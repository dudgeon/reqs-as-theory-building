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

function renderFrame(t) {
  const parts = [];
  for (const S of CTX) {
    const sc = SCENES[S.id];
    if (!sc) continue;
    if (t < S.start - (sc.pre ?? 0.05) || t > S.end + (sc.post ?? 0.6)) continue;
    const p = clamp((t - S.start) / Math.max(0.1, S.end - S.start));
    const z = 1 + (sc.zoom ?? 0.02) * Ease.inOutSine(p);
    const svg = sc.render(t, S);
    if (!svg) continue;
    parts.push(`<g transform="translate(960 540) scale(${z.toFixed(5)}) translate(-960 -540)">${svg}</g>`);
  }
  root.innerHTML = parts.join('');
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
  try { audio = new Audio('../build/mix.wav'); } catch (e) { audio = null; }
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
