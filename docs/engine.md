# Engine reference: the SVG motion-graphics kit

Everything visual in the video is drawn by about 1,550 lines of plain JavaScript in `video/`, with no framework and no build step. About 830 lines are the reusable engine, library and renderer; about 720 are this video's scenes. This page is the API reference, plus the recipes the scenes use. For the overall workflow see [`playbook.md`](playbook.md).

## How it runs

```
video/index.html   fonts (@font-face, OFL files in video/fonts), paper texture, SVG <defs>, the <g id="root"> stage
video/timeline.js  generated: window.TIMELINE = { fps, duration, scenes[], lines[], cues{} }
video/engine.js    maths, easing, SVG builders, text, motion helpers, palette C
video/shapes.js    illustration library (people, heads, props, icons, the constellation)
video/scenes.js    SCENES[id] = { render(t, S), sfx(S) }  ← the per-video choreography
video/main.js      renderFrame(t), collectSfx(), window.ready, and the browser preview player
video/render.js    Playwright driver: --stills / --frames / --sfx
```

`renderFrame(t)` finds every scene whose window contains `t` (from `S.start − pre` to `S.end + post`), calls `render(t, S)`, wraps each result in a slow camera push (`zoom`, default 2% over the scene, eased), and replaces `#root`'s contents. There is **no state between frames**. Any frame can be rendered alone and in any order, which is what makes parallel rendering and still-based review work.

The canvas is a 1920×1080 SVG with y pointing down. Every illustration draws around its own local origin; you place it with `G({x, y, s, r, o}, …)`.

## Scene API

```js
SCENES.name = {
  render(t, S) { … return svgString; },   // required
  sfx(S) { return [{ t, type, … }]; },     // optional sound-effect cues
  pre: 0.05,  post: 0.6,                   // optional: extra render window before/after the scene
  zoom: 0.02,                              // optional: camera push over the scene (0 = none)
};
```

`S` holds the scene's slice of the timeline:

| Field | Meaning |
|---|---|
| `S.start`, `S.end` | Scene window in absolute seconds. `start` is 0.45 s before the first line; `end` is the next scene's start. |
| `S.voStart`, `S.voEnd` | First line starts; last line ends |
| `S.cue(name)` | Absolute time of `{name}` in this scene's lines. Throws if it's missing, which is how typos surface. |
| `S.line(i)` | The i-th narration line `{ text, start, end, words[] }` |
| `S.id` | Scene id |

Scene ids come from `narration.json`, plus two implicit ones: `title`, from 0 to the first scene's start (`leadIn − 0.45` s), and `end`, which starts 0.35 s after the last line and lasts `tail` s.

## Timing and motion (`engine.js`)

| Function | Returns | Use |
|---|---|---|
| `P(t, t0, d = 0.5, ease = 'out')` | 0…1 | Progress of an animation starting at `t0` lasting `d` s |
| `Ease.{linear, in, out, inOut, outQuart, inOutSine, outBack, outBackSoft, outExpo, outElastic}` | fn | Easing curves (cubic by default) |
| `enter(t, t0, {d = 0.55, dy = 26, from = 0.9, ease = 'outBackSoft'})` | `{o, s, y, p}` | Standard entrance: fade, rise by `dy`, scale up from `from` |
| `exitAt(t, t1, d = 0.4)` | `{o, y, q}` | Standard exit (`inOut`), drifting up 14 px |
| `env(t, a, b, di, do_)` | 0…1 | Fade in at `a`, fade out ending at `b` |
| `pulse(t, tp, d = 0.5, amt = 0.08)` | scale | A brief swell at `tp` for emphasis |
| `wobble(t, f, a, ph)` | number | Sine idle motion |
| `clamp`, `lerp` | | |
| `rng(seed)` | fn → 0…1 | Deterministic randomness (mulberry32) |
| `once(key, fn)` | cached value | Compute a layout once (constellations, skylines) |

**Conventions** (these fixed real bugs, see behind-the-scenes items 9–10):

```js
const X = exitAt(t, S.end - 0.3, 0.4);              // every scene: out from S.end-0.3 to S.end+0.1
const eH = enter(t, S.start + 0.02, { dy: 14 });     // first element arrives with the scene
const e = enter(t, S.cue('map') - 0.3);              // lead the spoken word by ~0.3 s
return G({ o: X.o, y: X.y }, out);                   // wrap the whole scene in its exit
```

## SVG builders

All return strings. Styling uses a short options object: `fill`, `stroke`, `sw` (stroke width), `o` (opacity), `dash`, `rx`, `cap`, `filter`.

| Builder | Notes |
|---|---|
| `G({x, y, s, sx, sy, r, o, filter, clip}, ...children)` | Group: translate, then rotate (degrees), then scale. Returns `''` when `o ≤ 0.001`, so hidden things cost nothing. |
| `rect(x, y, w, h, o)`, `circle(cx, cy, r, o)`, `ellipse(cx, cy, rx, ry, o)`, `line(x1, y1, x2, y2, o)`, `path(d, o)` | Primitives |
| `drawPath(d, p, {stroke, sw, o})` | Stroke drawn on from 0 to `p` (uses `pathLength=1`). Use it for arrows, underlines, strikes and connecting threads. |
| `poly(pts, close)`, `smooth(pts, close)` | Path data from points; `smooth` is Catmull-Rom |
| `arcPath(x1, y1, x2, y2, bend)`, `quadPoint(x1, y1, x2, y2, bend, p)` | A curved connector, and a point along it (for moving things along arcs) |

## Text

| Function | Notes |
|---|---|
| `T(str, x, y, {font, size, weight, italic, fill, anchor, ls, o, stroke, sw})` | `font`: `'serif'` (Fraunces), `'sans'` (Inter), `'mono'` (JetBrains Mono), `'hand'` (Caveat). `anchor`: `start`, `middle` or `end`. Sets `white-space:pre`, so spaces survive. |
| `richText(segments, x, y, opts)` | One line with mixed styles: `[{t:'Programming '}, {t:'is ', italic:true, fill:C.ink2}, {t:'theory building', fill:C.goldDeep}]`. Measures each piece, so `anchor:'middle'` centres the whole line. |
| `measure(str, size, family, weight, italic)` | Pixel width, from canvas with the real loaded font. Use it for underlines sized to words and for morphing layouts (the title card). |
| `typeText(str, p, x, y, o)` | Typewriter reveal |

The type scale used: headlines 56–64 (serif 600), title 96–104 (serif 700), section labels 24–30 (sans 800, letterspaced, uppercase), captions 40–52 (hand 700), code 20–30 (mono).

## Palette `C`

| Token | Hex | Meaning in this video |
|---|---|---|
| `paper`, `paper2`, `paper3`, `card` | `#F3EDE2` … `#FFFDF8` | Ground and cards |
| `ink`, `ink2`, `ink3`, `faint` | `#1E2A3A` … | Text and line work |
| `night`, `night2` | `#1C2638` | Inside heads (the "night sky" behind the constellation) |
| `gold`, `goldDeep`, `goldLight` | `#F2A93B` … | **Theory** |
| `coral`, `coralDark`, `coralLight` | `#E4572E` … | **Spec** and critique marks (strike-outs, ✕) |
| `teal`, `tealDark`, `tealLight` | `#2A9D8F` … | **The world** (institutions, rules, people) and success ticks |
| `plum`, `plumLight` | `#7A6AD8` | **Agents** |
| `blue`, `mustard`, `olive`, `grey`, `sky` | | Supporting props |
| `skin[0-4]`, `hair[0-4]` | | Character variety |

The glow is a radial gradient (`url(#gGlow)` in `index.html`), not an SVG filter. Filters are slow to rasterize; gradients are nearly free.

## Illustration library (`shapes.js`)

| Component | Size and origin | Key options |
|---|---|---|
| `person(t, o)` | Feet at (0,0), about 255 px tall | `shirt, skin, hair, hairStyle 0–4, pants, mood (neutral, happy, worried, closed, o), arms (down, typing, hold, write, wave, point, shrug, hips, or [[x,y],[x,y]] hand positions), look (-1…1 eye direction), flip, glowHead, seed` (offsets the blink timing) |
| `bigHead(t, {fill})` | Cranium centre at (0,0), about 400×460 | Profile head facing right; `HEAD_PATH` exported |
| `makeConstellation(seed, n, {cx, cy, rx, ry, minD, extra})` | | Points in an ellipse, spanning tree plus extra short edges, reveal order grown outward |
| `constellation(t, K, {t0, dur, size, lineW, glow, color, lineColor, lineO, twinkle, dim, o})` | K's coordinates | Nodes pop in along the tree, edges draw once both ends exist, nodes twinkle |
| `codeCard({w, h, reveal, seed, title, dark, highlight, lineH})` | Centred | Window with coloured code bars; `reveal` 0…1 types it out |
| `docCard({w, h, title, lines, reveal, accent, fold, heading, checks, seed})`, `specDoc(o)` | Centred | Page with folded corner; `specDoc` is the coral "SPEC" variant with checkboxes |
| `shadowCard(x, y, w, h, {rx, fill, stroke})` | Top-left at x, y | Card with a soft drop shadow |
| `iconBank`, `iconPolicy` (§ + seal), `iconBust`, `iconGears(t)`, `iconServer(t)` | About 120 px, centred | `color`; gears and server lights animate with `t` |
| `robot(t, {color, look, typing})` | Base at (0,0), about 230 px tall | Blinks; arms tap when `typing` |
| `laptopFront(t, {w, h, screen, inner})`, `laptopBack({w, h})`, `desk(w)` | Base at (0,0) | |
| `speechBubble(w, h, {tail: left, right or centre})`, `thoughtBubble(w, h, {fill, stroke, dash, tailX})` | Centred | Put text or a constellation inside with `G` |
| `binder`, `stickyNote(text or [lines], {w, h, size, r})`, `magnifier`, `priceTag(label, {w})`, `puzzlePiece({color, size})`, `tapeStrip(w)` | Centred | Props |
| `heartbeat(t, {w, alive, color})` | Centred | ECG monitor; animate `alive` 1 → 0 for a flatline |
| `loopArrows(t, {r, color, spin})`, `badge(n)`, `pill(text)` | Centred | |
| `checkMark(p)`, `crossMark(p, {size, sw})`, `handArrow(x1, y1, x2, y2, p, {bend, head, color, sw})`, `underline(x, y, w, p)` | | Drawn-on marks |

Scene-local helpers in `scenes.js` that are worth lifting if you reuse them: `sparkle(x, y, r)`, `compilerMachine(t, {patch, patchT, decay})`, `mixColor(a, b, p)` (hex lerp, useful for "decay to grey"), and `HEAD_K()` (the shared head constellation).

## Recipes (all used in the video)

**Staggered list entrance** (world icons, ability cards):
```js
items.forEach((it, i) => { const e = enter(t, S.cue('world') - 0.2 + i * 0.12);
  out.push(G({ x: 300, y: ys[i] + e.y, s: 0.72 * e.s, o: e.o }, it())); });
```

**Threads that connect things** (world → theory → program):
```js
out.push(drawPath(arcPath(x1, y1, x2, y2, 0.12), P(t, t0 + i * 0.12, 0.7, 'inOut'), { stroke: C.goldDeep, sw: 2.5 }));
```

**Move along an arc** (the spec flying to the agent):
```js
const f = P(t, S.cue('getsspec'), 0.85, 'inOut');
const [x, y] = quadPoint(610, 700, 1610, 818, -0.32, f);
out.push(G({ x, y, s: lerp(1, 0.42, f), r: lerp(-4, 8, f) }, specDoc()));
```

**Damped swing** (the price tag): `r = base + 28 * Math.exp(-3 * lt) * Math.sin(lt * 9)`, where `lt = t − t0`.

**Something tried and failed** (the theory orb): travel about 40% along an arc, fall with `P(…, 'in')`, fade, pop a small `crossMark`.

**Fragments gather into a whole** (the enterprise scene): lerp each fragment node to a target node in the destination constellation. Fade fragment **edges** during the move (`lineO: 0.75 * (1 - clamp(gather * 3))`), then cross-fade to the destination's own constellation, so long stretched edges never show.

**Headline swap inside a scene:** `o = eOld.o * (1 - P(t, tSwap - 0.35, 0.35))` for the old one, and `enter(t, tSwap - 0.1)` for the new one.

**Reframe to use empty space:** animate a group's x across a beat (`lerp(1130, 1450, P(t, never - 0.7, 0.9, 'inOut'))`) so the frame is full both before and after a new element arrives.

**Character exits:** flip the figure, move x with `P(t, t0, 1.6, 'in')`, bob `y = -|sin((t − t0) * 9)| * 8`.

**Decay:** `mixColor(C.teal, '#A9ADB3', decay)` on fills, plus a small sinusoidal jitter on positions scaled by `decay`.

## Sound-effect catalogue (`pipeline/mix.py`)

Events come from each scene's `sfx(S)`: `{ t, type, gain = 1, pitch = 1, dur, note, pan }`.

| type | Sound | Typical use |
|---|---|---|
| `pop` | Short pitched blip (`pitch` scales it) | Something appears |
| `tick`, `click` | Tiny transient | Small items, a piece clicking into place |
| `whoosh`, `swish` | Band-passed noise sweep (`dur`) | Moves, transitions, a casting line |
| `rise` | Rising sweep with tone | A build-up (skyline rising, orb launching) |
| `chime` | Bell partials on D-major pentatonic (`note` 0–9) | Insight or "theory" moments |
| `pluck` | Marimba-like (`note`) | List items; ascending 0, 2, 4, 7 |
| `scribble` | Pencil-stroke noise (`dur`) | Underlines, strike-throughs, writing |
| `typing` | Random keyclicks (`dur`) | Code streaming |
| `thud` | Low knock | Something lands |
| `tape` | Sticky-tape rip with crackle | Patches |
| `fizzle` | Falling tone plus noise | Failure |
| `plop` | Water drop | The bobber lands |
| `steps` | Footsteps (`dur`) | Characters walking off |
| `flatline` | Soft monitor tone (`dur`) | Program death |
| `swing`, `creak` | Light swish plus ding; low creak | Price tag; balance tipping |

The music bed is four chords (D, Bm, G, A-sus) of about 6 s each, sine pads with slow cross-fades, low-passed at 1.8 kHz. It's normalised to −36 dBFS RMS, ducked to 0.55× under speech, and faded in and out. The final loudness is set in `encode.py` (two-pass loudnorm, −16 LUFS, −1.5 dBTP).

## Preview and rendering

```bash
python3 -m http.server                             # from the repo root
# http://localhost:8000/video/index.html           scrubbable player, plays build/mix.wav in sync
# http://localhost:8000/video/index.html?t=24.3    a single frame
node video/render.js --stills 24.3,30.5            # build/stills/t_024.30.jpg …
node video/render.js --frames --workers 4          # build/frames/f_00000.jpg … (JPEG q93)
node video/render.js --sfx                         # build/sfx.json
```

Performance: about 32 frames per second on 4 vCPUs. Keep a frame under about 2,000 elements, use gradients instead of filters, and cache expensive geometry with `once()`.
