---
name: explainer-video
description: Make, re-voice or re-render a 60–90 second animated explainer video with this repo's kit. Covers research, a fact-checked script, OpenRouter or local text-to-speech, word-aligned SVG motion graphics, a mixed and captioned MP4, a storyboard and a shareable page. Use when asked for an explainer, animated or educational video, or video essay, or to change the voice, script or visuals of the existing video.
---

# Explainer video

Follow `docs/playbook.md` phase by phase and don't skip its gates. `docs/engine.md` is the animation API; `docs/behind-the-scenes.md` lists problems already solved.

0. **Preflight.** Run `echo ${OPENROUTER_API_KEY:+key present}` and `./setup.sh`. If there's no key, tell the user once where to add it (environment settings; a new session picks it up) and continue with `VOICE=kokoro`. Never search the disk for credentials.
1. **Research.** Read the primary source in full. Build a quote bank with page numbers, list what the author's own words rule out, and find the hinge to the audience's present.
2. **Script.** Edit `pipeline/narration.json`. Budget words as speech-seconds × wpm / 60 (about 215 words for 90 s at 184 wpm). Put a `{cue}` in front of each word a visual should land on. Fact-check every line before synthesis.
3. **Voice and timing.** Run `.venv/bin/python pipeline/tts.py --provider openrouter|kokoro`, then `pipeline/align.py`, then `pipeline/timeline.py`. Check wpm, duration and alignment flags.
4. **Storyboard on paper.** For each scene, a beat table (cue → element → zone). Bands: headline y ≈ 150, content 240–900, labels ≤ 1040, side margins ≥ 80.
5. **Scenes** in `video/scenes.js`. Timing comes only from `S.cue()`, `S.start` and `S.end`. First element at `S.start + 0.02`; exit with `exitAt(t, S.end - 0.3, 0.4)`. After each scene, run `python3 tools/review.py cues` and read the sheets.
6. **Build** with `./build.sh`.
7. **QA.** `python3 tools/review.py transitions` (no empty frames), `python3 tools/review.py sample --every 1`, loudness about −16 LUFS, duration equal to the timeline, captions, `tests/test_openrouter_tts.py`.
8. **Ship.** Update `script/script.md`. Commit everything except `build/` and push. Edit the copy in `publish/template.html`, run `.venv/bin/python publish/page.py`, then publish with the Artifact tool using the file map it prints. Send the MP4 with `SendUserFile`. Report what you couldn't verify, especially the audio.
