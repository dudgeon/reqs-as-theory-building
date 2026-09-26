#!/usr/bin/env python3
"""Visual QA: tile frames into labelled contact sheets so a reviewer (human or agent) can scan many
moments in one image. This is how layout collisions and blank transition frames were caught.

  python3 tools/review.py stills 5.2 24.3 30.5          # render these times now (no full render needed)
  python3 tools/review.py cues                          # render cue+0.6s for every cue in the timeline
  python3 tools/review.py transitions                   # frames around every scene boundary (needs build/frames)
  python3 tools/review.py sample --every 1              # the whole cut at 1 fps (needs build/frames)
  python3 tools/review.py mp4 17.5 50.2                 # frames decoded from the final MP4

Sheets are written to build/review/<mode>_NN.jpg: 16 tiles per sheet (4x4), each 480x270 and stamped
with its time. One 4x4 sheet costs a reviewing agent about as much context as a single full frame.
"""
import argparse
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
OUT = BUILD / "review"
FONT = next((p for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                         "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
                         "/Library/Fonts/Arial Bold.ttf"] if pathlib.Path(p).exists()), None)


def timeline():
    return json.loads((BUILD / "timeline.json").read_text())


def tile(sources, labels, name, cols=4, w=480, h=270):
    """sources: list of image paths. Writes sheets of cols*4 tiles; returns the sheet paths."""
    OUT.mkdir(parents=True, exist_ok=True)
    per = cols * 4
    sheets = []
    for s in range(0, len(sources), per):
        chunk, labs = sources[s:s + per], labels[s:s + per]
        args, fc = [], ""
        for i, (src, lab) in enumerate(zip(chunk, labs)):
            args += ["-i", str(src)]
            text = f",drawtext=fontfile={FONT}:text='{lab}':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6" if FONT else ""
            fc += f"[{i}:v]scale={w}:{h}{text}[v{i}];"
        n = len(chunk)
        layout = "|".join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(n))
        fc += "".join(f"[v{i}]" for i in range(n)) + (f"xstack=inputs={n}:layout={layout}:fill=black[out]" if n > 1 else "copy[out]")
        dst = OUT / f"{name}_{s // per:02d}.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", fc, "-map", "[out]", "-q:v", "3", str(dst)], check=True)
        sheets.append(dst)
    return sheets


def render_stills(times):
    subprocess.run(["node", str(ROOT / "video" / "render.js"), "--stills", ",".join(f"{t:.2f}" for t in times)],
                   check=True, stdout=subprocess.DEVNULL)
    return [BUILD / "stills" / f"t_{t:06.2f}.jpg" for t in times]


def frame_file(t, fps):
    f = BUILD / "frames" / f"f_{int(round(t * fps)):05d}.jpg"
    if not f.exists():
        sys.exit(f"{f} missing: run a full render first (node video/render.js --frames)")
    return f


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["stills", "cues", "transitions", "sample", "mp4"])
    ap.add_argument("times", nargs="*", type=float)
    ap.add_argument("--every", type=float, default=1.0, help="sample interval in seconds (sample mode)")
    a = ap.parse_args()
    tl = timeline()
    fps = tl["fps"]
    labels = None
    if a.mode == "stills":
        times = a.times
        srcs = render_stills(times)
    elif a.mode == "cues":
        items = sorted((v, k) for k, v in tl["cues"].items() if "." in k)
        times = [min(v + 0.6, tl["duration"] - 0.05) for v, _ in items]
        srcs = render_stills(times)
        labels = [f"{t:.2f}s {k}" for t, (_, k) in zip(times, items)]
    elif a.mode == "transitions":
        times = []
        for s in tl["scenes"][1:]:
            times += [max(0, s["start"] - 0.25), s["start"], s["start"] + 0.25, s["start"] + 0.5]
        srcs = [frame_file(t, fps) for t in times]
    elif a.mode == "sample":
        n = int(tl["duration"] / a.every)
        times = [round(i * a.every + a.every / 2, 2) for i in range(n)]
        srcs = [frame_file(t, fps) for t in times]
    else:  # mp4
        mp4 = next((ROOT / "out").glob("*.mp4"))
        OUT.mkdir(parents=True, exist_ok=True)
        times, srcs = a.times, []
        for t in times:
            dst = OUT / f"mp4_{t:06.2f}.jpg"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(mp4), "-frames:v", "1", "-q:v", "2", str(dst)], check=True)
            srcs.append(dst)
    labels = labels or [f"{t:.2f}s" for t in times]
    for sheet in tile(srcs, labels, a.mode):
        print(sheet.relative_to(ROOT))


if __name__ == "__main__":
    main()
