# Playbook: make an animated explainer with this kit

A recipe for a coding agent (or a person) to go from a brief to a finished, captioned, shareable explainer: a 60–90 s short, or a 4–6 minute chaptered cut (see [Long-form cuts](#long-form-cuts-46-minutes)). It encodes what [`behind-the-scenes.md`](behind-the-scenes.md) learned the hard way, so you can skip the experiments. The animation API is documented in [`engine.md`](engine.md).

Each video is a folder `videos/<slug>/`, holding its script, scenes, storyboard and page template; the kit around it is shared. Every tool picks the video from `VIDEO=<slug>`, which you can leave out only while there is a single video. Intermediates go to `build/<slug>/`.

Work through the phases in order. Each ends with a **gate**: don't move on until it passes.

| Phase | What | Time |
|---|---|---|
| 0 | Preflight: keys, tools, repo | 5 min |
| 1 | Research the source | 10 min |
| 2 | Write and fact-check the script | 10 min |
| 3 | Voice and word timing | 2 min |
| 4 | Design the storyboard (on paper) | 10 min |
| 5 | Build scenes, reviewing as you go | 30–40 min (a 6 min cut: parallel agents, about 1.5 h) |
| 6 | Render, mix, encode | 4 min |
| 7 | QA | 5 min |
| 8 | Ship: storyboard, commit, page, hand-off | 10 min |

---

## Phase 0: Preflight

**Before the session starts**, if you can: ask the user to add `OPENROUTER_API_KEY` to the environment. In a Claude Code cloud session that is the environment menu in the session title bar → Edit → API credentials, or an environment variable. Secrets are read when a session starts, so a key added mid-session only reaches the *next* session.

In the session:

```bash
echo ${OPENROUTER_API_KEY:+OpenRouter key present}
./setup.sh                                  # ffmpeg, espeak-ng, .venv (torch CPU, kokoro, faster-whisper), spaCy model, Playwright
curl -s -o /dev/null -w "openrouter %{http_code}\n" https://openrouter.ai/api/v1/models
curl -s -o /dev/null -w "huggingface %{http_code}\n" https://huggingface.co/api/models/hexgrad/Kokoro-82M
df -h .                                     # needs ~4 GB: venv 1.9 GB, model cache 0.8 GB, frames 0.75 GB per 90 s
git ls-remote origin                        # is there a base branch? If not, you can't open a PR
```

- **No key?** Tell the user in one short message: where to add it, the variable name (`OPENROUTER_API_KEY`), and that a new session picks it up. Then carry on with `VOICE=kokoro`. The swap later is one command.
- **Never** search the disk for credentials, reuse keys meant for something else, or ask for a key in chat.
- GitHub release downloads may be blocked (403). Everything the kit needs comes from PyPI, Hugging Face, `download.pytorch.org` or apt.

**Gate:** `./setup.sh` prints `setup done`; you know which voice you'll use and whether a PR is possible.

## Phase 1: Research the source

1. Get the primary text, not a summary. For a PDF, try a couple of mirrors, then:
   ```bash
   .venv/bin/pip install -q pypdf
   .venv/bin/python -c "from pypdf import PdfReader as R; import sys; r=R(sys.argv[1]); t='\n'.join(p.extract_text() or '' for p in r.pages); open('src.txt','w').write(t); print(len(r.pages),'pages',len(t),'chars')" source.pdf
   ```
   A small character count means a scan with no text layer. Try another copy.
2. Read all of it. Build a **quote bank**: claim → exact words → page.
3. Write down the **constraints**: things the author says that your framing must respect. Naur listing *specifications* as secondary products meant the video couldn't claim "the spec is the theory."
4. Find the **hinge**: the one idea in the source that connects it to the audience's present. Here it was "the dominating cost was never text manipulation," which explains why agents change nothing about where the cost is.

**Gate:** every claim you plan to narrate points to a quote.

## Phase 2: Write and fact-check the script

**Structure.** This worked for "classic idea → today's practice":

1. Hook: a question the audience thinks they can answer (1–2 lines)
2. Thesis: the author's claim, in their terms (1–2 lines)
3. Mechanism: what it really means; a list of three sticks (2 lines)
4. Evidence: the author's own case or story (2–3 lines)
5. The turn: why it matters now (3–4 lines)
6. The audience's world: three concrete vignettes (1–2 lines)
7. Takeaways: 3–4 imperatives, one line each, each tied to part 3
8. Close: three parallel sentences

**Word budget.** Budget from the voice's speed:

```
speech seconds ≈ target − leadIn − tail − (lines × ~0.35 s of pauses)
words ≈ speech seconds × wpm / 60
```

For 90 s with 20 lines: 90 − 3.8 − 3.3 − 7 ≈ 76 s of speech. That's about **233 words at 184 wpm** (Kokoro `af_heart`, measured) or about **195 words at 155 wpm** (a slower hosted voice). Aim 5–10% under, because the pipeline prints the real wpm after the first TTS run.

**Format:** `videos/<slug>/narration.json` (start a new video by copying a folder in `videos/`)

```json
{
  "title": "Specs as Theory Building",
  "slug": "specs-as-theory-building",
  "fps": 30, "leadIn": 3.8, "tail": 3.3, "lineGap": 0.3, "sceneGap": 0.6,
  "pronounce": { "Naur": { "kokoro": "[Naur](/nˈaʊɚ/)", "respell": "Now-er" } },
  "scenes": [
    { "id": "ryle", "lines": [
      { "text": "Whoever holds it can {map}map the program to the world, {justify}justify each part, and {adapt}judge which changes fit.", "pauseAfter": 0.45 }
    ]},
    { "id": "compiler", "label": "Naur's compiler", "lines": [ "…" ] }
  ]
}
```

- One sentence or two per line. Each line is one TTS call, so a line boundary is a natural breath.
- Put a `{cue}` marker **in front of the word** the visual should land on. Keep cue names short and unique within the scene. Plan roughly one cue every 1.5–3 s.
- `leadIn` is the silent title card; `tail` is the end card. `pauseAfter` on a line overrides the gap after it.
- `pronounce`: `kokoro` takes misaki phoneme markup; `respell` is used for hosted voices only when you pass `--respell`. Hosted voices usually get names right unaided.
- `label` (optional) is the human name for a scene, used by the storyboard and the page.

**Fidelity pass.** Before any TTS, go line by line: which quote supports this? Watch for **compressions that merge distinct events** (the "successive teams" fix), overstatements, and your own extensions dressed as the author's claims. Label extensions as yours in the script doc.

**Gate:** each line maps to a quote or is clearly your application; the word count fits the budget.

## Phase 3: Voice and word timing

```bash
export VIDEO=<slug>
.venv/bin/python pipeline/tts.py --provider openrouter      # or: --provider kokoro
.venv/bin/python pipeline/align.py
.venv/bin/python pipeline/timeline.py
```

- `tts.py` prints each synthesized line, then `N lines, W words, S s of speech (X wpm)`. Lines are cached by a hash of (provider, config, text), so re-runs only synthesize what changed.
- `align.py` prints each line's cue times. A flag like `[31/33 matched; heard: …]` means Whisper misheard. Usually it's harmless (misses are interpolated), but a badly garbled line means a bad take. With a hosted voice, delete that line's file in `build/<slug>/vo/openrouter/` and re-run `tts.py` for a fresh take. Kokoro is deterministic, so rephrase the line instead. `--force` re-synthesizes every line.
- `timeline.py` prints the scene windows and the total duration, and writes `videos/<slug>/timeline.js` and `out/<slug>.srt`.

Tune `lineGap`, `sceneGap`, `pauseAfter`, `leadIn` and `tail` in `narration.json`, then re-run `timeline.py` alone. It's instant, and TTS isn't repeated.

**OpenRouter voices.** The endpoint is `POST https://openrouter.ai/api/v1/audio/speech` (OpenAI-compatible; body `model, input, voice, response_format: mp3|pcm, speed, provider.options`). Discover models with `curl "https://openrouter.ai/api/v1/models?output_modalities=speech"`. Tested settings:

| Model | Voice | Style control |
|---|---|---|
| `google/gemini-3.8-flash-tts` (default) | `Charon`; also `Kore`, `Puck`, `Sadaltager`, `Sulafat`… | `--style "…"` → `provider.options.google-ai-studio.speech_metadata.style`. Don't put directions in the text; Gemini reads it verbatim. |
| `microsoft/mai-voice-2` | `en-US-Harper:MAI-Voice-2` | `--provider-options '{"azure":{"style":"cheerful"}}'` |
| `hexgrad/kokoro-82m` | `af_heart` | `--style ""` (none) |

`tests/test_openrouter_tts.py` checks the request format against a local mock. Run it after touching `tts.py`.

**Gate:** all words aligned; `timeline.py` duration is within the target.

## Phase 4: Design the storyboard, on paper

Do this before writing scene code. Skipping it caused most of the layout fixes last time.

**Visual language.** Decide these once:
- **Semantic colours**: one colour per concept, used consistently. Here gold meant *theory*, coral meant *spec and critique marks*, teal meant *the world*, and plum meant *agents*. The palette is `C` in `video/engine.js`.
- **Type roles**: Fraunces for statements, Inter for labels, Caveat for handwritten asides, JetBrains Mono for code.
- **One recurring motif** that carries the argument. Here, the theory drawn as a constellation, in heads.

**Layout grid** (1920×1080):

| Band | y range | Use |
|---|---|---|
| Headline | 90–210 (baseline ≈ 150) | One statement per scene, entering with the scene |
| Content | 240–900 | Illustrations |
| Labels | 900–1040 | Captions under figures ("gets the spec") |
| Side margin | ≥ 80 px | The per-scene camera push (2%, about the centre) crops edges slightly |

Columns: three zones centred at x = 380 / 960 / 1540 (about 520 px wide), or two at 540 / 1380.

**Figure sizes.** A `person()` is about 255 px tall at `s: 1`, head centre at `feet − 252`. A thought bubble above a person needs its centre at `feet − 400` or higher, or its tail lands on the head. The profile head (`bigHead`) spans about 360×470 at `s: 0.95`.

**Per scene, write a beat table** before coding:

| cue | enters or changes | zone | exits |
|---|---|---|---|
| `S.start` | headline + main figure | headline, centre | |
| `map` | card 1 + threads draw | left | |
| … | | | `S.end` (crossfade) |

Rules: every moment has something on screen; nothing overlaps unless on purpose; each scene holds its complete composition for about 1 s before the exit.

**Gate:** a beat table for every scene.

## Phase 5: Build scenes, reviewing as you go

Edit `videos/<slug>/scenes.js` (or the files listed in `sceneFiles`). The scene shape (details in [`engine.md`](engine.md)):

```js
SCENES.myscene = {
  render(t, S) {
    const a = S.cue('map'), b = S.cue('justify');          // absolute seconds, from the voice
    const X = exitAt(t, S.end - 0.3, 0.4);                  // standard crossfade out
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 14 });        // first element arrives with the scene
    out.push(G({ o: eH.o, y: eH.y }, T('Headline', 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    const e1 = enter(t, a - 0.3);                           // lead the word by ~0.3 s
    if (e1.o > 0) out.push(G({ x: 400, y: 600 + e1.y, s: e1.s, o: e1.o }, iconBank()));
    out.push(drawPath('M500 600 C700 500 900 700 1100 600', P(t, b, 0.6, 'inOut'), { stroke: C.goldDeep, sw: 3 }));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [{ t: S.cue('map') - 0.3, type: 'pop' }, { t: S.cue('justify'), type: 'scribble', dur: 0.6 }],
};
```

Non-negotiable conventions:
- **Only cues and scene bounds for timing** (`S.cue()`, `S.start`, `S.end`, `S.voStart`). Never a literal like `t > 23.4`.
- **First element at `S.start + 0.02`; exit with `exitAt(t, S.end - 0.3, 0.4)`.** Together they give a crossfade with no empty frames.
- **Lead the word by 0.2–0.4 s** on entrances. Motion that starts before the word reads as in sync.
- **Pure functions of `t`**: no mutable state. Use `rng(seed)` for randomness and `once(key, fn)` for expensive layouts.
- **SFX from the same cues**: pop on appearances, whoosh on big moves, chime on insight moments, ascending plucks (notes 0, 2, 4, 7) on list items, scribble on underlines and strikes. Keep to about one per second.

**The review loop**, after each scene:

```bash
python3 tools/review.py cues                        # renders cue + 0.6 s for every cue → build/<slug>/review/cues_NN.jpg
python3 tools/review.py cues --scenes hook,ryle     # only some scenes (add --name x to keep your own sheet names)
python3 tools/review.py stills 24.3 30.5            # specific moments
```

Read the sheets. They're 4×4 tiles stamped with the time and cue name, so 16 moments cost about as much context as one frame. Look for overlaps, clipped or overflowing text, labels too small at thumbnail size, empty regions, and anything off-grid. Fix, re-render stills, move on. `python3 -m http.server` plus `http://localhost:8000/video/index.html?video=<slug>&t=24.3` shows any frame in a browser. Without `?t` you get a scrubbable preview with sound.

**Gate:** clean cue sheets for every scene.

## Phase 6: Render, mix, encode

```bash
VIDEO=<slug> ./build.sh                   # everything: TTS (cached), align, timeline, sfx, mix, frames, encode, storyboard
# or piece by piece after scene edits:
node video/render.js --sfx && .venv/bin/python pipeline/mix.py
node video/render.js --frames --workers 4 # ~85 s for 2,700 frames on 4 vCPUs (about 6 min for a 6 min cut)
.venv/bin/python pipeline/encode.py       # x264 CRF 18, two-pass loudnorm to -16 LUFS, soft subtitles
```

## Phase 7: QA

```bash
python3 tools/review.py transitions        # 4 frames around every scene boundary: none may be empty
python3 tools/review.py sample --every 1   # the whole cut at 1 fps
python3 tools/review.py mp4 12 48 80       # decoded from the MP4: check compression on the paper texture
ffprobe -v error -show_entries format=duration:stream=codec_name -of compact out/*.mp4   # h264 + aac + mov_text, duration = timeline
ffmpeg -hide_banner -nostats -i out/*.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:"   # ≈ -16 LUFS, ≤ -1.5 dBFS
.venv/bin/python tests/test_openrouter_tts.py
```

You can't listen. Say so, and ask the user to listen before the video goes wide: music and effects levels, voice naturalness, how "Naur" and other names sound.

**Gate:** no empty frames at transitions; duration and loudness on target; captions read correctly.

## Phase 8: Ship

1. `./build.sh` already exported the storyboard (`videos/<slug>/storyboard/`), taken from the actual frames at the moments listed in `videos/<slug>/beats.json` (`[{scene, at: cue or "start", offset, caption}]`).
2. Update `videos/<slug>/script.md`: narration table, quote bank with pages, and a section on where your application goes beyond the author.
3. Commit everything except `build/`, which is gitignored (frames are about 0.75 GB per 90 s). The MP4 in `out/` is about 20 MB per 90 s at CRF 18; `encode.py` takes `CRF=…` to trade size for quality.
4. Push. Open a draft PR only if the repo has a base branch.
5. **Page.** Edit the content sections of `videos/<slug>/page.html` for the new video, then:
   ```bash
   .venv/bin/python publish/page.py      # web encode (CRF 24), poster, keyframes, fills the template → build/<slug>/page/
   ```
   Artifact files are capped at 15 MB each. A video longer than about two minutes is split into parts that the page joins back together in the browser; `page.py` handles it.
   It prints the exact `file_path`, `root` and `files` map for the Artifact tool's publish call. A first publish also needs `icon` and a one-sentence `description`. Republishing the same `file_path` updates the same URL. The host doesn't serve `.vtt`, so captions are already embedded in the page.
6. Send the MP4 to the user (`SendUserFile`, `display: "render"`) so it plays inline in the app.
7. Report plainly: which voice was used and why, what you couldn't verify (audio), the runtime against the target, and where the page and files are.

## Long-form cuts (4–6 minutes)

The extended cut of *Specs as Theory Building* (about 6 min, 24 scenes, 10 chapters) used the same phases, with these changes.

**Script.**
- Budget about 980 words for 6 min at the stand-in voice's 176–184 wpm. A hosted voice at about 155 wpm would run about 7 min, so aim low if you plan to re-voice.
- Structure it like the source: one chapter per section of the argument, then the application, then the takeaways.
- Put `"chapter": "Title"` on each chapter's first scene. The timeline exports the chapters, `main.js` draws a chip at the top left for the first 4.5 s of each, and the page lists them as jump links.
- Re-read the whole source against the finished draft. Long scripts drift. Six lines of the extended cut were corrected this way, for example "several of their proposals" instead of "their proposed extensions", and "made ineffective" instead of "buried".

**Storyboard plan.** Write `videos/<slug>/storyboard-plan.md` before any scene code. It holds:
- the global rules: bands, palette meanings, motifs, motion, sound, code hygiene
- a beat table for every scene
- a quote bank for on-screen text

It is both the design and the brief for the scene builders. See the extended cut's plan for the shape.

**Scenes in parallel.** Group the scenes 2–5 to a file and list the files in `sceneFiles`. Then:
1. Add the shared illustrations to `video/shapes.js` first, check them in one test still, and commit.
2. Create a stub for every scene file. A missing file stops the page from loading.
3. Brief one agent per file with its part of the plan, the shared rules and the review loop.
   - Agents review with `LENIENT=1 python3 tools/review.py cues --scenes <their ids> --name <prefix>`. `LENIENT` logs and skips a scene that throws, so an unfinished neighbour doesn't break everyone's renders.
   - They must run `node --check` after every edit, because a syntax error in any scene file breaks every render.
   - Tell them to use only the quote bank for the source's wording. An agent that recites long passages of a published text gets cut off by the output filter; this stopped the first two attempts at the extended cut's case-study scenes.
4. Integrate:
   - Run `review.py transitions` across the group boundaries and a full `sample --every 2`.
   - Do a consistency pass: palette meanings, label sizes, headline positions, and how busy each scene is.

**Music.** A long bed needs movement. `mix.py` follows the chapter list: it changes the chord progression at each chapter and adds a soft swell as each chapter starts.

**Sizes.**
- Frames: 10,951 JPEGs and 3.0 GB for 6 min 5 s, rendered in about 6 minutes.
- Master MP4 at CRF 18: 82 MB. `encode.py` takes `CRF=…` if it needs to be smaller; GitHub rejects files over 100 MB.
- The page's web encode is split into parts under the 15 MB artifact limit (four parts for 6 min) and streamed back together. A 540p single file of about 11 MB is the fallback. The published page is about 57 MB, under the 64 MB per-publish limit.
- Web encodes carry only video and audio (`-map_chapters -1`): a chapter data track in the stream can make Media Source Extensions reject it.

---

## Re-voicing an existing video

```bash
export OPENROUTER_API_KEY=…                                    # or via the environment settings
VIDEO=<slug> ./build.sh                                         # uses OpenRouter automatically when the key is set
VIDEO=<slug> VOICE=openrouter ./build.sh --voice Sadaltager     # any tts.py flag passes through
```

Everything re-times from the new alignment. Then run the Phase 7 checks, update the voice line in the README and page if needed, and republish.

## Adapting the kit to a new topic: what to change

| File | Change |
|---|---|
| `videos/<slug>/narration.json` | title, slug, lines, cues, pronunciations, gaps; `chapter` titles and `sceneFiles` for long cuts |
| `videos/<slug>/scenes.js` | every scene. Keep the `title` and `end` scene patterns; update the end-card citation |
| `video/shapes.js` | add illustrations you need; reuse the rest |
| `videos/<slug>/beats.json` | storyboard keyframes: scene, cue or `start`, offset, caption |
| `videos/<slug>/page.html` | page copy: argument, takeaways, quotes, about |
| `videos/<slug>/script.md`, `README.md` | the written companions |

Leave alone unless you mean to change the method: `engine.js`, `main.js`, `render.js`, `tts.py`, `align.py`, `timeline.py`, `mix.py`, `encode.py`, `tools/review.py`, `publish/page.py`.

## Gotchas

- SVG text collapses leading and trailing spaces. `T()` sets `white-space:pre`; keep it.
- `ffmpeg -shortest` with a subtitle stream truncates the video. `encode.py` uses `-t`.
- `xstack` layouts need pixel offsets (`960_0`), not expressions like `w0*2`.
- Python f-strings for HTML or JS templates mangle braces and `\n`. Use `videos/<slug>/page.html` and its placeholders, and `node --check` any generated script.
- The spaCy model wheel from Hugging Face must be renamed with a version before `pip install`. `setup.sh` handles it.
- Playwright: reuse the installed version (1.56.1 here, with its browser build) rather than upgrading.
- Keyframes inside an exit fade come out nearly blank (tiny JPEG sizes are the tell). `storyboard.py` clamps to `scene.end − 0.4`.
- Reading full-resolution stills one by one burns context. Use the 4×4 sheets.
