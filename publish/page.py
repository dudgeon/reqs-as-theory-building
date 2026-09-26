#!/usr/bin/env python3
"""Build the shareable web page for the video into build/page/, ready to publish as an Artifact.

  python publish/page.py

Makes a web encode of out/<slug>.mp4 (CRF 24, comfortably under the 15 MB per-file limit), a
poster frame, copies the storyboard keyframes, and fills publish/template.html. Then publish
build/page/index.html with the Artifact tool, passing the supporting files this script prints.

Artifacts don't serve .vtt files, so captions are embedded in the page as JSON. The page builds
a native <track> from a blob URL and falls back to a scripted caption overlay.
"""
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from common import BUILD, load_narration, slug  # noqa: E402
from storyboard import beats  # noqa: E402

TEMPLATE = ROOT / "publish" / "template.html"
OUT = BUILD / "page"


def md(s):
    """The storyboard captions use *italic* and **bold**; render them as HTML."""
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return re.sub(r"\*(.+?)\*", r"<em>\1</em>", s)


def tc(t):
    m, s = divmod(t, 60)
    return f"{int(m)}:{int(s):02d}"


def srt_cues(path):
    def secs(x):
        h, m, rest = x.split(":")
        s, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    cues = []
    for block in path.read_text().strip().split("\n\n"):
        lines = block.strip().split("\n")
        a, b = lines[1].split(" --> ")
        cues.append([round(secs(a), 3), round(secs(b), 3), " ".join(lines[2:])])
    return cues


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main():
    narr = load_narration()
    stem = slug(narr)
    tl = json.loads((BUILD / "timeline.json").read_text())
    master = ROOT / "out" / f"{stem}.mp4"
    (OUT / "frames").mkdir(parents=True, exist_ok=True)

    web = OUT / f"{stem}.mp4"
    if not web.exists() or web.stat().st_mtime < master.stat().st_mtime:
        ffmpeg("-i", str(master), "-map", "0:v", "-map", "0:a", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
               "-tune", "animation", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(web))
    poster_t = tl["scenes"][0]["end"] - 0.25  # the title card, fully formed
    ffmpeg("-ss", f"{poster_t:.2f}", "-i", str(master), "-frames:v", "1", "-vf", "scale=1280:720", "-q:v", "3", str(OUT / "poster.jpg"))
    for f in (OUT / "frames").glob("*.jpg"):
        f.unlink()
    for f in sorted((ROOT / "storyboard" / "frames").glob("*.jpg")):
        shutil.copy(f, OUT / "frames" / f.name)

    labels = {s["id"]: s.get("label", s["id"].title()) for s in narr["scenes"]}
    labels.update(title="Title", end="End card")
    beat_html = "\n".join(
        f'''      <figure class="beat">
        <img src="frames/{img}" alt="{html.escape(re.sub(r"[*]+", "", cap))}" width="960" height="540">
        <figcaption><span class="tc">{tc(t)} · {html.escape(labels.get(scene, scene), quote=False)}</span><span>{md(cap)}</span></figcaption>
      </figure>''' for n, t, scene, cap, img in beats(tl))
    transcript = "\n".join(
        f'        <li><span class="tc">{tc(l["start"])}</span><span>{html.escape(l["text"])}</span></li>' for l in tl["lines"])
    m, s = divmod(round(tl["duration"]), 60)
    page = TEMPLATE.read_text()
    page = re.sub(r"\A<!--.*?-->\n", "", page, flags=re.S)  # drop the template's own header comment
    for key, value in {
        "{{TRANSCRIPT}}": transcript,
        "{{BEATS}}": beat_html,
        "{{CUES_JSON}}": json.dumps(srt_cues(ROOT / "out" / f"{stem}.srt")),
        "{{RUNTIME}}": f"{m} min {s} s" if m else f"{s} s",
        "{{VIDEO}}": web.name,
    }.items():
        assert key in page, f"template is missing {key}"
        page = page.replace(key, value)
    (OUT / "index.html").write_text(page)

    files = {web.name: web.name, "poster.jpg": "poster.jpg",
             **{f"frames/{f.name}": f"frames/{f.name}" for f in sorted((OUT / "frames").glob("*.jpg"))}}
    print(f"build/page/index.html ready ({web.stat().st_size / 1e6:.1f} MB video)")
    print("Publish with the Artifact tool:")
    print(json.dumps({"file_path": str(OUT / "index.html"), "root": str(OUT), "files": files}, indent=1))


if __name__ == "__main__":
    main()
