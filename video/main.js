// Bootstrap: frame rendering API for the headless renderer, plus a scrubbable preview.
'use strict';

const TL = window.TIMELINE;
const root = document.getElementById('root');

function sceneCtx(b) {
  return {
    ...b,
    cue(name) {
      const v = TL.cues[`${b.id}.${name}`];
      if (v == null) throw new Error(`missing cue ${b.id}.${name}`);
      return v;
    },
    line(i) { return TL.lines.filter(l => l.scene === b.id)[i]; },
  };
}
const CTX = TL.scenes.map(sceneCtx);
// ?lenient=1 (LENIENT=1 for render.js / review.py): a scene that throws is logged and skipped, so scenes can be
// reviewed while their neighbours are still being written. Full renders stay strict.
const LENIENT = new URLSearchParams(location.search).has('lenient');

function renderFrame(t) {
  const parts = [];
  for (const S of CTX) {
    const sc = SCENES[S.id];
    if (!sc) continue;
    if (t < S.start - (sc.pre ?? 0.05) || t > S.end + (sc.post ?? 0.6)) continue;
    const p = clamp((t - S.start) / Math.max(0.1, S.end - S.start));
    const z = 1 + (sc.zoom ?? 0.02) * Ease.inOutSine(p);
    let svg;
    try { svg = sc.render(t, S); } catch (e) {
      if (!LENIENT) throw e;
      console.error(`scene ${S.id} failed at t=${t.toFixed(2)}: ${e.message}`);
      continue;
    }
    if (!svg) continue;
    parts.push(`<g transform="translate(960 540) scale(${z.toFixed(5)}) translate(-960 -540)">${svg}</g>`);
  }
  for (const c of TL.chapters || []) parts.push(chapterChip(t, c));
  root.innerHTML = parts.join('');
}

// Chapter label, top-left, for the first seconds of each chapter (long videos only).
// It lives in the band above the headlines (y < 95), outside the camera push.
function chapterChip(t, c) {
  const a = c.start + 0.3, b = c.start + 4.8;
  if (t < a || t > b + 0.1) return '';
  const e = P(t, a, 0.5, 'out'), x = 1 - P(t, b - 0.6, 0.6, 'inOut');
  const o = Math.min(e, x);
  return G({ x: 96 - 18 * (1 - e), y: 62, o }, [
    circle(0, 0, 17, { fill: C.goldDeep }),
    T(String(c.n), 0, 6, { size: 17, weight: 800, fill: C.card, anchor: 'middle' }),
    T(c.title, 30, 8, { size: 24, weight: 600, fill: C.ink2, ls: 0.5 }),
  ]);
}

function collectSfx() {
  return CTX.flatMap(S => {
    const sc = SCENES[S.id];
    return sc && sc.sfx ? sc.sfx(S).map(e => ({ ...e, scene: S.id })) : [];
  }).filter(e => e.t != null && !isNaN(e.t)).sort((a, b) => a.t - b.t);
}

window.renderFrame = renderFrame;
window.collectSfx = collectSfx;
window.ready = (async () => {
  const faces = ['400 40px Fraunces', '600 40px Fraunces', '700 40px Fraunces', 'italic 400 40px Fraunces',
    'italic 600 40px Fraunces', '400 40px Inter', '500 40px Inter', '600 40px Inter', '700 40px Inter',
    '800 40px Inter', '400 40px "JetBrains Mono"', '600 40px "JetBrains Mono"', '500 40px Caveat', '700 40px Caveat'];
  await Promise.all(faces.map(f => document.fonts.load(f)));
  await document.fonts.ready;
  await new Promise(res => {
    const img = new Image();
    img.onload = img.onerror = res;
    img.src = 'assets/paper.jpg';
  });
  return true;
})();

// ---------------------------------------------------------------- preview mode
const params = new URLSearchParams(location.search);
if (!params.has('render')) {
  document.body.classList.add('preview');
  const stage = document.getElementById('stage');
  const scrub = document.getElementById('scrub');
  const clock = document.getElementById('clock');
  const btn = document.getElementById('play');
  scrub.max = TL.duration;
  const fit = () => {
    const s = Math.min(1, (window.innerWidth - 16) / 1920, (window.innerHeight - 60) / 1080);
    stage.style.transform = `scale(${s})`;
    stage.style.marginBottom = `${-1080 * (1 - s)}px`;
    stage.style.marginRight = `${-1920 * (1 - s)}px`;
  };
  window.addEventListener('resize', fit);
  let audio = null;
  try { audio = new Audio('../build/' + encodeURIComponent(params.get('video')) + '/mix.wav'); } catch (e) { audio = null; }
  let playing = false, t0 = 0, base = 0;
  const show = t => { renderFrame(t); scrub.value = t; clock.textContent = `${t.toFixed(2)}s`; };
  const tick = () => {
    if (!playing) return;
    const t = audio && !audio.paused ? audio.currentTime : base + (performance.now() - t0) / 1000;
    if (t >= TL.duration) { playing = false; btn.textContent = '▶︎'; return; }
    show(t);
    requestAnimationFrame(tick);
  };
  btn.onclick = () => {
    playing = !playing;
    btn.textContent = playing ? '❚❚' : '▶︎';
    base = +scrub.value; t0 = performance.now();
    if (audio) { audio.currentTime = base; playing ? audio.play().catch(() => {}) : audio.pause(); }
    if (playing) tick();
  };
  scrub.oninput = () => { show(+scrub.value); if (audio) audio.currentTime = +scrub.value; base = +scrub.value; t0 = performance.now(); };
  window.ready.then(() => { fit(); show(params.has('t') ? +params.get('t') : 0); });
}
