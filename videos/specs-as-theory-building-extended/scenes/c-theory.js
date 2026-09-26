// Scenes: ryle, newton, abilities (chapters 3 "What a theory is" and 4 "What the theory makes possible").
// Wrapped in an IIFE so helpers stay local to this file. Timing comes only from cues, lines and scene bounds.
'use strict';
(() => {

// ================================================================== local helpers
const GREY = '#A9ADB3';
const CHALK = '#F3EFE4';

// serif headline centred on the stage
const headline = (segs, o = {}) => richText(segs, 960, o.y ?? 150, { font: 'serif', size: o.size ?? 60, weight: 600, anchor: 'middle' });
// hand-lettered label (centred by default)
const hand = (s, x, y, o = {}) => T(s, x, y, { font: 'hand', size: 46, weight: 700, anchor: 'middle', fill: C.ink2, ...o });
// fractional part
const frac = v => v - Math.floor(v);
// phase swaps inside a scene: the old phase fades over SWAP_FD, ending at the swap time sw; the next phase starts at
// sw - 0.1. The old headline alone fades a little faster (hdOut), so two headlines are never on screen together.
const SWAP_FD = 0.34;
const hdOut = (t, sw) => 1 - P(t, sw - SWAP_FD, SWAP_FD - 0.1, 'inOut');

// teal success badge with a tick, centred (p 0…1)
function tickBadge(p, r = 28) {
  if (p <= 0) return '';
  return G({ s: lerp(0.4, 1, Ease.outBack(clamp(p * 1.3))), o: clamp(p * 3) },
    circle(0, 0, r, { fill: C.teal }), circle(0, 0, r, { stroke: C.card, sw: 3 }),
    G({ s: r / 34 }, checkMark(clamp(p * 1.6 - 0.3), { color: C.card, sw: 8 })));
}
// speech bubble with a hand-lettered line; p 0…1 pops it in, q 0…1 pops it out
function sayBubble(txt, p, q, o = {}) {
  if (p <= 0 || q >= 1) return '';
  const w = o.w ?? 290, h = o.h ?? 92;
  return G({ s: lerp(0.5, 1, Ease.outBack(clamp(p))) * (1 - 0.15 * q), o: clamp(p * 2.5) * (1 - q) },
    speechBubble(w, h, { tail: o.tail ?? 'left', fill: o.fill, stroke: o.stroke }),
    T(txt, 0, 14, { font: 'hand', size: o.size ?? 46, weight: 700, anchor: 'middle', fill: o.color ?? C.ink }));
}
// three bouncing "talking" dots
const talkDots = t => [0, 1, 2].map(i => circle(-26 + i * 26, -7 * Math.max(0, Math.sin(t * 9 - i * 0.9)), 7, { fill: C.ink2 })).join('');
// a small yellow pencil whose tip sits at the origin
const pencil = () => G({ r: 34 }, rect(-6.5, -66, 13, 52, { rx: 2, fill: C.mustard }), rect(-6.5, -74, 13, 9, { rx: 2, fill: C.coralLight }),
  path('M-6.5 -14 L6.5 -14 L0 2 Z', { fill: '#E9D4AE' }), path('M-2.2 -4 L2.2 -4 L0 2 Z', { fill: C.ink }));
// a "≈" badge (similarity)
function approx(p, o = {}) {
  if (p <= 0) return '';
  const r = o.r ?? 24;
  return G({ s: lerp(0.3, 1, Ease.outBack(clamp(p))) * (o.s ?? 1), o: clamp(p * 2.5) },
    circle(0, 0, r * 2.2, { fill: 'url(#gGlow)', o: 0.5 }), circle(0, 0, r, { fill: C.card, stroke: C.goldDeep, sw: 3 }),
    T('≈', 0, r * 0.44, { font: 'serif', size: r * 1.35, weight: 700, fill: C.goldDeep, anchor: 'middle' }));
}

// ================================================================== RYLE
// Stylised portrait card: a silhouette cameo, the name and the book. Centred, 400×500.
function rylePortrait() {
  const cy = -80;
  return [
    shadowCard(-200, -250, 400, 500, { rx: 18 }),
    `<clipPath id="c3_ryle_cameo"><ellipse cx="0" cy="${cy}" rx="116" ry="138"/></clipPath>`,
    ellipse(0, cy, 116, 138, { fill: C.paper2 }),
    G({ clip: 'url(#c3_ryle_cameo)' },
      path('M-150 112 C-138 42 -92 24 -46 18 L52 18 C98 24 138 42 150 112 Z', { fill: C.ink2 }),
      path('M-22 18 L6 58 L32 18 Z', { fill: C.paper2 }),
      G({ x: -10, y: cy - 6, s: 0.44 }, path(HEAD_PATH, { fill: C.ink2 }))),
    ellipse(0, cy, 124, 146, { stroke: C.faint, sw: 7 }),
    ellipse(0, cy, 116, 138, { stroke: C.ink3, sw: 1.5 }),
    T('Gilbert Ryle', 0, 136, { font: 'serif', size: 46, weight: 600, anchor: 'middle' }),
    T('The Concept of Mind (1949)', 0, 184, { font: 'serif', size: 27, italic: true, fill: C.ink2, anchor: 'middle' }),
  ].join('');
}

// Panel 1: one person tells a joke, the other laughs. Panel-local coordinates (480×460 card).
function jokePanel(t, c) {
  const tell = c.joke - 0.3, laugh = c.joke + 0.55;
  const talking = t > tell && t < laugh + 0.4;
  const gest = talking ? [72 + wobble(t, 1.7, 10), -186 + wobble(t, 2.3, 12)] : [52, -108];
  const bounce = t > laugh ? -Math.abs(Math.sin((t - laugh) * 12)) * 7 * (1 - P(t, laugh + 1.4, 0.6)) : 0;
  const out = [];
  out.push(G({ x: -105, y: 196, s: 0.8 }, person(t, { shirt: C.coral, skin: C.skin[1], hair: C.hair[1], hairStyle: 1, seed: 31, look: 0.7, mood: t > laugh ? 'happy' : 'neutral', arms: [[-52, -108], gest] })));
  out.push(G({ x: 110, y: 196 + bounce, s: 0.8 }, person(t, { shirt: C.blue, skin: C.skin[4], hair: C.hair[2], hairStyle: 2, seed: 32, flip: true, look: 0.6, mood: t > laugh ? 'happy' : 'neutral', arms: t > laugh ? [[-30, -128], [30, -128]] : 'down' })));
  const b = P(t, tell, 0.45, 'outBack');
  if (b > 0) out.push(G({ x: -60, y: -150, s: lerp(0.5, 1, b), o: clamp(b * 2.5) }, speechBubble(176, 78, { tail: 'left' }), G({ y: 6 }, talkDots(t))));
  const h1 = P(t, laugh, 0.4, 'outBack'), h2 = P(t, laugh + 0.3, 0.4, 'outBack');
  if (h1 > 0) out.push(G({ x: 158, y: -96 + bounce * 0.5, s: h1, r: 9, o: clamp(h1 * 2) }, T('ha ha!', 0, 0, { font: 'hand', size: 46, weight: 700, fill: C.coral, anchor: 'middle' })));
  if (h2 > 0) out.push(G({ x: 92, y: -160, s: h2, r: -7, o: clamp(h2 * 2) }, T('ha!', 0, 0, { font: 'hand', size: 40, weight: 700, fill: C.coral, anchor: 'middle' })));
  return out;
}

// Panel 2: casting a fishing line; the bobber plops. Lifted from the 90 s cut.
function fishPanel(t, c) {
  const how = c.fish - 0.2;
  const out = [];
  out.push(path('M-46 150 Q-10 142 26 150 T98 150 T170 150 T222 148 L222 200 Q222 212 210 212 L-46 212 Z', { fill: C.tealLight, o: 0.6 }));
  [0, 1].forEach(k => {
    const ph = frac(t * 0.25 + k * 0.5);
    out.push(path(`M${r2(-20 + ph * 200)} ${176 + k * 16} q10 -5 20 0`, { stroke: C.card, sw: 2.5, o: 0.7 * Math.sin(ph * Math.PI) }));
  });
  out.push(rect(-228, 132, 206, 14, { rx: 4, fill: '#C69C6D' }), rect(-206, 146, 11, 66, { fill: '#A77E52' }), rect(-52, 146, 11, 66, { fill: '#A77E52' }));
  const fx = -150, fy = 132, fs = 0.72;
  out.push(G({ x: fx, y: fy, s: fs }, person(t, { shirt: C.olive, skin: C.skin[3], hair: C.hair[0], hairStyle: 0, arms: [[-30, -150], [40, -168]], seed: 33, mood: 'happy', look: 0.6 })));
  const rodA = t < how ? -58 + wobble(t, 0.5, 2) : t < how + 0.3 ? lerp(-58, -104, P(t, how, 0.3, 'out')) : lerp(-104, -26, P(t, how + 0.3, 0.45, 'outBack'));
  const hx = fx + 40 * fs, hy = fy - 168 * fs, L = 178, rad = rodA * Math.PI / 180;
  const tipX = hx + Math.cos(rad) * L, tipY = hy + Math.sin(rad) * L;
  out.push(line(hx, hy, tipX, tipY, { stroke: '#6B4E2E', sw: 5 }));
  const launch = how + 0.5, landT = how + 1.05;
  const land = P(t, launch, landT - launch, 'out');
  const bob = t > landT ? Math.sin((t - landT) * 4.2) * 3 : 0;
  if (t >= launch) {
    const bx = lerp(tipX, 150, land), by = lerp(tipY + 40, 152, land) - Math.sin(land * Math.PI) * 110 + bob;
    out.push(path(`M${r2(tipX)} ${r2(tipY)} Q${r2((tipX + bx) / 2)} ${r2(Math.min(tipY, by) - 24 + 60 * land)} ${r2(bx)} ${r2(by)}`, { stroke: C.ink2, sw: 2 }));
    out.push(circle(bx, by, 9, { fill: C.coral }), circle(bx, by - 4, 4.5, { fill: C.card }));
  } else {
    out.push(line(tipX, tipY, tipX, tipY + 40, { stroke: C.ink2, sw: 2 }), circle(tipX, tipY + 40, 9, { fill: C.coral }), circle(tipX, tipY + 36, 4.5, { fill: C.card }));
  }
  [0, 0.45].forEach(d => {
    const rp = P(t, landT + d, 1.1, 'out');
    if (rp > 0 && rp < 1) out.push(ellipse(150, 158, 16 + 50 * rp, 4 + 10 * rp, { stroke: C.teal, sw: 3, o: 1 - rp }));
  });
  return out;
}

// Panel 3: writes "recieve", notices, strikes it, writes "receive".
function lapsePanel(t, c) {
  const out = [];
  // timed so the fix and its tick are done before the phase clears (just after "lapses")
  const wA = c.lapses - 2.05, wB = c.lapses + 0.15, strikeT = c.lapses - 0.15;
  // notepad
  out.push(G({ x: 52, y: -80, r: -2.5 }, [
    rect(-168 + 3, -108 + 7, 336, 216, { rx: 8, fill: 'rgba(30,42,58,0.10)' }),
    rect(-168, -108, 336, 216, { rx: 8, fill: C.card, stroke: C.faint, sw: 2 }),
    ...[-38, 22, 82].map(yy => line(-150, yy, 150, yy, { stroke: C.sky, sw: 2.5 })),
    line(-118, -108, -118, 108, { stroke: C.coralLight, sw: 2, o: 0.8 }),
    ...[-120, -80, -40, 0, 40, 80, 120].map(xx => circle(xx, -98, 4, { fill: C.paper3 })),
  ]));
  // words, in notepad-ish coordinates (not rotated, for crisp text)
  const x0 = -52, y1 = -110, y2 = -50;
  const p1 = P(t, wA, 1.25, 'linear'), p2 = P(t, wB, 0.45, 'linear');
  const s1 = 'recieve', s2 = 'receive';
  out.push(typeText(s1, p1, x0, y1, { font: 'hand', size: 56, weight: 700, fill: C.ink }));
  const w1 = measure(s1, 56, 'hand', 700);
  const st = P(t, strikeT, 0.3, 'inOut');
  out.push(drawPath(`M${x0 - 8} ${y1 - 16} C${x0 + w1 * 0.3} ${y1 - 22} ${x0 + w1 * 0.7} ${y1 - 12} ${x0 + w1 + 8} ${y1 - 19}`, st, { stroke: C.coral, sw: 6 }));
  out.push(typeText(s2, p2, x0, y2, { font: 'hand', size: 56, weight: 700, fill: C.ink }));
  // the pencil follows the writing
  const writing2 = t > wB - 0.15;
  const cur = writing2 ? s2.slice(0, Math.round(p2 * s2.length)) : s1.slice(0, Math.round(p1 * s1.length));
  const px = x0 + measure(cur, 56, 'hand', 700) + 4, py = (writing2 ? y2 : y1) - 4 + (p1 > 0 && p1 < 1 || p2 > 0 && p2 < 1 ? Math.sin(t * 30) * 3 : 0);
  const pencilO = P(t, wA - 0.4, 0.3) * (1 - P(t, wB + 0.8, 0.4));
  if (pencilO > 0) out.push(G({ x: px, y: py, o: pencilO }, pencil()));
  // the writer notices
  const noticed = t > c.lapses - 0.4;
  out.push(G({ x: -168, y: 204, s: 0.7 }, person(t, { shirt: C.plumLight, skin: C.skin[2], hair: C.hair[3], hairStyle: 3, seed: 34, look: 0.7, mood: noticed && t < wB + 0.3 ? 'o' : t > wB + 0.3 ? 'happy' : 'neutral', arms: [[-40, -118], [62, -196]] })));
  const bang = P(t, c.lapses - 0.4, 0.35, 'outBack') * (1 - P(t, wB + 0.5, 0.3));
  if (bang > 0) out.push(G({ x: -118, y: -12, s: bang, r: 10, o: clamp(bang * 2) }, T('!', 0, 0, { font: 'serif', size: 64, weight: 700, fill: C.coral, anchor: 'middle' })));
  return out;
}

// Phase 3: a receding row of rulebooks; book p sits at rpos(p) with scale k^p.
const R_K = 0.7, R_X0 = 440, R_XI = 1630, R_Y0 = 580, R_YI = 532;
const rpos = p => { const k = Math.pow(R_K, p); return [R_XI - (R_XI - R_X0) * k, R_YI - (R_YI - R_Y0) * k, k]; };
function farBook(col) {
  return [book({ w: 300, h: 400, color: col }), ...[-150, -118, -86, -54].map((y, i) => rect(-96 + (i % 2) * 14, y, 192 - (i % 2) * 28, 15, { rx: 7.5, fill: 'rgba(255,255,255,0.7)' }))].join('');
}
function rulesPhase(t, c) {
  const out = [];
  // the headline and the RULES book arrive together, as the panels finish clearing
  const tIn = c.sw2 - 0.1;
  const eH = enter(t, tIn, { dy: 14 });
  const hw = measure('Rule-following?', 60, 'serif', 600);
  const strike = P(t, c.regress + 0.4, 0.4, 'inOut');
  out.push(G({ o: eH.o * hdOut(t, c.sw3), y: eH.y }, headline([{ t: 'Rule-following?' }]),
    drawPath(`M${r2(960 - hw / 2 - 12)} 134 C${r2(960 - hw / 6)} 126 ${r2(960 + hw / 6)} 140 ${r2(960 + hw / 2 + 12)} 128`, strike, { stroke: C.coral, sw: 8 })));
  // book 0: RULES (centre first, then it takes its place at the head of the row)
  const slide = P(t, c.rules2 - 0.55, 0.6, 'inOut');
  const [x0, y0] = rpos(0);
  const b0 = P(t, tIn + 0.05, 0.6, 'outBack'), b0o = P(t, tIn + 0.05, 0.25);
  const bx0 = lerp(960, x0, slide), by0 = lerp(570, y0, slide) + wobble(t, 0.35, 4);
  // perspective guides: the row is a tunnel that narrows to the vanishing point
  const gp = P(t, c.regress - 0.45, 0.8, 'inOut');
  if (gp > 0) [-1, 1].forEach(sg => out.push(drawPath(`M${x0 + 150} ${y0 + sg * 200} L${R_XI} ${R_YI}`, gp, { stroke: C.ink3, sw: 2, o: 0.4 })));
  // far books: an endless stream drifting into the vanishing point ("and so on forever")
  const flowT = c.regress + 0.2, ft = Math.max(0, t - flowT);
  const u = 0.45 + 0.38 * ft;
  const far = [];
  for (let m = 13; m >= 0; m--) {
    const p = 2 + m + frac(u);
    const ap = P(t, c.regress - 0.35 + 0.9 * (1 - Math.pow(0.72, m)), 0.3, 'outBack');
    if (ap <= 0) continue;
    const [x, y, k] = rpos(p);
    const fade = clamp((p - 2) / 0.4) * (1 - 0.05 * p);
    far.push(G({ x, y: y - (1 - ap) * 40 * k, s: k * lerp(0.6, 1, ap), o: clamp(ap * 2) * fade }, farBook(mixColor(C.blue, C.paper3, clamp(0.08 + 0.06 * p)))));
    // small chevron to the next book
    const [xn, yn, kn] = rpos(p + 1);
    const cx = (x + 150 * k + xn - 150 * kn) / 2;
    if (k > 0.04) far.push(G({ x: cx, y: (y + yn) / 2, s: k * 1.6, o: clamp(ap * 2) * fade * 0.8 }, path('M-6 -10 L4 0 L-6 10', { stroke: C.ink3, sw: 4 })));
  }
  out.push(far.join(''));
  // the vanishing point: ∞
  const inf = P(t, c.regress + 0.15, 0.5, 'outBack');
  if (inf > 0) out.push(G({ x: R_XI + 82, y: R_YI + 30, s: inf * (1 + 0.06 * Math.sin(t * 4)), o: clamp(inf * 2) }, T('∞', 0, 0, { font: 'serif', size: 96, weight: 600, fill: C.ink, anchor: 'middle' })));
  // book 1: RULES FOR APPLYING THE RULES
  const [x1, y1, k1] = rpos(1);
  const b1 = P(t, c.rules2 - 0.3, 0.6, 'outBack'), b1o = P(t, c.rules2 - 0.3, 0.25);
  if (b1o > 0) out.push(G({ x: lerp(x1 + 380, x1, b1), y: y1 + wobble(t, 0.35, 3, 1.2), s: k1, r: lerp(10, 1.5, b1), o: b1o }, book({ title: ['RULES FOR', 'APPLYING', 'THE RULES'], w: 300, h: 400, color: mixColor(C.blue, C.paper3, 0.06) })));
  if (b0o > 0) out.push(G({ x: bx0, y: by0 - 70 * (1 - b0), s: lerp(0.85, 1, b0), r: -2, o: b0o }, book({ title: ['RULES'], w: 300, h: 400, color: C.blue })));
  // arrows: book 0 → book 1 → the rest
  out.push(handArrow(x0 + 162, y0 - 20, x1 - 118, y1 - 16, P(t, c.rules2 + 0.05, 0.45, 'inOut'), { color: C.ink2, sw: 4, head: 14, bend: -0.3 }));
  const [x2, y2, k2] = rpos(2.45);
  out.push(handArrow(x1 + 116, y1 - 14, x2 - 150 * k2 - 10, y2 - 10, P(t, c.regress - 0.35, 0.35, 'inOut'), { color: C.ink2, sw: 3.5, head: 12, bend: -0.3 }));
  // "absurd"
  const ab = P(t, c.regress + 0.55, 0.45, 'outBack');
  if (ab > 0) out.push(G({ x: 1560, y: 800, s: lerp(0.6, 1, ab), r: -4, o: clamp(ab * 2) }, hand('absurd', 0, 0, { size: 64, fill: C.coral }),
    underline(-92, 18, 184, P(t, c.regress + 0.8, 0.4, 'inOut'), { color: C.coral, sw: 5 })));
  return out;
}

// Phase 4: explain, answer, argue.
function theoryTalk(t, c) {
  const out = [];
  const eH = enter(t, c.sw3 - 0.1, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Having a ' }, { t: 'theory', fill: C.goldDeep }, { t: ' goes further' }])));
  const eP = enter(t, c.sw3 + 0.02, { dy: 30, d: 0.6 });
  const asking = t > c.answer - 0.35, arguing = t > c.argue - 0.3;
  const askArms = arguing ? 'hips' : asking ? [[-52, -108], [56, -238]] : 'down';
  const OX = 600, HX = 1320, PY = 955, PS = 1.2;
  out.push(G({ x: OX, y: PY + eP.y, s: PS, o: eP.o }, person(t, { shirt: C.blue, skin: C.skin[3], hair: C.hair[3], hairStyle: 3, seed: 41, look: 0.7, arms: askArms, mood: arguing ? 'closed' : asking ? 'o' : 'neutral' })));
  const bubble = P(t, c.sw3 + 0.25, 0.7);
  const beats = [c.explain - 0.3, c.answer + 0.15, c.argue + 0.1];
  const talkPulse = beats.reduce((m, tp) => Math.max(m, t > tp ? Math.exp(-(t - tp) * 2.2) : 0), 0);
  const holdArms = t > c.argue + 0.1 ? 'point' : t > c.explain - 0.3 ? [[-52, -108], [84, -180 + wobble(t, 1.4, 8)]] : 'down';
  out.push(G({ x: HX, y: PY + eP.y, s: PS, o: eP.o }, holder(t, {
    flip: true, bubble, shirt: C.olive, skin: C.skin[0], hair: C.hair[1], hairStyle: 0, seed: 42, look: 0.7, mood: 'happy', arms: holdArms, glowHead: 0.6 * talkPulse,
    theory: { seed: 12, n: 10, t0: c.sw3 + 0.4, dur: 1.0, glow: 1 + 0.8 * talkPulse },
  })));
  // holder's lines (right slot) and the other person's (left slot)
  const hs = (a, b) => [P(t, a, 0.4), b == null ? 0 : P(t, b, 0.22)];
  const [e1, x1] = hs(c.explain - 0.3, c.answer + 0.1), [e2, x2] = hs(c.answer + 0.15, c.argue + 0.05), [e3] = hs(c.argue + 0.1);
  const [q1, qx1] = hs(c.answer - 0.35, c.argue - 0.35), [q2] = hs(c.argue - 0.3);
  const R = [1090, 505], Lp = [700, 440];
  // each reply draws on the theory: a few gold sparkles pop around the holder's bubble
  beats.forEach((tp, i) => {
    const sp = P(t, tp + 0.1, 0.5, 'outBack') * (1 - P(t, tp + 0.9, 0.4));
    if (sp > 0) [[-176, -40, 15], [170, -46, 11], [-164, 50, 10]].forEach(([dx, dy, r], k) =>
      out.push(sparkle(R[0] + dx + (i - 1) * 12, R[1] + dy - 14 * sp, r * sp * (1 + 0.12 * Math.sin(t * 6 + k)), { fill: C.gold })));
  });
  out.push(G({ x: R[0], y: R[1] }, sayBubble('here’s how…', e1, x1, { tail: 'right', w: 300 })));
  out.push(G({ x: R[0], y: R[1] }, sayBubble('then…', e2, x2, { tail: 'right', w: 220 })));
  out.push(G({ x: R[0], y: R[1] }, sayBubble('because…', e3, 0, { tail: 'right', w: 260, color: C.goldDeep })));
  out.push(G({ x: Lp[0], y: Lp[1] }, sayBubble('what if…?', q1, qx1, { tail: 'left', w: 270 })));
  out.push(G({ x: Lp[0], y: Lp[1] }, sayBubble('but…', q2, 0, { tail: 'left', w: 190 })));
  return out;
}

SCENES.ryle = {
  render(t, S) {
    const c = {
      ryle: S.cue('ryle'), joke: S.cue('joke'), fish: S.cue('fish'), well: S.cue('well'), lapses: S.cue('lapses'),
      rules: S.cue('rules'), rules2: S.cue('rules2'), regress: S.cue('regress'),
      explain: S.cue('explain'), answer: S.cue('answer'), argue: S.cue('argue'),
      L1: S.line(1).start, L2: S.line(2).start, L3: S.line(3).start,
    };
    // phase swaps: the old phase fades out over FD, ending at sw; the next one starts 0.1 s before sw, when the old is
    // under 10%, so two headlines are never half-visible together and no frame goes blank
    const FD = SWAP_FD;
    c.sw1 = c.L1 + 0.05; c.sw2 = c.L2 - 0.26; c.sw3 = c.L3 - 0.1;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // ---- phase 1: what kind of knowledge? → Gilbert Ryle
    const o1 = 1 - P(t, c.sw1 - FD, FD, 'inOut');
    if (o1 > 0) {
      const A = [];
      const eH = enter(t, S.start + 0.02, { dy: 14 });
      A.push(G({ o: eH.o * hdOut(t, c.sw1), y: eH.y }, headline([{ t: 'What kind of ' }, { t: 'knowledge', fill: C.goldDeep }, { t: '?' }])));
      // the head starts centred, then makes room for Ryle's portrait (reframe, so neither half of the frame sits empty)
      const mv = P(t, c.ryle - 0.85, 0.8, 'inOut');
      const K = HEAD_K(), hx = lerp(850, 610, mv), hy = 612, hs = 0.76;
      const eHd = enter(t, S.start + 0.08, { dy: 20, from: 0.94, d: 0.7 });
      A.push(G({ x: hx, y: hy + eHd.y, s: hs * eHd.s, o: eHd.o }, bigHead(t), constellation(t, K, { t0: S.start + 0.35, dur: 1.9, size: 7, lineW: 2.6, glow: 1 + 0.3 * P(t, c.ryle, 0.6) })));
      const qp = P(t, S.start + 0.95, 0.55, 'outBack');
      const qDim = 1 - 0.75 * P(t, c.ryle + 0.2, 0.6);
      if (qp > 0) A.push(G({ x: hx + 295, y: 395 + wobble(t, 0.55, 7), s: qp, r: lerp(-24, 8, qp) + wobble(t, 0.4, 3), o: clamp(qp * 2) * qDim }, T('?', 0, 44, { font: 'serif', size: 136, weight: 700, fill: C.goldDeep, anchor: 'middle' })));
      const eC = enter(t, c.ryle - 0.55, { d: 0.65 });
      if (eC.o > 0) A.push(G({ x: 1340, y: 595 + eC.y, s: eC.s, r: 1.5, o: eC.o }, rylePortrait()));
      const front = once('ryle_front', () => [...K.pts.keys()].sort((a, b) => K.pts[b][0] - K.pts[a][0])[1]);
      const [nx, ny] = toGlobal(K, front, hx, hy, hs);
      A.push(drawPath(arcPath(nx + 8, ny, 1134, 600, 0.16), P(t, c.ryle - 0.2, 0.75, 'inOut'), { stroke: C.goldDeep, sw: 3, o: 0.8 }));
      out.push(G({ o: o1, y: -10 * (1 - o1) }, A));
    }
    // ---- phase 2: intelligent behaviour
    const o2 = t > c.sw1 - 0.12 ? 1 - P(t, c.sw2 - FD, FD, 'inOut') : 0;
    if (o2 > 0) {
      const B = [];
      const eH = enter(t, c.sw1 - 0.1, { dy: 14 });
      B.push(G({ o: eH.o * hdOut(t, c.sw2), y: eH.y }, headline([{ t: 'Intelligent behaviour' }])));
      const panels = [jokePanel, fishPanel, lapsePanel];
      panels.forEach((fn, i) => {
        const e = enter(t, c.sw1 + i * 0.14, { d: 0.55, dy: 30 });
        if (e.o <= 0) return;
        const px = 380 + i * 580, py = 565;
        const tk = i < 2 ? P(t, c.well - 0.3 + i * 0.16, 0.5) : P(t, c.lapses + 0.5, 0.5);
        B.push(G({ x: px, y: py + e.y, s: e.s, o: e.o }, shadowCard(-240, -230, 480, 460, { rx: 22 }), fn(t, c), G({ x: 212, y: -202 }, tickBadge(tk))));
      });
      const l1 = P(t, c.well + 0.05, 0.45);
      if (l1 > 0) B.push(G({ o: l1, y: 10 * (1 - l1) }, hand('doing things well', 670, 885, { fill: C.tealDark }),
        underline(670 - 150, 900, 300, P(t, c.well + 0.2, 0.5, 'inOut'), { color: C.teal, sw: 4 })));
      const l2 = P(t, c.lapses + 0.1, 0.45);
      if (l2 > 0) B.push(G({ o: l2, y: 10 * (1 - l2) }, hand('catching your own lapses', 1540, 885, { fill: C.tealDark }),
        underline(1540 - 200, 900, 400, P(t, c.lapses + 0.25, 0.5, 'inOut'), { color: C.teal, sw: 4 })));
      out.push(G({ o: o2, y: -10 * (1 - o2) }, B));
    }
    // ---- phase 3: not rule-following — the regress
    const o3 = t > c.sw2 - 0.12 ? 1 - P(t, c.sw3 - FD, FD, 'inOut') : 0;
    if (o3 > 0) out.push(G({ o: o3, y: -10 * (1 - o3) }, rulesPhase(t, c)));
    // ---- phase 4: having a theory goes further
    if (t > c.sw3 - 0.12) out.push(theoryTalk(t, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n), L1 = S.line(1).start, L2 = S.line(2).start, L3 = S.line(3).start;
    const sw1 = L1 + 0.05, sw2 = L2 - 0.26, sw3 = L3 - 0.1;   // phase swaps, as in render
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.45, gain: 0.4 }, { t: S.start + 0.4, type: 'chime', note: 0, gain: 0.5 },
      { t: S.start + 0.95, type: 'pop', pitch: 0.8, gain: 0.5 },
      { t: c('ryle') - 0.85, type: 'whoosh', dur: 0.7, gain: 0.25 },
      { t: c('ryle') - 0.55, type: 'pop', pitch: 0.9, gain: 0.7 }, { t: c('ryle') - 0.2, type: 'swish', gain: 0.4 },
      { t: sw1 - 0.05, type: 'whoosh', dur: 0.5, gain: 0.4 },
      ...[0, 1, 2].map(i => ({ t: sw1 + i * 0.14, type: 'pluck', note: [0, 2, 4][i], gain: 0.4 })),
      { t: c('joke') - 0.3, type: 'pop', pitch: 1.1, gain: 0.5 }, { t: c('joke') + 0.55, type: 'pop', pitch: 1.45, gain: 0.45 },
      { t: c('joke') + 0.85, type: 'pop', pitch: 1.65, gain: 0.4 },
      { t: c('fish') - 0.2, type: 'swish', gain: 0.6 }, { t: c('fish') + 0.85, type: 'plop', gain: 0.8 },
      { t: c('lapses') - 2.05, type: 'scribble', dur: 1.25, gain: 0.3 },
      { t: c('well') - 0.3, type: 'pluck', note: 4, gain: 0.5 }, { t: c('well') - 0.14, type: 'pluck', note: 7, gain: 0.5 },
      { t: c('lapses') - 0.4, type: 'pop', pitch: 1.3, gain: 0.5 }, { t: c('lapses') - 0.15, type: 'scribble', dur: 0.3, gain: 0.6 },
      { t: c('lapses') + 0.15, type: 'scribble', dur: 0.45, gain: 0.3 }, { t: c('lapses') + 0.5, type: 'pluck', note: 9, gain: 0.5 },
      { t: sw2 - 0.3, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: sw2 + 0.2, type: 'thud', gain: 0.6 },
      { t: c('rules2') - 0.55, type: 'swish', gain: 0.35 }, { t: c('rules2') - 0.05, type: 'thud', gain: 0.5 },
      ...[0, 1, 2, 3, 4, 5].map(m => ({ t: c('regress') - 0.35 + 0.9 * (1 - Math.pow(0.72, m)), type: 'tick', gain: 0.45 - m * 0.04, pitch: 1 + m * 0.12 })),
      { t: c('regress') + 0.15, type: 'rise', dur: 0.6, gain: 0.4 },
      { t: c('regress') + 0.4, type: 'scribble', dur: 0.4, gain: 0.6 }, { t: c('regress') + 0.55, type: 'fizzle', gain: 0.45 },
      { t: sw3 - 0.05, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: sw3 + 0.4, type: 'chime', note: 2, gain: 0.6 },
      { t: c('explain') - 0.3, type: 'pop', pitch: 1.0, gain: 0.6 },
      { t: c('answer') - 0.35, type: 'pop', pitch: 1.25, gain: 0.55 }, { t: c('answer') + 0.15, type: 'pop', pitch: 0.95, gain: 0.55 },
      { t: c('argue') - 0.3, type: 'pop', pitch: 1.3, gain: 0.55 }, { t: c('argue') + 0.1, type: 'pop', pitch: 0.9, gain: 0.55 },
      { t: c('argue') + 0.3, type: 'chime', note: 4, gain: 0.45 },
    ];
  },
};

// ================================================================== NEWTON
function chalkboard(w, h) {
  return [
    rect(-w / 2 - 16 + 3, -h / 2 - 16 + 9, w + 32, h + 32, { rx: 12, fill: 'rgba(30,42,58,0.12)' }),
    rect(-w / 2 - 16, -h / 2 - 16, w + 32, h + 32, { rx: 12, fill: '#B08A5E' }),
    rect(-w / 2, -h / 2, w, h, { rx: 6, fill: '#2F3D3A' }),
    ellipse(-w * 0.22, -h * 0.1, w * 0.3, h * 0.32, { fill: '#FFFFFF', o: 0.035 }),
    ellipse(w * 0.25, h * 0.15, w * 0.22, h * 0.25, { fill: '#FFFFFF', o: 0.03 }),
    rect(-w * 0.42, h / 2 + 3, w * 0.84, 9, { rx: 4, fill: '#95714A' }),
    rect(w * 0.22, h / 2 - 5, 34, 9, { rx: 3, fill: CHALK }),
  ].join('');
}
// Kepler orbit: eccentric anomaly for mean anomaly M
function kepE(M, e) { let E = M; for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
// A pendulum of length L hanging from the origin, rotated by theta (radians)
function pendulumBob(theta, L) {
  return G({ r: -theta * 180 / Math.PI }, line(0, 0, 0, L, { stroke: C.ink2, sw: 3 }),
    circle(0, L, 24, { fill: C.blue }), circle(-7, L - 7, 7, { fill: '#FFFFFF', o: 0.35 }));
}
// A playground swing with a child, hanging from the origin
function swingSeat(t, theta, L) {
  const kick = Math.sin(theta * 3) * 10;
  return G({ r: -theta * 180 / Math.PI },
    line(-24, 0, -32, L, { stroke: C.ink2, sw: 3 }), line(24, 0, 32, L, { stroke: C.ink2, sw: 3 }),
    path(`M4 ${L - 10} L30 ${L - 4} L${40 + kick * 0.3} ${L + 34}`, { stroke: C.ink, sw: 10 }),
    rect(-18, L - 66, 36, 58, { rx: 14, fill: C.coral }),
    line(-14, L - 54, -31, L - 64, { stroke: C.coral, sw: 9 }), line(14, L - 54, 31, L - 64, { stroke: C.coral, sw: 9 }),
    circle(0, L - 86, 19, { fill: C.skin[1] }),
    path(`M-19 ${L - 88} Q-18 ${L - 110} 2 ${L - 108} Q20 ${L - 108} 19 ${L - 90} Q8 ${L - 100} -19 ${L - 88} Z`, { fill: C.hair[2] }),
    circle(7, L - 86, 2.6, { fill: C.ink }), path(`M3 ${L - 76} Q8 ${L - 72} 13 ${L - 77}`, { stroke: C.ink, sw: 2 }),
    rect(-40, L - 8, 80, 11, { rx: 4, fill: '#A77E52' }));
}
// A stylised face with the family likeness (heavy brows, hooked nose, wide smile), centred, ~120×150
function likeFace(t, o = {}) {
  const { skin = C.skin[0], hair = C.hair[1], style = 0, glasses = false, beard = false, seed = 0 } = o;
  const bt = (t + seed * 1.3) % 3.3, blink = bt < 0.12 ? Math.abs(bt - 0.06) / 0.06 : 1;
  const out = [];
  if (style === 2) out.push(path('M-58 -16 Q-66 -88 0 -90 Q66 -88 58 -16 L64 64 Q44 74 34 40 L-34 40 Q-44 74 -64 64 Z', { fill: hair }));
  out.push(circle(-51, 4, 12, { fill: skin }), circle(51, 4, 12, { fill: skin }));
  out.push(ellipse(0, 0, 52, 64, { fill: skin }));
  if (style === 0) out.push(path('M-53 -12 Q-58 -74 0 -72 Q58 -74 53 -12 Q44 -46 4 -48 Q-34 -46 -53 -12 Z', { fill: hair }));
  if (style === 1) out.push(path('M-52 -4 Q-56 -40 -36 -54 Q-42 -30 -46 6 Z M52 -4 Q56 -40 36 -54 Q42 -30 46 6 Z', { fill: hair }));
  if (style === 2) out.push(path('M-54 -8 Q-54 -78 0 -74 Q54 -78 54 -8 Q30 -52 -54 -8 Z', { fill: hair }));
  if (beard) out.push(path('M-50 6 Q-48 74 0 78 Q48 74 50 6 Q42 40 24 36 Q0 52 -24 36 Q-42 40 -50 6 Z', { fill: hair }));
  out.push(path('M-36 -24 Q-22 -35 -7 -26', { stroke: C.ink, sw: 6 }), path('M36 -24 Q22 -35 7 -26', { stroke: C.ink, sw: 6 }));
  out.push(ellipse(-20, -6, 4.5, 5.5 * blink, { fill: C.ink }), ellipse(20, -6, 4.5, 5.5 * blink, { fill: C.ink }));
  out.push(path('M0 -8 Q16 16 5 23 Q-1 26 -7 21', { stroke: C.ink2, sw: 3.5 }));
  out.push(path('M-21 37 Q0 51 21 37', { stroke: beard ? C.card : C.ink, sw: 4 }));
  out.push(circle(-31, 18, 7, { fill: C.coral, o: 0.18 }), circle(31, 18, 7, { fill: C.coral, o: 0.18 }));
  if (glasses) out.push(circle(-20, -6, 15, { stroke: C.ink, sw: 3 }), circle(20, -6, 15, { stroke: C.ink, sw: 3 }), line(-5, -7, 5, -7, { stroke: C.ink, sw: 3 }));
  return out.join('');
}
// A five-line staff with a melody (steps: 0 = bottom line, each step half a gap). Notes pop in from t0, `step` s apart.
function staffTune(t, t0, steps, o = {}) {
  const w = o.w ?? 320, gap = o.gap ?? 18, step = o.step ?? 0.1, col = o.color ?? C.ink, out = [];
  for (let i = 0; i < 5; i++) out.push(line(-w / 2, -2 * gap + i * gap, w / 2, -2 * gap + i * gap, { stroke: C.ink3, sw: 2.2 }));
  out.push(line(-w / 2, -2 * gap, -w / 2, 2 * gap, { stroke: C.ink3, sw: 2.2 }), line(w / 2 - 7, -2 * gap, w / 2 - 7, 2 * gap, { stroke: C.ink3, sw: 2.2 }), line(w / 2, -2 * gap, w / 2, 2 * gap, { stroke: C.ink3, sw: 5 }));
  steps.forEach((s, k) => {
    const nx = -w / 2 + 46 + k * ((w - 96) / (steps.length - 1)), ny = 2 * gap - s * gap / 2;
    const tk = t0 + k * step, p = P(t, tk, 0.3, 'outBack');
    if (p <= 0) return;
    const hop = t > tk && t < tk + 0.35 ? -Math.sin((t - tk) / 0.35 * Math.PI) * 9 : wobble(t, 0.7, 1.5, k * 1.3);
    out.push(G({ x: nx, y: ny + hop, s: p }, G({ r: -22 }, ellipse(0, 0, gap * 0.74, gap * 0.52, { fill: col })), line(gap * 0.68, -2, gap * 0.68, -gap * 3.3, { stroke: col, sw: 3.5 })));
  });
  return out.join('');
}
// An open rulebook trying to state similarity as a rule. Centred, ~540×340.
function openRulebook(t, c) {
  const out = [
    path('M-282 -166 Q-140 -186 0 -160 Q140 -186 282 -166 L282 184 Q140 160 0 186 Q-140 160 -282 184 Z', { fill: C.blue }),
    G({ x: 4, y: 10 }, path('M-266 -160 Q-134 -178 -2 -154 L-2 170 Q-134 150 -266 170 Z', { fill: 'rgba(30,42,58,0.10)' })),
    path('M-266 -160 Q-134 -178 -2 -154 L-2 170 Q-134 150 -266 170 Z', { fill: C.card, stroke: C.faint, sw: 2 }),
    path('M266 -160 Q134 -178 2 -154 L2 170 Q134 150 266 170 Z', { fill: C.card, stroke: C.faint, sw: 2 }),
    line(0, -156, 0, 172, { stroke: 'rgba(30,42,58,0.18)', sw: 3 }),
    T('RULES', -134, -104, { size: 28, weight: 800, fill: C.blue, anchor: 'middle', ls: 5 }),
    ...[0, 1, 2, 3, 4, 5].map(k => rect(-232, -64 + k * 36, [190, 170, 200, 150, 186, 120][k], 9, { rx: 4.5, fill: C.ink3, o: 0.55 })),
  ];
  // the attempt: "IF …" (the condition never gets written) "THEN similar"
  const a = P(t, c.norules + 0.05, 0.45, 'linear'), b = P(t, c.norules + 0.55, 0.5, 'linear');
  const mono = { font: 'mono', size: 30, weight: 600, fill: C.ink };
  out.push(typeText('IF', a * 2, 34, -70, mono));
  if (a >= 0.5) out.push(T('…', 86, -70, { ...mono, size: 46, fill: C.coral, o: 0.65 + 0.35 * Math.sin(t * 8) }));
  out.push(typeText('THEN', b * 2.4, 34, -12, mono));
  out.push(typeText('similar', clamp(b * 2.4 - 1.2), 118, -12, { ...mono, fill: C.goldDeep }));
  return out.join('');
}
// The theory the page tries to hold (page-local coordinates, centred on the page)
const pageK = () => once('newton_pageK', () => {
  const K = makeConstellation(57, 26, { rx: 470, ry: 262, minD: 70, extra: 0.3 });
  const order = [...K.pts.keys()].sort((a, b) => Math.hypot(K.pts[a][0], K.pts[a][1] * 1.4) - Math.hypot(K.pts[b][0], K.pts[b][1] * 1.4));
  const rank = new Array(K.pts.length); order.forEach((idx, k) => (rank[idx] = k));
  return { ...K, rank };
});

function newtonA(t, S, c) {
  const out = [];
  const eH = enter(t, S.start + 0.02, { dy: 14 });
  out.push(G({ o: eH.o * hdOut(t, c.swA), y: eH.y }, headline([{ t: 'A ' }, { t: 'theory', fill: C.goldDeep }, { t: ' isn’t just its laws' }], { size: 58 })));
  // the board: the laws. It starts big and centred, then lifts into place as "Newton's theory" begins (reframe)
  const mvB = P(t, c.newton - 0.45, 0.8, 'inOut');
  const bx = 960, by = lerp(560, 338, mvB), bs = lerp(1.45, 1, mvB);
  const eB = enter(t, S.start + 0.1, { dy: 20, d: 0.6 });
  const glowB = P(t, c.newton - 0.35, 0.7);
  const s1 = 'F = m·a', s2 = 'F = G·Mm / r²';
  const w1 = measure(s1, 88, 'hand', 700), w2 = measure(s2, 50, 'hand', 700);
  out.push(G({ x: bx, y: by + eB.y, s: bs * eB.s, o: eB.o },
    glowB > 0 ? ellipse(0, 0, 420, 190, { fill: 'url(#gGlow)', o: 0.45 * glowB * (1 + 0.1 * Math.sin(t * 3)) }) : '',
    chalkboard(500, 176),
    typeText(s1, P(t, S.start + 0.4, 0.7, 'linear'), -w1 / 2, 8, { font: 'hand', size: 88, weight: 700, fill: CHALK }),
    typeText(s2, P(t, S.start + 1.1, 0.7, 'linear'), -w2 / 2, 66, { font: 'hand', size: 50, weight: 700, fill: CHALK, o: 0.85 })));
  const eL = P(t, S.start + 0.9, 0.45);
  if (eL > 0) out.push(G({ o: eL }, hand('the laws', bx - 292 * bs, by + 12 * bs, { size: lerp(48, 40, mvB), anchor: 'end' })));
  // "Newton's theory": the laws plus how they apply
  const eN = P(t, c.newton + 0.1, 0.45);
  if (eN > 0) out.push(G({ o: eN, y: 8 * (1 - eN) }, hand('Newton’s theory', 960, by + 172 * bs, { size: 50, fill: C.goldDeep })));
  // the pendulum (left of the board) and the orbit (right), fed by gold threads from the board;
  // each one's similar case sits further out, so threads and ≈ links never cross
  const pvx = 620, pvy = 512, L = 232, T0 = 1.9;
  const tp = c.pendulum - 0.3, tq = c.planets - 0.3, ts = c.similar - 0.3;
  // the threads leave the board on "Newton's theory" and reach each case as it appears
  const th0 = c.newton + 0.1, th1 = c.newton + 0.35;
  out.push(drawPath(arcPath(800, 446, pvx + 4, pvy - 14, 0.22), P(t, th0, Math.max(0.6, tp - th0), 'inOut'), { stroke: C.goldDeep, sw: 3, o: 0.85 }));
  const ox = 1236, oy = 660, a = 172, ecc = 0.5, b = a * Math.sqrt(1 - ecc * ecc), sunX = ox + a * ecc;
  out.push(drawPath(arcPath(1150, 430, sunX - 6, oy - 30, -0.2), P(t, th1, Math.max(0.6, tq - th1), 'inOut'), { stroke: C.goldDeep, sw: 3, o: 0.85 }));
  const theta = (tt, t0) => 0.46 * Math.cos(2 * Math.PI * (tt - t0) / T0);
  const eP = enter(t, tp, { d: 0.5 });
  if (eP.o > 0) {
    const th = theta(t, tp);
    out.push(G({ o: eP.o, y: eP.y }, [
      path(`M${pvx - L * Math.sin(0.46)} ${pvy + L * Math.cos(0.46)} A${L} ${L} 0 0 0 ${pvx + L * Math.sin(0.46)} ${pvy + L * Math.cos(0.46)}`, { stroke: C.ink3, sw: 2, dash: '5 9', o: 0.7 }),
      rect(pvx - 60, pvy - 16, 120, 16, { rx: 4, fill: C.ink2 }),
      ...[-44, -22, 0, 22, 44].map(dx => line(pvx + dx - 6, pvy - 16, pvx + dx + 6, pvy - 28, { stroke: C.ink3, sw: 2.5 })),
      G({ x: pvx, y: pvy }, pendulumBob(th, L)), circle(pvx, pvy, 6, { fill: C.ink }),
    ]));
  }
  // the orbit (Kepler motion: faster near the sun)
  const eO = enter(t, tq, { d: 0.5 });
  if (eO.o > 0) {
    const E = kepE(2 * Math.PI * (t - tq) / 3.4 + 2.2, ecc);
    const plx = ox + a * Math.cos(E), ply = oy + b * Math.sin(E);
    out.push(G({ o: eO.o, y: eO.y }, [
      ellipse(ox, oy, a, b, { stroke: C.ink3, sw: 2, o: 0.8 }),
      circle(sunX, oy, 70, { fill: 'url(#gGlow)', o: 0.7 }), circle(sunX, oy, 26, { fill: C.gold }), circle(sunX, oy, 26, { stroke: C.goldDeep, sw: 2 }),
      circle(plx, ply, 15, { fill: C.blue }), circle(plx - 4, ply - 4, 5, { fill: '#FFFFFF', o: 0.35 }),
    ]));
  }
  // similar cases: a playground swing (same period as the pendulum) and a moon around the earth
  const sx = 290;
  const eS = enter(t, ts, { d: 0.5 });
  if (eS.o > 0) {
    out.push(G({ o: eS.o, y: eS.y }, [
      line(sx - 118, pvy - 6, sx - 150, 800, { stroke: '#A77E52', sw: 9 }), line(sx - 118, pvy - 6, sx - 86, 800, { stroke: '#A77E52', sw: 9 }),
      line(sx + 118, pvy - 6, sx + 150, 800, { stroke: '#A77E52', sw: 9 }), line(sx + 118, pvy - 6, sx + 86, 800, { stroke: '#A77E52', sw: 9 }),
      line(sx - 132, pvy - 8, sx + 132, pvy - 8, { stroke: '#8C6A45', sw: 12 }),
      G({ x: sx, y: pvy - 4 }, swingSeat(t, theta(t, tp), L)),
    ]));
  }
  const mx = 1630, my = oy;
  const eM = enter(t, ts + 0.15, { d: 0.5 });
  if (eM.o > 0) {
    const ang = (t - ts) * 2 * Math.PI / 2.6 + 0.8;
    out.push(G({ o: eM.o, y: eM.y }, [
      circle(mx, my, 86, { stroke: C.ink3, sw: 2, dash: '5 8', o: 0.8 }),
      circle(mx, my, 30, { fill: C.teal }), path(`M${mx - 18} ${my - 16} q10 -8 18 2 q-2 10 -12 8 z M${mx + 4} ${my + 8} q12 -4 16 6 q-8 10 -16 2 z`, { fill: C.olive }),
      circle(mx + Math.cos(ang) * 86, my + Math.sin(ang) * 86, 10, { fill: C.grey }),
    ]));
  }
  // gold links with ≈, from each case out to its similar case: drawn on, then dashed once complete
  const simPulse = 1 + 0.25 * Math.max(0, Math.sin(clamp((t - c.similar - 1.0) / 0.6) * Math.PI));
  const links = [[pvx - 66, pvy - 22, sx + 136, pvy - 22, 0.42, c.similar - 0.05], [ox + a * 0.6, 520, mx - 60, 560, -0.35, c.similar + 0.1]];
  links.forEach(([x1, y1, x2, y2, bd, t0], i) => {
    const lp = P(t, t0, 0.6, 'inOut'), d = arcPath(x1, y1, x2, y2, bd);
    out.push(lp < 1 ? drawPath(d, lp, { stroke: C.goldDeep, sw: 3.5, o: 0.9 }) : path(d, { stroke: C.goldDeep, sw: 3.5, o: 0.9, dash: '11 9' }));
    const [qx, qy] = quadPoint(x1, y1, x2, y2, bd, 0.5);
    out.push(G({ x: qx, y: qy }, approx(P(t, c.similar + 0.35 + i * 0.15, 0.45), { s: simPulse })));
  });
  const eR = P(t, c.similar + 0.3, 0.5);
  if (eR > 0) out.push(G({ o: eR, y: 10 * (1 - eR) }, hand('recognizing similar cases', 960, 905, { size: 48, fill: C.goldDeep })));
  return out;
}

function newtonB(t, S, c) {
  const out = [];
  const eH = enter(t, c.swA - 0.1, { dy: 14 });
  out.push(G({ o: eH.o * hdOut(t, c.swB), y: eH.y }, headline([{ t: 'Similarity', fill: C.goldDeep }, { t: ' can’t be put into rules' }], { size: 58 })));
  // the rulebook: centre first, then it moves left to make room for faces and tunes
  const slide = P(t, c.faces - 0.9, 0.75, 'inOut');
  const eR = enter(t, c.swA + 0.05, { d: 0.6, dy: 30 });
  const xp = P(t, c.norules + 1.0, 0.45, 'inOut');
  const shake = t > c.norules + 1.0 && t < c.norules + 1.5 ? Math.sin(t * 60) * 5 * (1 - P(t, c.norules + 1.0, 0.5)) : 0;
  const rx = lerp(960, 500, slide) + shake, ry = 575, rs = lerp(1, 0.9, slide);
  out.push(G({ x: rx, y: ry + eR.y, s: rs * eR.s, o: eR.o }, openRulebook(t, c), G({ x: 134, y: -40 }, crossMark(xp, { size: 78, sw: 15 }))));
  // right column: faces with a family likeness (top) and two similar tunes (bottom)
  const cx = 1330, fy = 420, FS = 1.3, FDX = 250;
  const faces = [
    { skin: C.skin[0], hair: C.hair[1], style: 0, glasses: false },
    { skin: C.skin[4], hair: C.hair[4], style: 1, beard: true },
    { skin: C.skin[0], hair: C.hair[2], style: 2, glasses: true },
  ];
  faces.forEach((f, i) => {
    const e = enter(t, c.faces - 0.35 + i * 0.12, { d: 0.5 });
    if (e.o > 0) out.push(G({ x: cx + (i - 1) * FDX, y: fy + e.y + wobble(t, 0.5, 3, i * 2), s: FS * e.s, o: e.o }, likeFace(t, { ...f, seed: i })));
  });
  [0, 1].forEach(i => out.push(G({ x: cx + (i - 0.5) * FDX, y: fy + 8 }, approx(P(t, c.faces + 0.15 + i * 0.15, 0.4), { r: 26 }))));
  // the staves arrive with the faces; the melodies play on "tunes"
  const ty = 755, TW = 320, TDX = 205;
  const eT = enter(t, c.faces + 0.1, { d: 0.5 });
  if (eT.o > 0) {
    out.push(G({ x: cx - TDX, y: ty + eT.y, o: eT.o }, staffTune(t, c.tunes - 0.55, [2, 4, 3, 6, 5], { w: TW, step: 0.08 })));
    out.push(G({ x: cx + TDX, y: ty + eT.y, o: eT.o }, staffTune(t, c.tunes - 0.12, [3, 5, 4, 7, 6], { w: TW, step: 0.08 })));
    out.push(G({ x: cx, y: ty }, approx(P(t, c.tunes + 0.22, 0.4), { r: 26 })));
  }
  return out;
}

function newtonC(t, S, c) {
  const out = [];
  const eH = enter(t, c.swB - 0.1, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'A ' }, { t: 'theory', fill: C.goldDeep }, { t: ' can’t be fully written down' }], { size: 58 })));
  const px = 960, py = 610;
  const eP = enter(t, c.swB - 0.08, { d: 0.6, dy: 30 });
  out.push(G({ x: px, y: py + eP.y, s: eP.s, o: eP.o }, docCard({ w: 340, h: 440, lines: 0, heading: false, seed: 91 })));
  // the constellation grows from the page centre, bigger than the page; what's outside spills away
  const K = pageK(), n = K.pts.length;
  const g0 = c.swB + 0.02, gd = 0.75;
  const sp = P(t, c.cantwrite + 0.75, 1.15, 'inOut');
  const ink = P(t, c.cantwrite + 0.9, 0.6);
  const inside = K.pts.map(p => Math.abs(p[0]) < 148 && Math.abs(p[1]) < 196);
  const pos = K.pts.map((p, i) => {
    if (inside[i]) return [p[0], p[1]];
    const d = Math.hypot(p[0], p[1]) || 1, f = sp;
    return [p[0] + p[0] / d * (40 * f + 300 * f * f), p[1] + p[1] / d * (20 * f + 150 * f * f) - 110 * f + Math.sin(t * 3 + i) * 6 * f];
  });
  const appear = i => g0 + gd * K.rank[i] / (n - 1);
  const G1 = [];
  for (const [a, b] of K.edges) {
    const p = P(t, Math.max(appear(a), appear(b)) + 0.05, 0.35, 'inOut');
    if (p <= 0) continue;
    const both = inside[a] && inside[b];
    const o = both ? 0.8 : 0.75 * (1 - clamp(sp * 2.2));
    if (o <= 0.01) continue;
    const [x1, y1] = pos[a], [x2, y2] = pos[b];
    G1.push(line(x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), { stroke: both ? mixColor(C.goldLight, C.ink3, ink) : C.goldLight, sw: 2.4, o }));
  }
  K.pts.forEach((pt, i) => {
    const p = P(t, appear(i), 0.4, 'outBack');
    if (p <= 0) return;
    const [x, y] = pos[i];
    const tw = 1 + 0.18 * Math.sin(t * 2.6 + pt[3]);
    const r = 7 * pt[2] * p * tw;
    if (inside[i]) {
      if (ink < 1) G1.push(circle(x, y, r * 4, { fill: 'url(#gGlow)', o: 0.8 * (1 - ink) }));
      G1.push(circle(x, y, r * lerp(1, 0.75, ink), { fill: mixColor(C.gold, C.ink, ink) }));
    } else {
      const o = Math.pow(1 - sp, 1.3);
      if (o <= 0.01) return;
      G1.push(circle(x, y, r * 4, { fill: 'url(#gGlow)', o: 0.8 * o }), circle(x, y, r, { fill: C.gold, o }), circle(x - r * 0.25, y - r * 0.25, r * 0.35, { fill: '#FFF6DE', o: 0.8 * o }));
    }
  });
  out.push(G({ x: px, y: py + eP.y }, G1));
  return out;
}

SCENES.newton = {
  render(t, S) {
    const c = {
      newton: S.cue('newton'), pendulum: S.cue('pendulum'), planets: S.cue('planets'), similar: S.cue('similar'),
      norules: S.cue('norules'), faces: S.cue('faces'), tunes: S.cue('tunes'), cantwrite: S.cue('cantwrite'), L1: S.line(1).start,
    };
    // phase swaps: the old phase fades out over FD, ending at sw; the next starts 0.1 s before sw (old under 10%)
    const FD = SWAP_FD;
    c.swA = c.L1 + 0.1; c.swB = c.cantwrite + 0.05;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const oA = 1 - P(t, c.swA - FD, FD, 'inOut');
    if (oA > 0) out.push(G({ o: oA, y: -10 * (1 - oA) }, newtonA(t, S, c)));
    const oB = t > c.swA - 0.12 ? 1 - P(t, c.swB - FD, FD, 'inOut') : 0;
    if (oB > 0) out.push(G({ o: oB, y: -10 * (1 - oB) }, newtonB(t, S, c)));
    if (t > c.swB - 0.12) out.push(newtonC(t, S, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n), swA = S.line(1).start + 0.1, swB = S.cue('cantwrite') + 0.05;
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.45, gain: 0.4 }, { t: S.start + 0.4, type: 'scribble', dur: 0.7, gain: 0.4 },
      { t: S.start + 1.1, type: 'scribble', dur: 0.7, gain: 0.3 },
      { t: c('newton') - 0.35, type: 'chime', note: 1, gain: 0.6 }, { t: c('newton') + 0.1, type: 'scribble', dur: 1.2, gain: 0.22 },
      { t: c('pendulum') - 0.3, type: 'pop', pitch: 0.9, gain: 0.6 }, { t: c('pendulum') + 0.1, type: 'swish', gain: 0.3 },
      { t: c('planets') - 0.3, type: 'pop', pitch: 1.1, gain: 0.6 }, { t: c('planets') + 0.1, type: 'whoosh', dur: 0.6, gain: 0.25 },
      { t: c('similar') - 0.3, type: 'pop', pitch: 1.25, gain: 0.5 }, { t: c('similar') - 0.15, type: 'pop', pitch: 1.35, gain: 0.45 },
      { t: c('similar') + 0.35, type: 'chime', note: 4, gain: 0.6 },
      { t: c('similar') + 1.0, type: 'tick', gain: 0.5 }, { t: swA - 0.3, type: 'whoosh', dur: 0.5, gain: 0.4 },
      { t: swA + 0.2, type: 'thud', gain: 0.45 },
      { t: c('norules') + 0.05, type: 'typing', dur: 1.0, gain: 0.5 }, { t: c('norules') + 1.0, type: 'scribble', dur: 0.45, gain: 0.6 },
      { t: c('norules') + 1.1, type: 'fizzle', gain: 0.45 },
      { t: c('faces') - 0.9, type: 'swish', gain: 0.3 },
      ...[0, 1, 2].map(i => ({ t: c('faces') - 0.35 + i * 0.12, type: 'pop', pitch: 0.95 + i * 0.1, gain: 0.45 })),
      ...[0, 2, 1, 4, 3].map((n, k) => ({ t: c('tunes') - 0.55 + k * 0.08, type: 'pluck', note: n, gain: 0.32 })),
      ...[1, 3, 2, 5, 4].map((n, k) => ({ t: c('tunes') - 0.12 + k * 0.08, type: 'pluck', note: n, gain: 0.32 })),
      { t: swB - 0.3, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: swB, type: 'chime', note: 0, gain: 0.55 },
      { t: c('cantwrite') + 0.75, type: 'whoosh', dur: 1.1, gain: 0.35 }, { t: c('cantwrite') + 1.0, type: 'fizzle', gain: 0.35 },
    ];
  },
};

// ================================================================== ABILITIES
// World icons for the MAP card: three that matter (right column) and the rest of the world around them.
const MAP_COLS = [-196, -114, -26], MAP_ROWS = [-146, -60, 26];
const MAP_CROWD = [
  { c: 0, r: 0, k: 'bust', skin: C.skin[0], hair: C.hair[2] }, { c: 1, r: 0, k: 'gears' },
  { c: 0, r: 1, k: 'server' }, { c: 1, r: 1, k: 'bust', skin: C.skin[3], hair: C.hair[3] },
  { c: 0, r: 2, k: 'policy' }, { c: 1, r: 2, k: 'bust', skin: C.skin[4], hair: C.hair[4] },
].map(d => ({ ...d, x: MAP_COLS[d.c], y: MAP_ROWS[d.r] }));
const MAP_KEY = [{ k: 'bank' }, { k: 'bust', skin: C.skin[2], hair: C.hair[1] }, { k: 'policy' }].map((d, i) => ({ ...d, x: MAP_COLS[2], y: MAP_ROWS[i] }));
function miniIcon(t, d, col) {
  const g = col !== C.teal;
  if (d.k === 'bank') return G({ s: 0.44 }, iconBank({ color: col }));
  if (d.k === 'policy') return G({ s: 0.42, o: g ? 0.55 : 1 }, iconPolicy({ color: col }));
  if (d.k === 'bust') return G({ s: 0.52 }, iconBust({ color: col, skin: g ? mixColor(d.skin, GREY, 0.8) : d.skin, hair: g ? mixColor(d.hair, GREY, 0.6) : d.hair }));
  if (d.k === 'gears' || d.k === 'gears2') return G({ s: 0.5 }, iconGears(t, { color: col, spin: g ? 0.2 : 1 }));
  return G({ s: 0.37 }, iconServer(t, { color: g ? col : C.blue }));
}
function mapCard(t, c) {
  const out = [];
  const lt = t - c.map;
  out.push(G({ x: 146, y: -62 }, codeCard({ w: 160, h: 250, seed: 74, lineH: 26 })));
  const codeY = [-101, -49, 3], codeX = 72;
  // the rest of the world arrives, then greys out: only three parts matter
  const grey = P(t, c.relevant + 0.55, 0.6, 'inOut');
  MAP_CROWD.forEach((d, i) => {
    const p = P(t, c.relevant - 0.35 + i * 0.05, 0.4, 'outBack');
    if (p <= 0) return;
    const col = mixColor(C.teal, GREY, grey);
    out.push(G({ x: d.x, y: d.y, s: p * lerp(1, 0.86, grey), o: clamp(p * 2) * lerp(1, 0.55, grey) }, miniIcon(t, d, grey > 0.02 ? col : C.teal)));
  });
  MAP_KEY.forEach((d, i) => {
    const lit = P(t, c.relevant + 0.7 + i * 0.08, 0.4, 'outBack');
    if (lit > 0) out.push(circle(d.x, d.y, 40 + 4 * Math.sin(t * 3 + i), { fill: 'url(#gGlow)', o: 0.7 * lit }), circle(d.x, d.y, 38, { stroke: C.gold, sw: 4, o: clamp(lit * 2) }));
    out.push(G({ x: d.x, y: d.y }, miniIcon(t, d, C.teal)));
    const p = P(lt, -0.1 + i * 0.18, 0.55, 'inOut');
    out.push(drawPath(arcPath(d.x + 36, d.y, codeX, codeY[i], i === 1 ? 0 : (i === 0 ? -0.15 : 0.15)), p, { stroke: C.goldDeep, sw: 4 }));
    const dp = P(lt, 0.4 + i * 0.18, 0.3, 'outBack');
    if (dp > 0) out.push(circle(codeX, codeY[i], 8 * dp, { fill: C.gold }), circle(d.x + 36, d.y, 6 * dp, { fill: C.gold }));
  });
  const lb = P(t, c.relevant + 0.85, 0.45);
  if (lb > 0) out.push(G({ o: lb, y: 8 * (1 - lb) }, hand('which parts matter', -30, 150, { size: 48, fill: C.goldDeep })));
  return out;
}
function justifyCard(t, c) {
  const out = [];
  const lt = t - c.justify;
  out.push(G({ x: -30, y: -84 }, codeCard({ w: 280, h: 250, seed: 75, lineH: 26 })));
  const part = P(lt, -0.25, 0.4);
  if (part > 0) out.push(rect(-164, -113, 268, 58, { rx: 9, fill: C.gold, o: 0.16 * part }), rect(-164, -113, 268, 58, { rx: 9, stroke: C.goldDeep, sw: 3.5, o: part }));
  const n1 = P(lt, 0.05, 0.45, 'outBack');
  if (n1 > 0) out.push(G({ x: 148, y: -172, s: n1, r: 7 }, stickyNote('why?', { w: 150, h: 96, size: 50, r: 0 }), circle(0, -42, 6.5, { fill: C.coral })));
  // the justification, tied to the part with a gold string
  const str = P(lt, 0.7, 0.6, 'inOut');
  out.push(drawPath('M-164 -84 C-238 -40 -232 100 -140 136', str, { stroke: C.goldDeep, sw: 4 }));
  const tg = P(lt, 1.1, 0.5, 'outBack');
  if (tg > 0) out.push(G({ x: 0, y: 136, s: tg, r: lerp(-10, -2, tg) + wobble(t, 0.6, 1.5) }, [
    rect(-146 + 3, -39 + 6, 292, 78, { rx: 16, fill: 'rgba(30,42,58,0.10)' }),
    rect(-146, -39, 292, 78, { rx: 16, fill: C.card, stroke: C.goldDeep, sw: 3.5 }),
    circle(-124, 0, 8, { fill: C.paper, stroke: C.goldDeep, sw: 3 }),
    T('because…', 14, 16, { font: 'hand', size: 52, weight: 700, fill: C.goldDeep, anchor: 'middle' }),
  ]));
  return out;
}
const tileShape = (k, o = {}) => k === 'circle' ? circle(0, 0, 38, o)
  : k === 'square' ? rect(-35, -35, 70, 70, { rx: 8, ...o })
  : k === 'tri' ? path('M0 -40 L44 34 L-44 34 Z', o)
  : path('M0 -38 L46 32 Q0 44 -46 32 Z', o);
function adaptCard(t, c) {
  const out = [];
  const tiles = [{ k: 'circle', x: -165 }, { k: 'square', x: -55 }, { k: 'tri', x: 55 }];
  const rowY = 26, slotX = 165;
  out.push(rect(-222, rowY - 62, 444, 124, { rx: 18, fill: C.paper, stroke: C.faint, sw: 2 }));
  out.push(G({ x: slotX, y: rowY }, tileShape('req', { stroke: C.ink3, sw: 3, dash: '8 7' })));
  // compare: the request is checked against each existing part in turn
  const hov = [40, -158];
  const cmp = [c.similarity - 1.0, c.similarity - 0.6, c.similarity - 0.25];
  const match = P(t, cmp[2] + 0.1, 0.4, 'outBack');
  tiles.forEach((d, i) => {
    const hl = i === 2 ? match : 0;
    if (hl > 0) out.push(circle(d.x, rowY, 74, { fill: 'url(#gGlow)', o: 0.8 * hl }));
    out.push(G({ x: d.x, y: rowY, s: 1 + 0.08 * hl }, tileShape(d.k, { fill: C.blue }), hl > 0 ? tileShape(d.k, { fill: C.gold, stroke: C.goldDeep, sw: 4, o: clamp(hl) }) : ''));
    const lp = P(t, cmp[i], 0.25, 'out') * (i < 2 ? 1 - P(t, cmp[i] + 0.35, 0.2) : 1 - P(t, c.similarity + 0.3, 0.3));
    if (lp > 0) out.push(line(hov[0], hov[1] + 44, d.x, rowY - 44, { stroke: i === 2 ? C.goldDeep : C.coral, sw: 3, dash: '6 7', o: lp }));
    if (i < 2) {
      const np = P(t, cmp[i] + 0.12, 0.2) * (1 - P(t, cmp[i] + 0.42, 0.2));
      if (np > 0) out.push(G({ x: d.x - 34, y: rowY - 66, s: lerp(0.6, 1, Ease.outBack(clamp(P(t, cmp[i] + 0.12, 0.25)))), o: np }, T('≠', 0, 14, { font: 'serif', size: 48, weight: 700, fill: C.coral, anchor: 'middle' })));
    }
  });
  // the change request arrives, hovers, then slots in beside the part it resembles
  const arr = P(t, c.adapt - 0.3, 0.7, 'outBack');
  if (arr > 0) {
    const slot = P(t, c.similarity + 0.25, 0.55, 'inOut');
    const [ax, ay] = [lerp(lerp(290, hov[0], arr), slotX, slot), lerp(lerp(-330, hov[1], arr), rowY, slot) + (slot > 0 ? -Math.sin(slot * Math.PI) * 40 : wobble(t, 0.8, 4))];
    const solid = P(t, c.similarity + 0.7, 0.3);
    out.push(G({ x: ax, y: ay, r: lerp(lerp(24, 0, arr), 0, slot), o: clamp(arr * 2) },
      tileShape('req', { fill: mixColor(C.coralLight, C.blue, solid), o: lerp(0.55, 1, solid) }),
      tileShape('req', { stroke: mixColor(C.coral, C.gold, solid), sw: 4, dash: solid > 0.5 ? undefined : '9 6' })));
    const lb = P(t, c.adapt + 0.15, 0.4) * (1 - P(t, c.similarity + 0.1, 0.35));
    if (lb > 0) out.push(G({ o: lb }, hand('change request', 44, -218, { size: 46, fill: C.coral })));
  }
  // ≈ by the matching comparison; it steps aside while the request moves, then settles on an arc joining the pair
  const ap = P(t, cmp[2] + 0.2, 0.4) * (1 - P(t, c.similarity + 0.2, 0.2));
  if (ap > 0) out.push(G({ x: 104, y: -76 }, approx(ap, { r: 24 })));
  const arc = P(t, c.similarity + 0.7, 0.4, 'inOut');
  if (arc > 0) {
    const d = arcPath(58, -24, 162, -24, -0.5);
    out.push(arc < 1 ? drawPath(d, arc, { stroke: C.goldDeep, sw: 3.5 }) : path(d, { stroke: C.goldDeep, sw: 3.5, dash: '9 8' }));
    out.push(G({ x: 110, y: -52 }, approx(P(t, c.similarity + 0.85, 0.4), { r: 24 })));
  }
  const ok = P(t, c.similarity + 0.95, 0.5);
  if (ok > 0) out.push(G({ x: 200, y: -122 }, tickBadge(ok, 26)));
  return out;
}

function abilitiesIntro(t, S, c) {
  const out = [];
  const eH = enter(t, S.start + 0.02, { dy: 14 });
  out.push(G({ o: eH.o * hdOut(t, c.sw), y: eH.y }, headline([{ t: 'A program’s ' }, { t: 'theory', fill: C.goldDeep }, { t: ': how the world will be handled' }], { size: 54 })));
  const K = HEAD_K(), hx = 960, hy = 598, hs = 0.8;
  const eHd = enter(t, S.start + 0.1, { dy: 20, from: 0.94, d: 0.7 });
  // "Its holder…": the head swells and glows just before the intro clears
  const hold = pulse(t, c.three - 1.05, 0.6, 0.05);
  const glow = 1 + 0.6 * P(t, c.three - 1.05, 0.4) * (1 - P(t, c.three - 0.5, 0.3));
  out.push(G({ x: hx, y: hy + eHd.y, s: hs * eHd.s * hold, o: eHd.o }, bigHead(t), constellation(t, K, { t0: S.start + 0.3, dur: 1.6, size: 7, lineW: 2.6, glow })));
  // the world
  const wx = 300, ys = [370, 510, 650, 790];
  const icons = [() => iconBank(), () => iconPolicy(), () => iconBust({ skin: C.skin[3], hair: C.hair[3] }), () => iconGears(t)];
  const eW = enter(t, c.howhandled - 0.3, { dy: 10 });
  out.push(G({ o: eW.o }, T('THE WORLD', wx, 280, { size: 26, weight: 800, fill: C.tealDark, anchor: 'middle', ls: 6 })));
  icons.forEach((f, i) => {
    const e = enter(t, c.howhandled - 0.25 + i * 0.12, { d: 0.5 });
    if (e.o > 0) out.push(G({ x: wx, y: ys[i] + e.y, s: 0.66 * e.s, o: e.o }, f()));
  });
  const left = once('abilities_left', () => [...K.pts.keys()].sort((a, b) => K.pts[a][0] - K.pts[b][0]).slice(0, 4).sort((a, b) => K.pts[a][1] - K.pts[b][1]));
  const right = once('abilities_right', () => [...K.pts.keys()].sort((a, b) => K.pts[b][0] - K.pts[a][0]).slice(0, 3).sort((a, b) => K.pts[a][1] - K.pts[b][1]));
  const threadsL = left.map((ni, i) => { const [gx, gy] = toGlobal(K, ni, hx, hy, hs); return [wx + 62, ys[i] - 8, gx, gy, i < 2 ? -0.12 : 0.12]; });
  // the program
  const cx = 1610, cy = 590;
  const eP = enter(t, c.howhandled + 1.0, { d: 0.5 });
  out.push(G({ o: eP.o }, T('THE PROGRAM', cx, 280, { size: 26, weight: 800, fill: C.blue, anchor: 'middle', ls: 6 })));
  if (eP.o > 0) out.push(G({ x: cx, y: cy + eP.y, s: eP.s, o: eP.o }, codeCard({ w: 300, h: 380, seed: 4, reveal: P(t, c.howhandled + 1.1, 0.9, 'linear'), title: 'program' })));
  const threadsR = right.map((ni, i) => { const [gx, gy] = toGlobal(K, ni, hx, hy, hs); return [gx, gy, cx - 150 + 8, cy - 120 + i * 110, 0.1]; });
  threadsL.forEach((th, i) => out.push(drawPath(arcPath(...th), P(t, c.howhandled + 0.25 + i * 0.12, 0.7, 'inOut'), { stroke: C.goldDeep, sw: 2.5, o: 0.8 })));
  threadsR.forEach((th, i) => out.push(drawPath(arcPath(...th), P(t, c.howhandled + 1.5 + i * 0.12, 0.6, 'inOut'), { stroke: C.goldDeep, sw: 2.5, o: 0.8 })));
  // affairs of the world flow through the theory into the program
  const flow = P(t, c.howhandled + 2.1, 0.5);
  if (flow > 0) {
    [...threadsL, ...threadsR].forEach((th, i) => {
      const f = frac(t * 0.55 + i * 0.37);
      const [x, y] = quadPoint(th[0], th[1], th[2], th[3], th[4], f);
      out.push(circle(x, y, 5, { fill: C.gold, o: flow * Math.sin(f * Math.PI) }));
    });
  }
  return out;
}

function abilityCards(t, S, c) {
  const out = [];
  const eH = enter(t, c.sw - 0.1, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Three things ' }, { t: 'no document', fill: C.coral }, { t: ' can do' }], { size: 58 })));
  const cards = [
    { n: 1, title: 'MAP', cue: c.map, draw: mapCard },
    { n: 2, title: 'JUSTIFY', cue: c.justify, draw: justifyCard },
    { n: 3, title: 'ADAPT', cue: c.adapt, draw: adaptCard },
  ];
  const ends = [c.justify - 0.45, c.adapt - 0.45, 1e9];
  const allOn = P(t, c.similarity + 1.0, 0.5);
  const anyActive = P(t, c.map - 0.5, 0.35);
  cards.forEach((d, i) => {
    const e = enter(t, c.sw - 0.05 + i * 0.15, { d: 0.55, dy: 30 });
    if (e.o <= 0) return;
    const focus = Math.min(P(t, d.cue - 0.5, 0.35), 1 - P(t, ends[i], 0.35));
    const dimK = lerp(1, lerp(0.6, 1, Math.max(focus, allOn)), anyActive);
    const inner = [shadowCard(-250, -270, 500, 540, { rx: 24 })];
    if (focus > 0) inner.push(rect(-250, -270, 500, 540, { rx: 24, stroke: C.gold, sw: 4, o: focus }));
    inner.push(G({ x: -206, y: -226 }, badge(d.n, { fill: focus > 0.5 ? C.goldDeep : C.ink })));
    inner.push(T(d.title, 0, 232, { size: 40, weight: 800, anchor: 'middle', ls: 7, fill: C.ink }));
    inner.push(...d.draw(t, c));
    out.push(G({ x: 360 + i * 600, y: 606 + e.y, s: e.s * (1 + 0.02 * focus), o: e.o * dimK }, inner));
  });
  return out;
}

SCENES.abilities = {
  render(t, S) {
    const c = {
      howhandled: S.cue('howhandled'), three: S.cue('three'), map: S.cue('map'), relevant: S.cue('relevant'),
      justify: S.cue('justify'), adapt: S.cue('adapt'), similarity: S.cue('similarity'),
    };
    // intro → cards swap: the intro fades out over FD, ending at sw; the cards start 0.1 s before sw (intro under 10%)
    const FD = SWAP_FD;
    c.sw = c.three - 0.2;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const o1 = 1 - P(t, c.sw - FD, FD, 'inOut');
    if (o1 > 0) out.push(G({ o: o1, y: -10 * (1 - o1) }, abilitiesIntro(t, S, c)));
    if (t > c.sw - 0.12) out.push(abilityCards(t, S, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n), sw = S.cue('three') - 0.2;
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.45, gain: 0.4 }, { t: S.start + 0.3, type: 'chime', note: 0, gain: 0.5 },
      ...[0, 1, 2, 3].map(i => ({ t: c('howhandled') - 0.25 + i * 0.12, type: 'pop', pitch: 0.9 + i * 0.08, gain: 0.5 })),
      { t: c('howhandled') + 0.25, type: 'scribble', dur: 0.7, gain: 0.3 },
      { t: c('howhandled') + 1.0, type: 'pop', pitch: 1.2, gain: 0.55 }, { t: c('howhandled') + 1.1, type: 'typing', dur: 0.9, gain: 0.45 },
      { t: c('three') - 1.05, type: 'chime', note: 2, gain: 0.5 },
      { t: sw - 0.3, type: 'whoosh', dur: 0.5, gain: 0.4 },
      ...[0, 1, 2].map(i => ({ t: sw - 0.05 + i * 0.15, type: 'pluck', note: [0, 2, 4][i], gain: 0.5 })),
      { t: c('map') - 0.1, type: 'scribble', dur: 0.8, gain: 0.35 }, { t: c('map') + 0.45, type: 'tick', gain: 0.5 },
      { t: c('map') + 0.63, type: 'tick', gain: 0.5 }, { t: c('map') + 0.81, type: 'tick', gain: 0.5 },
      { t: c('relevant') - 0.35, type: 'pop', pitch: 1.1, gain: 0.4 }, { t: c('relevant') - 0.1, type: 'pop', pitch: 1.25, gain: 0.35 },
      { t: c('relevant') + 0.55, type: 'swish', gain: 0.35 }, { t: c('relevant') + 0.75, type: 'chime', note: 3, gain: 0.55 },
      { t: c('justify') - 0.25, type: 'scribble', dur: 0.35, gain: 0.35 }, { t: c('justify') + 0.05, type: 'pop', pitch: 1.1, gain: 0.55 },
      { t: c('justify') + 0.7, type: 'scribble', dur: 0.6, gain: 0.35 }, { t: c('justify') + 1.1, type: 'pop', pitch: 0.9, gain: 0.55 },
      { t: c('adapt') - 0.3, type: 'whoosh', dur: 0.6, gain: 0.45 }, { t: c('adapt') + 0.2, type: 'pop', pitch: 1.0, gain: 0.45 },
      { t: c('similarity') - 1.0, type: 'tick', gain: 0.45 }, { t: c('similarity') - 0.6, type: 'tick', gain: 0.45 },
      { t: c('similarity') - 0.1, type: 'chime', note: 5, gain: 0.6 }, { t: c('similarity') + 0.25, type: 'swish', gain: 0.35 },
      { t: c('similarity') + 0.75, type: 'click', gain: 0.7 }, { t: c('similarity') + 0.9, type: 'chime', note: 7, gain: 0.4 }, { t: c('similarity') + 0.95, type: 'pluck', note: 9, gain: 0.45 },
    ];
  },
};

})();
