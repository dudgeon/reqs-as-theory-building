"""Shared helpers for the narration pipeline."""
import json
import pathlib
import re
import subprocess

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
NARRATION = ROOT / "pipeline" / "narration.json"
BUILD = ROOT / "build"
SR = 48000  # working sample rate for everything audio

CUE_RE = re.compile(r"\{(\w+)\}")


def load_narration():
    return json.loads(NARRATION.read_text())


def clean_text(text):
    """Line text with cue markers removed (what the viewer hears / reads)."""
    return re.sub(r"\s+", " ", CUE_RE.sub("", text)).strip()


def tokens_with_cues(text):
    """Split a line into whitespace tokens, attaching any {cue} markers to the token they precede.

    Returns [(token, [cue, ...]), ...] using the clean text's tokens.
    """
    out = []
    pending = []
    for raw in text.split():
        cues = CUE_RE.findall(raw)
        word = CUE_RE.sub("", raw)
        pending.extend(cues)
        if word:
            out.append((word, pending))
            pending = []
    if pending and out:  # trailing cue with no word: attach to last token
        out[-1][1].extend(pending)
    return out


def norm_word(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def iter_lines(narr):
    for scene in narr["scenes"]:
        for i, line in enumerate(scene["lines"]):
            yield scene, i, line


def read_audio(path, sr=SR):
    """Decode any audio file to mono float32 at `sr` via ffmpeg."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def write_wav(path, audio, sr=SR):
    import soundfile as sf
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), audio, sr, subtype="PCM_24")


def resample(audio, sr_in, sr_out=SR):
    if sr_in == sr_out:
        return audio.astype(np.float32)
    from scipy.signal import resample_poly
    from math import gcd
    g = gcd(sr_in, sr_out)
    return resample_poly(audio, sr_out // g, sr_in // g).astype(np.float32)
