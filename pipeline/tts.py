#!/usr/bin/env python3
"""Synthesize the narration one line at a time.

  python pipeline/tts.py --provider openrouter   # OpenRouter /api/v1/audio/speech (needs OPENROUTER_API_KEY)
  python pipeline/tts.py --provider kokoro       # local Kokoro-82M stand-in (no key needed)

Each line becomes build/vo/<provider>/<hash>.wav (48 kHz mono, silence-trimmed,
level-matched). Unchanged lines are cached. The manifest build/vo.json records
which files the rest of the pipeline should use.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import tempfile

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, SR, clean_text, iter_lines, load_narration, read_audio, resample, write_wav  # noqa: E402

OPENROUTER_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/") + "/audio/speech"

DEFAULTS = {
    "openrouter": {
        "model": "google/gemini-3.8-flash-tts",
        "voice": "Charon",
        "style": "a warm, curious science-explainer narrator: clear, unhurried, quietly enthusiastic, "
                 "with natural emphasis on key words",
        "speed": None,
    },
    "kokoro": {"model": "hexgrad/Kokoro-82M", "voice": "af_heart", "style": None, "speed": 1.0},
}


def apply_pronunciations(text, pron, provider, respell=False):
    """Local Kokoro gets exact phonemes; hosted voices keep the real spelling unless --respell is given."""
    key = "kokoro" if provider == "kokoro" else ("respell" if respell else None)
    if key is None:
        return text
    for word in sorted(pron, key=len, reverse=True):
        if key in pron[word]:
            text = re.sub(rf"(?<![\w\[]){re.escape(word)}(?![\w'’])", pron[word][key], text)
    return text


# ---------------------------------------------------------------- providers

_kokoro = None


def synth_kokoro(text, cfg):
    global _kokoro
    from kokoro import KPipeline
    if _kokoro is None:
        _kokoro = KPipeline(lang_code="a", repo_id=cfg["model"])
    parts = [r.audio.numpy() for r in _kokoro(text, voice=cfg["voice"], speed=cfg["speed"] or 1.0,
                                             split_pattern=None) if r.audio is not None]
    return resample(np.concatenate(parts), 24000, SR)


def synth_openrouter(text, cfg):
    import requests
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        sys.exit("OPENROUTER_API_KEY is not set. Add it to the environment (see README) or use --provider kokoro.")
    body = {"model": cfg["model"], "input": text, "voice": cfg["voice"], "response_format": "mp3"}
    if cfg.get("speed"):
        body["speed"] = cfg["speed"]
    options = {}
    if cfg.get("style"):
        options = {
            "google-ai-studio": {"speech_metadata": {"style": cfg["style"]}},
            "google-vertex": {"speech_metadata": {"style": cfg["style"]}},
            "openai": {"instructions": cfg["style"]},
        }
    if cfg.get("provider_options"):
        options.update(cfg["provider_options"])
    if options:
        body["provider"] = {"options": options}
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/dudgeon/reqs-as-theory-building",
        "X-Title": load_narration().get("title", "Explainer video"),
    }
    for attempt in range(4):
        r = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=300)
        if r.status_code == 200 and r.content:
            break
        if r.status_code in (429, 500, 502, 503, 504) and attempt < 3:
            import time
            time.sleep(2 ** (attempt + 1))
            continue
        sys.exit(f"OpenRouter TTS failed ({r.status_code}): {r.text[:500]}")
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        f.write(r.content)
        f.flush()
        return read_audio(f.name, SR)


PROVIDERS = {"kokoro": synth_kokoro, "openrouter": synth_openrouter}


# ---------------------------------------------------------------- post-processing

def trim_and_level(audio, target_rms_db=-20.0):
    """Trim leading/trailing silence, add short fades, and match speech level across lines."""
    win = int(0.01 * SR)
    n = len(audio) // win
    frames = audio[: n * win].reshape(n, win)
    env = np.abs(frames).max(axis=1)
    peak = env.max() if n else 0
    if peak <= 0:
        return audio
    thresh = peak * 10 ** (-40 / 20)
    active = np.where(env > thresh)[0]
    start = max(0, active[0] * win - int(0.03 * SR))
    end = min(len(audio), (active[-1] + 1) * win + int(0.09 * SR))
    audio = audio[start:end].copy()
    # level: RMS over voiced frames
    frames = audio[: (len(audio) // win) * win].reshape(-1, win)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    voiced = rms[rms > rms.max() * 10 ** (-30 / 20)]
    cur = 20 * np.log10(np.sqrt((voiced ** 2).mean()) + 1e-9)
    audio *= 10 ** ((target_rms_db - cur) / 20)
    fi, fo = int(0.005 * SR), int(0.04 * SR)
    audio[:fi] *= np.linspace(0, 1, fi)
    audio[-fo:] *= np.linspace(1, 0, fo)
    peak = np.abs(audio).max()
    if peak > 0.98:
        audio *= 0.98 / peak
    return audio.astype(np.float32)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--provider", choices=PROVIDERS, default="openrouter")
    ap.add_argument("--model")
    ap.add_argument("--voice")
    ap.add_argument("--style", help="delivery style (Gemini speech_metadata / OpenAI instructions)")
    ap.add_argument("--speed", type=float)
    ap.add_argument("--provider-options", help="extra JSON merged into provider.options, e.g. "
                    '\'{"azure": {"style": "cheerful"}}\'')
    ap.add_argument("--respell", action="store_true", help="use the phonetic respellings in narration.json "
                    "(e.g. Naur -> Now-er) for hosted voices that mispronounce names")
    ap.add_argument("--force", action="store_true", help="ignore the cache")
    args = ap.parse_args()

    cfg = dict(DEFAULTS[args.provider])
    for k in ("model", "voice", "style", "speed"):
        if getattr(args, k) is not None:
            cfg[k] = getattr(args, k)
    if args.provider_options:
        cfg["provider_options"] = json.loads(args.provider_options)

    narr = load_narration()
    pron = narr.get("pronounce", {})
    outdir = BUILD / "vo" / args.provider
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = {"provider": args.provider, "config": cfg, "lines": []}
    total = 0.0
    for scene, i, line in iter_lines(narr):
        spoken = apply_pronunciations(clean_text(line["text"]), pron, args.provider, args.respell)
        key = hashlib.sha1(json.dumps([args.provider, cfg, spoken], sort_keys=True).encode()).hexdigest()[:16]
        path = outdir / f"{scene['id']}_{i}_{key}.wav"
        if args.force or not path.exists():
            print(f"  synth {scene['id']}[{i}]: {spoken}", flush=True)
            audio = trim_and_level(PROVIDERS[args.provider](spoken, cfg))
            write_wav(path, audio)
        else:
            import soundfile as sf
            audio = sf.read(str(path))[0]
        dur = len(audio) / SR
        total += dur
        manifest["lines"].append({"scene": scene["id"], "index": i, "text": clean_text(line["text"]),
                                  "spoken": spoken, "file": str(path.relative_to(BUILD.parent)),
                                  "duration": round(dur, 4)})
    (BUILD / "vo.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    words = sum(len(l["text"].split()) for l in manifest["lines"])
    print(f"{len(manifest['lines'])} lines, {words} words, {total:.1f}s of speech "
          f"({words / total * 60:.0f} wpm) -> build/vo.json")


if __name__ == "__main__":
    main()
