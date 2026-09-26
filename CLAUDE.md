# CLAUDE.md

This repo is a kit for making animated explainer videos entirely from code, from 60-second shorts to six-minute long-form cuts. It also holds two videos made with it, both applying Peter Naur's 1985 essay to specs for coding agents:
- `videos/specs-as-theory-building/`: *Specs as Theory Building*, the 90 s cut.
- `videos/specs-as-theory-building-extended/`: the extended cut, about 6 min, in ten chapters.

**Before making or changing a video, read [`docs/playbook.md`](docs/playbook.md).** It is the step-by-step recipe, with a quality gate for each phase, and it covers the long-form variant. [`docs/engine.md`](docs/engine.md) is the animation API. [`docs/behind-the-scenes.md`](docs/behind-the-scenes.md) explains why things are built this way and lists every bug already hit and fixed. The `explainer-video` skill (`.claude/skills/explainer-video/`) is the short version.

## Commands

Every tool picks the video from `VIDEO=<folder in videos/>`. It is required once there is more than one video.

```bash
./setup.sh                                          # once per machine: ffmpeg, espeak-ng, .venv (torch CPU, kokoro, faster-whisper), spaCy model, Playwright
VIDEO=<slug> ./build.sh                             # full build → out/<slug>.mp4 + .srt, videos/<slug>/storyboard/  (about 4 min per 90 s of video)
VIDEO=<slug> VOICE=openrouter ./build.sh --voice Charon   # needs OPENROUTER_API_KEY; VOICE=kokoro is the local stand-in voice
VIDEO=<slug> python3 tools/review.py cues           # contact sheets → build/<slug>/review/ (modes: cues, transitions, sample, stills <t…>, mp4 <t…>; --scenes a,b --name x)
VIDEO=<slug> LENIENT=1 python3 tools/review.py cues --scenes a,b --name x   # review some scenes while others are unfinished
VIDEO=<slug> .venv/bin/python publish/page.py       # shareable page → build/<slug>/page/, then publish it with the Artifact tool
.venv/bin/python tests/test_openrouter_tts.py       # offline check of the OpenRouter TTS request
```

## Where things live

- `videos/<slug>/narration.json`: the script. Lines carry `{cue}` markers and pauses. The file also holds pronunciations, title, slug, the scene files and chapter titles. It is the single source of truth for words and timing.
- `videos/<slug>/scenes.js`, or several files listed in `sceneFiles`: the video's choreography. `video/engine.js` and `video/shapes.js` are the shared engine and illustration library; `video/main.js` renders frames and chapter chips.
- `videos/<slug>/script.md`: the narration plus the source quotes with page numbers. `storyboard/`: keyframes generated from the cut, chosen in `beats.json`. `page.html`: the template for the shareable page. `storyboard-plan.md` (long-form cuts): the beat tables written before animating.
- `pipeline/`: tts → align → timeline → mix → encode → storyboard, in that order (`build.sh` runs them all).
- `build/<slug>/`: every intermediate, gitignored (frames are about 0.75 GB per 90 s). `out/`: the committed master videos and captions.

## Rules

- Scenes get their timing only from cues and scene bounds (`S.cue('x')`, `S.start`, `S.end`, `S.line(i)`), never hard-coded seconds. This is what lets a new voice or script re-time everything.
- Every scene's first element enters at `S.start + 0.02`, and the scene exits with `exitAt(t, S.end - 0.3, 0.4)`. Anything else leaves blank frames between scenes.
- With several scene files, wrap each file in an IIFE and prefix every `once()` key with the scene id; the cache is shared.
- Review with `tools/review.py` after every scene and after every full render. Read the 4×4 sheets rather than single full-resolution frames, to save context.
- Fact-check every narration line against the primary source before synthesizing it.
- Never hand-edit generated files: `videos/*/timeline.js`, `out/*.srt`, `videos/*/storyboard/*`.
- `OPENROUTER_API_KEY` comes only from the environment settings. Never search the disk for keys and never ask for them in chat. If it's missing, tell the user once (a new session picks up the key) and continue with `VOICE=kokoro`.
- You can't hear audio. Verify it by measurement (loudness, alignment) and ask a human to listen before the video is shared widely.
- Don't commit `build/`.
