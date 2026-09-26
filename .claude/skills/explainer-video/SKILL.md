---
name: explainer-video
description: Make, re-voice or re-render an animated explainer video with this repo's kit, from a 60–90 second short to a 4–6 minute chaptered cut. Covers research, a fact-checked script, OpenRouter or local text-to-speech, word-aligned SVG motion graphics, a mixed and captioned MP4, a storyboard and a shareable page. Use when asked for an explainer, animated or educational video, or video essay, or to change the voice, script or visuals of an existing video.
---

# Explainer video

Follow `docs/playbook.md` phase by phase and don't skip its gates. `docs/engine.md` is the animation API; `docs/behind-the-scenes.md` lists problems already solved. Each video is a folder `videos/<slug>/`, and every tool reads `VIDEO=<slug>`.

0. **Preflight.** Run `echo ${OPENROUTER_API_KEY:+key present}` and `./setup.sh`. If there's no key, tell the user once where to add it (environment settings; a new session picks it up) and continue with `VOICE=kokoro`. Never search the disk for credentials.
1. **Research.** Read the primary source in full. Build a quote bank with page numbers, list what the author's own words rule out, and find the hinge to the audience's present.
2. **Script.** Create `videos/<slug>/narration.json` (copy an existing one for the shape).
   - Budget words as speech-seconds × wpm / 60: about 215 words for 90 s, and about 980 for 6 min, at 176–184 wpm.
   - Put a `{cue}` in front of each word a visual should land on.
   - For long cuts, add `chapter` titles and split the scenes across `sceneFiles`.
   - Fact-check every line before synthesis.
3. **Voice and timing.** Run `pipeline/tts.py --provider openrouter|kokoro`, then `pipeline/align.py`, then `pipeline/timeline.py`, each with `.venv/bin/python` and `VIDEO=<slug>`. Check wpm, duration and alignment flags.
4. **Storyboard on paper.** For each scene, a beat table (cue → element → zone). Bands: headline y ≈ 150, content 240–900, labels ≤ 1040, side margins ≥ 80. For long cuts, write it to `videos/<slug>/storyboard-plan.md`; it doubles as the brief for parallel scene agents.
5. **Scenes** in `videos/<slug>/scenes.js`, or one file per group of scenes, each wrapped in an IIFE.
   - Timing comes only from `S.cue()`, `S.start` and `S.end`.
   - The first element enters at `S.start + 0.02`; exit with `exitAt(t, S.end - 0.3, 0.4)`.
   - After each scene, run `LENIENT=1 python3 tools/review.py cues --scenes <ids> --name <you>` and read the sheets.
6. **Build** with `VIDEO=<slug> ./build.sh`.
7. **QA.**
   - `tools/review.py transitions`: no empty frames.
   - `tools/review.py sample --every 1`.
   - Loudness about −16 LUFS, duration equal to the timeline, and captions.
   - `tests/test_openrouter_tts.py`.
8. **Ship.**
   - Update `videos/<slug>/script.md`, then commit everything except `build/` and push.
   - Edit the copy in `videos/<slug>/page.html`, run `publish/page.py`, then publish with the Artifact tool using the file map it prints. Long videos are split into parts under the 15 MB file limit automatically.
   - Send the MP4 with `SendUserFile`.
   - Report what you couldn't verify, especially the audio.
