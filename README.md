# Specs as Theory Building

A 90-second animated explainer about Peter Naur's 1985 essay **"Programming as Theory Building."** It covers what Naur actually argued and why the argument now applies to **specs**, the main input to agentic coding. It is aimed at product managers gathering requirements in regulated, hard-to-map enterprise environments.

▶ **Video:** [`out/specs-as-theory-building.mp4`](out/specs-as-theory-building.mp4) (1920×1080, 30 fps, about 90 s, captions embedded; sidecar [`.srt`](out/specs-as-theory-building.srt))
📝 **Script, with Naur's own words and page numbers:** [`script/script.md`](script/script.md)
🎞 **Storyboard:** [`storyboard/README.md`](storyboard/README.md)

![Storyboard contact sheet](storyboard/contact-sheet.jpg)

## The argument in one breath

Naur says a program's real product is not its text. It is the **theory** its programmers hold: knowing how the program handles its part of the world, and being able to *explain*, *justify* and *adapt* it. Documents, including specifications, can't carry that theory, and a program whose theory-holders are gone is dead even while it runs. Agents now make text nearly free, but for Naur text was never the expensive part. So the scarce work moves to **specifying**. Writing the spec is how a PM builds the theory, the spec is what the agent receives, and the theory stays with the people who built it.

### Takeaways for PMs

1. **Trace every requirement to its source** (the rule, the system, the owner). This is Naur's *map*.
2. **Write down the why**, plus what you rejected and the reason. This is Naur's *justify*.
3. **Rehearse change.** Would a likely new rule fit the design, or need a patch? This is Naur's *adapt*.
4. **Sit with the people who hold the theory**, and keep them in the loop as agents build. This keeps the program alive.

## How it was made

Everything is generated from source in this repo: script, voice, timing, illustration, animation, sound and captions.

| Step | File | What it does |
|---|---|---|
| Script | `pipeline/narration.json` | Single source of truth. The `{cue}` markers tie visual beats to specific words. |
| Voice | `pipeline/tts.py` | Synthesizes each line through **OpenRouter's** `/api/v1/audio/speech`, or a local stand-in |
| Alignment | `pipeline/align.py` | Uses faster-whisper word timestamps so animation beats land on words for any voice |
| Timeline | `pipeline/timeline.py` | Lays out lines and scenes on one clock, and exports captions |
| Animation | `video/*.js` | A small immediate-mode SVG motion-graphics engine. Every frame is a pure function of time and illustrations are hand-coded vectors. |
| Frames | `video/render.js` | Headless Chromium via Playwright renders 2,700 frames at 1080p |
| Sound | `pipeline/mix.py` | Procedural music bed and cue-synced sound effects, ducked under the narration |
| Encode | `pipeline/encode.py` | H.264 and AAC, loudness-normalized to −16 LUFS, soft subtitles |
| Storyboard | `pipeline/storyboard.py` | Keyframes, contact sheet and `storyboard/README.md`, taken from the actual cut |

Preview in a browser: run `python3 -m http.server` from the repo root, then open `http://localhost:8000/video/index.html`. That gives a scrubbable player that plays `build/mix.wav` in sync.

## Voiceover: OpenRouter

The pipeline calls OpenRouter's text-to-speech endpoint (OpenAI-compatible, `POST /api/v1/audio/speech`). By default it uses **`google/gemini-3.8-flash-tts`** with voice **`Charon`** and a style prompt ("a warm, curious science-explainer narrator…") passed through `provider.options.google-ai-studio.speech_metadata`.

> **Status of the current cut:** it was rendered **without** an OpenRouter key, because none was available in the build environment. The narration is a local stand-in, [`hexgrad/Kokoro-82M`](https://huggingface.co/hexgrad/Kokoro-82M) (voice `af_heart`). OpenRouter also hosts that model as `hexgrad/kokoro-82m`. The end card credits whichever voice was used.

To render with an OpenRouter voice:

```bash
export OPENROUTER_API_KEY=...            # or store it in your environment's secrets
./setup.sh                               # once: ffmpeg, espeak-ng, Python deps, Chromium
./build.sh                               # uses OpenRouter automatically when the key is set
# other voices / models:
VOICE=openrouter ./build.sh --voice Sadaltager
VOICE=openrouter ./build.sh --model microsoft/mai-voice-2 --voice "en-US-Harper:MAI-Voice-2" --provider-options '{"azure":{"style":"cheerful"}}'
VOICE=openrouter ./build.sh --model hexgrad/kokoro-82m --voice af_heart --style ""   # the stand-in voice, via OpenRouter
```

Timing adapts automatically. Each line is re-aligned, so the animation re-times itself to the new voice. A slower voice makes the video longer; the stand-in runs at about 186 wpm (90 s total).

## Sources

- Peter Naur, "Programming as Theory Building," *Microprocessing and Microprogramming* 15 (1985): 253–261. Invited keynote at Euromicro 84. It is reprinted in Naur, *Computing: A Human Activity* (1992).
- Gilbert Ryle, *The Concept of Mind* (1949).

## Credits and licences

Fonts: Fraunces, Inter, JetBrains Mono and Caveat (SIL Open Font License; see `video/fonts/LICENSE-*.txt`). Stand-in voice: Kokoro-82M (Apache-2.0). Alignment: faster-whisper (MIT). All illustrations, animation, music and sound effects are generated by the code in this repository.
