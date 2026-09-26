#!/usr/bin/env python3
"""Mix the soundtrack: narration + a quiet procedural music bed + sound effects on animation cues.

Reads build/timeline.json (line placement) and build/sfx.json (from `node video/render.js --sfx`).
Writes build/mix.wav (48 kHz stereo). Loudness is normalised later, at encode time.
"""
import json
import os
import sys

import numpy as np
from scipy.signal import butter, istft, sosfilt, stft

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, ROOT, SR, read_audio, write_wav  # noqa: E402

rng = np.random.default_rng(11)
NOTE_D = 293.66  # D4
PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]  # D major pentatonic degrees (semitones)


def hz(semi, base=NOTE_D):
    return base * 2 ** (semi / 12)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def tone(f, dur, tau=None, partials=((1, 1.0),), f_end=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if f_end is None:
        ph = 2 * np.pi * f * t
    else:  # exponential glide
        k = np.log(f_end / f) / dur
        ph = 2 * np.pi * f * (np.exp(k * t) - 1) / k
    y = sum(a * np.sin(ph * m) for m, a in partials)
    if tau:
        y = y * env_exp(n, tau)
    atk = min(n, int(0.004 * SR))
    y[:atk] *= np.linspace(0, 1, atk)
    return y


def band_noise(dur, lo, hi, order=2):
    n = int(dur * SR)
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, rng.standard_normal(n))


def sweep_noise(dur, f0, f1, width=0.8):
    """Noise with a spectral peak gliding from f0 to f1 (log), via STFT masking."""
    n = int(dur * SR) + 1024
    x = rng.standard_normal(n)
    f, tt, Z = stft(x, SR, nperseg=1024)
    centre = np.exp(np.linspace(np.log(f0), np.log(f1), Z.shape[1]))
    lf = np.log(np.maximum(f, 20))[:, None]
    mask = np.exp(-((lf - np.log(centre)[None, :]) ** 2) / (2 * width ** 2))
    _, y = istft(Z * mask, SR, nperseg=1024)
    return y[: int(dur * SR)]


def shaped(y, attack=0.3):
    """Rise-then-fall envelope (fraction of length spent rising)."""
    n = len(y)
    a = max(1, int(n * attack))
    e = np.concatenate([np.sin(np.linspace(0, np.pi / 2, a)) ** 2, np.cos(np.linspace(0, np.pi / 2, n - a)) ** 2])
    return y * e


def norm(y, peak):
    m = np.abs(y).max()
    return y * (peak / m) if m > 0 else y


# ---------------------------------------------------------------- sound effects
def sfx(ev):
    k, g, p = ev["type"], ev.get("gain", 1.0), ev.get("pitch", 1.0)
    d = ev.get("dur", 0.5)
    if k == "pop":
        y = tone(620 * p, 0.14, 0.035, ((1, 1), (2, 0.25)), f_end=300 * p) + 0.3 * band_noise(0.14, 2000, 6000) * env_exp(int(0.14 * SR), 0.004)
        return norm(y, 0.20 * g)
    if k == "tick":
        return norm(tone(2100 * p, 0.03, 0.006) + 0.4 * band_noise(0.03, 3000, 8000) * env_exp(int(0.03 * SR), 0.003), 0.07 * g)
    if k == "click":
        return norm(tone(1300, 0.05, 0.008) + band_noise(0.05, 2500, 7000) * env_exp(int(0.05 * SR), 0.004), 0.16 * g)
    if k == "whoosh":
        return norm(shaped(sweep_noise(d, 250, 2200), 0.55), 0.10 * g)
    if k == "swish":
        return norm(shaped(sweep_noise(0.35, 900, 4000, 0.5), 0.4), 0.10 * g)
    if k == "rise":
        y = shaped(sweep_noise(d, 200, 1600, 0.6), 0.85) + 0.3 * shaped(tone(220, d, None, ((1, 1),), f_end=660), 0.85)
        return norm(y, 0.07 * g)
    if k == "scribble":
        n = int(d * SR)
        strokes = np.abs(np.sin(2 * np.pi * np.cumsum(rng.uniform(7, 13, n) / SR)))
        y = band_noise(d, 1800, 5500) * strokes ** 2
        return norm(shaped(y, 0.1), 0.05 * g)
    if k == "typing":
        n = int(d * SR)
        y = np.zeros(n)
        t = 0.0
        while t < d - 0.05:
            i = int(t * SR)
            c = band_noise(0.03, 1800, 5000) * env_exp(int(0.03 * SR), 0.005) * rng.uniform(0.5, 1)
            y[i:i + len(c)] += c[: n - i]
            t += rng.uniform(0.05, 0.11)
        return norm(y, 0.06 * g)
    if k == "thud":
        y = tone(95, 0.3, 0.07, ((1, 1), (2, 0.2)), f_end=60) + 0.4 * band_noise(0.3, 80, 600) * env_exp(int(0.3 * SR), 0.03)
        return norm(y, 0.20 * g)
    if k == "chime":
        f = hz(PENTA[ev.get("note", 0) % len(PENTA)] + 12)
        y = tone(f, 2.2, 0.7, ((1, 1), (2.76, 0.25), (5.4, 0.08))) + 0.35 * tone(f * 2, 2.2, 0.35)
        return norm(y, 0.075 * g)
    if k == "pluck":
        f = hz(PENTA[ev.get("note", 0) % len(PENTA)] + 12)
        y = tone(f, 1.0, 0.22, ((1, 1), (4, 0.18), (10, 0.03)))
        return norm(y, 0.12 * g)
    if k == "tape":
        y = shaped(sweep_noise(0.16, 1200, 3500, 0.5), 0.2)
        crackle = (rng.random(len(y)) > 0.985) * rng.uniform(-1, 1, len(y))
        return norm(y + 0.8 * crackle * np.linspace(1, 0, len(y)), 0.07 * g)
    if k == "fizzle":
        y = tone(700, 0.5, 0.18, ((1, 1), (3, 0.15)), f_end=160) + 0.3 * band_noise(0.5, 1000, 6000) * env_exp(int(0.5 * SR), 0.1)
        return norm(y, 0.07 * g)
    if k == "plop":
        return norm(tone(240, 0.12, 0.035, f_end=720), 0.14 * g)
    if k == "steps":
        n = int(d * SR)
        y = np.zeros(n)
        for i, t in enumerate(np.arange(0.0, d - 0.1, 0.34)):
            s = tone(110 if i % 2 else 95, 0.12, 0.03, f_end=70) + 0.2 * band_noise(0.12, 300, 2000) * env_exp(int(0.12 * SR), 0.01)
            j = int(t * SR)
            y[j:j + len(s)] += s[: n - j] * (1 - 0.5 * t / d)
        return norm(y, 0.08 * g)
    if k == "flatline":
        y = tone(880, d, None, ((1, 1), (2, 0.1)))
        y *= np.minimum(1, np.linspace(0, 8, len(y))) * np.linspace(1, 0, len(y)) ** 1.5
        return norm(y, 0.03 * g)
    if k == "swing":
        return norm(shaped(sweep_noise(0.3, 700, 2500, 0.5), 0.5), 0.05 * g) + np.pad(norm(tone(1567, 0.25, 0.08), 0.03), (0, max(0, int(0.3 * SR) - int(0.25 * SR))))
    if k == "creak":
        y = tone(140, d, 0.35, ((1, 1), (2.1, 0.3)), f_end=100) + 0.2 * band_noise(d, 100, 900) * env_exp(int(d * SR), 0.2)
        return norm(shaped(y, 0.15), 0.05 * g)
    raise ValueError(f"unknown sfx {k}")


# ---------------------------------------------------------------- music bed
def music_bed(total):
    n = int(total * SR)
    L, R = np.zeros(n), np.zeros(n)
    chords = [  # semitones relative to D4 (D major: I, vi, IV, V-sus)
        [-12, 0, 4, 7, 11, 16],      # Dmaj9-ish
        [-15, -3, 2, 6, 9, 14],      # Bm11
        [-17, -5, 2, 7, 11, 14],     # Gmaj7
        [-19, -7, 2, 4, 9, 14],      # A sus
    ]
    seg = 6.0
    t = np.arange(n) / SR
    k = 0
    start = 0.0
    while start < total:
        ch = chords[k % len(chords)]
        a, b = start - 1.5, start + seg + 1.5  # overlap for cross-fades
        i0, i1 = max(0, int(a * SR)), min(n, int(b * SR))
        tt = t[i0:i1]
        e = np.clip((tt - a) / 2.2, 0, 1) * np.clip((b - tt) / 2.2, 0, 1)
        e = np.sin(e * np.pi / 2) ** 2
        for j, s in enumerate(ch):
            f = hz(s)
            amp = (0.5 if j == 0 else 0.26) / (1 + 0.15 * j)
            for side, cents, ph in ((L, -4, 0.0), (R, 4, 1.3)):
                ff = f * 2 ** (cents / 1200)
                wob = 1 + 0.002 * np.sin(2 * np.pi * 0.13 * tt + ph + j)
                side[i0:i1] += amp * e * (np.sin(2 * np.pi * ff * wob * tt + ph + j) + 0.12 * np.sin(4 * np.pi * ff * tt + ph))
        start += seg
        k += 1
    # gentle movement: slow tremolo + low-pass
    sos = butter(2, 1800, btype="low", fs=SR, output="sos")
    L, R = sosfilt(sos, L), sosfilt(sos, R)
    return np.stack([L, R], axis=1)


def main():
    tl = json.loads((BUILD / "timeline.json").read_text())
    events = json.loads((BUILD / "sfx.json").read_text())
    total = tl["duration"]
    n = int(total * SR)
    vo = np.zeros(n)
    for line in tl["lines"]:
        a = read_audio(ROOT / line["file"])
        i = int(line["start"] * SR)
        vo[i:i + len(a)] += a[: n - i]

    # music: -20 dB-ish under the voice, ducked further while someone is speaking
    mus = music_bed(total)
    mus *= 10 ** (-36 / 20) / (np.sqrt((mus ** 2).mean()) + 1e-12)  # bed sits ~15 LU under the voice
    act = np.convolve(np.abs(vo), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same") > 0.01
    duck = np.where(act, 0.55, 1.0)
    sm = int(0.35 * SR)
    duck = np.convolve(duck, np.ones(sm) / sm, mode="same")
    fade = np.clip(np.arange(n) / (1.2 * SR), 0, 1) * np.clip((n - np.arange(n)) / (2.0 * SR), 0, 1)
    mus *= (duck * fade)[:, None]

    fx = np.zeros((n, 2))
    for ev in events:
        y = sfx(ev)
        i = int(ev["t"] * SR)
        if i >= n or i + len(y) <= 0:
            continue
        if i < 0:
            y, i = y[-i:], 0
        pan = ev.get("pan", 0.0)
        seg = y[: n - i]
        fx[i:i + len(seg), 0] += seg * (1 - max(0, pan))
        fx[i:i + len(seg), 1] += seg * (1 + min(0, pan))

    mix = mus + fx + vo[:, None]
    peak = np.abs(mix).max()
    if peak > 0.95:
        mix *= 0.95 / peak
    write_wav(BUILD / "mix.wav", mix.astype(np.float32))
    write_wav(BUILD / "vo_only.wav", vo.astype(np.float32))
    rms = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
    print(f"mix {total:.2f}s  vo {rms(vo):.1f} dBFS  music {rms(mus):.1f} dBFS  sfx {rms(fx):.1f} dBFS  "
          f"({len(events)} sfx) -> build/mix.wav")


if __name__ == "__main__":
    main()
