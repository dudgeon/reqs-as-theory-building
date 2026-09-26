#!/usr/bin/env python3
"""Export the storyboard: keyframes pulled from the rendered frames at cue-relative times,
a contact sheet, and storyboard/README.md describing each beat.

Run after the frames are rendered (build/frames). Times follow the cues, so the storyboard
stays in sync when the voice (and therefore the timing) changes.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import BUILD, ROOT  # noqa: E402

# (scene, anchor, offset seconds, caption)
BEATS = [
    ("title", "start", 1.25, "Naur's title is struck out: *Programming* becomes **Specs**."),
    ("title", "start", 3.0, "Title card: *Specs as Theory Building*, Naur's big idea for the age of coding agents."),
    ("hook", "q", 0.8, "\"What does a software team *actually* produce?\" A team at laptops builds a tall stack of printouts. *The product?*"),
    ("hook", "notcode", 0.9, "Naur's 1985 paper answers: **not the code.** The stack is crossed out and sparks appear over the team's heads."),
    ("thesis", "prog", 0.8, "Programming is theory building. THE WORLD (institutions, rules, people, processes) is mapped through a theory, drawn as a constellation in the head, to THE PROGRAM."),
    ("thesis", "specs", 1.0, "Code, docs and even the SPEC drop onto a shelf of *secondary products*. *Primary: the theory.*"),
    ("ryle", "explain", 0.9, "Theory in Gilbert Ryle's sense. *Knowing that* is a card of facts. *Knowing how* is doing it (casting a line) and being able to explain why."),
    ("ryle", "adapt", 1.3, "Whoever holds the theory can **Map** the world to the program, **Justify** each part, and **Adapt**: judge which changes fit."),
    ("compiler", "patch", 1.6, "Naur's case: Team B inherits a compiler with full code and docs, yet proposes taped-on patches that would break its design. Later maintainers, without Team A, did break it."),
    ("compiler", "notravel", 0.45, "The theory tries to travel to Team B and can't: **code + docs ≠ theory.**"),
    ("compiler", "runs", 1.0, "Team A leaves and the monitor flatlines: *program death*. The program still runs, but nobody can change it intelligently."),
    ("agents", "free", 0.9, "Now agents write the code. Text is nearly free: **$0.00**."),
    ("agents", "theory", 0.7, "For Naur, text was never the expensive part. The scale tips toward THEORY."),
    ("agents", "keep", 1.0, "Specifying builds the theory. The agent **gets the spec** and **you keep the theory**."),
    ("enterprise", "unsaid", 1.3, "A regulated enterprise: the theory is scattered across a rule buried in policy, a platform quirk one engineer knows, and a constraint nobody says out loud."),
    ("enterprise", "rgtb", 1.9, "Requirements gathering *is* theory building. The fragments come together in one head."),
    ("takeaways", "loop", 1.2, "Four habits: trace to source (map), write down the why (justify), rehearse change (adapt), and stay close to the theory-holders (keep it alive)."),
    ("close", "c3", 1.1, "Code is the output. The spec is the handoff. **The theory is the product.**"),
    ("end", "start", 1.6, "End card with the citation and voice credit."),
]


def main():
    tl = json.loads((BUILD / "timeline.json").read_text())
    scenes = {s["id"]: s for s in tl["scenes"]}
    fps = tl["fps"]
    outdir = ROOT / "storyboard" / "frames"
    outdir.mkdir(parents=True, exist_ok=True)
    for f in outdir.glob("*.jpg"):
        f.unlink()
    rows, shots = [], []
    for n, (scene, anchor, off, caption) in enumerate(BEATS, 1):
        t0 = scenes[scene]["start"] if anchor == "start" else tl["cues"][f"{scene}.{anchor}"]
        t = min(t0 + off, scenes[scene]["end"] - 0.4, tl["duration"] - 0.1)  # stay clear of the exit fade
        src = BUILD / "frames" / f"f_{int(round(t * fps)):05d}.jpg"
        dst = outdir / f"{n:02d}_{scene}.jpg"
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
                    str(ROOT / "storyboard" / "contact-sheet.jpg")], check=True)

    md = ["# Storyboard: *Specs as Theory Building*", "",
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
    (ROOT / "storyboard" / "README.md").write_text("\n".join(md))
    print(f"{len(rows)} keyframes -> storyboard/")


if __name__ == "__main__":
    main()
