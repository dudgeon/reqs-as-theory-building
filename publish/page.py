#!/usr/bin/env python3
"""Build the shareable web page for the video into build/page/, ready to publish as an Artifact.

  python publish/page.py

Makes a web encode of out/<slug>.mp4 (CRF 24), a poster frame, copies the storyboard keyframes,
and fills videos/<video>/page.html. Then publish build/<video>/page/index.html with the Artifact
tool, passing the supporting files this script prints.

Artifact files are capped at 15 MB each. A web encode bigger than that is re-encoded as fragmented
MP4 and cut at fragment boundaries into <slug>-partN.mp4 files; the template's {{VIDEO_PARTS}}
placeholder gets their names, MIME type and duration, and the page streams them back into one
timeline with Media Source Extensions (or joins them into one blob where MSE is missing).

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
from common import BUILD, PROJECT, load_narration, slug  # noqa: E402
from storyboard import beats  # noqa: E402

TEMPLATE = PROJECT / "page.html"
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


PART_LIMIT = 14_000_000  # bytes; Artifact files may be at most 15 MB


def top_level_boxes(data):
    """(offset, size, type) of each top-level MP4 box."""
    i, out = 0, []
    while i + 8 <= len(data):
        size, kind = int.from_bytes(data[i:i + 4], "big"), data[i + 4:i + 8].decode("latin-1")
        if size == 1:
            size = int.from_bytes(data[i + 8:i + 16], "big")
        elif size == 0:
            size = len(data) - i
        out.append((i, size, kind))
        i += size
    return out


def codec_string(path):
    """RFC 6381 codecs for an H.264 High/Main + AAC-LC file, for MediaSource.isTypeSupported."""
    info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                      "stream=profile,level", "-of", "json", str(path)],
                                     capture_output=True, text=True, check=True).stdout)["streams"][0]
    prof = {"High": "6400", "Main": "4d40", "Constrained Baseline": "42e0", "Baseline": "4200"}[info["profile"]]
    return f'video/mp4; codecs="avc1.{prof}{int(info["level"]):02x},mp4a.40.2"'


def split_parts(master, stem):
    """Fragmented web encode cut at moof boundaries into parts under PART_LIMIT. Returns the part paths."""
    frag = OUT / f"{stem}-fragmented.mp4"
    ffmpeg("-i", str(master), "-map", "0:v", "-map", "0:a", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
           "-tune", "animation", "-pix_fmt", "yuv420p", "-g", "150", "-c:a", "aac", "-b:a", "160k",
           "-movflags", "+frag_keyframe+empty_moov+default_base_moof", str(frag))
    data = frag.read_bytes()
    units = []  # [start, end): the init segment (ftyp + moov), then one unit per moof + mdat fragment
    for off, size, kind in top_level_boxes(data):
        if kind == "moof" or not units:
            units.append([off, off + size])
        else:
            units[-1][1] = off + size
    parts, (a, b) = [], units[0]
    for u0, u1 in units[1:]:  # pack whole fragments into parts under the limit
        if u1 - a > PART_LIMIT:
            parts.append((a, b))
            a = u0
        b = u1
    parts.append((a, b))
    paths = []
    for old in OUT.glob(f"{stem}-part*.mp4"):
        old.unlink()
    for k, (a, b) in enumerate(parts):
        assert b - a <= 15_000_000, f"part {k + 1} is {(b - a) / 1e6:.1f} MB; use more keyframes (-g)"
        dst = OUT / f"{stem}-part{k + 1}.mp4"
        dst.write_bytes(data[a:b])
        paths.append(dst)
    return paths, codec_string(frag)


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
    video_files, video_parts = [web], "null"
    if web.stat().st_size > PART_LIMIT:  # too big for one Artifact file: stream it in parts
        parts, mime = split_parts(master, stem)
        video_files = parts
        video_parts = json.dumps({"parts": [p.name for p in parts], "mime": mime, "duration": tl["duration"]})
    poster_t = tl["scenes"][0]["end"] - 0.25  # the title card, fully formed
    ffmpeg("-ss", f"{poster_t:.2f}", "-i", str(master), "-frames:v", "1", "-vf", "scale=1280:720", "-q:v", "3", str(OUT / "poster.jpg"))
    for f in (OUT / "frames").glob("*.jpg"):
        f.unlink()
    for f in sorted((PROJECT / "storyboard" / "frames").glob("*.jpg")):
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
    chapters = "\n".join(
        f'        <li><button type="button" class="chap" data-t="{c["start"]:.2f}"><span class="tc">{tc(c["start"])}</span>'
        f'<span>{c["n"]} · {html.escape(c["title"], quote=False)}</span></button></li>' for c in tl.get("chapters", []))
    optional = {"{{CHAPTERS}}": chapters, "{{VIDEO_PARTS}}": video_parts}
    for key, value in optional.items():
        page = page.replace(key, value)
    for key, value in {
        "{{TRANSCRIPT}}": transcript,
        "{{BEATS}}": beat_html,
        "{{CUES_JSON}}": json.dumps(srt_cues(ROOT / "out" / f"{stem}.srt")),
        "{{RUNTIME}}": f"{m} min {s} s" if m else f"{s} s",
        "{{VIDEO}}": video_files[0].name,
    }.items():
        assert key in page, f"template is missing {key}"
        page = page.replace(key, value)
    (OUT / "index.html").write_text(page)

    if len(video_files) > 1:
        assert "{{VIDEO_PARTS}}" in TEMPLATE.read_text(), "the video needs parts; add {{VIDEO_PARTS}} to the template"
    files = {**{f.name: f.name for f in video_files}, "poster.jpg": "poster.jpg",
             **{f"frames/{f.name}": f"frames/{f.name}" for f in sorted((OUT / "frames").glob("*.jpg"))}}
    sizes = ", ".join(f"{f.stat().st_size / 1e6:.1f}" for f in video_files)
    print(f"{(OUT / 'index.html').relative_to(ROOT)} ready (video: {len(video_files)} file(s), {sizes} MB)")
    print("Publish with the Artifact tool:")
    print(json.dumps({"file_path": str(OUT / "index.html"), "root": str(OUT), "files": files}, indent=1))


if __name__ == "__main__":
    main()
