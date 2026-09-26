// Scenes: title, hook, naur, views, matching. Wrapped in an IIFE so helpers stay local to this file.
'use strict';
(() => {

// ================================================================== local helpers
// Horizontal S-curve with flat tangents at both ends: threads between two columns.
function sCurve(x1, y1, x2, y2, k = 0.45) {
  const dx = (x2 - x1) * k;
  return `M${r2(x1)} ${r2(y1)} C${r2(x1 + dx)} ${r2(y1)} ${r2(x2 - dx)} ${r2(y2)} ${r2(x2)} ${r2(y2)}`;
}
// The point at p (0…1) along sCurve().
function sCurvePt(x1, y1, x2, y2, p, k = 0.45) {
  const dx = (x2 - x1) * k, q = 1 - p;
  const bz = (a, b, c, d) => q * q * q * a + 3 * q * q * p * b + 3 * q * p * p * c + p * p * p * d;
  return [bz(x1, x1 + dx, x2 - dx, x2), bz(y1, y1, y2, y2)];
}
// A dashed straight line that draws on as p goes 0…1.
function dashLine(x1, y1, x2, y2, p, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1, dash = o.dash ?? 14, gap = o.gap ?? 12;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len, end = len * clamp(p);
  const out = [];
  for (let s = 0; s < end; s += dash + gap) {
    const e = Math.min(s + dash, end);
    out.push(line(x1 + ux * s, y1 + uy * s, x1 + ux * e, y1 + uy * e, { stroke: o.stroke ?? C.ink3, sw: o.sw ?? 3, o: o.o }));
  }
  return out.join('');
}
// Rich-text segments [{t, fill, …}] cut to their first n characters (a typewriter over mixed colours).
function truncSegs(segs, n) {
  const out = [];
  let left = Math.max(0, Math.round(n));
  for (const s of segs) {
    if (left <= 0) break;
    out.push({ ...s, t: s.t.slice(0, left) });
    left -= s.t.length;
  }
  return out;
}
const segLen = segs => segs.reduce((a, s) => a + s.t.length, 0);
const segText = segs => segs.map(s => s.t).join('');
// A linter's wavy underline from x over width w, drawn on with p.
function squiggle(x, y, w, p, o = {}) {
  const a = o.amp ?? 4, n = Math.max(2, Math.round(w / 10)), pts = [];
  for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + (i % 2 ? -a : a)]);
  return drawPath(smooth(pts), p, { stroke: o.color ?? C.coral, sw: o.sw ?? 3, o: o.o });
}

// ================================================================== TITLE
// The offsets were tuned for a 3.75 s card; they stretch or shrink with the actual lead-in.
const titleAt = S => { const k = clamp((S.end - S.start) / 3.75, 0.6, 1.5); return s => S.start + s * k; };
SCENES.title = {
  post: 0.6, zoom: 0.015,
  render(t, S) {
    const at = titleAt(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const K = once('title_K', () => makeConstellation(42, 22, { cx: 960, cy: 540, rx: 860, ry: 430, minD: 150, extra: 0.25 }));
    const out = [constellation(t, K, { t0: S.start + 0.02, dur: at(2.0) - S.start, size: 4.5, lineW: 1.6, o: 0.28, glow: 0.5 })];
    const e1 = enter(t, at(0.1), { dy: 12 });
    out.push(G({ o: e1.o, y: e1.y }, T('PETER NAUR  ·  1985', 960, 402, { size: 26, weight: 700, fill: C.ink2, anchor: 'middle', ls: 7 })));
    const size = 104, y = 540;
    const A = 'Programming', B = 'Specs', R = ' as Theory Building';
    const wA = measure(A, size, 'serif', 700), wB = measure(B, size, 'serif', 700), wR = measure(R, size, 'serif', 700);
    const x0 = 960 - (wA + wR) / 2, x1 = 960 - (wB + wR) / 2;
    const e2 = enter(t, at(0.22), { dy: 30, d: 0.7 });
    const strike = P(t, at(0.85), 0.38, 'inOut');
    const goneA = P(t, at(1.28), 0.4, 'in');
    const m = P(t, at(1.33), 0.75, 'inOut');
    const dropB = P(t, at(1.52), 0.65, 'outBack');
    const inB = P(t, at(1.52), 0.25, 'out');
    out.push(G({ o: e2.o, y: e2.y }, [
      G({ o: 1 - goneA, y: -26 * goneA }, T(A, x0, y, { font: 'serif', size, weight: 700 }),
        drawPath(`M${r2(x0 - 10)} ${y - 30} C${r2(x0 + wA * 0.35)} ${y - 40} ${r2(x0 + wA * 0.7)} ${y - 26} ${r2(x0 + wA + 12)} ${y - 38}`, strike, { stroke: C.coral, sw: 10 })),
      G({ o: inB, y: lerp(-60, 0, dropB) }, T(B, x1, y, { font: 'serif', size, weight: 700, fill: C.coral })),
      T(R, lerp(x0 + wA, x1 + wB, m), y, { font: 'serif', size, weight: 700 }),
    ]));
    const sub = 'The extended cut: Naur, in depth';
    const e3 = enter(t, at(1.9), { dy: 16 });
    out.push(G({ o: e3.o, y: e3.y }, T(sub, 960, 626, { font: 'serif', size: 42, italic: true, fill: C.ink2, anchor: 'middle' })));
    const wS = measure(sub, 42, 'serif', 400, true) * 0.74;
    out.push(underline(960 - wS / 2, 660, wS, P(t, at(2.15), 0.6, 'inOut'), { color: C.gold, sw: 6 }));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const at = titleAt(S);
    return [
      { t: at(0.08), type: 'chime', note: 0, gain: 0.7 }, { t: at(0.85), type: 'scribble', dur: 0.38 },
      { t: at(1.52), type: 'pop', pitch: 1.0 }, { t: at(1.9), type: 'whoosh', dur: 0.5, gain: 0.45 },
      { t: at(2.15), type: 'scribble', dur: 0.5, gain: 0.3 },
    ];
  },
};

// ================================================================== HOOK
const HOOK_TEAM = [
  { x: 430, shirt: C.teal, skin: C.skin[0], hair: C.hair[0], hs: 0, seed: 1 },
  { x: 630, shirt: C.coral, skin: C.skin[2], hair: C.hair[3], hs: 3, seed: 2 },
  { x: 830, shirt: C.blue, skin: C.skin[4], hair: C.hair[2], hs: 2, seed: 3 },
];
// the stack grows from {code} and tops out at {pile}
const hookGrow = S => { const g0 = S.cue('code') - 0.25; return [g0, Math.max(g0 + 0.5, S.cue('pile') - 0.1)]; };
SCENES.hook = {
  render(t, S) {
    const q = S.cue('q'), ans = S.cue('ans'), nc = S.cue('notcode');
    const l2 = S.line(1).start;
    const [g0, g1] = hookGrow(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // --- the team at laptops behind a desk
    const eT = enter(t, S.start + 0.02, { dy: 40, d: 0.7 });
    const glow = P(t, nc + 0.15, 0.6);
    const happy = t > nc + 0.25;
    const lookR = t > g0 && t < l2 ? 0.6 : 0;
    const team = HOOK_TEAM.map((pp, i) => {
      const bob = Math.sin(t * 7 + i * 2) * 1.2;
      return G({ x: pp.x, y: 890 + bob, s: 1.05 }, person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, arms: 'typing', seed: pp.seed, look: lookR, mood: happy ? 'happy' : 'neutral', glowHead: glow * 0.9 }));
    });
    const laptops = HOOK_TEAM.map(pp => G({ x: pp.x, y: 758 }, laptopBack({ w: 150, h: 92 })));
    out.push(G({ o: eT.o, y: eT.y }, team, laptops, G({ x: 630, y: 770 }, desk(820))));
    // sparkles over the heads once "not the code" lands
    HOOK_TEAM.forEach((pp, i) => {
      const sp = P(t, nc + 0.15 + i * 0.12, 0.5, 'outBack');
      if (sp > 0) out.push(sparkle(pp.x + 34, 590 - 18 * sp, 16 * sp * (1 + 0.1 * Math.sin(t * 5 + i)), { fill: C.gold }));
    });
    // --- the stack: sheets slide in under a code card, which rides up on top
    const sx = 1230, sBase = 885, N = 22;
    const sheetT = i => g0 + (g1 - g0) * (i / (N - 1));
    const stack = [];
    let count = 0;
    for (let i = 0; i < N; i++) {
      const p = P(t, sheetT(i), 0.2, 'out');
      if (p <= 0) continue;
      count += p;
      const jit = Math.sin(i * 12.9898) * 14;
      stack.push(rect(sx - 150 + jit - (1 - p) * 90, sBase - (i + 1) * 13, 300, 11, { rx: 3, fill: C.card, stroke: C.faint, sw: 2, o: p }));
    }
    const eC = enter(t, g0 - 0.05, { d: 0.45, from: 0.7, dy: 30 });
    if (eC.o > 0) {
      const land = pulse(t, g1 + 0.1, 0.35, 0.06);
      const topY = sBase - count * 13 - 104;
      stack.push(G({ x: sx + 6, y: topY + eC.y, r: -3 + Math.sin(t * 1.7) * 0.8, s: eC.s * land, o: eC.o },
        codeCard({ w: 300, h: 200, seed: 9, reveal: P(t, g0 + 0.1, 1.1, 'linear') })));
    }
    const dim = 1 - 0.55 * P(t, nc - 0.05, 0.5);
    out.push(G({ o: dim }, stack));
    // pages fly from the laptops onto the pile while it grows
    const topNow = sBase - count * 13 - 150;
    for (let k = 0; k < 6; k++) {
      const tk = g0 + k * Math.max(0.05, g1 - g0 - 0.3) / 5;
      const f = P(t, tk, 0.42, 'inOut');
      if (f <= 0 || f >= 1) continue;
      const from = HOOK_TEAM[k % 3];
      const [fx, fy] = quadPoint(from.x + 62, 712, sx - 60, topNow, -0.32, f);
      out.push(G({ x: fx, y: fy, r: lerp(-24, 18, f) + k * 9, s: 0.7 + 0.3 * Math.sin(f * Math.PI), o: Math.min(1, Math.sin(f * Math.PI) * 2.2) },
        rect(-19, -24, 38, 48, { rx: 3, fill: C.card, stroke: C.faint, sw: 1.5 }),
        [0, 1, 2].map(j => rect(-12, -14 + j * 11, 24 - j * 5, 4.5, { rx: 2, fill: CODE_COLORS[(k + j) % CODE_COLORS.length], o: 0.7 }))));
    }
    // cross it out
    out.push(G({ x: sx, y: 640 }, crossMark(P(t, nc - 0.2, 0.5, 'inOut'), { size: 130, sw: 18 })));
    // "?" and label
    const qp = P(t, q - 0.25, 0.55, 'outBack');
    const qFade = 1 - P(t, nc - 0.15, 0.4);
    if (qp > 0) out.push(G({ x: 1530, y: 560, s: qp, r: lerp(-20, 6, qp) + Math.sin(t * 2.1) * 3 * qp, o: qFade }, T('?', 0, 60, { font: 'serif', size: 230, weight: 700, fill: C.coral, anchor: 'middle' })));
    const lp = P(t, q + 0.15, 0.5);
    if (lp > 0) out.push(G({ o: lp * qFade, y: (1 - lp) * 8 }, T('the product?', 1545, 700, { font: 'hand', size: 50, weight: 700, fill: C.coral, anchor: 'middle' })));
    // the opening question, then the paper that answers it (line 2)
    const eQ = enter(t, S.voStart - 0.2, { dy: 14 });
    const qOut = exitAt(t, l2 - 0.45, 0.35);
    if (eQ.o * qOut.o > 0) out.push(G({ o: eQ.o * qOut.o, y: eQ.y + qOut.y }, richText([{ t: 'What does a software team ' }, { t: 'actually', italic: true, fill: C.coral }, { t: ' produce?' }], 960, 172, { font: 'serif', size: 62, weight: 600, anchor: 'middle' })));
    const jp = enter(t, l2 - 0.15, { dy: -40, d: 0.6 });
    if (jp.o > 0) {
      const jn = 'Microprocessing and Microprogramming 15 (1985)';
      const title = 'Programming as Theory Building';
      const wJ = measure(jn, 22, 'sans', 600), wT = measure(title, 40, 'serif', 600);
      const cw = Math.max(640, Math.max(wJ, wT) + 80), x = -cw / 2 + 40;
      const card = [
        shadowCard(-cw / 2, -150, cw, 300, { rx: 6 }),
        T(jn, x, -100, { size: 22, weight: 600, fill: C.ink2 }),
        line(x, -82, cw / 2 - 40, -82, { stroke: C.faint, sw: 2 }),
        T(title, x, -30, { font: 'serif', size: 40, weight: 600 }),
        underline(x - 2, -12, wT + 4, P(t, ans - 0.2, 0.6, 'inOut'), { color: C.gold, sw: 6 }),
        T('Peter Naur', x, 22, { font: 'serif', size: 28, italic: true, fill: C.ink2 }),
        ...[0, 1, 2, 3].map(k => rect(x, 52 + k * 20, (cw - 80) * [0.96, 1, 0.9, 0.62][k], 8, { rx: 4, fill: C.ink3, o: 0.45 })),
      ];
      out.push(G({ x: 640, y: 300 + jp.y + Math.sin(t * 1.3) * 2.5, r: -2, o: jp.o, s: jp.s }, card));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const [g0, g1] = hookGrow(S), l2 = S.line(1).start;
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.5, gain: 0.35 },
      { t: S.cue('q') - 0.25, type: 'pop', pitch: 0.8 },
      { t: g0, type: 'typing', dur: g1 - g0 + 0.1, gain: 0.55 }, { t: g0 + 0.1, type: 'rise', dur: g1 - g0, gain: 0.3 },
      { t: g1 + 0.1, type: 'thud', gain: 0.6 },
      { t: l2 - 0.15, type: 'whoosh', dur: 0.45 },
      { t: S.cue('ans') - 0.2, type: 'scribble', dur: 0.5, gain: 0.5 },
      { t: S.cue('notcode') - 0.2, type: 'scribble', dur: 0.5 },
      { t: S.cue('notcode') + 0.2, type: 'chime', note: 2 },
    ];
  },
};

// ================================================================== NAUR
const NAUR_SECTIONS = [
  'Introduction',
  'Programming and the programmers’ knowledge',
  'Ryle’s notion of theory',
  'The theory to be built by the programmer',
  'Problems and costs of program modifications',
  'Program life, death and revival',
  'Method and theory building',
  'Programmers’ status and the Theory Building View',
  'Conclusions',
];
const NAUR_ROW_Y = i => -52 + i * 40;
const NAUR_LENS_X = -322;

// Card 1: the ALGOL 60 report cover (400×330, centred). code 0…1 types the begin…end block; hl 0…1 marks the editor.
function naurAlgolCard(t, o = {}) {
  const { code = 1, hl = 0 } = o;
  const out = [shadowCard(-200, -165, 400, 330, { rx: 10 }), rect(-186, -151, 372, 302, { rx: 5, stroke: C.faint, sw: 2 })];
  out.push(T('Report on the Algorithmic', 0, -106, { font: 'serif', size: 26, weight: 600, anchor: 'middle' }));
  out.push(T('Language ALGOL 60', 0, -72, { font: 'serif', size: 26, weight: 600, anchor: 'middle' }));
  const wEd = measure('edited by ', 22, 'serif', 400, true), wPN = measure('Peter Naur', 22, 'serif', 400, true);
  const x0 = -(wEd + wPN) / 2;
  if (hl > 0) out.push(rect(x0 + wEd - 5, -56, (wPN + 10) * hl, 28, { rx: 6, fill: C.goldLight, o: 0.8 }));
  out.push(richText([{ t: 'edited by ', fill: C.ink2 }, { t: 'Peter Naur', fill: C.ink }], 0, -36, { font: 'serif', size: 22, italic: true, anchor: 'middle' }));
  out.push(line(-150, -14, 150, -14, { stroke: C.faint, sw: 2 }));
  const bx = -140;
  if (code > 0.02) out.push(T('begin', bx, 16, { font: 'mono', size: 22, weight: 600, o: clamp(code * 8) }));
  [[0, 0.62, C.blue], [1, 0.5, C.teal], [1, 0.72, C.plum], [0, 0.42, C.coral]].forEach(([ind, w, col], i) => {
    const p = clamp(code * 6 - 1 - i);
    if (p > 0) out.push(rect(bx + 30 + ind * 26, 31 + i * 21, 230 * w * p, 9, { rx: 4.5, fill: col, o: 0.75 }));
  });
  if (code > 0.84) out.push(T('end', bx, 134, { font: 'mono', size: 22, weight: 600, o: clamp((code - 0.84) / 0.16) }));
  return out.join('');
}
// Card 2: BNF (400×330, centred). letters/prods 0…1 reveal; nGlow 0…1 lights the N.
function naurBnfCard(t, o = {}) {
  const { letters = 1, prods = 1, nGlow = 0 } = o;
  const out = [shadowCard(-200, -165, 400, 330, { rx: 10 })];
  ['B', 'N', 'F'].forEach((ch, i) => {
    const p = clamp(letters * 3 - i);
    if (p <= 0) return;
    const x = (i - 1) * 104, isN = i === 1;
    if (isN && nGlow > 0) out.push(circle(x, -66, 84, { fill: 'url(#gGlow)', o: 0.9 * nGlow }));
    out.push(G({ x, y: -28 + (1 - Ease.outBack(p)) * 26, o: clamp(p * 2) },
      T(ch, 0, 0, { font: 'serif', size: 110, weight: 700, fill: isN ? mixColor(C.ink, C.goldDeep, nGlow) : C.ink, anchor: 'middle' })));
  });
  const L = [
    [['<digit>', C.blue], ['  ::= ', C.ink3], ['0 | 1 | … | 9', C.ink]],
    [['<number>', C.blue], [' ::= ', C.ink3], ['<digit>', C.blue]],
    [['         | ', C.ink3], ['<number><digit>', C.blue]],
  ].map(l => l.map(([s, fill]) => ({ t: s, fill })));
  const lx = -measure('<digit>  ::= 0 | 1 | … | 9', 22, 'mono', 400) / 2;
  L.forEach((segs, i) => {
    const p = clamp(prods * 3 - i);
    if (p > 0) out.push(richText(truncSegs(segs, p * segLen(segs)), lx, 52 + i * 38, { font: 'mono', size: 22 }));
  });
  return out.join('');
}
// A gold medal with a laurel, centred, radius r.
function naurMedal(t, o = {}) {
  const r = o.r ?? 58;
  const leaves = [];
  for (let k = 0; k < 6; k++) {
    const deg = 112 + k * 22, a = (deg * Math.PI) / 180, R = r * 0.64;
    leaves.push(G({ x: Math.cos(a) * R, y: Math.sin(a) * R, r: deg + 60 }, ellipse(0, 0, r * 0.16, r * 0.07, { fill: C.goldDeep, o: 0.9 })));
  }
  const glint = 0.5 + 0.5 * Math.sin(t * 2.4);
  return [
    circle(3, 7, r, { fill: 'rgba(30,42,58,0.14)' }),
    circle(0, 0, r, { fill: C.gold, stroke: C.goldDeep, sw: 5 }),
    circle(0, 0, r * 0.84, { stroke: '#FFE3A6', sw: 2.5 }),
    G({}, leaves), G({ sx: -1, sy: 1 }, leaves),
    sparkle(0, -2, r * 0.3, { fill: C.goldDeep }),
    path(`M${r2(-r * 0.62)} ${r2(-r * 0.3)} A${r2(r * 0.69)} ${r2(r * 0.69)} 0 0 1 ${r2(-r * 0.2)} ${r2(-r * 0.66)}`, { stroke: '#FFF6DE', sw: 5, o: 0.45 + 0.4 * glint }),
  ].join('');
}
// Card 3: the Turing Award (400×330, centred). lt = time since the card began to enter.
function naurTuringCard(t, o = {}) {
  const lt = o.lt ?? 99;
  const out = [shadowCard(-200, -165, 400, 330, { rx: 10 })];
  const drop = P(lt, 0.05, 0.6, 'outBack');
  const ls = Math.max(0, lt - 0.3);
  const swing = 9 * Math.exp(-2.2 * ls) * Math.sin(ls * 6.5) + 1.4 * Math.sin(t * 1.6);
  const r = 58, cyM = -24, top = -165, L = cyM - r - top;
  const ribbon = [
    path(`M-64 0 L-30 0 L10 ${L + 6} L-16 ${L + 6} Z`, { fill: C.blue }),
    path(`M64 0 L30 0 L-10 ${L + 6} L16 ${L + 6} Z`, { fill: mixColor(C.blue, C.ink, 0.3) }),
    line(-47, 0, -3, L + 4, { stroke: C.goldLight, sw: 3, o: 0.85 }),
    line(47, 0, 3, L + 4, { stroke: C.goldLight, sw: 3, o: 0.6 }),
    circle(0, L - 2, 8, { stroke: C.goldDeep, sw: 4 }),
  ];
  out.push(G({ y: top, r: swing, o: clamp(drop * 2) }, G({ y: -(1 - drop) * 34 }, ribbon, G({ y: L + r }, naurMedal(t, { r })))));
  const tp = P(lt, 0.45, 0.4);
  out.push(G({ o: tp, y: (1 - tp) * 8 }, T('A.M. TURING AWARD', 0, 86, { size: 22, weight: 800, fill: C.ink2, anchor: 'middle', ls: 3 }),
    T('2005', 0, 130, { font: 'serif', size: 34, weight: 600, fill: C.goldDeep, anchor: 'middle' })));
  const sp = 0.5 + 0.5 * Math.sin(t * 3.1);
  if (drop >= 1) out.push(sparkle(52 + swing * 2, -120, 11 * sp, { fill: C.gold, o: 0.9 }));
  return out.join('');
}
// The essay's section list; focus(i) 0…1 brings heading i into focus; ly = lens height (current-row tint).
function naurRows(focus, ly) {
  const out = [];
  NAUR_SECTIONS.forEach((s, i) => {
    const k = focus(i), y = NAUR_ROW_Y(i);
    const near = ly == null ? 0 : Math.max(0, 1 - Math.abs(ly - (y - 8)) / 34);
    if (near > 0) out.push(rect(-352, y - 29, 704, 40, { rx: 10, fill: C.goldLight, o: 0.4 * near }));
    out.push(circle(-322, y - 8, 16, { fill: C.goldDeep, o: k }), circle(-322, y - 8, 16, { stroke: mixColor(C.faint, C.goldDeep, k), sw: 2.5 }));
    out.push(T(String(i + 1), -322, y, { size: 22, weight: 800, fill: mixColor(C.ink3, C.card, k), anchor: 'middle' }));
    out.push(T(s, -290, y, { size: 24, weight: 500, fill: mixColor(C.ink3, C.ink, k) }));
  });
  return out.join('');
}
// The essay's first page (900×630, centred) with its section list and a magnifier.
function naurEssayPage(t, o = {}) {
  const { ul = 0, focus = () => 0, ly = null, lensIn = 0 } = o;
  const w = 900, h = 630, x = -w / 2, y = -h / 2;
  const out = [shadowCard(x, y, w, h, { rx: 8 })];
  out.push(T('Microprocessing and Microprogramming 15 (1985) 253–261', x + 50, y + 54, { size: 22, weight: 600, fill: C.ink2 }));
  out.push(line(x + 50, y + 72, x + w - 50, y + 72, { stroke: C.faint, sw: 2 }));
  const title = 'Programming as Theory Building';
  const wT = measure(title, 48, 'serif', 600);
  out.push(T(title, 0, y + 136, { font: 'serif', size: 48, weight: 600, anchor: 'middle' }));
  out.push(underline(-wT / 2 - 4, y + 154, wT + 8, ul, { color: C.gold, sw: 6 }));
  out.push(T('Peter Naur', 0, y + 194, { font: 'serif', size: 30, italic: true, fill: C.ink2, anchor: 'middle' }));
  out.push(line(-40, y + 222, 40, y + 222, { stroke: C.faint, sw: 2 }));
  out.push(naurRows(focus, lensIn > 0 ? ly : null));
  if (lensIn > 0) {
    // magnifier: a 1.55x copy of the list inside the glass, clipped to the lens
    const lx = NAUR_LENS_X, R = 48, id = 'naurLensClip';
    const d = R * 0.7;
    out.push(G({ x: lx, y: ly, s: lerp(0.5, 1, lensIn), o: clamp(lensIn * 2) }, G({ x: -lx, y: -ly }, [
      `<defs><clipPath id="${id}"><circle cx="${r2(lx)}" cy="${r2(ly)}" r="${R}"/></clipPath></defs>`,
      line(lx - d, ly + d, lx - d - 44, ly + d + 44, { stroke: C.ink, sw: 14 }),
      G({ clip: `url(#${id})` }, circle(lx, ly, R, { fill: C.card }),
        G({ x: lx, y: ly, s: 1.55 }, G({ x: -lx, y: -ly }, naurRows(focus, ly))),
        circle(lx, ly, R, { fill: 'rgba(255,255,255,0.18)' })),
      circle(lx, ly, R, { stroke: C.ink, sw: 9 }),
      path(`M${r2(lx - R * 0.55)} ${r2(ly - R * 0.35)} A${R * 0.62} ${R * 0.62} 0 0 1 ${r2(lx - R * 0.2)} ${r2(ly - R * 0.6)}`, { stroke: '#FFFFFF', sw: 4, o: 0.8 }),
    ])));
  }
  return out.join('');
}
// lens sweep window, shared by render and sfx
const naurSweep = S => { const a = S.cue('essay') + 0.6; return [a, Math.max(a + 1.2, S.end - 0.5)]; };
SCENES.naur = {
  render(t, S) {
    const al = S.cue('algol'), bnf = S.cue('bnf'), tu = S.cue('turing'), es = S.cue('essay');
    const l2 = S.line(1).start;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const shrink = P(t, l2 - 0.1, 0.8, 'inOut');
    // headline
    const hOut = 1 - P(t, l2 - 0.25, 0.4);
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o * hOut, y: eH.y - 16 * (1 - hOut) }, T('Peter Naur', 960, 150, { font: 'serif', size: 62, weight: 600, anchor: 'middle' })));
    const eS = enter(t, S.start + 0.3, { dy: 10 });
    out.push(G({ o: eS.o * hOut, y: eS.y - 16 * (1 - hOut) }, T('1928–2016  ·  Datalogisk Institut, Copenhagen', 960, 198, { size: 26, weight: 500, fill: C.ink2, anchor: 'middle' })));
    // three cards, which later shrink up into a row
    const cards = [
      { cue: al, x: 420, draw: lt => naurAlgolCard(t, { code: P(lt, 0.25, 1.0, 'linear'), hl: P(lt, 0.55, 0.45, 'inOut') }) },
      { cue: bnf, x: 960, draw: lt => naurBnfCard(t, { letters: P(lt, 0.05, 0.45, 'linear'), prods: P(lt, 0.5, 1.0, 'linear'), nGlow: P(lt, 0.55, 0.4) * (0.85 + 0.15 * Math.sin(t * 4)) }) },
      { cue: tu, x: 1500, draw: lt => naurTuringCard(t, { lt }) },
    ];
    cards.forEach((c, i) => {
      const e = enter(t, c.cue - 0.3, { d: 0.6 });
      if (e.o <= 0) return;
      const lt = t - (c.cue - 0.3);
      const bob = Math.sin(t * 1.3 + i * 2.1) * 4 * (1 - shrink);
      const x = lerp(c.x, 760 + i * 200, shrink), y = lerp(565, 160, shrink) + bob + e.y * (1 - shrink);
      out.push(G({ x, y, s: lerp(1, 0.34, shrink) * e.s, r: lerp(0, [-3, 0, 3][i], shrink), o: e.o }, c.draw(lt)));
    });
    // hand labels under cards 1 and 2
    [{ cue: al, x: 420, segs: [{ t: 'edited the report (1960)' }] },
      { cue: bnf, x: 960, segs: [{ t: 'Backus–' }, { t: 'Naur', fill: C.goldDeep }, { t: ' Form' }] }].forEach(l => {
      const p = P(t, l.cue + 0.4, 0.45);
      if (p > 0) out.push(G({ o: p * (1 - clamp(shrink * 3)), y: (1 - p) * 8 }, richText(l.segs, l.x, 806, { font: 'hand', size: 44, weight: 700, fill: C.ink2, anchor: 'middle' })));
    });
    // the essay itself, with its real section headings and a magnifier sliding down them
    const eP = enter(t, l2 + 0.12, { dy: 70, d: 0.75, from: 0.95 });
    if (eP.o > 0) {
      const [sw0, sw1] = naurSweep(S);
      const sweep = P(t, sw0, sw1 - sw0, 'inOutSine');
      const lensIn = P(t, es + 0.3, 0.45, 'outBack');
      const ly = lerp(NAUR_ROW_Y(0) - 8, NAUR_ROW_Y(8) - 8, sweep);
      const focus = i => (lensIn > 0 ? clamp((ly - (NAUR_ROW_Y(i) - 8) + 26) / 26) : 0);
      out.push(G({ x: 960, y: 592 + eP.y, s: eP.s, r: (1 - eP.p) * 1.5, o: eP.o }, naurEssayPage(t, { ul: P(t, es - 0.15, 0.6, 'inOut'), focus, ly, lensIn })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const [sw0, sw1] = naurSweep(S), l2 = S.line(1).start;
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.45, gain: 0.4 },
      { t: S.cue('algol') - 0.3, type: 'pop', pitch: 0.85 }, { t: S.cue('algol') + 0.0, type: 'typing', dur: 0.9, gain: 0.35 },
      { t: S.cue('bnf') - 0.3, type: 'pop', pitch: 1.0 }, { t: S.cue('bnf') + 0.3, type: 'chime', note: 1, gain: 0.6 },
      { t: S.cue('turing') - 0.3, type: 'pop', pitch: 1.12 }, { t: S.cue('turing') - 0.1, type: 'swing', gain: 0.6 },
      { t: l2 - 0.1, type: 'whoosh', dur: 0.7, gain: 0.5 }, { t: l2 + 0.5, type: 'thud', gain: 0.4 },
      { t: S.cue('essay') - 0.15, type: 'scribble', dur: 0.55, gain: 0.45 },
      { t: S.cue('essay') + 0.3, type: 'pop', pitch: 1.25, gain: 0.45 },
      { t: sw0, type: 'swish', dur: sw1 - sw0, gain: 0.3 },
      ...[0.25, 0.55, 0.85].map((f, i) => ({ t: lerp(sw0, sw1, f), type: 'tick', gain: 0.3, pitch: 1 + i * 0.08 })),
      { t: sw1 - 0.1, type: 'chime', note: 5, gain: 0.45 },
    ];
  },
};

// ================================================================== VIEWS (chapter: what programming is)
// Conveyor belt: left end at x=0, top run at y=0, w long; phase = distance travelled in px.
function conveyor(w, phase) {
  const body = '#3A4458', roller = '#AEB4BE', leg = '#8A93A3';
  const out = [
    rect(46, 26, 16, 84, { rx: 4, fill: leg }), rect(w - 62, 26, 16, 84, { rx: 4, fill: leg }),
    rect(28, 106, 52, 9, { rx: 4.5, fill: leg }), rect(w - 80, 106, 52, 9, { rx: 4.5, fill: leg }),
    rect(0, 0, w, 32, { rx: 16, fill: body }),
  ];
  // rollers carry one diameter line (180° symmetry), so their spin reads the right way at 30 fps
  const nr = Math.round(w / 72), rr = 10, ang = phase / rr;
  for (let k = 0; k < nr; k++) {
    const x = 16 + (k * (w - 32)) / (nr - 1);
    out.push(circle(x, 16, rr, { fill: roller }), line(x - Math.cos(ang) * 7, 16 - Math.sin(ang) * 7, x + Math.cos(ang) * 7, 16 + Math.sin(ang) * 7, { stroke: body, sw: 2.5 }));
  }
  const gapC = 44;
  for (let x = phase % gapC; x < w - 20; x += gapC) if (x > 14) out.push(rect(x, -3, 12, 5, { rx: 2, fill: '#6B768C' }));
  return out.join('');
}
const VIEWS_BELT = { x: 322, y: 774, w: 560, v: 260 };
SCENES.views = {
  render(t, S) {
    const prod = S.cue('prod'), texts = S.cue('texts'), tbv = S.cue('tbv'), ins = S.cue('insight'), sec = S.cue('second');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // headline, divider and a small "vs" (the chapter chip owns the top-left corner for the first 5 s)
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Two views ', fill: C.ink }, { t: 'of programming', fill: C.ink }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    const leftDim = 1 - 0.55 * P(t, sec - 0.1, 0.6);
    out.push(dashLine(960, 250, 960, 940, P(t, S.start + 0.15, 1.1, 'inOut'), { stroke: C.ink3, sw: 3, o: 0.75 }));
    const vs = P(t, S.voStart + 0.45, 0.5, 'outBack');
    if (vs > 0) out.push(G({ x: 960, y: 596, s: vs, o: clamp(vs * 2) * lerp(1, 0.6, 1 - leftDim) }, circle(0, 0, 32, { fill: C.paper, stroke: C.faint, sw: 2.5 }), T('vs', 0, 9, { font: 'serif', size: 30, italic: true, fill: C.ink2, anchor: 'middle' })));
    // panel labels: both appear, faint, on "two views"; each lights up on its cue
    const lblIn = P(t, S.voStart + 0.55, 0.5);
    const lOn = P(t, prod - 0.25, 0.4), rOn = P(t, tbv - 0.25, 0.4);
    out.push(G({ o: lblIn * lerp(0.4, 1, lOn) * leftDim }, T('PRODUCTION VIEW', 480, 282, { size: 28, weight: 800, fill: C.ink2, anchor: 'middle', ls: 7 })));
    out.push(G({ o: lblIn * lerp(0.4, 1, rOn) }, T('THEORY BUILDING VIEW', 1440, 282, { size: 28, weight: 800, fill: mixColor(C.ink3, C.goldDeep, rOn), anchor: 'middle', ls: 7 })));
    // ---- left panel: a programmer feeds texts onto a conveyor
    const L = [];
    const eL = enter(t, prod - 0.3, { d: 0.6 });
    const B = VIEWS_BELT;
    const stopT = sec - 0.1;
    const tEff = t < stopT ? t : stopT + 0.35 * (1 - Math.pow(1 - clamp((t - stopT) / 0.7), 2));
    const run = Math.max(0, tEff - (prod - 0.3));
    if (eL.o > 0) {
      const px = 205;
      L.push(G({ o: eL.o, y: eL.y }, [
        G({ x: px, y: 882 + Math.sin(t * 7) * 1.2, s: 0.95 }, person(t, { shirt: C.blue, skin: C.skin[1], hair: C.hair[1], hairStyle: 1, arms: 'typing', seed: 21, look: t > texts - 0.4 ? 0.6 : 0.2 })),
        G({ x: px, y: 770 }, laptopBack({ w: 132, h: 84 })),
        G({ x: px, y: 776 }, desk(230)),
        G({ x: B.x, y: B.y }, conveyor(B.w, run * B.v)),
        rect(B.x + B.w - 8, B.y - 42, 8, 44, { rx: 3, fill: '#8A93A3' }),
      ]));
      // items ride the belt and queue at the stopper
      const items = [
        { launch: texts - 0.45, rest: 797, h: 180, draw: () => codeCard({ w: 150, h: 180, seed: 71 }) },
        { launch: texts + 0.15, rest: 637, h: 172, draw: () => docCard({ w: 140, h: 172, seed: 72, title: 'docs', lines: 5 }) },
        { launch: texts + 0.75, rest: 482, h: 172, draw: () => specDoc({ w: 140, h: 172, accent: C.coral, lines: 4 }) },
      ];
      items.forEach((it, i) => {
        if (t < it.launch) return;
        const lt = t - it.launch;
        const x0 = 300, xr = Math.min(it.rest, x0 + B.v * Math.max(0, Math.min(tEff, stopT + 99) - it.launch));
        const arrived = x0 + B.v * lt >= it.rest;
        const em = P(t, it.launch, 0.3, 'outBack');
        const tArr = it.launch + (it.rest - x0) / B.v;
        const bump = arrived ? pulse(t, tArr, 0.25, 0.05) : 1;
        const jig = arrived ? 0 : Math.sin(t * 22 + i) * 1.2;
        L.push(G({ x: xr, y: B.y - it.h / 2 - 3 + jig, s: lerp(0.35, 1, em) * bump, o: clamp(em * 2) }, it.draw()));
      });
      const lab = P(t, texts + 1.15, 0.5);
      if (lab > 0) L.push(G({ o: lab, y: (1 - lab) * 8 }, T('output: a program + texts', 600, 968, { font: 'hand', size: 46, weight: 700, fill: C.ink2, anchor: 'middle' })));
    }
    out.push(G({ o: leftDim }, L));
    // ---- right panel: a head, and the theory it forms
    const hx = 1420, hy = 572, hs = 0.72;
    const eHead = enter(t, tbv - 0.3, { d: 0.65, from: 0.9 });
    const glowUp = P(t, sec - 0.1, 0.7);
    if (eHead.o > 0) {
      const breathe = 1 + 0.012 * Math.sin(t * 1.7);
      out.push(G({ x: hx, y: hy + eHead.y, s: hs * eHead.s * breathe, o: eHead.o },
        glowUp > 0 ? circle(-10, -30, 330, { fill: 'url(#gGlow)', o: 0.55 * glowUp * (0.9 + 0.1 * Math.sin(t * 3)) }) : '',
        bigHead(t),
        constellation(t, HEAD_K(), { t0: ins - 0.3, dur: 2.0, size: 7.5, lineW: 2.6, glow: 1 + 0.6 * glowUp })));
    }
    const eI = P(t, ins + 0.35, 0.5);
    if (eI > 0) {
      out.push(G({ o: eI, y: (1 - eI) * 8 }, T('an insight, a theory', 1668, 404, { font: 'hand', size: 44, weight: 700, fill: C.goldDeep, anchor: 'middle' })));
      out.push(handArrow(1600, 424, 1500, 482, P(t, ins + 0.5, 0.45, 'inOut'), { color: C.goldDeep, bend: 0.3, sw: 3.5, head: 14 }));
    }
    // the texts, small, on a shelf under the head: secondary
    const eS = P(t, sec - 0.3, 0.45);
    if (eS > 0) out.push(G({ o: eS }, line(1250, 888, 1630, 888, { stroke: C.ink3, sw: 5 }), line(1292, 888, 1292, 912, { stroke: C.ink3, sw: 4 }), line(1588, 888, 1588, 912, { stroke: C.ink3, sw: 4 })));
    const mini = [
      { x: 1330, h: 180, draw: () => codeCard({ w: 150, h: 180, seed: 71 }) },
      { x: 1440, h: 172, draw: () => docCard({ w: 140, h: 172, seed: 72, lines: 5 }) },
      { x: 1550, h: 172, draw: () => docCard({ w: 140, h: 172, seed: 11, lines: 4, checks: true, accent: C.coral }) },
    ];
    mini.forEach((m, i) => {
      const t0 = sec - 0.2 + i * 0.14;
      const fall = P(t, t0, 0.35, 'in');
      if (fall <= 0) return;
      const lt = t - t0 - 0.35;
      const hop = lt > 0 ? Math.abs(Math.exp(-7 * lt) * Math.sin(lt * 22)) * 10 : 0;
      out.push(G({ x: m.x, y: 886 - m.h * 0.25 - (1 - fall) * 170 - hop, s: 0.5, r: (1 - fall) * (i - 1) * 14, o: clamp(fall * 4) }, m.draw()));
    });
    const eSec = P(t, sec + 0.35, 0.45);
    if (eSec > 0) out.push(G({ o: eSec, y: (1 - eSec) * 8 }, T('secondary', 1440, 962, { font: 'serif', size: 40, italic: true, fill: C.ink2, anchor: 'middle' })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const texts = S.cue('texts'), sec = S.cue('second');
    return [
      { t: S.start + 0.1, type: 'whoosh', dur: 0.5, gain: 0.35 }, { t: S.start + 0.2, type: 'scribble', dur: 1.0, gain: 0.2 },
      { t: S.voStart + 0.45, type: 'pop', pitch: 0.9, gain: 0.5 },
      { t: S.cue('prod') - 0.3, type: 'pop', pitch: 0.85 }, { t: S.cue('prod') - 0.1, type: 'click', gain: 0.5 },
      ...[texts - 0.45, texts + 0.15, texts + 0.75].map((x, i) => ({ t: x, type: 'pop', pitch: 1 + i * 0.1, gain: 0.5 })),
      { t: S.cue('tbv') - 0.3, type: 'whoosh', dur: 0.55, gain: 0.5 },
      { t: S.cue('insight') - 0.3, type: 'chime', note: 0 },
      ...[0, 1, 2].map(i => ({ t: sec - 0.2 + i * 0.14 + 0.35, type: 'thud', gain: 0.35 })),
      { t: sec + 0.25, type: 'chime', note: 4, gain: 0.45 },
    ];
  },
};

// ================================================================== MATCHING
const MATCH_WY = [372, 516, 660, 804];   // world item centres
const MATCH_CY = [392, 516, 640, 764];   // code line centres
const MATCH_WX = 450, MATCH_TX1 = 520, MATCH_TX2 = 1168, MATCH_CODE_X = 1200;
const mseg = arr => arr.map(([s, fill]) => ({ t: s, fill }));
const MATCH_LINES = [
  { old: mseg([['ledger', C.ink], ['.post', C.blue], ['(payment)', C.ink]]) },
  { old: mseg([['users', C.ink], [' = ', C.ink2], ['[ana]', C.ink]]),
    neu: mseg([['users', C.ink], [' = ', C.ink2], ['[ana', C.ink], [', ben', C.goldDeep], [']', C.ink]]), keep: 12 },
  { old: mseg([['run_batch', C.blue], ['(', C.ink], ['"nightly"', C.olive], [')', C.ink]]),
    neu: mseg([['run_batch', C.blue], ['(', C.ink], ['"', C.olive], ['hourly', C.goldDeep], ['"', C.olive], [')', C.ink]]), keep: 11 },
  { old: mseg([['apply', C.blue], ['(policy.', C.ink], ['v1', C.ink], [')', C.ink]]),
    neu: mseg([['apply', C.blue], ['(policy.', C.ink], ['v2', C.goldDeep], [')', C.ink]]), keep: 13 },
];
// per-row timing, shared by render and sfx
function matchTimes(S) {
  const mt = S.cue('matching'), sy = S.cue('symbols'), ch = S.cue('changes'), md = S.cue('mods');
  const draw = [0, 1, 2, 3].map(i => mt - 0.2 + i * 0.3);                 // thread starts drawing
  const land = [0, 1, 2, 3].map(i => Math.max(draw[i] + 0.8, sy - 0.3 + i * 0.2)); // thread lands, line lights
  const change = [null, ch - 0.05, ch + 0.2, ch - 0.3];                   // the world changes (rows 1–3)
  const fix = [null, md - 0.15, md + 0.17, md + 0.49];                    // the line retypes (0.5 s), then the thread redraws
  return { mt, sy, ch, md, draw, land, change, fix };
}
SCENES.matching = {
  render(t, S) {
    const M = matchTimes(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // headline: "matching" turns gold on its cue
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    const goldOn = P(t, M.mt - 0.25, 0.35);
    const hsz = 62;
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Programming ' }, { t: 'is ', italic: true, weight: 400, fill: C.ink2 }, { t: 'matching', fill: mixColor(C.ink, C.goldDeep, goldOn) }], 960, 150, { font: 'serif', size: hsz, weight: 600, anchor: 'middle' })));
    const wAll = measure('Programming ', hsz, 'serif', 600) + measure('is ', hsz, 'serif', 400, true) + measure('matching', hsz, 'serif', 600);
    const wM = measure('matching', hsz, 'serif', 600);
    out.push(underline(960 + wAll / 2 - wM, 172, wM, P(t, M.mt - 0.1, 0.55, 'inOut')));
    // ---- the world panel
    const eW = enter(t, S.start + 0.1, { d: 0.6 });
    out.push(G({ o: eW.o, y: eW.y }, rect(200, 300, 540, 600, { rx: 30, fill: C.tealLight, o: 0.2 }), rect(200, 300, 540, 600, { rx: 30, stroke: C.teal, sw: 2.5, o: 0.3 }),
      T('THE WORLD', 470, 270, { size: 26, weight: 800, fill: C.tealDark, anchor: 'middle', ls: 6 })));
    const fast = P(t, M.change[2] - 0.1, 0.4);
    const gt = t + 4 * Math.max(0, t - M.change[2]);          // gears run 5x faster after the change
    const newP = P(t, M.change[1] - 0.25, 0.6, 'out');        // a new person arrives
    const tabP = P(t, M.change[3], 0.45, 'outBack');          // the policy gets a v2 tab
    const icons = [
      () => G({ s: 0.72 }, iconBank()),
      () => [newP > 0 ? G({ x: lerp(-190, -70, newP), y: 6, s: 0.7, o: clamp(newP * 2) }, iconBust({ color: mixColor(C.teal, C.ink, 0.25), skin: C.skin[0], hair: C.hair[2] })) : '',
        G({ s: 0.8 }, iconBust({ skin: C.skin[3], hair: C.hair[3] }))].join(''),
      () => [G({ s: 0.78 }, iconGears(gt)),
        fast > 0 ? G({ x: -14, y: 5, r: gt * 90 }, [0, 1, 2].map(k => path(`M${r2(Math.cos(k * 2.1) * 60)} ${r2(Math.sin(k * 2.1) * 60)} A60 60 0 0 1 ${r2(Math.cos(k * 2.1 + 0.55) * 60)} ${r2(Math.sin(k * 2.1 + 0.55) * 60)}`, { stroke: C.tealDark, sw: 3.5, o: 0.55 * fast }))) : ''].join(''),
      () => [G({ s: 0.66 }, iconPolicy()),
        tabP > 0 ? G({ x: 34, y: -46, s: tabP, r: lerp(-30, 8, tabP) }, rect(-29, -17, 58, 34, { rx: 9, fill: C.teal }), T('v2', 0, 8, { size: 22, weight: 800, fill: C.card, anchor: 'middle' })) : ''].join(''),
    ];
    icons.forEach((ic, i) => {
      const e = enter(t, S.start + 0.3 + i * 0.12, { d: 0.5 });
      if (e.o > 0) out.push(G({ x: MATCH_WX, y: MATCH_WY[i] + e.y, s: e.s, o: e.o }, ic()));
    });
    // ---- the symbols panel: a code card
    const eC = enter(t, S.start + 0.35, { d: 0.6 });
    const cx0 = 1130, cw = 640, cy0 = 300, chh = 600;
    const fills = once('matching_fill', () => {
      const R = rng(17), f = [];
      MATCH_CY.forEach(y => [42, 82].forEach(dy => f.push([y + dy, Math.floor(R() * 3), 0.25 + R() * 0.45, CODE_COLORS[Math.floor(R() * CODE_COLORS.length)]])));
      return f;
    });
    const card = [shadowCard(cx0, cy0, cw, chh, { rx: 20 }),
      circle(cx0 + 26, cy0 + 26, 7, { fill: C.coral }), circle(cx0 + 48, cy0 + 26, 7, { fill: C.mustard }), circle(cx0 + 70, cy0 + 26, 7, { fill: C.teal }),
      T('program', cx0 + cw - 24, cy0 + 34, { font: 'mono', size: 22, weight: 600, fill: C.ink3, anchor: 'end' }),
      line(cx0 + 20, cy0 + 52, cx0 + cw - 20, cy0 + 52, { stroke: C.faint, sw: 2 }),
      ...fills.map(([y, ind, w, col]) => rect(MATCH_CODE_X + ind * 30, y - 5, (cw - 110) * w, 10, { rx: 5, fill: col, o: 0.3 }))];
    out.push(G({ o: eC.o, y: eC.y }, card, T('SYMBOLS', 1450, 270, { size: 26, weight: 800, fill: C.blue, anchor: 'middle', ls: 6 })));
    // ---- rows: code line, thread, nodes, mismatch and fix
    MATCH_LINES.forEach((ln, i) => {
      const y = MATCH_CY[i], wy = MATCH_WY[i];
      const lit = P(t, M.land[i] - 0.05, 0.3);
      const chT = M.change[i], fxT = M.fix[i];
      const brk = chT == null ? 0 : P(t, chT + 0.15, 0.3);
      const typeP = fxT == null ? 0 : P(t, fxT, 0.5, 'linear');
      const redraw = fxT == null ? 0 : P(t, fxT + 0.5, 0.4, 'inOut');
      // the code text: grey until lit; retyped when fixed
      let segs = ln.old, caretOn = false;
      if (ln.neu && typeP > 0) {
        const nOld = segLen(ln.old), nNew = segLen(ln.neu), del = nOld - ln.keep, add = nNew - ln.keep;
        const k = typeP * (del + add);
        segs = k < del ? truncSegs(ln.old, nOld - k) : truncSegs(ln.neu, ln.keep + (k - del));
        caretOn = typeP < 1;
      }
      const flash = lit * (1 - P(t, M.land[i] + 0.35, 0.8));
      const fixFlash = redraw * (1 - P(t, fxT + 0.9, 0.9));
      const hlO = 0.16 * lit + 0.45 * flash + 0.35 * fixFlash;
      const R = [];
      if (hlO > 0) R.push(rect(MATCH_CODE_X - 14, y - 24, 470, 46, { rx: 10, fill: C.goldLight, o: hlO }));
      if (brk > 0 && typeP < 1) R.push(rect(MATCH_CODE_X - 14, y - 24, 470, 46, { rx: 10, fill: C.coralLight, o: 0.3 * brk * (1 - typeP) }));
      if (lit < 1) R.push(richText(segs.map(s => ({ ...s, fill: C.ink3 })), MATCH_CODE_X, y + 9, { font: 'mono', size: 26, o: (1 - lit) * eC.o }));
      if (lit > 0) R.push(richText(segs, MATCH_CODE_X, y + 9, { font: 'mono', size: 26, o: lit }));
      if (caretOn && Math.sin(t * 30) > -0.3) R.push(rect(MATCH_CODE_X + measure(segText(segs), 26, 'mono', 400) + 3, y - 16, 3, 30, { fill: C.ink }));
      if (brk > 0) {
        const wTxt = measure(segText(ln.old), 26, 'mono', 400);
        R.push(G({ o: 1 - P(t, fxT, 0.2) }, squiggle(MATCH_CODE_X, y + 22, wTxt, P(t, chT + 0.3, 0.35, 'inOut'))));
      }
      out.push(G({ o: eC.o }, R));
      // the thread: gold while matched, coral and dashed once its world item changes, gold again after the fix
      const d = sCurve(MATCH_TX1, wy, MATCH_TX2, y);
      const dp = P(t, M.draw[i], M.land[i] - M.draw[i], 'out');
      if (dp > 0) {
        out.push(circle(MATCH_TX1, wy, 7 * P(t, M.draw[i] - 0.1, 0.3, 'outBack'), { fill: C.gold, stroke: C.goldDeep, sw: 2 }));
        const goldO = 1 - brk * (1 - redraw);
        if (goldO > 0 && redraw <= 0) out.push(drawPath(d, dp, { stroke: C.goldDeep, sw: 3.5, o: goldO }));
        if (brk > 0 && redraw < 1) out.push(path(d, { stroke: C.coral, sw: 3.5, dash: '12 10', o: brk * (1 - redraw) }));
        if (redraw > 0) out.push(drawPath(d, redraw, { stroke: C.goldDeep, sw: 3.5 }));
        const landP = P(t, M.land[i] - 0.08, 0.3, 'outBack');
        const nodeCol = brk > 0 && redraw < 0.99 ? mixColor(C.gold, C.coral, brk) : C.gold;
        if (landP > 0) out.push(circle(MATCH_TX2, y, 7 * landP * pulse(t, fxT == null ? -9 : fxT + 0.9, 0.4, 0.5), { fill: nodeCol, stroke: C.goldDeep, sw: 2 }));
        // the mismatch mark
        if (brk > 0) {
          const ne = P(t, chT + 0.2, 0.4, 'outBack') * (1 - P(t, fxT + 0.45, 0.3));
          const [mx, my] = sCurvePt(MATCH_TX1, wy, MATCH_TX2, y, 0.5);
          if (ne > 0) out.push(G({ x: mx, y: my, s: ne }, circle(0, 0, 21, { fill: C.card, stroke: C.coral, sw: 3 }), T('≠', 0, 11, { font: 'serif', size: 34, weight: 700, fill: C.coral, anchor: 'middle' })));
        }
        // a pulse travels along each matched thread
        const matched = lit >= 1 && (brk <= 0 || redraw >= 1);
        if (matched) {
          const base = redraw >= 1 ? fxT + 0.9 : M.land[i];
          const ph = ((t - base) * 0.62 + 0.999) % 1;
          const [qx, qy] = sCurvePt(MATCH_TX1, wy, MATCH_TX2, y, ph);
          const po = Math.sin(ph * Math.PI);
          out.push(circle(qx, qy, 16, { fill: 'url(#gGlow)', o: 0.8 * po }), circle(qx, qy, 4.5, { fill: C.gold, o: po }));
        }
      }
    });
    // the modification loop
    const lp = P(t, M.md + 0.05, 0.5, 'outBack');
    if (lp > 0) {
      const lx = 855, ly = 948;
      out.push(G({ x: lx, y: ly, s: 0.66 * lp, o: clamp(lp * 2) }, loopArrows(t, { r: 44, color: C.goldDeep, spin: Math.max(0, t - M.md) * 150 })));
      out.push(G({ o: clamp(lp * 2), y: (1 - clamp(lp)) * 8 }, T('modification', lx + 48, ly + 14, { font: 'hand', size: 46, weight: 700, fill: C.goldDeep })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const M = matchTimes(S);
    return [
      { t: S.start + 0.1, type: 'whoosh', dur: 0.5, gain: 0.4 },
      { t: S.start + 0.3, type: 'pop', pitch: 0.9, gain: 0.4 }, { t: S.start + 0.66, type: 'pop', pitch: 1.1, gain: 0.4 },
      { t: M.mt - 0.1, type: 'scribble', dur: 0.5, gain: 0.4 }, { t: M.draw[0], type: 'whoosh', dur: 1.2, gain: 0.3 },
      ...M.land.map((x, i) => ({ t: x - 0.05, type: 'pluck', note: [0, 2, 4, 7][i], gain: 0.55 })),
      { t: M.change[3], type: 'pop', pitch: 1.2, gain: 0.55 }, { t: M.change[1] - 0.25, type: 'swish', dur: 0.5, gain: 0.45 },
      { t: M.change[2] - 0.1, type: 'rise', dur: 0.5, gain: 0.35 }, { t: M.ch + 0.45, type: 'fizzle', gain: 0.45 },
      ...[1, 2, 3].map(i => ({ t: M.fix[i], type: 'typing', dur: 0.45, gain: 0.45 })),
      { t: M.md + 0.05, type: 'whoosh', dur: 0.5, gain: 0.3 },
      { t: M.fix[3] + 0.9, type: 'chime', note: 3, gain: 0.6 },
    ];
  },
};

})();
