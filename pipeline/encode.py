#!/usr/bin/env python3
"""Encode build/frames + build/mix.wav into out/specs-as-theory-building.mp4.

Audio is loudness-normalised (two-pass EBU R128: -16 LUFS, -1.5 dBTP) and the SRT
captions are embedded as a soft subtitle track.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, ROOT, load_narration, slug  # noqa: E402


def main():
    tl = json.loads((BUILD / "timeline.json").read_text())
    narr = load_narration()
    SLUG = slug(narr)
    out = ROOT / "out" / f"{SLUG}.mp4"
    srt = ROOT / "out" / f"{SLUG}.srt"
    ln = "loudnorm=I=-16:TP=-1.5:LRA=11"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(BUILD / "mix.wav"), "-af",
                            f"{ln}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe, re.S).group(0))
    af = (f"{ln}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-framerate", str(tl["fps"]), "-i", str(BUILD / "frames" / "f_%05d.jpg"),
           "-i", str(BUILD / "mix.wav"), "-i", str(srt),
           "-map", "0:v", "-map", "1:a", "-map", "2:s",
           "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "animation", "-pix_fmt", "yuv420p",
           "-af", af, "-c:a", "aac", "-b:a", "192k",
           "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
           "-metadata", f"title={narr['title']}",
           "-movflags", "+faststart", "-t", f"{tl['duration']:.3f}", str(out)]
    subprocess.run(cmd, check=True)
    size = out.stat().st_size / 1e6
    print(f"-> {out.relative_to(ROOT)} ({size:.1f} MB)")


if __name__ == "__main__":
    main()
