#!/usr/bin/env python3
"""Word-level alignment of each synthesized line (faster-whisper), so visual cues land on words.

Reads build/vo.json, writes build/alignment.json:
  {"<scene>/<index>": {"words": [{"w", "start", "end"}], "cues": {"cue": seconds}}}
Times are relative to the start of that line's audio file. Script words that the
recogniser missed are interpolated from their neighbours by character position.
"""
import difflib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, ROOT, iter_lines, load_narration, norm_word, tokens_with_cues  # noqa: E402

NUMBER_WORDS = {"1985": ["nineteen", "eightyfive"]}


def recognise(model, path, prompt):
    segments, _ = model.transcribe(str(path), language="en", word_timestamps=True, beam_size=5,
                                   initial_prompt=prompt, condition_on_previous_text=False,
                                   vad_filter=False)
    return [(w.word.strip(), w.start, w.end) for s in segments for w in s.words]


def align_line(tokens, rec, duration):
    script = [norm_word(t) for t, _ in tokens]
    heard = [norm_word(w) for w, _, _ in rec]
    times = [None] * len(tokens)
    sm = difflib.SequenceMatcher(a=script, b=heard, autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            times[a + k] = (rec[b + k][1], rec[b + k][2])
    # fuzzy pass for near-misses inside replaced spans (e.g. "Naur" heard as "Nauer")
    for tag, a0, a1, b0, b1 in sm.get_opcodes():
        if tag == "replace" and (a1 - a0) == (b1 - b0):
            for k in range(a1 - a0):
                times[a0 + k] = (rec[b0 + k][1], rec[b0 + k][2])
        elif tag == "replace" and b1 > b0:
            span_s, span_e = rec[b0][1], rec[b1 - 1][2]
            chars = [len(t) + 1 for t, _ in tokens[a0:a1]]
            tot, acc = sum(chars), 0
            for k, c in enumerate(chars):
                times[a0 + k] = (span_s + (span_e - span_s) * acc / tot,
                                 span_s + (span_e - span_s) * (acc + c) / tot)
                acc += c
    # interpolate anything still missing, by character position between known anchors
    offs, acc = [], 0
    for t, _ in tokens:
        offs.append(acc)
        acc += len(t) + 1
    total_chars = acc
    known = [(offs[i], times[i][0]) for i in range(len(tokens)) if times[i]]
    known = [(0, 0.0)] + known + [(total_chars, duration)]
    for i in range(len(tokens)):
        if times[i] is None:
            lo = max((k for k in known if k[0] <= offs[i]), key=lambda k: k[0])
            hi = min((k for k in known if k[0] > offs[i]), key=lambda k: k[0])
            frac = (offs[i] - lo[0]) / max(1, hi[0] - lo[0])
            s = lo[1] + (hi[1] - lo[1]) * frac
            times[i] = (s, s + 0.25)
    # enforce monotonic starts
    for i in range(1, len(times)):
        if times[i][0] < times[i - 1][0]:
            times[i] = (times[i - 1][0], max(times[i][1], times[i - 1][0]))
    matched = sum(1 for a, b, n in sm.get_matching_blocks() for _ in range(n))
    return times, matched


def main():
    from faster_whisper import WhisperModel
    narr = load_narration()
    vo = json.loads((BUILD / "vo.json").read_text())
    files = {(l["scene"], l["index"]): l for l in vo["lines"]}
    model = WhisperModel(os.environ.get("ALIGN_MODEL", "small.en"), device="cpu", compute_type="int8")
    out = {}
    for scene, i, line in iter_lines(narr):
        entry = files[(scene["id"], i)]
        tokens = tokens_with_cues(line["text"])
        rec = recognise(model, ROOT / entry["file"], entry["text"])
        times, matched = align_line(tokens, rec, entry["duration"])
        cues = {}
        for (tok, tcues), (s, _) in zip(tokens, times):
            for c in tcues:
                cues[c] = round(s, 3)
        heard = " ".join(w for w, _, _ in rec)
        flag = "" if matched == len(tokens) else f"  [{matched}/{len(tokens)} matched; heard: {heard}]"
        print(f"{scene['id']}[{i}] {entry['duration']:.2f}s {sorted(cues.items(), key=lambda kv: kv[1])}{flag}")
        out[f"{scene['id']}/{i}"] = {
            "words": [{"w": t, "start": round(s, 3), "end": round(e, 3)} for (t, _), (s, e) in zip(tokens, times)],
            "cues": cues,
        }
    (BUILD / "alignment.json").write_text(json.dumps(out, indent=1))
    print("-> build/alignment.json")


if __name__ == "__main__":
    main()
