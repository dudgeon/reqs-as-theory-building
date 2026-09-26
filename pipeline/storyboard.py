#!/usr/bin/env python3
"""Export the storyboard: keyframes pulled from the rendered frames at cue-relative times,
a contact sheet, and videos/<video>/storyboard/README.md describing each beat (from beats.json).

Run after the frames are rendered (build/frames). Times follow the cues, so the storyboard
stays in sync when the voice (and therefore the timing) changes.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, PROJECT, ROOT, load_narration  # noqa: E402

def load_beats():
    """videos/<video>/beats.json: [{scene, at: cue name or "start", offset: seconds, caption}]"""
    return [(b["scene"], b["at"], b["offset"], b["caption"]) for b in json.loads((PROJECT / "beats.json").read_text())]


def beats(tl):
    """Resolve beats.json against the timeline: [(n, t, scene, caption, image name)]."""
    scenes = {s["id"]: s for s in tl["scenes"]}
    out = []
    for n, (scene, anchor, off, caption) in enumerate(load_beats(), 1):
        t0 = scenes[scene]["start"] if anchor == "start" else tl["cues"][f"{scene}.{anchor}"]
        t = min(t0 + off, scenes[scene]["end"] - 0.4, tl["duration"] - 0.1)  # stay clear of the exit fade
        out.append((n, t, scene, caption, f"{n:02d}_{scene}.jpg"))
    return out


def main():
    tl = json.loads((BUILD / "timeline.json").read_text())
    fps = tl["fps"]
    outdir = PROJECT / "storyboard" / "frames"
    outdir.mkdir(parents=True, exist_ok=True)
    for f in outdir.glob("*.jpg"):
        f.unlink()
    rows, shots = [], []
    for n, t, scene, caption, img in beats(tl):
        src = BUILD / "frames" / f"f_{int(round(t * fps)):05d}.jpg"
        dst = outdir / img
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", "scale=960:540", "-q:v", "4", str(dst)], check=True)
        shots.append(dst)
        said = [l["text"] for l in tl["lines"] if l["scene"] == scene and l["start"] <= t + 0.6 and l["end"] >= t - 2.5]
        rows.append((n, t, scene, caption, " ".join(said), dst.name))
    # contact sheet (4 columns)
    cols, w, h = 4, 480, 270
    args, fc = [], ""
    for i, f in enumerate(shots):
        args += ["-i", str(f)]
        fc += f"[{i}:v]scale={w}:{h}[v{i}];"
    lay = "|".join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(len(shots)))
    fc += "".join(f"[v{i}]" for i in range(len(shots))) + f"xstack=inputs={len(shots)}:layout={lay}:fill=0xF3EDE2[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", fc, "-map", "[out]", "-q:v", "4",
                    str(PROJECT / "storyboard" / "contact-sheet.jpg")], check=True)

    md = [f"# Storyboard: *{load_narration()['title']}*", "",
          f"{len(rows)} beats across {tl['duration']:.0f} seconds. Keyframes are exported from the rendered video "
          "(`python pipeline/storyboard.py`), so they always match the current cut.", "",
          "![Contact sheet](contact-sheet.jpg)", ""]
    for n, t, scene, caption, said, img in rows:
        mm, ss = divmod(t, 60)
        md += [f"### {n}. {scene} ({int(mm)}:{ss:04.1f})", "", f"![{scene}](frames/{img})", "", caption, ""]
        if said:
            md += [f"> 🎙 *{said}*", ""]
    md += ["---", "",
           "**Visual language.** Warm paper, ink-navy line art and three accent colours. Gold means *theory* "
           "(the constellation), coral means *the spec and critique marks*, and teal means *the world*. "
           "Type is Fraunces for statements, Inter for labels and Caveat for handwritten asides. "
           "The recurring motif is the theory drawn as a constellation. It lives inside people's heads, "
           "it can't be copied across with documents, and it glows wherever a human really understands the system.", ""]
    (PROJECT / "storyboard" / "README.md").write_text("\n".join(md))
    print(f"{len(rows)} keyframes -> storyboard/")


if __name__ == "__main__":
    main()
