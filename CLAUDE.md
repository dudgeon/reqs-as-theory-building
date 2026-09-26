# CLAUDE.md

This repo is a kit for making 60–90 s animated explainer videos entirely from code, plus the first video made with it: *Specs as Theory Building*, which applies Peter Naur's 1985 essay to specs for coding agents.

**Before making or changing a video, read [`docs/playbook.md`](docs/playbook.md).** It is the step-by-step recipe, with a quality gate for each phase. [`docs/engine.md`](docs/engine.md) is the animation API. [`docs/behind-the-scenes.md`](docs/behind-the-scenes.md) explains why things are built this way and lists every bug already hit and fixed. The `explainer-video` skill (`.claude/skills/explainer-video/`) is the short version.

## Commands

```bash
./setup.sh                                    # once per machine: ffmpeg, espeak-ng, .venv (torch CPU, kokoro, faster-whisper), spaCy model, Playwright
./build.sh                                    # full build → out/<slug>.mp4 + .srt, storyboard/  (about 4 min)
VOICE=openrouter ./build.sh --voice Charon    # needs OPENROUTER_API_KEY; VOICE=kokoro is the local stand-in voice
python3 tools/review.py cues                   # contact sheets → build/review/ (modes: cues, transitions, sample, stills <t…>, mp4 <t…>)
.venv/bin/python publish/page.py              # shareable page → build/page/, then publish it with the Artifact tool
.venv/bin/python tests/test_openrouter_tts.py # offline check of the OpenRouter TTS request
```

## Where things live

- `pipeline/narration.json`: the script. Lines carry `{cue}` markers, pauses, pronunciations, title and slug. It is the single source of truth for words and timing.
- `video/scenes.js`: this video's choreography. `video/engine.js` and `video/shapes.js` are the reusable engine and illustration library.
- `pipeline/`: tts → align → timeline → mix → encode → storyboard, in that order (`build.sh` runs them all).
- `script/script.md`: narration plus the source quotes with page numbers. `storyboard/`: keyframes generated from the cut.
- `build/`: every intermediate, gitignored (frames are about 0.75 GB). `out/`: the committed master video and captions.

## Rules

- Scenes get their timing only from cues and scene bounds (`S.cue('x')`, `S.start`, `S.end`), never hard-coded seconds. This is what lets a new voice or script re-time everything.
- Every scene's first element enters at `S.start + 0.02`, and the scene exits with `exitAt(t, S.end - 0.3, 0.4)`. Anything else leaves blank frames between scenes.
- Review with `tools/review.py` after every scene and after every full render. Read the 4×4 sheets rather than single full-resolution frames, to save context.
- Fact-check every narration line against the primary source before synthesizing it.
- Never hand-edit generated files: `video/timeline.js`, `out/*.srt`, `storyboard/*`.
- `OPENROUTER_API_KEY` comes only from the environment settings. Never search the disk for keys and never ask for them in chat. If it's missing, tell the user once (a new session picks up the key) and continue with `VOICE=kokoro`.
- You can't hear audio. Verify it by measurement (loudness, alignment) and ask a human to listen before the video is shared widely.
- Don't commit `build/`.
