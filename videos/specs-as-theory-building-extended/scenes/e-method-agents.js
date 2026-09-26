// Scenes: method, status, agents, enterprise (chapters 7 "Method and the programmer" and 8 "Specs, in the age of agents").
// Wrapped in an IIFE so helpers stay local to this file. Timing comes only from cues, lines and scene bounds.
'use strict';
(() => {

// ================================================================== local helpers
const GREY = '#A9ADB3';
// serif headline centred on the stage
const headline = (segs, o = {}) => richText(segs, o.x ?? 960, o.y ?? 150, { font: 'serif', size: o.size ?? 58, weight: 600, anchor: 'middle' });
// hand-lettered label (centred by default)
const hand = (s, x, y, o = {}) => T(s, x, y, { font: 'hand', size: 46, weight: 700, anchor: 'middle', fill: C.ink2, ...o });
// letter-spaced section label
const section = (s, x = 960, y = 150, o = {}) => T(s, x, y, { size: 28, weight: 800, fill: C.ink2, anchor: 'middle', ls: 7, ...o });
// start time of the nth occurrence of a word in line li; fb keeps the scene working if the script changes
function wordAt(S, li, word, fb, nth = 0) {
  const L = S.line(li);
  const ws = L ? L.words.filter(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '') === word) : [];
  return ws[nth] ? ws[nth].start : fb;
}
// typewriter text that grows from the left edge of its final, centred position
function typeCentered(str, p, x, y, o = {}) {
  const w = measure(str, o.size ?? 32, o.font ?? 'sans', o.weight ?? 400, o.italic);
  return typeText(str, p, x - w / 2, y, { ...o, anchor: 'start' });
}
// open arrowhead at (x, y) pointing along angle a (radians)
const arrowHead = (x, y, a, s = 12, o = {}) => path(`M${r2(x - Math.cos(a - 0.55) * s)} ${r2(y - Math.sin(a - 0.55) * s)} L${r2(x)} ${r2(y)} L${r2(x - Math.cos(a + 0.55) * s)} ${r2(y - Math.sin(a + 0.55) * s)}`, { stroke: o.color ?? C.ink2, sw: o.sw ?? 4 });
// teal success badge with a tick (p 0…1)
function tickBadge(p, r = 26) {
  if (p <= 0) return '';
  return G({ s: lerp(0.4, 1, Ease.outBack(clamp(p * 1.3))), o: clamp(p * 3) },
    circle(0, 0, r, { fill: C.teal }), G({ s: r / 34 }, checkMark(clamp(p * 1.6 - 0.3), { color: C.card, sw: 8 })));
}
// a small yellow pencil whose tip sits at the origin
const pencil = () => G({ r: 34 }, rect(-6.5, -66, 13, 52, { rx: 2, fill: C.mustard }), rect(-6.5, -74, 13, 9, { rx: 2, fill: C.coralLight }),
  path('M-6.5 -14 L6.5 -14 L0 2 Z', { fill: '#E9D4AE' }), path('M-2.2 -4 L2.2 -4 L0 2 Z', { fill: C.ink }));
// dust puffs for a landing at (x, y), p 0…1
function puffs(x, y, p) {
  if (p <= 0 || p >= 1) return '';
  return [-1, 1].map(d => [0, 1].map(k => circle(x + d * (40 + 60 * p + k * 26), y - 10 - k * 8 - 14 * p, 12 + 10 * p - k * 4, { fill: C.paper3, o: 0.8 * (1 - p) }))).flat().join('');
}

// ================================================================== METHOD
// A flowchart titled METHOD (four numbered boxes) meets a theory with no inherent parts or order:
// the boxes' number badges fly onto the theory's nodes and can't stick.
const MB = { xs: [-465, -155, 155, 465], y: 45, w: 250, h: 210 };
const M_LAB = ['steps', 'order', 'notations', 'documents'];
function methodGlyph(i) {
  const c = C.blue;
  if (i === 0) return path('M-50 36 L-50 16 L-24 16 L-24 -4 L2 -4 L2 -24 L28 -24 L28 -44 L52 -44', { stroke: c, sw: 7 });
  if (i === 1) return [0, 1, 2].map(k => rect(-50, -38 + k * 27, 40 + k * 30, 16, { rx: 8, fill: c, o: 0.55 + k * 0.2 })).join('');
  if (i === 2) return [rect(-56, -18, 38, 36, { rx: 6, stroke: c, sw: 5 }), line(-14, 0, 4, 0, { stroke: c, sw: 4 }), arrowHead(6, 0, 0, 9, { color: c, sw: 4 }),
    path('M30 -24 L52 0 L30 24 L8 0 Z', { stroke: c, sw: 5 })].join('');
  return G({ x: -14, y: 6, r: -8, s: 0.34 }, docCard({ w: 200, h: 240, seed: 91, lines: 5 })) + G({ x: 14, y: -4, r: 6, s: 0.34 }, docCard({ w: 200, h: 240, seed: 92, lines: 5 }));
}
// st: { boxIn[4], arrow[3], lab[4], rules, hl[4], badge[4] }
function methodChart(t, st) {
  const out = [shadowCard(-650, -215, 1300, 430, { rx: 24 })];
  out.push(T('METHOD', -606, -146, { size: 36, weight: 800, fill: C.blue, ls: 8 }));
  MB.xs.forEach((bx, i) => {
    if (i < 3 && st.arrow[i] > 0) {
      const x1 = bx + MB.w / 2 + 8, x2 = MB.xs[i + 1] - MB.w / 2 - 8;
      out.push(drawPath(`M${x1} ${MB.y} L${x2} ${MB.y}`, st.arrow[i], { stroke: C.blue, sw: 5 }));
      if (st.arrow[i] > 0.8) out.push(arrowHead(x2, MB.y, 0, 12, { color: C.blue, sw: 5 }));
    }
    const p = st.boxIn[i];
    if (p <= 0) return;
    const hl = st.hl[i];
    const box = [rect(-MB.w / 2, -MB.h / 2, MB.w, MB.h, { rx: 18, fill: mixColor(C.card, C.sky, 0.25 + 0.75 * hl), stroke: C.blue, sw: 3.5 + 1.5 * hl })];
    const lp = st.lab[i];
    if (lp > 0) {
      box.push(G({ y: -24, s: lerp(0.5, 1, Ease.outBack(clamp(lp * 1.6))), o: clamp(lp * 3) }, methodGlyph(i)));
      box.push(typeCentered(M_LAB[i], lp, 0, 78, { size: 36, weight: 700, fill: C.ink }));
    }
    if (st.badge[i]) box.push(G({ y: -MB.h / 2 - 5 * hl }, badge(i + 1, { r: 26, fill: C.blue })));
    out.push(G({ x: bx, y: MB.y, s: lerp(0.6, 1, Ease.outBack(clamp(p))), o: clamp(p * 2) }, box));
  });
  return out.join('');
}
function methodTimes(S) {
  const m0 = S.cue('method'), wr = S.cue('workrules'), no = S.cue('noorder'), nr = S.cue('noright'), ed = S.cue('educate');
  const words = [wordAt(S, 0, 'steps', wr + 1.5), wordAt(S, 0, 'order', wr + 2.1), wordAt(S, 0, 'notations', wr + 2.4), wordAt(S, 0, 'documents', wr + 3.1)];
  const l1 = S.line(1) ? S.line(1).start : no - 0.75;          // "But a theory…"
  const though = wordAt(S, 1, 'though', ed - 0.5);
  return { m0, wr, no, nr, ed, words, l1, though, launch: i => no - 0.7 + i * 0.16, slip: i => no + 0.95 + i * 0.13 };
}
SCENES.method = {
  render(t, S) {
    const { m0, wr, no, nr, ed, words, l1, though, launch, slip } = methodTimes(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // headline
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Can a ' }, { t: 'method', fill: C.blue }, { t: ' stand in for the ' }, { t: 'theory', fill: C.goldDeep }, { t: '?' }])));
    // the method chart: centred, then it moves aside for the theory
    const mv = P(t, l1 - 0.6, 0.8, 'inOut');
    const cx = lerp(960, 500, mv), cy = lerp(540, 480, mv), cs = lerp(1, 0.62, mv);
    const fold = P(t, though - 0.15, 0.45, 'inOut');
    const stampP = P(t, nr - 0.15, 0.35);
    const eC = enter(t, S.start + 0.1, { d: 0.6, dy: 30 });
    // a pulse runs through the boxes in order: once while they wait for labels, then again once labelled
    const run = (a, b) => [0, 1, 2, 3].map(i => (t > a && t < b + 0.6 ? clamp(1 - Math.abs(((t - a) * 2.6 % 5.5) - i - 0.5) * 1.4) * (1 - P(t, b, 0.3)) : 0));
    const hA = run(m0 + 0.55, wr - 0.25), hB = run(words[3] + 0.3, launch(0) - 0.3);
    const hl = hA.map((v, i) => Math.max(v, hB[i]));
    const st = {
      boxIn: [0, 1, 2, 3].map(i => P(t, m0 - 0.3 + i * 0.14, 0.5, 'linear')),
      arrow: [0, 1, 2].map(i => P(t, m0 - 0.05 + i * 0.14, 0.35, 'inOut')),
      lab: words.map(w => P(t, w - 0.25, 0.4, 'linear')),
      hl,
      badge: [0, 1, 2, 3].map(i => t < launch(i)),
    };
    const shake = t > nr - 0.05 ? 8 * Math.exp(-(t - nr + 0.05) * 9) * Math.sin((t - nr) * 55) : 0;   // the stamp's impact
    if (fold < 1) out.push(G({ x: cx + shake, y: cy + eC.y, sx: cs * eC.s * lerp(1, 0.1, fold), sy: cs * eC.s, o: eC.o * (1 - 0.35 * stampP) * (1 - fold) }, methodChart(t, st)));
    // "a set of work rules", under the chart until it moves aside
    const eW = enter(t, wr - 0.25, { dy: 10 });
    if (eW.o > 0) out.push(G({ o: eW.o * (1 - P(t, l1 - 0.7, 0.35)), y: eW.y }, hand('a set of work rules', 960, 850, { size: 54, fill: C.ink2 }),
      underline(960 - 190, 872, 380, P(t, wr + 0.1, 0.5, 'inOut'), { color: C.blue, sw: 5 })));
    // the theory: a night orb with a slowly turning constellation
    const OX = 1400, OY = 540, OR = 280;
    const Kc = once('method_K', () => makeConstellation(29, 14, { rx: 200, ry: 185, minD: 80, extra: 0.4 }));
    const targets = once('method_targets', () => [[-120, -110], [110, -95], [-105, 100], [120, 105]].map(([ax, ay]) =>
      Kc.pts.reduce((bi, p, i) => (Math.hypot(p[0] - ax, p[1] - ay) < Math.hypot(Kc.pts[bi][0] - ax, Kc.pts[bi][1] - ay) ? i : bi), 0)));
    const rot = 5 * Math.sin((t - S.start) * 0.45);
    const nodePage = i => {
      const a = rot * Math.PI / 180, [x, y] = Kc.pts[i];
      return [OX + x * Math.cos(a) - y * Math.sin(a), OY + x * Math.sin(a) + y * Math.cos(a)];
    };
    const eO = enter(t, l1 - 0.1, { d: 0.55, from: 0.8, dy: 20 });
    if (eO.o > 0) {
      const glowUp = 1 + 0.3 * P(t, no + 1.6, 0.8);
      out.push(G({ x: OX, y: OY + eO.y, s: eO.s, o: eO.o }, [
        circle(0, 0, OR * 1.3, { fill: 'url(#gGlow)', o: 0.38 * glowUp }),
        circle(0, 0, OR, { fill: 'url(#gNight)' }),
        circle(0, 0, OR, { stroke: C.goldDeep, sw: 3, o: 0.3 }),
        G({ r: rot }, constellation(t, Kc, { t0: l1 - 0.05, dur: 0.6, size: 8, lineW: 2.8, glow: glowUp })),
      ]));
      const eL = enter(t, no - 0.2, { dy: 10 });
      if (eL.o > 0) out.push(G({ o: eL.o * (1 - P(t, nr - 0.4, 0.4)), y: eL.y }, hand('no inherent parts or order', OX, OY + OR + 78, { fill: C.goldDeep, size: 50 })));
    }
    // the number badges fly onto the theory's nodes, and slide off
    [0, 1, 2, 3].forEach(i => {
      const L = launch(i);
      if (t < L) return;
      const fp = P(t, L, 0.6, 'inOut');
      const sx = cx + MB.xs[i] * cs, sy = cy + (MB.y - MB.h / 2) * cs;
      const [tx, ty] = nodePage(targets[i]);
      let [bx, by] = quadPoint(sx, sy, tx, ty, -0.28, fp);
      const land = L + 0.6, s0 = slip(i), dir = i % 2 ? 1 : -1;
      const jig = t > land ? 14 * Math.sin((t - land) * 16) * Math.exp(-(t - land) * 3) : 0;
      const sl = P(t, s0 - 0.3, 0.3, 'inOut'), fall = P(t, s0, 0.9, 'in');
      bx += dir * (18 * sl + 80 * fall); by += 10 * sl + 420 * fall;
      const bo = 1 - P(t, s0 + 0.35, 0.35);
      const ring = P(t, land, 0.5);
      if (ring > 0 && ring < 1) out.push(circle(tx, ty, 14 + 30 * ring, { stroke: C.goldLight, sw: 3, o: 1 - ring }));
      out.push(G({ x: bx, y: by, r: lerp(-25, 0, fp) + jig + dir * (25 * sl + 170 * fall), s: lerp(cs, 1, fp), o: bo }, badge(i + 1, { r: 26, fill: C.blue })));
    });
    // no right method
    if (stampP > 0) out.push(G({ x: cx, y: cy, o: 1 - fold }, stamp('NO RIGHT METHOD', stampP, { size: 40, rot: -8 })));
    // the chart folds into a textbook, which a student reads
    const bookIn = P(t, though + 0.05, 0.45, 'outBack');
    const toHands = P(t, ed - 0.4, 0.6, 'inOut');
    const stX = 450, stY = 915, stS = 1.05;
    const eSt = enter(t, though - 0.2, { d: 0.6, dy: 0 });
    if (eSt.o > 0) {
      const walkX = lerp(-120, 0, P(t, though - 0.2, 0.8, 'out'));
      const bob = t < though + 0.45 ? -Math.abs(Math.sin((t - though) * 9)) * 7 : 0;
      const q = toHands;
      const arms = [[lerp(-52, -80, q), lerp(-108, -104, q)], [lerp(52, 80, q), lerp(-108, -104, q)]];
      out.push(G({ x: stX + walkX, y: stY + bob, s: stS, o: eSt.o }, person(t, { shirt: C.olive, skin: C.skin[4], hair: C.hair[2], hairStyle: 1, seed: 31, mood: 'happy', look: q > 0.5 ? 0 : 0.5, arms })));
    }
    if (bookIn > 0) {
      const bx = lerp(cx, stX, toHands), by = lerp(cy, stY - 112 * stS, toHands);
      const bob = toHands >= 1 ? Math.sin((t - ed) * 2.2) * 2 : 0;
      out.push(G({ x: bx, y: by + bob, s: lerp(0.3, 1, bookIn), r: lerp(-10, -3, toHands), o: clamp(bookIn * 3) }, book({ title: 'METHODS', w: 170, h: 212, color: C.blue, size: 22 })));
    }
    const eE = enter(t, ed - 0.1, { dy: 10 });
    if (eE.o > 0) out.push(G({ o: eE.o, y: eE.y }, hand('useful as education', 820, 770, { fill: C.tealDark, size: 52 }), G({ x: 820, y: 832 }, tickBadge(P(t, ed + 0.2, 0.5)))));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const { m0, wr, no, nr, ed, words, l1, though, launch, slip } = methodTimes(S);
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.45, gain: 0.4 },
      ...[0, 1, 2, 3].map(i => ({ t: m0 - 0.3 + i * 0.14, type: 'pop', pitch: 0.85 + i * 0.1, gain: 0.45 })),
      { t: wr - 0.2, type: 'scribble', dur: 0.45, gain: 0.4 },
      ...words.map((w, i) => ({ t: w - 0.25, type: 'pluck', note: [0, 2, 4, 7][i], gain: 0.6 })),
      { t: l1 - 0.6, type: 'whoosh', dur: 0.8, gain: 0.5 }, { t: l1 - 0.1, type: 'chime', note: 2, gain: 0.6 },
      ...[0, 1, 2, 3].map(i => ({ t: launch(i) + 0.6, type: 'tick', gain: 0.5, pitch: 1 + i * 0.08 })),
      { t: slip(0), type: 'fizzle', gain: 0.45 },
      { t: nr - 0.15, type: 'thud', gain: 0.8 },
      { t: though - 0.15, type: 'swish', dur: 0.4, gain: 0.5 }, { t: though - 0.2, type: 'steps', dur: 0.7, gain: 0.35 },
      { t: ed + 0.2, type: 'pluck', note: 7, gain: 0.6 },
    ];
  },
};

// ================================================================== STATUS
// Replaceable parts on a production line (no) → a responsible, permanent developer of the activity →
// the same standing as engineers and lawyers.
const STATUS_DRONE = { shirt: GREY, skin: '#D6D9DD', hair: '#8B9097', hairStyle: 0, pants: '#80858D', mood: 'closed', seed: 2 };
function hardHat() {
  return [path('M-40 -268 Q-38 -310 0 -312 Q38 -310 40 -268 Z', { fill: C.mustard }), rect(-6, -310, 12, 40, { rx: 5, fill: 'rgba(0,0,0,0.10)' }),
    rect(-52, -273, 104, 12, { rx: 6, fill: '#D9A93C' })].join('');
}
function briefcase() {
  return [path('M-13 -24 L-13 -36 L13 -36 L13 -24', { stroke: '#6B4428', sw: 6 }), rect(-36, -26, 72, 52, { rx: 7, fill: '#8B5E3C' }),
    rect(-36, -6, 72, 5, { fill: 'rgba(0,0,0,0.18)' }), rect(-6, -10, 12, 12, { rx: 2, fill: C.mustard })].join('');
}
function blueprint() {
  return G({ r: -28 }, rect(-16, -70, 32, 140, { rx: 16, fill: C.blueLight, stroke: C.blue, sw: 3 }), ellipse(0, -70, 16, 7, { fill: C.card, stroke: C.blue, sw: 2.5 }));
}
function monitorIcon(t) {
  const bars = [0, 1, 2].map(k => rect(-40, -34 + k * 18, 30 + ((k * 29 + Math.floor(t * 3)) % 44), 8, { rx: 4, fill: [C.plumLight, C.tealLight, C.goldLight][k] }));
  return [rect(-62, -54, 124, 88, { rx: 9, fill: '#3A4458' }), rect(-54, -46, 108, 72, { rx: 4, fill: C.night }), ...bars,
    rect(-9, 34, 18, 16, { fill: '#6B7486' }), rect(-34, 48, 68, 9, { rx: 4.5, fill: '#6B7486' })].join('');
}
function statusTimes(S) {
  const cmp = S.cue('components'), resp = S.cue('responsible'), sd = S.cue('standing');
  return {
    cmp, resp, sd,
    wLine: wordAt(S, 0, 'line', cmp + 1.7), wAct: wordAt(S, 0, 'activity', resp + 2.3), wComp: wordAt(S, 0, 'computer', resp + 3.0),
    wEng: wordAt(S, 0, 'engineers', sd + 0.7), wLaw: wordAt(S, 0, 'engineers', sd + 0.7) + 0.4,   // the lawyer lands just after the engineer: "lawyers" comes too close to the scene end
    swaps: [cmp - 0.35, cmp + 0.3, cmp + 0.95],
  };
}
SCENES.status = {
  render(t, S) {
    const { cmp, resp, sd, wLine, wAct, wComp, wEng, wLaw, swaps } = statusTimes(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 12 });
    out.push(G({ o: eH.o, y: eH.y }, section('THE PROGRAMMER’S STATUS')));
    // ---- phase A: a production line of identical, swappable figures
    const pA = exitAt(t, resp - 0.45, 0.4);
    if (pA.o > 0) {
      const A = [];
      const eB = enter(t, S.start + 0.02, { dy: 30, d: 0.6 });
      const run = t - S.start, v = 85, span = 1600, x0 = 160;
      const beltY = 800, fs = 0.76;
      // conveyor: legs, belt, rollers, moving stripes
      [300, 700, 1220, 1620].forEach(lx => A.push(rect(lx - 9, beltY + 26, 18, 96, { rx: 5, fill: C.ink3 })));
      A.push(rect(x0 - 20, beltY, span + 40, 30, { rx: 15, fill: C.ink2 }));
      for (let k = 0; k < 14; k++) {
        const sx = x0 + ((k * 120 + v * run) % span);
        A.push(line(sx, beltY + 9, sx + 26, beltY + 9, { stroke: C.ink3, sw: 3, o: 0.8 }));
      }
      for (let k = 0; k <= 12; k++) {
        const rx = x0 + k * (span / 12), a = run * v / 14;
        A.push(circle(rx, beltY + 15, 11, { fill: C.ink3 }), line(rx - Math.cos(a) * 9, beltY + 15 - Math.sin(a) * 9, rx + Math.cos(a) * 9, beltY + 15 + Math.sin(a) * 9, { stroke: C.ink2, sw: 3 }));
      }
      // identical figures ride the belt; three get swapped out for copies
      const N = 7, sp = span / N;
      const posAt = (i, tt) => x0 + ((i * sp + v * (tt - S.start)) % span);
      const swapped = swaps.map((ts, k) => {
        const tx = [620, 1300, 960][k];
        let best = 0;
        for (let i = 1; i < N; i++) if (Math.abs(posAt(i, ts) - tx) < Math.abs(posAt(best, ts) - tx)) best = i;
        return best;
      });
      for (let i = 0; i < N; i++) {
        const x = posAt(i, t), edge = clamp((x - x0) / 70) * clamp((x0 + span - x) / 70);
        let dy = 0, fo = 1;
        swapped.forEach((j, k) => {
          if (j !== i || t < swaps[k]) return;
          const ts = swaps[k];
          const outP = P(t, ts, 0.5, 'in');
          if (outP < 1) A.push(G({ x: x + 60 * outP, y: beltY - 260 * outP, s: fs, r: 30 * outP, o: edge * (1 - outP) }, person(t, STATUS_DRONE)));
          const inP = P(t, ts + 0.35, 0.5, 'outBack');
          dy += lerp(-300, 0, inP); fo *= clamp(P(t, ts + 0.35, 0.2) * 1.2);
          // a swap sign over the slot
          const sg = P(t, ts - 0.1, 0.3, 'outBack') * (1 - P(t, ts + 0.8, 0.3));
          if (sg > 0) A.push(G({ x: x + 70, y: beltY - 300, s: sg, o: clamp(sg * 2) * edge }, circle(0, 0, 44, { fill: C.card, stroke: C.faint, sw: 2 }), loopArrows(t, { r: 26, color: C.ink2, spin: (t - ts) * 220 })));
        });
        if (fo > 0) A.push(G({ x, y: beltY + dy, s: fs, o: edge * fo }, person(t, STATUS_DRONE)));
      }
      const eL = enter(t, cmp - 0.15, { dy: 12 });
      if (eL.o > 0) {
        const lx = 960, ly = 380;
        const w = measure('replaceable component?', 58, 'hand', 700);
        A.push(G({ o: eL.o, y: eL.y }, hand('replaceable component?', lx, ly, { size: 58, fill: C.ink })));
        A.push(drawPath(`M${lx - w / 2 - 14} ${ly - 14} C${lx - w / 6} ${ly - 26} ${lx + w / 6} ${ly - 4} ${lx + w / 2 + 16} ${ly - 20}`, P(t, wLine - 0.3, 0.4, 'inOut'), { stroke: C.coral, sw: 8 }));
      }
      out.push(G({ o: pA.o * eB.o, y: pA.y + eB.y }, A));
    }
    // ---- phase B: one responsible, permanent developer at the heart of the activity
    const mvC = P(t, sd - 0.7, 0.8, 'inOut');                  // the programmer moves into the line-up
    const eP = enter(t, resp - 0.35, { d: 0.6 });
    const pB = exitAt(t, sd - 0.65, 0.4);
    const ringP = enter(t, wAct - 0.45, { d: 0.6 });
    const RX = 960, RY = 585, RA = 650, RB = 285;
    if (ringP.o * pB.o > 0) {
      const B = [];
      const drift = 0.035 * (t - wAct);
      // the activity: a dashed teal ring (ellipse() has no dash option, so write the element directly)
      B.push(`<ellipse cx="${RX}" cy="${RY}" rx="${RA}" ry="${RB}" fill="none" stroke="${C.teal}" stroke-width="3.5" stroke-dasharray="14 12" opacity="0.75"/>`);
      const items = [
        { a: 180, f: () => monitorIcon(t), comp: true },
        { a: 216, f: () => G({ s: 0.72 }, iconBank()) },
        { a: 324, f: () => G({ s: 0.72 }, iconPolicy()) },
        { a: 0, f: () => G({ s: 0.8 }, iconBust({ skin: C.skin[3], hair: C.hair[3] })) },
        { a: 36, f: () => G({ s: 0.72 }, iconGears(t)) },
        { a: 144, f: () => G({ s: 0.8 }, iconBust({ color: C.coral, skin: C.skin[0], hair: C.hair[2] })) },
      ];
      items.forEach((it, k) => {
        const a = (it.a * Math.PI) / 180 + drift;
        const ix = RX + Math.cos(a) * RA, iy = RY + Math.sin(a) * RB;
        const e = enter(t, wAct - 0.4 + k * 0.1, { d: 0.5 });
        if (e.o <= 0) return;
        const thr = P(t, wAct + 0.1 + k * 0.1, 0.6, 'inOut');
        B.push(drawPath(arcPath(RX, 560, ix, iy, k % 2 ? 0.12 : -0.12), thr, { stroke: C.goldDeep, sw: 2.5, o: 0.75 }));
        const ps = it.comp ? pulse(t, wComp - 0.15, 0.6, 0.18) : 1;
        B.push(G({ x: ix, y: iy + e.y, s: e.s * ps, o: e.o }, circle(0, 0, 70, { fill: C.card, stroke: it.comp ? C.teal : C.faint, sw: it.comp ? 4 : 2 }), it.f()));
      });
      out.push(G({ o: ringP.o * pB.o }, B));
    }
    if (eP.o > 0) {
      const px = lerp(960, 1390, mvC), py = lerp(800, 820, mvC), ps = lerp(1.1, 1.3, mvC);
      const glow = 0.5 + 0.15 * Math.sin(t * 3);
      out.push(G({ o: eP.o * (1 - mvC) }, circle(px, py - 200, 190, { fill: 'url(#gGlow)', o: glow })));
      const lap = P(t, sd - 0.3, 0.4);
      const arms = lap > 0 ? [[-44, -120], [44, -120]] : 'down';
      out.push(G({ x: px, y: py + eP.y, s: ps * eP.s, o: eP.o }, holder(t, {
        shirt: C.teal, skin: C.skin[2], hair: C.hair[1], hairStyle: 2, seed: 9, mood: 'happy', arms, glowHead: 0.8 * (1 - mvC),
        bubble: P(t, resp - 0.1, 0.6) * (1 - mvC), theory: { seed: 21, n: 10, w: 250, h: 170, t0: resp + 0.05, dur: 1.2 },
      }), lap > 0 ? G({ y: -112, s: 0.55, o: lap }, laptopFront(t, { w: 150, h: 96, inner: [0, 1, 2].map(k => rect(-50, -80 + k * 16, 28 + ((k * 31 + Math.floor(t * 6)) % 50), 7, { rx: 3.5, fill: [C.plumLight, C.tealLight, C.goldLight][k] })).join('') })) : ''));
      const eR = enter(t, resp + 0.35, { dy: 10 });
      if (eR.o > 0) out.push(G({ o: eR.o * pB.o, y: eR.y }, hand('responsible, permanent developer', 960, 965, { fill: C.goldDeep, size: 50 })));
    }
    // ---- phase C: the same standing as engineers and lawyers
    const plin = enter(t, sd - 0.35, { dy: 20 });
    if (plin.o > 0) {
      const Cc = [];
      Cc.push(G({ x: 960, y: 820 }, rect(-680 + 3, 8, 1360, 66, { rx: 12, fill: 'rgba(30,42,58,0.10)' }), rect(-680, 0, 1360, 66, { rx: 12, fill: C.card, stroke: C.faint, sw: 2 }),
        ...[['ENGINEER', -430], ['LAWYER', 0], ['PROGRAMMER', 430]].map(([s, x]) => T(s, x, 43, { size: 24, weight: 800, fill: C.ink2, anchor: 'middle', ls: 4 }))));
      out.push(G({ o: plin.o, y: plin.y }, Cc));
      const eE = enter(t, wEng - 0.35, { d: 0.5 });
      if (eE.o > 0) out.push(G({ x: 530, y: 820 + eE.y, s: 1.3 * eE.s, o: eE.o }, person(t, { shirt: C.mustard, skin: C.skin[1], hair: C.hair[0], hairStyle: 0, seed: 14, mood: 'happy', arms: [[-52, -108], [30, -140]], look: 0.3 }),
        G({ x: 34, y: -128 }, blueprint()), hardHat()));
      const eW = enter(t, wLaw - 0.35, { d: 0.5 });
      if (eW.o > 0) out.push(G({ x: 960, y: 820 + eW.y, s: 1.3 * eW.s, o: eW.o }, person(t, { shirt: C.ink, skin: C.skin[3], hair: C.hair[3], hairStyle: 4, seed: 16, mood: 'happy', look: 0.2 }),
        path('M-14 -208 L0 -186 L14 -208 Z', { fill: C.card }), path('M-5 -200 L5 -200 L3 -192 L7 -158 L0 -150 L-7 -158 L-3 -192 Z', { fill: C.coral }),
        G({ x: 58, y: -84 }, briefcase())));
      [[745, wLaw + 0.15], [1175, wLaw + 0.3]].forEach(([ex, et]) => {
        const p = P(t, et, 0.45, 'outBack');
        if (p > 0) out.push(G({ x: ex, y: 610, s: p, o: clamp(p * 2) }, circle(0, 0, 32, { fill: C.card, stroke: C.goldDeep, sw: 3.5 }), T('=', 0, 14, { size: 42, weight: 800, fill: C.goldDeep, anchor: 'middle' })));
      });
      const eS = enter(t, sd - 0.15, { dy: 10 });
      if (eS.o > 0) out.push(G({ o: eS.o, y: eS.y }, hand('the same standing', 960, 972, { fill: C.goldDeep, size: 54 })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const { cmp, resp, sd, wLine, wAct, wComp, wEng, wLaw, swaps } = statusTimes(S);
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.5, gain: 0.4 },
      ...swaps.flatMap(ts => [{ t: ts, type: 'pop', pitch: 1.3, gain: 0.4 }, { t: ts + 0.45, type: 'thud', gain: 0.35 }]),
      { t: cmp - 0.15, type: 'pop', pitch: 0.9, gain: 0.5 }, { t: wLine - 0.3, type: 'scribble', dur: 0.4, gain: 0.55 },
      { t: resp - 0.45, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: resp - 0.1, type: 'chime', note: 3, gain: 0.6 },
      ...[0, 2, 4].map((k, i) => ({ t: wAct - 0.4 + k * 0.1, type: 'pluck', note: [0, 2, 4][i], gain: 0.45 })),
      { t: wComp - 0.15, type: 'tick', gain: 0.5 },
      { t: sd - 0.7, type: 'whoosh', dur: 0.7, gain: 0.45 }, { t: sd - 0.3, type: 'thud', gain: 0.5 },
      { t: wEng - 0.35, type: 'pop', pitch: 0.9, gain: 0.5 }, { t: wLaw - 0.35, type: 'pop', pitch: 1.05, gain: 0.5 },
      { t: wLaw + 0.2, type: 'chime', note: 5, gain: 0.6 },
    ];
  },
};

// ================================================================== AGENTS
// Phase 1: text is nearly free, the cost moves to specifying. Phase 2: an agent dropped into a codebase attempts
// revival; its picture differs from the original. Phase 3: the PM writes the spec, the agent gets it, the PM keeps the theory.
const MZ = { cols: 10, rows: 7, cell: 72, x: 170, y: 380 };
const MZ_ROBOT = [MZ.x + 5.5 * MZ.cell, MZ.y + 3.5 * MZ.cell];     // centre of the drop cell
// a perfect maze whose walls are drawn as runs of coloured code tokens
function agentsMaze() {
  return once('agents_maze', () => {
    const { cols, rows, cell } = MZ, R = rng(314);
    const id = (c, r) => r * cols + c;
    const open = new Set(), seen = new Array(cols * rows).fill(false);
    const stack = [[5, 3]];
    seen[id(5, 3)] = true;
    while (stack.length) {
      const [c, r] = stack[stack.length - 1];
      const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows && !seen[id(x, y)]);
      if (!nb.length) { stack.pop(); continue; }
      const [nc, nr] = nb[Math.floor(R() * nb.length)];
      open.add(Math.min(id(c, r), id(nc, nr)) + '_' + Math.max(id(c, r), id(nc, nr)));
      seen[id(nc, nr)] = true;
      stack.push([nc, nr]);
    }
    const isOpen = (a, b) => open.has(Math.min(a, b) + '_' + Math.max(a, b));
    const segs = [];
    // horizontal walls (including top and bottom borders)
    for (let r = 0; r <= rows; r++) {
      let run = null;
      for (let c = 0; c <= cols; c++) {
        const wall = c < cols && (r === 0 || r === rows || !isOpen(id(c, r - 1), id(c, r)));
        if (wall && !run) run = [c, c + 1]; else if (wall) run[1] = c + 1;
        else if (run) { segs.push([run[0] * cell, r * cell, run[1] * cell, r * cell]); run = null; }
      }
    }
    for (let c = 0; c <= cols; c++) {
      let run = null;
      for (let r = 0; r <= rows; r++) {
        const wall = r < rows && (c === 0 || c === cols || !isOpen(id(c - 1, r), id(c, r)));
        if (wall && !run) run = [r, r + 1]; else if (wall) run[1] = r + 1;
        else if (run) { segs.push([c * cell, run[0] * cell, c * cell, run[1] * cell]); run = null; }
      }
    }
    // split each wall into code tokens
    const toks = [];
    for (const [x1, y1, x2, y2] of segs) {
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      let s = 0;
      while (s < L - 6) {
        const len = Math.min(L - s, 26 + R() * 60);
        const ax = MZ.x + x1 + ux * s, ay = MZ.y + y1 + uy * s, bx = MZ.x + x1 + ux * (s + len), by = MZ.y + y1 + uy * (s + len);
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        toks.push({ ax, ay, bx, by, col: CODE_COLORS[Math.floor(R() * CODE_COLORS.length)], d: Math.hypot(mx - MZ_ROBOT[0], my - MZ_ROBOT[1]), ang: Math.atan2(my - MZ_ROBOT[1], mx - MZ_ROBOT[0]) });
        s += len + 8;
      }
    }
    return toks;
  });
}
function agentsTimes(S) {
  const c = n => S.cue(n);
  const l1 = S.line(1) ? S.line(1).start : c('dropped') - 0.5, l2 = S.line(2) ? S.line(2).start : c('handoff') - 0.75;
  return {
    ag: c('agents'), free: c('free'), moved: c('moved'), tospec: c('tospec'), dropped: c('dropped'), revival: c('revival'), differs: c('differs'),
    handoff: c('handoff'), tbuild: c('tbuild'), gets: c('getsspec'), keep: c('keep'), l1, l2,
    wOn: wordAt(S, 0, 'on', c('moved') - 1.6), wCost: wordAt(S, 0, 'cost', c('moved') - 0.3), wMoved: wordAt(S, 0, 'moved', c('tospec') - 0.3),
  };
}
const codeScreen = t => [0, 1, 2, 3].map(k => rect(-70, -114 + k * 20, 40 + ((k * 37 + Math.floor(t * 12)) % 90), 8, { rx: 4, fill: [C.plumLight, C.tealLight, C.blueLight, C.goldLight][k], o: 0.9 })).join('');
// the weight that stands for the cost
function costWeight() {
  return [ellipse(0, 52, 70, 9, { fill: 'rgba(30,42,58,0.14)' }), circle(0, -46, 24, { stroke: C.ink, sw: 11 }),
    path('M-66 48 L-48 -34 Q-46 -40 -40 -40 L40 -40 Q46 -40 48 -34 L66 48 Z', { fill: C.ink }),
    T('COST', 0, 20, { size: 30, weight: 800, fill: C.card, anchor: 'middle', ls: 2 })].join('');
}
SCENES.agents = {
  render(t, S) {
    const A = agentsTimes(S);
    const { ag, free, tospec, dropped, revival, differs, handoff, tbuild, gets, keep, l1, wOn, wCost, wMoved } = A;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // ---------------- phase 1: code is nearly free; the cost moves to specifying
    const p1 = exitAt(t, l1 - 0.35, 0.45);
    if (p1.o > 0) {
      const Q = [];
      const ax = 380, ay = 790;
      const eA = enter(t, S.start + 0.02, { d: 0.6 });
      const typing = t > ag - 0.1 && t < ag + 1.9;
      Q.push(G({ x: ax, y: ay + eA.y, o: eA.o, s: eA.s }, G({ y: -40 }, robot(t, { typing: typing ? 1 : 0, look: t > wCost ? 0.9 : 0.4 })),
        G({ y: 70 }, laptopFront(t, { w: 230, h: 140, inner: typing ? codeScreen(t) : '' })), G({ y: 90 }, desk(420))));
      Q.push(G({ o: eA.o }, T('agent', ax, 985, { size: 26, weight: 800, fill: C.plum, anchor: 'middle', ls: 4 })));
      // code streams into a growing stack of cards
      const sx0 = 820, sy0 = 440;
      const cardT = k => ag - 0.05 + k * 0.42;
      const dimCode = 1 - 0.3 * P(t, wCost - 0.3, 0.5);
      const cards = [];
      for (let k = 0; k < 4; k++) {
        const e = P(t, cardT(k), 0.35, 'outBack');
        if (e <= 0) continue;
        cards.push(G({ x: sx0 + k * 18, y: sy0 - k * 16 - (1 - e) * 30, r: -5 + k * 3, s: lerp(0.7, 1, e), o: clamp(e * 2) },
          codeCard({ w: 300, h: 240, seed: 31 + k, reveal: P(t, cardT(k) + 0.05, 0.4, 'linear'), title: k === 3 ? 'generated' : null })));
      }
      Q.push(G({ o: dimCode }, cards));
      if (typing) {
        for (let k = 0; k < 7; k++) {
          const ph = ((t - ag) * 1.7 + k / 7) % 1;
          const cur = clamp(Math.floor((t - ag + 0.05) / 0.42), 0, 3);
          const [px, py] = quadPoint(ax + 20, ay - 150, sx0 + cur * 18 - 90, sy0 - cur * 16 + 20, -0.3, ph);
          Q.push(rect(px - 22, py - 5, 44, 10, { rx: 5, fill: CODE_COLORS[k % CODE_COLORS.length], o: 0.8 * Math.sin(ph * Math.PI) }));
        }
      }
      // $0.00 on the text
      const tagP = P(t, free - 0.15, 0.3);
      if (tagP > 0) {
        const lt = Math.max(0, t - free + 0.15);
        const sw = 28 * Math.exp(-3 * lt) * Math.sin(lt * 9);
        Q.push(G({ x: 1010, y: 268, r: 26 + sw, o: tagP * dimCode }, line(0, 0, -12, 0, { stroke: C.ink2, sw: 2 }), priceTag('$0.00', { w: 160 })));
        const lab = enter(t, free + 0.3, { dy: 10 });
        if (lab.o > 0) Q.push(G({ o: lab.o, y: lab.y }, hand('text ≈ free', 860, 668, { size: 54, fill: C.ink2 })));
      }
      // the specifying station
      const stX = 1480;
      const eSt = enter(t, wOn - 0.2, { d: 0.55 });
      const landT = tospec - 0.12;
      const glowP = P(t, landT - 0.05, 0.5);
      const dip = t > landT ? 7 * Math.exp(-(t - landT) * 6) * Math.cos((t - landT) * 18) : 0;
      if (eSt.o > 0) {
        Q.push(G({ o: eSt.o * glowP }, circle(stX, 700, 330, { fill: 'url(#gGlow)', o: 0.55 + 0.12 * Math.sin(t * 3) })));
        Q.push(G({ x: stX, y: eSt.y + dip, o: eSt.o }, G({ y: 860 }, desk(420)),
          G({ x: 80, y: 712, s: 0.62, r: 3 }, specDoc({ w: 210, h: 270, reveal: 0.35, accent: C.coral })),
          G({ x: 170, y: 836, r: 0 }, pencil())));
        Q.push(G({ o: eSt.o, y: eSt.y, s: 1 }, G({ x: stX, y: 552, s: pulse(t, landT, 0.5, 0.12) }, T('SPECIFYING', 0, 0, { size: 32, weight: 800, fill: C.coral, anchor: 'middle', ls: 6 }))));
      }
      // the cost: it hasn't gone (it drops in), then it moves to specifying
      const drop = P(t, wCost - 0.35, 0.4, 'in');
      if (drop > 0) {
        const hop = P(t, wMoved - 0.5, landT - (wMoved - 0.5), 'inOut');
        const g0 = [880, 832], g1 = [stX - 80, 806 + dip];
        let [wx, wy] = hop > 0 ? quadPoint(g0[0], g0[1], g1[0], g1[1], -0.3, hop) : [g0[0], lerp(-120, g0[1], drop)];
        const squash = t > wCost - 0.05 ? 1 - 0.08 * Math.exp(-(t - wCost + 0.05) * 8) * Math.cos((t - wCost + 0.05) * 20) : 1;
        Q.push(puffs(g0[0], g0[1] + 52, P(t, wCost + 0.05, 0.6)));
        Q.push(puffs(g1[0], g1[1] + 52, P(t, landT, 0.6)));
        Q.push(G({ x: wx, y: wy, r: hop > 0 && hop < 1 ? 14 * Math.sin(hop * Math.PI * 2) : 0, sy: squash, sx: 2 - squash }, costWeight()));
      }
      out.push(G({ o: p1.o, y: p1.y }, Q));
    }
    // ---------------- phase 2: dropped into a codebase; revival; its picture differs
    const e2 = P(t, l1 - 0.1, 0.5);
    const p2 = exitAt(t, handoff - 0.8, 0.45);
    if (e2 * p2.o > 0) {
      const Q = [], M = [];
      const toks = agentsMaze();
      const [rx, ry] = MZ_ROBOT;
      const mzOff = lerp(390, 0, P(t, revival - 1.1, 0.9, 'inOut'));   // centred at first, then aside for the bubble
      const scan0 = dropped + 0.9, scanOn = t > scan0 && t < revival + 0.2 ? P(t, scan0, 0.3) * (1 - P(t, revival - 0.1, 0.3)) : 0;
      const beam = -Math.PI / 2 + (t - scan0) * 2.3;
      const beamD = a => { const d = Math.atan2(Math.sin(a - beam), Math.cos(a - beam)); return Math.abs(d); };
      toks.forEach(k => {
        const rp = P(t, l1 - 0.1 + k.d / 900, 0.35);
        if (rp <= 0) return;
        const lit = scanOn * clamp(1 - beamD(k.ang) / 0.35) * (k.d < 460 ? 1 : 0);
        M.push(line(k.ax, k.ay, lerp(k.ax, k.bx, rp), lerp(k.ay, k.by, rp), { stroke: k.col, sw: 10 + 4 * lit, o: 0.55 + 0.45 * lit }));
      });
      if (scanOn > 0) {
        const L = 470, a1 = beam - 0.3, a2 = beam + 0.3;
        M.push(`<clipPath id="e_agents_mz"><rect x="${MZ.x}" y="${MZ.y}" width="${MZ.cols * MZ.cell}" height="${MZ.rows * MZ.cell}"/></clipPath>`);
        M.push(G({ clip: 'url(#e_agents_mz)' }, path(`M${rx} ${ry - 50} L${r2(rx + Math.cos(a1) * L)} ${r2(ry - 50 + Math.sin(a1) * L)} A${L} ${L} 0 0 1 ${r2(rx + Math.cos(a2) * L)} ${r2(ry - 50 + Math.sin(a2) * L)} Z`, { fill: C.plum, o: 0.2 * scanOn })));
      }
      // a stack of documents beside the maze
      const eD = enter(t, dropped - 0.2, { d: 0.5 });
      if (eD.o > 0) M.push(G({ x: 985, y: 800 + eD.y, o: eD.o }, G({ x: -26, r: -8, s: 0.5 }, docCard({ w: 220, h: 280, seed: 41, title: 'docs' })),
        G({ x: 0, y: -8, r: 3, s: 0.5 }, docCard({ w: 220, h: 280, seed: 42 })), G({ x: 24, y: -14, r: 9, s: 0.5 }, docCard({ w: 220, h: 280, seed: 43, title: 'README' }))));
      // the robot is lowered on a cable
      const low = P(t, dropped - 0.4, 1.1, 'outBack');
      const dy = lerp(-720, 0, low);
      const swing = t > dropped - 0.4 ? 7 * Math.sin((t - dropped) * 4.2) * Math.exp(-Math.max(0, t - dropped) * 1.6) : 0;
      const rs = 0.62, robotBase = ry + 34;
      const cableUp = P(t, dropped + 1.2, 0.6, 'in');
      const antY = robotBase + dy - 228 * rs;
      if (low > 0) {
        M.push(line(rx, lerp(-20, antY - 10, cableUp), rx, antY, { stroke: C.ink2, sw: 3 }));
        const look = scanOn > 0 ? clamp(Math.cos(beam) * 1.2, -1, 1) : t > revival - 0.8 ? 0.9 * P(t, revival - 0.8, 0.4) : 0;
        M.push(G({ x: rx, y: robotBase + dy, r: swing, s: rs }, robot(t, { look })));
      }
      Q.push(G({ x: mzOff }, M));
      // its picture of the system: a rebuilt, different constellation
      const BX = 1375, BY = 470, BW = 600, BH = 420;
      const Ko = once('agents_Korig', () => makeConstellation(85, 12, { rx: 215, ry: 132, minD: 66, extra: 0.4 }));
      const Ka = once('agents_Kagent', () => perturbConstellation(Ko, 5, 44, { drop: 0.3, add: 0.25 }));
      const eB = P(t, revival - 0.75, 0.6, 'outBack');
      if (eB > 0) {
        // a trail of thought dots from the robot's head to the bubble
        [0.12, 0.34, 0.58, 0.8].forEach((q, k) => {
          const [dx, dy2] = quadPoint(rx + mzOff + 52, ry - 104, BX - BW * 0.5 + 6, BY + 60, -0.22, q);
          const dp = P(t, revival - 0.95 + k * 0.08, 0.3, 'outBack');
          if (dp > 0) Q.push(circle(dx + 2, dy2 + 4, (7 + k * 5) * dp, { fill: 'rgba(30,42,58,0.10)' }), circle(dx, dy2, (7 + k * 5) * dp, { fill: C.night }));
        });
        Q.push(G({ x: BX, y: BY, s: lerp(0.3, 1, eB), o: clamp(eB * 2) }, ellipse(3, 8, BW / 2, BH / 2, { fill: 'rgba(30,42,58,0.10)' }), ellipse(0, 0, BW / 2, BH / 2, { fill: C.night }),
          ellipse(0, 0, BW / 2 - 10, BH / 2 - 10, { stroke: C.plum, sw: 2, o: 0.35 })));
        // sparks fly from the scanned code up into the picture
        const nA = Ka.pts.length;
        Ka.pts.forEach((pt, i) => {
          const at = revival - 0.25 + 1.8 * (Ka.rank[i] / Math.max(1, nA - 1));
          const fp = P(t, at - 0.5, 0.5, 'inOut');
          if (fp <= 0 || fp >= 1) return;
          const tk = toks[(i * 37) % toks.length];
          const [qx, qy] = quadPoint((tk.ax + tk.bx) / 2 + mzOff, (tk.ay + tk.by) / 2, BX + pt[0], BY + pt[1], -0.25, fp);
          Q.push(circle(qx, qy, 16, { fill: 'url(#gGlow)', o: 0.7 }), circle(qx, qy, 5, { fill: C.coral }));
        });
        const ghostP = P(t, differs - 0.35, 0.5);
        const inner = [];
        // the rebuilt picture never quite settles: once compared, its nodes drift a little
        const wob = P(t, differs + 0.9, 0.8);
        const Kw = wob > 0 ? { ...Ka, pts: Ka.pts.map((p, i) => [p[0] + wob * 5 * Math.sin(t * 1.7 + i * 1.3), p[1] + wob * 5 * Math.cos(t * 1.4 + i * 2.1), p[2], p[3]]) } : Ka;
        if (ghostP > 0) inner.push(constellation(t, Ko, { t0: differs - 0.35, dur: 0.7, size: 6.5, lineW: 2.4, ghost: true, color: C.gold, lineColor: C.goldLight, lineO: 0.95 }));
        inner.push(constellation(t, Kw, { t0: revival - 0.25, dur: 1.8, size: 6.5, lineW: 2.4, color: C.coral, lineColor: C.coralLight, glow: 0.35, lineO: 0.8 }));
        // mark the differences: shifted nodes and wrong links
        if (ghostP > 0) {
          const disp = once('agents_disp', () => Ka.pts.map((p, i) => [i, Math.hypot(p[0] - Ko.pts[i][0], p[1] - Ko.pts[i][1])]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(d => d[0]));
          Kw.pts.forEach((p, i) => inner.push(drawPath(`M${r2(Ko.pts[i][0])} ${r2(Ko.pts[i][1])} L${r2(p[0])} ${r2(p[1])}`, P(t, differs + 0.25 + i * 0.03, 0.4, 'inOut'), { stroke: C.coralLight, sw: 2, o: 0.8 })));
          disp.forEach((i, k) => {
            const rp = P(t, differs + 0.55 + k * 0.18, 0.4, 'outBack');
            if (rp > 0) inner.push(circle(Kw.pts[i][0], Kw.pts[i][1], 20 * rp * (1 + 0.1 * Math.sin(t * 4 + k * 2)), { stroke: C.coral, sw: 3.5 }));
          });
          const wrong = once('agents_wrong', () => Ka.edges.filter(([a, b]) => !Ko.edges.some(([c, d]) => (a === c && b === d) || (a === d && b === c))));
          wrong.forEach(([a, b], k) => {
            const cp = P(t, differs + 0.9 + k * 0.15, 0.4);
            if (cp > 0) inner.push(G({ x: (Kw.pts[a][0] + Kw.pts[b][0]) / 2, y: (Kw.pts[a][1] + Kw.pts[b][1]) / 2 }, circle(0, 0, 15, { fill: C.night, o: cp }), crossMark(cp, { size: 9, sw: 5, color: C.coral })));
          });
        }
        Q.push(G({ x: BX, y: BY, s: lerp(0.3, 1, eB), o: clamp(eB * 2) }, inner));
        // labels
        const eR = enter(t, revival - 0.15, { dy: 10 });
        if (eR.o > 0) {
          const w = measure('revival', 64, 'hand', 700);
          Q.push(G({ o: eR.o, y: eR.y }, hand('revival', BX - 40, 790, { size: 64, fill: C.coralDark }), G({ x: BX - 40 + w / 2 + 62, y: 772 }, pill('Naur', { size: 18 }))));
        }
        const eDf = enter(t, differs - 0.1, { dy: 10 });
        if (eDf.o > 0) Q.push(G({ o: eDf.o, y: eDf.y }, richText([{ t: 'its picture', fill: C.coralDark }, { t: '  ≠  ', fill: C.ink2 }, { t: 'the original', fill: C.goldDeep }], BX, 870, { font: 'hand', size: 50, weight: 700, anchor: 'middle' })));
      }
      out.push(G({ o: e2 * p2.o, y: p2.y }, Q));
    }
    // ---------------- phase 3: the spec is the handoff
    const e3 = enter(t, handoff - 0.6, { d: 0.6 });
    if (e3.o > 0) {
      const eH = enter(t, handoff - 0.45, { dy: 14 });
      out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'The ' }, { t: 'spec', fill: C.coral }, { t: ' is the handoff' }])));
      // agent at its desk, on the right
      const ax = 1450, ay = 790;
      const receive = P(t, gets + 0.55, 0.3);
      const screen = receive > 0 ? mixColor(C.night, C.teal, 0.6 * (1 - P(t, gets + 0.9, 0.8))) : C.night;
      out.push(G({ x: ax, y: ay + e3.y, o: e3.o, s: e3.s }, G({ y: -40 }, robot(t, { look: t > gets ? -0.6 : -0.3 })),
        G({ y: 70 }, laptopFront(t, { w: 230, h: 140, screen })), G({ y: 90 }, desk(420))));
      // the PM writes the spec; the theory grows while writing
      const px = 430, py = 905;
      const write = P(t, handoff + 0.1, gets - 0.5 - (handoff + 0.1), 'linear');
      const KP = once('agents_Kpm', () => makeConstellation(23, 11, { rx: 92, ry: 58, minD: 26, extra: 0.35 }));
      const keepGlow = 1 + 0.5 * Math.sin(Math.max(0, t - keep) * 5) * P(t, keep, 0.3) * (1 - P(t, keep + 1.2, 0.5));
      // the writing hand follows the lines of the spec as they appear
      const DX = 600, DY = 725;
      const ln = Math.min(5, Math.floor(write * 6)), lp = write * 6 - ln;
      const tipX = DX - 50 + 70 * lp + 5 * Math.sin(t * 13), tipY = DY - 57 + ln * 26;
      const reach = P(t, handoff - 0.1, 0.35, 'inOut') * (1 - P(t, gets - 0.5, 0.35, 'inOut'));
      // the hand holds the pencil halfway up its body (the pencil leans left, tip on the line)
      const hand2 = [lerp(52, tipX - 22 - px, reach), lerp(-108, tipY - 33 - py, reach)];
      const arms = [[-52, -108], hand2];
      out.push(G({ x: 670, y: 864 + e3.y, o: e3.o }, desk(380)));
      // the spec document: written on the desk, then it flies to the agent (drawn before the PM, so the hand sits on the page)
      const fly = P(t, gets - 0.25, 0.85, 'inOut');
      const land = [ax + 160, ay + 28];
      const [sx, sy] = fly > 0 ? quadPoint(DX, DY, land[0], land[1], -0.32, fly) : [DX, DY];
      const ss = lerp(1, 0.42, fly) * pulse(t, gets + 0.6, 0.35, 0.12);
      if (fly > 0) out.unshift(drawPath(arcPath(DX, DY, land[0], land[1], -0.32), fly, { stroke: C.coral, sw: 3, o: 0.35 * (1 - P(t, keep + 0.4, 0.5)) }));
      out.push(G({ x: sx, y: sy + e3.y, s: ss, r: lerp(0, 8, fly), o: e3.o }, specDoc({ w: 210, h: 270, reveal: write, accent: C.coral })));
      out.push(G({ x: px, y: py + e3.y, o: e3.o }, person(t, { shirt: C.coral, skin: C.skin[2], hair: C.hair[1], hairStyle: 2, seed: 11, mood: 'happy', look: 0.5, arms })));
      if (reach > 0.02) out.push(G({ x: px + hand2[0] + 22, y: py + hand2[1] + 33 + e3.y, sx: -1, sy: 1, o: e3.o * clamp(reach * 3) }, pencil()));
      const eBub = P(t, tbuild - 0.8, 0.6, 'outBack');
      const grow = 1 + 0.28 * P(t, keep - 0.2, 0.6, 'outBack');
      if (eBub > 0) out.push(G({ x: px + 40, y: 440 - 30 * (grow - 1) + e3.y, s: lerp(0.4, 1, eBub) * pulse(t, tbuild - 0.1, 0.6, 0.06) * grow, o: e3.o * clamp(eBub * 2) },
        circle(0, 0, 150, { fill: 'url(#gGlow)', o: 0.5 * P(t, tbuild - 0.2, 0.8) * keepGlow }),
        thoughtBubble(250, 170, { fill: C.night, stroke: C.night, tailX: -60 }),
        constellation(t, KP, { t0: tbuild - 0.4, dur: 2.2, size: 5.5 * keepGlow, lineW: 2, glow: 0.9 * keepGlow })));
      const l1p = enter(t, gets + 0.3, { dy: 8 }), l2p = enter(t, keep - 0.1, { dy: 8 });
      if (l1p.o > 0) out.push(G({ o: l1p.o, y: l1p.y }, richText([{ t: 'gets ', weight: 500, fill: C.ink2 }, { t: 'the spec', weight: 800, fill: C.coral }], ax, 1030, { size: 32, anchor: 'middle' })));
      if (l2p.o > 0) out.push(G({ o: l2p.o, y: l2p.y }, richText([{ t: 'you keep ', weight: 500, fill: C.ink2 }, { t: 'the theory', weight: 800, fill: C.goldDeep }], px + 40, 1030, { size: 32, anchor: 'middle' })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const { ag, free, tospec, dropped, revival, differs, handoff, tbuild, gets, keep, l1, wOn, wCost, wMoved } = agentsTimes(S);
    return [
      { t: S.start + 0.05, type: 'pop', pitch: 0.9, gain: 0.5 }, { t: ag, type: 'typing', dur: 1.8, gain: 0.6 },
      ...[0, 1, 2, 3].map(k => ({ t: ag - 0.05 + k * 0.42, type: 'tick', gain: 0.3, pitch: 0.95 + k * 0.05 })),
      { t: free - 0.15, type: 'swing', gain: 0.7 },
      { t: wOn - 0.2, type: 'pop', pitch: 1.1, gain: 0.45 },
      { t: wCost - 0.05, type: 'thud', gain: 0.8 },
      { t: wMoved - 0.5, type: 'whoosh', dur: 0.6, gain: 0.5 }, { t: tospec - 0.12, type: 'thud', gain: 0.7 }, { t: tospec, type: 'chime', note: 1, gain: 0.6 },
      { t: l1 - 0.35, type: 'whoosh', dur: 0.5, gain: 0.4 },
      { t: dropped - 0.4, type: 'whoosh', dur: 0.9, gain: 0.5 }, { t: dropped + 0.25, type: 'thud', gain: 0.5 },
      { t: dropped + 0.9, type: 'swish', dur: 0.6, gain: 0.3 }, { t: dropped + 2.3, type: 'swish', dur: 0.6, gain: 0.3 },
      { t: revival - 0.75, type: 'pop', pitch: 1.0, gain: 0.45 }, { t: revival - 0.25, type: 'rise', dur: 1.6, gain: 0.35 },
      { t: differs - 0.35, type: 'whoosh', dur: 0.5, gain: 0.35 }, { t: differs + 0.55, type: 'scribble', dur: 0.6, gain: 0.45 },
      { t: differs + 0.9, type: 'fizzle', gain: 0.35 },
      { t: handoff - 0.8, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: handoff - 0.3, type: 'pop', pitch: 0.95, gain: 0.45 },
      { t: handoff + 0.1, type: 'scribble', dur: 3.0, gain: 0.3 }, { t: tbuild - 0.1, type: 'chime', note: 3, gain: 0.6 },
      { t: gets - 0.25, type: 'whoosh', dur: 0.85, gain: 0.6 }, { t: gets + 0.55, type: 'pop', pitch: 1.2, gain: 0.55 },
      { t: keep, type: 'chime', note: 4, gain: 0.7 },
    ];
  },
};

// ================================================================== ENTERPRISE (ported from the 90 s cut; once() keys prefixed)
SCENES.enterprise = {
  render(t, S) {
    const reg = S.cue('reg'), sc = S.cue('scattered'), rule = S.cue('rule'), quirk = S.cue('quirk'), uns = S.cue('unsaid'), rg = S.cue('rgtb');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    void reg;
    // skyline
    const sky = P(t, S.start + 0.02, 1.0, 'out');
    const blds = once('enterprise_skyline', () => { const R = rng(99); let x = -20; const b = []; while (x < 1940) { const w = 90 + R() * 130, h = 70 + R() * 150; b.push([x, w, h]); x += w + 8; } return b; });
    out.push(G({ y: (1 - sky) * 200 }, blds.map(([x, w, h]) => [rect(x, 1080 - h, w, h + 10, { fill: C.paper3, o: 0.85 }),
      ...Array.from({ length: Math.floor(h / 36) }, (_, r) => rect(x + 16, 1080 - h + 16 + r * 36, w - 32, 10, { rx: 3, fill: C.paper2 }))])));
    // header -> headline
    const hdrOut = P(t, rg - 0.35, 0.35);
    const eH = enter(t, S.start + 0.1, { dy: 12 });
    out.push(G({ o: eH.o * (1 - hdrOut), y: eH.y }, T('A REGULATED ENTERPRISE', 960, 132, { size: 30, weight: 800, fill: C.ink2, anchor: 'middle', ls: 8 })));
    const eS = P(t, sc - 0.1, 0.4);
    out.push(G({ o: eS * (1 - hdrOut) }, T('the theory is scattered', 960, 196, { font: 'serif', size: 44, italic: true, fill: C.goldDeep, anchor: 'middle' })));
    const eR = enter(t, rg - 0.1, { dy: 14 });
    if (eR.o > 0) out.push(G({ o: eR.o, y: eR.y }, richText([{ t: 'Requirements gathering ' }, { t: 'is ', italic: true, weight: 400, fill: C.ink2 }, { t: 'theory building', fill: C.goldDeep }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    // the three places the theory hides
    const back = P(t, rg - 0.2, 0.6, 'inOut');
    const zoneO = 1 - 0.72 * back;
    const frag = once('enterprise_frags', () => [0, 1, 2].map(i => makeConstellation(60 + i, 4, { rx: 46, ry: 34, minD: 22, extra: 0.2 })));
    const fragPos = [[520, 470], [1150, 395], [1660, 378]];
    const Z = [];
    // zone 1: policy binder + clause under magnifier
    const z1 = enter(t, rule - 0.3);
    if (z1.o > 0) {
      const mag = P(t, rule + 0.3, 0.7, 'outBack');
      Z.push(G({ o: z1.o, y: z1.y }, G({ x: 260, y: 560, r: -4 }, binder({ color: C.blue })),
        G({ x: 430, y: 580, r: 3 }, shadowCard(-110, -140, 220, 280, { rx: 6 }), ...[0, 1, 2, 3, 4, 5, 6].map(k => rect(-86, -110 + k * 32, [150, 170, 120, 160, 140, 170, 100][k], 8, { rx: 4, fill: C.ink3, o: 0.5 })),
          rect(-96, -30, 190, 44, { rx: 6, fill: C.goldLight, o: 0.8 * mag }), T('§4.2(b)', -80, 2, { font: 'mono', size: 26, weight: 600, fill: C.ink, o: mag })),
        G({ x: 520, y: 640 - 40 * (1 - mag), o: mag }, magnifier({ color: C.ink })),
        T('a rule buried in policy', 390, 850, { font: 'hand', size: 44, weight: 700, anchor: 'middle' })));
    }
    // zone 2: legacy platform + sticky note + the one engineer
    const z2 = enter(t, quirk - 0.3);
    if (z2.o > 0) {
      const note = P(t, quirk + 0.35, 0.5, 'outBack');
      Z.push(G({ o: z2.o, y: z2.y }, G({ x: 880, y: 590 }, iconServer(t, { w: 170, h: 230, color: C.blue })),
        T('CORE v7', 880, 452, { font: 'mono', size: 26, weight: 600, fill: C.ink2, anchor: 'middle' }),
        G({ x: 1080, y: 800, s: 0.78 }, person(t, { shirt: C.teal, skin: C.skin[3], hair: C.hair[0], hairStyle: 0, seed: 13, arms: 'point', look: -0.6, flip: true })),
        note > 0 ? G({ x: 1060, y: 470, s: note }, stickyNote(['batch posts', '2 a.m. only'], { w: 200, h: 120, size: 34, r: 6 })) : '',
        T('a platform quirk one engineer knows', 960, 850, { font: 'hand', size: 44, weight: 700, anchor: 'middle' })));
    }
    // zone 3: stakeholder with an unspoken constraint
    const z3 = enter(t, uns - 0.3);
    if (z3.o > 0) {
      const bub = P(t, uns + 0.3, 0.5, 'outBack');
      Z.push(G({ o: z3.o, y: z3.y }, G({ x: 1540, y: 800, s: 0.85 }, person(t, { shirt: C.plum, skin: C.skin[0], hair: C.hair[4], hairStyle: 4, seed: 17, arms: 'hips', mood: 'closed' })),
        bub > 0 ? G({ x: 1660, y: 400, s: bub }, thoughtBubble(250, 160, { tailX: -80 }), T('…', 0, 56, { font: 'serif', size: 64, weight: 700, fill: C.ink2, anchor: 'middle' })) : '',
        T('a constraint nobody says out loud', 1540, 850, { font: 'hand', size: 44, weight: 700, anchor: 'middle' })));
    }
    out.push(G({ o: zoneO }, Z));
    // fragments of theory, scattered -> gathered into one head
    const gather = P(t, rg + 0.05, 0.9, 'inOut');
    const hx = 960, hy = 610, hs = 0.78;
    const eHead = P(t, rg - 0.2, 0.6);
    if (eHead > 0) out.push(G({ x: hx, y: hy, s: hs, o: eHead }, bigHead(t)));
    const K = HEAD_K();
    frag.forEach((Kf, i) => {
      const fp = P(t, sc + i * 0.2, 0.5, 'outBack');
      if (fp <= 0) return;
      // each fragment node flies to a node of the head constellation
      const nodes = Kf.pts.map((pt, k) => {
        const target = K.pts[(i * 5 + k * 2) % K.pts.length];
        const fx = fragPos[i][0] + pt[0], fy = fragPos[i][1] + pt[1];
        const gx = hx + target[0] * hs, gy = hy + target[1] * hs;
        return [lerp(fx, gx, gather), lerp(fy, gy, gather), pt[2], pt[3]];
      });
      const Kmoved = { ...Kf, pts: nodes };
      out.push(constellation(t, Kmoved, { t0: sc + i * 0.2, dur: 0.4, size: 7, lineW: 2, glow: 1, lineO: 0.75 * (1 - clamp(gather * 3)), o: fp * (1 - P(t, rg + 0.95, 0.4)) }));
    });
    if (gather > 0.9) out.push(G({ x: hx, y: hy, s: hs }, constellation(t, K, { t0: rg + 0.8, dur: 0.6, size: 7, lineW: 2.6, glow: 1 })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: S.start, type: 'rise', dur: 0.9, gain: 0.5 }, { t: S.cue('scattered'), type: 'chime', note: 5 },
    { t: S.cue('rule') - 0.3, type: 'pop', pitch: 0.85 }, { t: S.cue('rule') + 0.3, type: 'whoosh', dur: 0.5, gain: 0.35 },
    { t: S.cue('quirk') - 0.3, type: 'pop', pitch: 1.0 }, { t: S.cue('quirk') + 0.35, type: 'tick' },
    { t: S.cue('unsaid') - 0.3, type: 'pop', pitch: 1.12 }, { t: S.cue('unsaid') + 0.3, type: 'plop', gain: 0.5 },
    { t: S.cue('rgtb') + 0.05, type: 'whoosh', dur: 0.9 }, { t: S.cue('rgtb') + 0.85, type: 'chime', note: 0 },
  ],
};

})();
