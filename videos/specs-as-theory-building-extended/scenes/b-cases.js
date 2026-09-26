// Scenes: compiler, monitor (chapter "Evidence from the field": Naur's two field cases).
// Wrapped in an IIFE so helpers stay local to this file. Timing comes only from cues, lines and scene bounds.
'use strict';
(() => {

// ================================================================== local helpers
const GREY = '#A9ADB3';
const MUSTARD_DK = '#B8912E';
// section label (uppercase, letterspaced), centred
const secLabel = (s, x, y, o = {}) => T(s, x, y, { size: 30, weight: 800, fill: C.ink2, anchor: 'middle', ls: 8, ...o });
// hand-lettered label, centred
const hand = (s, x, y, o = {}) => T(s, x, y, { font: 'hand', size: 46, weight: 700, anchor: 'middle', fill: C.ink2, ...o });
// serif italic line under the case label
const subline = (s, x = 960, y = 196) => T(s, x, y, { font: 'serif', size: 42, italic: true, fill: C.ink2, anchor: 'middle' });
// start time of the first word of line li that begins with w (lower case), else the fallback
function wordT(S, li, w, fb) {
  const L = S.line(li);
  const hit = L && (L.words || []).find(x => x.w.toLowerCase().replace(/^[^a-z0-9]+/, '').startsWith(w));
  return hit ? hit.start : fb;
}
// walking bob (px, negative = up) while t is inside (a, b)
const walkBob = (t, a, b, ph = 0) => (t > a && t < b ? -Math.abs(Math.sin((t - a) * 9 + ph)) * 8 : 0);
// rounded-rectangle outline as path data (for drawn-on traces)
const rrPath = (x, y, w, h, r) => `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
// teal success badge with a tick (p 0…1), centred
function tickBadge(p, r = 26) {
  if (p <= 0) return '';
  return G({ s: lerp(0.4, 1, Ease.outBack(clamp(p * 1.3))), o: clamp(p * 3) },
    circle(0, 0, r, { fill: C.teal }), circle(0, 0, r, { stroke: C.card, sw: 3 }),
    G({ s: r / 34 }, checkMark(clamp(p * 1.6 - 0.3), { color: C.card, sw: 8 })));
}
// hand-drawn ring: a slightly open, overshooting ellipse, centred (cached per size)
function ringD(rx, ry, seed) {
  return once(`compiler_ring_${seed}_${Math.round(rx)}_${Math.round(ry)}`, () => {
    const R = rng(seed), pts = [], n = 28, a0 = -2.5 + R() * 0.5;
    for (let k = 0; k <= n; k++) {
      const u = k / n, a = a0 + u * (Math.PI * 2 + 0.5), g = 1 + 0.09 * u + (R() - 0.5) * 0.03;
      pts.push([Math.cos(a) * rx * g, Math.sin(a) * ry * g]);
    }
    return smooth(pts);
  });
}
// an amorphous blob outline of radius about r, centred (cached)
function blobD(seed, r) {
  return once(`compiler_blob_${seed}_${r}`, () => {
    const R = rng(seed), n = 7 + Math.floor(R() * 3), pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + R() * 0.3, rr = r * (0.72 + R() * 0.5);
      pts.push([Math.cos(a) * rr * 1.18, Math.sin(a) * rr * 0.86]);
    }
    return smooth(pts, true);
  });
}
// a jagged, lopsided polygon of radius about r, centred (cached)
function jagD(seed, r) {
  return once(`compiler_jag_${seed}_${r}`, () => {
    const R = rng(seed), n = 8 + Math.floor(R() * 4), pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = r * (k % 2 ? 0.62 + R() * 0.2 : 0.95 + R() * 0.25);
      pts.push([Math.cos(a) * rr * 1.15, Math.sin(a) * rr * 0.9]);
    }
    return poly(pts, true);
  });
}
// a bumpy, cloud-like outline of radius about r, centred (cached)
function cloudD(seed, r) {
  return once(`compiler_cloud_${seed}_${r}`, () => {
    const R = rng(seed), n = 14, pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = r * (k % 2 ? 0.78 : 1.0) * (0.9 + R() * 0.2);
      pts.push([Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.8]);
    }
    return smooth(pts, true);
  });
}
// one amorphous addition: four kinds of shape (blob, jagged, slab, cloud), centred
function addition(i, r, col) {
  const st = { fill: col, stroke: 'rgba(30,42,58,0.24)', sw: 2 };
  const k = i % 4;
  if (k === 1) return path(jagD(90 + i, r), st);
  if (k === 2) return rect(-r * 1.1, -r * 0.62, r * 2.2, r * 1.24, { rx: 9, ...st });
  if (k === 3) return path(cloudD(95 + i, r), st);
  return path(blobD(80 + i, r), st);
}
// a code card with a gold highlight and handwritten margin notes (annotated code), centred
function annotatedCard(o = {}) {
  const { w = 240, h = 190, seed = 64, note = 1 } = o;
  const x = -w / 2, y = -h / 2;
  const ly = y + 52 + 2 * 26;   // the highlighted line (index 2)
  return [
    codeCard({ w, h, seed, highlight: 2, lineH: 26 }),
    drawPath(`M${x + 16} ${ly + 22} C${x + w * 0.3} ${ly + 27} ${x + w * 0.5} ${ly + 18} ${x + w * 0.62} ${ly + 23}`, note, { stroke: C.goldDeep, sw: 3.5 }),
    drawPath(`M${x + w - 44} ${y + 58} q10 -8 20 0 t20 0 M${x + w - 44} ${y + 72} q8 -6 16 0`, clamp(note * 1.4 - 0.2), { stroke: C.coral, sw: 3 }),
    drawPath(`M${x + w - 50} ${ly + 4} L${x + w * 0.66} ${ly + 8}`, clamp(note * 1.6 - 0.5), { stroke: C.goldDeep, sw: 3 }),
  ].join('');
}
// a ring binder without a printed title, centred (about 140×190)
function docBinder(col = C.blue) {
  return [
    rect(-67, -87, 140, 190, { rx: 10, fill: 'rgba(30,42,58,0.12)' }),
    rect(-70, -95, 140, 190, { rx: 10, fill: col }),
    rect(-70, -95, 26, 190, { rx: 8, fill: 'rgba(0,0,0,0.18)' }),
    ...[-58, 0, 58].map(yy => circle(-57, yy, 6, { fill: C.paper3 })),
    rect(-28, -62, 84, 46, { rx: 6, fill: C.card }),
    rect(-16, -46, 60, 8, { rx: 4, fill: col, o: 0.6 }), rect(-16, -32, 40, 6, { rx: 3, fill: col, o: 0.4 }),
  ].join('');
}
// a small stack of documents, centred
const docStack = () => [
  G({ x: -18, y: 12, r: -7 }, docCard({ w: 220, h: 280, seed: 61, lines: 7 })),
  G({ x: 10, y: 5, r: 4 }, docCard({ w: 220, h: 280, seed: 62, lines: 7 })),
  docCard({ w: 220, h: 280, seed: 63, title: 'docs', lines: 6 }),
].join('');
// the point at fraction q (0…1) of the way along a polyline
function polyPoint(pts, q) {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = clamp(q) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) { const k = segs[i] ? clamp(d / segs[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}
// a spinning clock; ph = revolutions of the minute hand so far
const clockAt = (ph, r) => clock(ph, { r, speed: 1 });

// ================================================================== COMPILER (case 1)
// Three acts: the handover (documentation, annotated code, personal advice); group B's proposals, caught by the
// authors; ten years later, without the authors.
const CMP = { x0: 872, x1: 980, y: 590, s: 0.95, fy: 905, ps: 0.95 };
const CMP_A = [
  { x: 250, shirt: C.teal, skin: C.skin[0], hair: C.hair[0], hs: 0, seed: 21 },
  { x: 452, shirt: C.blue, skin: C.skin[3], hair: C.hair[3], hs: 3, seed: 22 },
];
const CMP_B = [
  { x: 1478, shirt: C.mustard, skin: C.skin[1], hair: C.hair[2], hs: 4, seed: 23 },
  { x: 1680, shirt: C.olive, skin: C.skin[4], hair: C.hair[1], hs: 2, seed: 24 },
];
const cmpKA = () => once('compiler_KA', () => makeConstellation(31, 9, { rx: 68, ry: 38, minD: 22, extra: 0.4 }));
const cmpKB = i => once('compiler_KB' + i, () => makeConstellation([37, 44][i], 5, { rx: 60, ry: 32, minD: 28, extra: 0 }));
const cmpKAdv = () => once('compiler_Kadv', () => makeConstellation(43, 6, { rx: 64, ry: 22, minD: 20, extra: 0.3 }));
// group B's proposals, in machine coordinates
const CMP_PROPS = [
  { x: -84, y: -54, w: 108, h: 56, r: -12, c: C.mustard },
  { x: 128, y: -150, w: 118, h: 56, r: 7, c: '#E4B955' },
  { x: 262, y: 12, w: 92, h: 116, r: 12, c: '#EDCB78' },
  { x: 96, y: 92, w: 124, h: 54, r: 9, c: C.mustard },
  { x: -176, y: 140, w: 150, h: 58, r: -6, c: '#E4B955' },
];
// the amorphous additions, in machine coordinates: x, y, radius, colour, early (arrives as the authors walk off)
const CMP_BLOBS = [
  [-205, -166, 46, C.mustard, 1], [250, -128, 40, GREY, 1], [-120, 160, 44, C.olive, 1],
  [-40, -180, 52, C.coralLight, 0], [120, -176, 44, C.blueLight, 0], [284, -22, 46, C.plumLight, 0],
  [282, 94, 48, C.mustard, 0], [178, 160, 46, C.tealLight, 0], [28, 174, 52, GREY, 0],
  [-262, 126, 46, '#D9A47A', 0], [-298, 8, 42, C.olive, 0], [-288, -104, 40, C.blueLight, 0],
  [-96, 16, 40, C.plumLight, 0], [98, -10, 38, C.coralLight, 0], [-8, -96, 34, '#D9A47A', 0],
];
const CMP_BLOCKS = [-170, 0, 170];
const CMP_BCOL = () => [C.teal, C.blue, C.plum];
// gears drawn over compilerMachine's static ones so they can turn (ang in degrees)
function cmpGears(ang, decay) {
  const col = c => (decay > 0 ? mixColor(c, GREY, decay) : c);
  return CMP_BLOCKS.map((bx, i) => {
    const jy = decay * Math.sin(i * 2.3) * 10, bc = col(CMP_BCOL()[i]);
    return circle(bx, 30 + jy, 14.5, { fill: bc }) +
      G({ x: bx, y: 30 + jy, s: 0.32, r: ang * (i % 2 ? -1.2 : 1) + i * 14 }, path(gearPath(40, 10), { fill: 'rgba(255,255,255,0.6)' }), circle(0, 0, 13, { fill: bc }));
  }).join('');
}
// the machine's structure as drawn-on outlines (frame plus three blocks), machine coordinates
function cmpTrace(p, decay, o = {}) {
  if (p <= 0) return '';
  const out = [drawPath(rrPath(-260, -150, 520, 300, 20), p, { stroke: C.tealLight, sw: 20, o: 0.45 * (o.o ?? 1) }),
    drawPath(rrPath(-260, -150, 520, 300, 20), p, { stroke: o.color ?? C.tealDark, sw: o.sw ?? 6, o: o.o })];
  CMP_BLOCKS.forEach((bx, i) => {
    const jy = decay * Math.sin(i * 2.3) * 10;
    out.push(drawPath(rrPath(bx - 62, -40 + jy, 124, 96, 14), clamp(p * 1.3 - 0.2 - i * 0.05), { stroke: o.color ?? C.tealDark, sw: (o.sw ?? 6) - 1, o: o.o }));
  });
  return out.join('');
}

function cmpTimes(S) {
  const c = {
    ho: S.cue('handover'), docs: S.cue('docs'), adv: S.cue('advice'), pat: S.cue('patches'), des: S.cue('destroyed'),
    spot: S.cue('spotted'), vis: S.cue('visible'), amo: S.cue('amorphous'), L1: S.line(1).start, L2: S.line(2).start,
  };
  c.ann = wordT(S, 0, 'annotated', lerp(c.docs, c.adv, 0.55));
  c.prop = wordT(S, 1, 'proposals', c.pat - 0.75);
  c.wo = wordT(S, 2, 'without', lerp(c.L2, c.vis, 0.5));
  c.early = [0, 1, 2].map(k => c.wo + 0.1 + k * 0.3);   // the first additions arrive as the authors leave
  return c;
}

SCENES.compiler = {
  render(t, S) {
    const c = cmpTimes(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const { fy, ps } = CMP;
    // ---- header: case label + a sub-line naming the act
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, secLabel('CASE 1 · A COMPILER', 960, 134)));
    const acts = [
      { a: S.start + 0.3, b: c.L1 - 0.35, s: 'the handover' },
      { a: c.L1 - 0.1, b: c.L2 - 0.4, s: 'the proposals' },
      { a: c.L2 - 0.15, b: S.end + 5, s: 'about 10 years later', clock: true },
    ];
    acts.forEach(A => {
      const o = P(t, A.a, 0.45) * (1 - P(t, A.b, 0.35, 'inOut'));
      if (o <= 0) return;
      const dy = 10 * (1 - P(t, A.a, 0.45)) - 8 * P(t, A.b, 0.35);
      if (!A.clock) { out.push(G({ o, y: dy }, subline(A.s))); return; }
      const w = measure(A.s, 42, 'serif', 400, true);
      const ph = 0.03 * (t - S.start) + 2.6 * P(t, A.a, 1.5, 'inOut');
      out.push(G({ o, y: dy }, subline(A.s, 960 + 30), G({ x: 960 + 30 - w / 2 - 44, y: 182 }, clockAt(ph, 24))));
    });

    // ---- the machine
    const eM = enter(t, S.start + 0.02, { d: 0.65, dy: 22 });
    const rf = P(t, c.wo + 0.3, 1.0, 'inOut');   // act 3: with A gone, the machine takes the stage
    const mx = lerp(lerp(CMP.x0, CMP.x1, P(t, c.ho + 0.9, 1.0, 'inOut')), 830, rf), my = CMP.y + 6 * rf;
    const msc = CMP.s * lerp(1, 1.2, rf);
    const shakeA = P(t, c.des - 0.2, 0.4) * (1 - P(t, c.spot + 0.5, 0.5));
    const decay = Math.max(0.3 * shakeA, 0.6 * P(t, c.amo - 0.05, 1.5, 'inOut'));
    // gears: turn steadily, jam while the patches are on, crawl once the additions pile up
    const u = t - S.start, jamA = c.des - 0.2 - S.start, jamB = c.spot + 0.8 - S.start;
    const jammed = clamp(u - jamA, 0, jamB - jamA);
    const slowed = 0.85 * Math.max(0, u - (c.amo - S.start));
    const ang = 120 * (u - jammed - slowed) + (u > jamA && u < jamB ? 7 * Math.sin(t * 43) : 0);
    const M = [compilerMachine(t, { decay }), cmpGears(ang, decay)];
    // act 2: B's proposals: dashed outlines, taped on, filled in; ringed by the authors, then gone
    // B's pointing hand, in machine coordinates: each proposal flies out of it
    const hand0 = [(CMP_B[0].x - 104 * ps - mx) / msc, (fy - 196 * ps - my) / msc];
    CMP_PROPS.forEach((pp, i) => {
      const a = P(t, c.prop - 0.2 + i * 0.16, 0.5, 'out');
      if (a <= 0) return;
      const [px, py] = quadPoint(hand0[0], hand0[1], pp.x, pp.y, -0.3, a);
      const gone = P(t, c.spot + 0.5 + i * 0.05, 0.35, 'in');
      if (gone >= 1) return;
      const tape = P(t, c.pat - 0.25 + i * 0.1, 0.3, 'outBack');
      const fill = P(t, c.des - 0.25 + i * 0.07, 0.35);
      const wob = fill * (1 - gone) * 3.5 * Math.sin(t * 9 + i * 1.7);
      const { w, h } = pp;
      const body = [
        rect(-w / 2, -h / 2, w, h, { rx: 7, fill: pp.c, o: lerp(0.22, 1, fill) }),
        fill < 1 ? rect(-w / 2, -h / 2, w, h, { rx: 7, stroke: MUSTARD_DK, sw: 3, dash: '10 7', o: 1 - fill }) : '',
        fill > 0 ? rect(-w / 2, -h / 2, w, h, { rx: 7, stroke: 'rgba(30,42,58,0.25)', sw: 2, o: fill }) : '',
        tape > 0 ? G({ x: -w / 2 + 10, y: -h / 2 + 6, r: -35, s: tape }, tapeStrip(50)) + G({ x: w / 2 - 10, y: h / 2 - 6, r: -35, s: tape }, tapeStrip(50)) : '',
      ];
      M.push(G({ x: px, y: py, r: lerp(-20, pp.r, a) + wob, s: lerp(0.3, 1, a) * (1 - 0.5 * gone), o: clamp(a * 3) * (1 - gone) }, body));
      const rp = P(t, c.spot - 0.25 + i * 0.12, 0.35, 'inOut');
      if (rp > 0) M.push(G({ x: pp.x, y: pp.y, r: pp.r, o: 1 - P(t, c.spot + 0.6 + i * 0.05, 0.3) }, drawPath(ringD(w / 2 + 18, h / 2 + 16, 5 + i), rp, { stroke: C.coral, sw: 5 })));
    });
    // the authors' neat solution, framed within the existing structure
    const gb = P(t, c.spot + 0.85, 0.45, 'outBack');
    if (gb > 0) {
      const gc = decay > 0 ? mixColor(C.gold, GREY, decay) : C.gold;
      M.push(G({ o: clamp(gb * 2) }, line(0, 56, 0, 81, { stroke: decay > 0 ? mixColor(C.ink2, GREY, decay) : C.ink2, sw: 5 })));
      M.push(G({ x: 0, y: 100 - 30 * (1 - clamp(gb)), s: lerp(1.25, 1, clamp(gb)), o: clamp(gb * 2) },
        circle(0, 0, 110, { fill: 'url(#gGlow)', o: 0.6 * (1 - P(t, c.spot + 1.6, 1.0)) * (1 - decay) }),
        rect(-86, -19, 172, 38, { rx: 10, fill: gc }), rect(-86, -19, 172, 38, { rx: 10, stroke: decay > 0 ? mixColor(C.goldDeep, GREY, decay) : C.goldDeep, sw: 2.5 }),
        ...[-50, 0, 50].map(dx => circle(dx, 0, 5, { fill: C.card, o: 0.85 }))));
      M.push(G({ x: 124, y: 100 }, tickBadge(P(t, c.spot + 1.25, 0.45) * (1 - P(t, c.L2 + 0.2, 0.4)), 22)));
    }
    // act 3: amorphous additions (a few during the ten years, the rest at "amorphous")
    let lateK = 0;
    CMP_BLOBS.forEach(([bx, by, r, col, early], i) => {
      const t0 = early ? c.early[i] : c.amo - 0.3 + (lateK++) * 0.09;
      const bp = P(t, t0, 0.45, 'outBack');
      if (bp <= 0) return;
      const wb = 2.5 * Math.sin(t * 1.7 + i * 1.3);
      M.push(G({ x: bx, y: by, r: wb + (i % 2 ? 8 : -6), s: bp, o: clamp(bp * 3) },
        addition(i, r, col),
        G({ x: -r * 0.55, y: -r * 0.45, r: -30 + (i % 3) * 20 }, tapeStrip(Math.round(r * 0.9), { h: 18 })),
        i % 2 ? G({ x: r * 0.6, y: r * 0.35, r: 40 }, tapeStrip(Math.round(r * 0.7), { h: 16 })) : ''));
    });
    // "the structure was still visible": its outline traced on top
    const tr = P(t, c.vis - 0.3, 1.0, 'inOut');
    if (tr > 0) M.push(G({ o: 0.9 - 0.3 * P(t, c.amo + 0.6, 0.8) }, cmpTrace(tr, decay, { color: C.tealDark, sw: 6 })));
    const shake = 1.3 * shakeA * (1 - P(t, c.spot + 0.2, 0.4)) * Math.sin(t * 13);
    out.push(G({ x: mx, y: my + eM.y, s: msc * eM.s, r: shake, o: eM.o }, M));

    // ---- the handover: documentation, a binder and the annotated code card fly from A to B's feet
    const src = [CMP_A[1].x + 44, fy - 150];
    const pileO = 1 - 0.3 * P(t, c.L1, 0.6) - 0.3 * P(t, c.L2 + 0.4, 0.8);
    const pile = [
      { t0: c.docs - 0.35, x: 1300, y: 848, r: -4, s: 0.46, f: docStack },
      { t0: c.docs - 0.18, x: 1400, y: 858, r: 7, s: 0.47, f: () => docBinder(C.blue) },
      { t0: c.ann - 0.35, x: 1190, y: 866, r: -7, s: 0.48, f: () => annotatedCard({ note: P(t, c.ann + 0.45, 0.6) }) },
    ];
    pile.forEach((it, k) => {
      const f = P(t, it.t0, 0.8, 'inOut');
      if (f <= 0) return;
      const [x, y] = quadPoint(src[0], src[1], it.x, it.y, -1.1, f);
      const land = pulse(t, it.t0 + 0.8, 0.3, 0.12);
      out.push(G({ x, y, r: lerp(-30 + k * 12, it.r, f), s: lerp(0.3, it.s, f) * land, o: clamp(f * 4) * pileO }, it.f()));
    });
    const l1 = P(t, c.docs + 0.35, 0.45) * (1 - P(t, c.adv - 0.3, 0.4));
    if (l1 > 0) out.push(G({ o: l1, y: 8 * (1 - l1) }, hand('full documentation', 1340, 982, { size: 42 })));
    const l2 = P(t, c.ann + 0.35, 0.45) * (1 - P(t, c.adv - 0.3, 0.4));
    if (l2 > 0) out.push(G({ o: l2, x: -10 * (1 - l2) }, hand('annotated code', 1116, 884, { size: 42, anchor: 'end' })));

    // ---- group A: the authors, with bright theories
    const flash = P(t, c.spot - 0.35, 0.3) * (1 - P(t, c.spot + 1.0, 0.8));
    CMP_A.forEach((pp, i) => {
      const e = enter(t, S.start + 0.12 + i * 0.12, { dy: 30, d: 0.6 });
      const w0 = c.wo - 0.2 + i * 0.14;
      const leave = P(t, w0, 1.7, 'in');
      if (leave >= 1) return;
      const walking = t > w0;
      const pointing = t > c.spot - 0.35 && t < c.L2 - 0.25;
      const tossing = i === 1 && ((t > c.docs - 0.45 && t < c.docs + 0.1) || (t > c.ann - 0.45 && t < c.ann - 0.05));
      const talking = i === 1 && t > c.adv - 0.4 && t < c.L1 - 0.3;
      const arms = walking ? 'down' : pointing ? 'point' : tossing ? [[-52, -108], [80, -228]] : talking ? [[-52, -108], [66, -176 + wobble(t, 1.4, 9)]] : 'down';
      const x = pp.x - 860 * leave, y = fy + e.y + walkBob(t, w0, w0 + 1.8, i);
      out.push(G({ x, y, s: ps * e.s, o: e.o }, holder(t, {
        shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: pp.seed, flip: walking, look: walking ? 0.2 : 0.5,
        mood: talking && Math.sin(t * 11) > 0 ? 'o' : 'happy', arms, glowHead: 0.8 * flash,
        bubble: P(t, S.start + 0.35 + i * 0.15, 0.6),
        theory: { K: cmpKA(), w: 190, h: 130, t0: S.start + 0.55 + i * 0.15, dur: 0.9, glow: 1 + 1.2 * flash },
      })));
    });
    const gAo = P(t, S.start + 0.6, 0.45) * (1 - P(t, c.wo - 0.2, 0.4));
    if (gAo > 0) out.push(G({ o: gAo }, secLabel('GROUP A', 350, 404, { size: 26, ls: 6, fill: C.goldDeep })));
    // the authors' thread to their neat solution
    const thr = P(t, c.spot + 0.55, 0.45, 'inOut') * (1 - P(t, c.L2 - 0.3, 0.4));
    if (thr > 0) out.push(drawPath(arcPath(CMP_A[1].x + 181, fy - 399, mx - 80, my + 90, -0.22), thr, { stroke: C.goldDeep, sw: 3, o: 0.85 }));

    // ---- group B: keen, holding only sparse, ghostly theories
    const gotIt = P(t, c.adv + 1.15, 0.5, 'outBack');
    CMP_B.forEach((pp, i) => {
      const t0 = c.ho - 0.2 + i * 0.18;
      if (t < t0) return;
      const wk = P(t, t0, 1.1, 'out');
      const x = pp.x + 560 * (1 - wk), y = fy + walkBob(t, t0, t0 + 1.05, i);
      const keen = t > c.prop - 0.3 && t < c.spot - 0.3;
      const arms = keen ? (i === 0 ? 'point' : [[-52, -108], [66, -196 + wobble(t, 1.1, 8)]]) : i === 1 ? 'hips' : 'down';
      const mood = t > c.spot - 0.2 && t < c.L2 ? 'o' : t > c.amo + 0.8 ? 'worried' : 'happy';
      const K = cmpKB(i);
      const lit = gotIt > 0 ? (i === 0 ? [0, 2] : [1]).map(k => {
        const [nx, ny, sz, ph] = K.pts[k];
        const r = 4.6 * sz * gotIt * (1 + 0.15 * Math.sin(t * 2.6 + ph));
        return circle(nx, ny, r * 4, { fill: 'url(#gGlow)', o: 0.7 }) + circle(nx, ny, r, { fill: C.gold });
      }).join('') : '';
      out.push(G({ x, y, s: ps, o: clamp((t - t0) / 0.2) }, holder(t, {
        shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: pp.seed, flip: true, look: 0.5, mood, arms,
        bubbleSide: -1, bubble: P(t, t0 + 0.85, 0.6),
        theory: { K, w: 190, h: 130, ghost: true, color: C.ink3, lineColor: C.ink3, glow: 0, t0: t0 + 1.05, dur: 0.6 },
      }), lit ? G({ x: -96, y: -420 }, lit) : ''));
    });
    const gBo = P(t, c.ho + 0.9, 0.45);
    if (gBo > 0) out.push(G({ o: gBo }, secLabel('GROUP B', 1582, 404, { size: 26, ls: 6 })));

    // ---- personal advice: a speech bubble from A with some theory in it; a little reaches B
    const eAd = P(t, c.adv - 0.35, 0.45, 'outBack');
    const adOut = P(t, c.L1 - 0.35, 0.4);
    const bx = 700, by = 318;
    if (eAd > 0 && adOut < 1) {
      out.push(G({ x: bx, y: by + wobble(t, 0.6, 3), s: lerp(0.5, 1, clamp(eAd)) * (1 - 0.1 * adOut), o: clamp(eAd * 2) * (1 - adOut) },
        speechBubble(250, 100, { tail: 'left', fill: C.night, stroke: 'rgba(30,42,58,0.35)' }),
        constellation(t, cmpKAdv(), { t0: c.adv - 0.2, dur: 0.6, size: 4.6, lineW: 1.8, glow: 0.9 })));
      const lp = P(t, c.adv + 0.05, 0.45) * (1 - adOut);
      if (lp > 0) out.push(G({ o: lp, y: 8 * (1 - lp) }, hand('personal advice', 1010, 414, { fill: C.goldDeep })));
      const [ex, ey] = [CMP_B[0].x - 96 * ps, fy - 420 * ps - 40];
      const arcP = P(t, c.adv + 0.3, 0.7, 'inOut');
      if (arcP > 0) {
        const d = arcPath(bx + 128, by + 10, ex - 60, ey, -0.25);
        out.push(G({ o: 0.7 * (1 - adOut) }, path(d, { stroke: C.goldDeep, sw: 3, dash: '8 9', o: arcP })));
        [0, 1, 2].forEach(k => {
          const q = P(t, c.adv + 0.35 + k * 0.14, 0.8, 'inOut');
          if (q <= 0 || q >= 1) return;
          const [qx, qy] = quadPoint(bx + 128, by + 10, ex - 60, ey, -0.25, q);
          out.push(circle(qx, qy, 14, { fill: 'url(#gGlow)', o: 0.9 }), circle(qx, qy, 5, { fill: C.gold }));
        });
      }
    }

    // ---- captions under the stage (one at a time)
    const cap = (s, a, b, col) => {
      const o = P(t, a, 0.45) * (1 - P(t, b, 0.35));
      if (o > 0) out.push(G({ o, y: 10 * (1 - P(t, a, 0.45)) }, hand(s, 960, 1004, { fill: col })));
    };
    cap('would destroy its power and simplicity', c.des + 0.05, c.spot + 0.35, C.coral);
    cap('framed within the existing structure', c.spot + 0.9, c.L2 + 0.25, C.goldDeep);
    cap('still visible', Math.max(c.vis + 0.05, c.L2 + 0.6), c.amo - 0.15, C.tealDark);
    cap('made ineffective by amorphous additions', c.amo + 0.25, S.end + 5, C.coral);
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = cmpTimes(S);
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: S.start + 0.15, type: 'pop', pitch: 0.9, gain: 0.5 },
      { t: S.start + 0.6, type: 'chime', note: 2, gain: 0.5 },
      { t: c.ho - 0.2, type: 'steps', dur: 1.1, gain: 0.45 }, { t: c.ho + 0.9, type: 'whoosh', dur: 0.9, gain: 0.35 },
      { t: c.docs - 0.35, type: 'whoosh', dur: 0.7, gain: 0.45 }, { t: c.docs + 0.45, type: 'thud', gain: 0.5 },
      { t: c.docs + 0.62, type: 'thud', gain: 0.4 }, { t: c.ann - 0.35, type: 'whoosh', dur: 0.7, gain: 0.4 },
      { t: c.ann + 0.45, type: 'thud', gain: 0.45 }, { t: c.ann + 0.5, type: 'scribble', dur: 0.5, gain: 0.3 },
      { t: c.adv - 0.35, type: 'pop', pitch: 1.1, gain: 0.55 }, { t: c.adv + 0.3, type: 'swish', dur: 0.7, gain: 0.35 },
      { t: c.adv + 1.15, type: 'chime', note: 4, gain: 0.45 },
      { t: c.L1 - 0.1, type: 'whoosh', dur: 0.45, gain: 0.35 },
      ...CMP_PROPS.map((_, i) => ({ t: c.prop - 0.2 + i * 0.16, type: 'pop', pitch: 0.95 + i * 0.08, gain: 0.4 })),
      ...[0, 2, 4].map(i => ({ t: c.pat - 0.25 + i * 0.1, type: 'tape', gain: 0.5 })),
      { t: c.des - 0.2, type: 'creak', dur: 0.8, gain: 0.5 }, { t: c.des + 0.05, type: 'scribble', dur: 0.7, gain: 0.35 },
      { t: c.des + 0.4, type: 'fizzle', gain: 0.35 },
      { t: c.spot - 0.35, type: 'chime', note: 5, gain: 0.55 }, { t: c.spot - 0.2, type: 'scribble', dur: 0.8, gain: 0.45 },
      { t: c.spot + 0.55, type: 'swish', dur: 0.4, gain: 0.35 }, { t: c.spot + 0.95, type: 'click', gain: 0.6 },
      { t: c.spot + 1.25, type: 'pluck', note: 7, gain: 0.5 },
      { t: c.L2 - 0.15, type: 'whoosh', dur: 0.6, gain: 0.4 }, ...c.early.map((x, k) => ({ t: x, type: k === 1 ? 'tape' : 'tick', gain: 0.4 })),
      { t: c.wo - 0.2, type: 'steps', dur: 1.6, gain: 0.4 },
      { t: c.vis - 0.3, type: 'scribble', dur: 1.0, gain: 0.35 }, { t: c.vis + 0.5, type: 'pluck', note: 4, gain: 0.4 },
      { t: c.amo - 0.3, type: 'tape', gain: 0.5 }, { t: c.amo + 0.1, type: 'tape', gain: 0.45 }, { t: c.amo + 0.5, type: 'tape', gain: 0.45 },
      { t: c.amo + 0.25, type: 'scribble', dur: 0.7, gain: 0.35 }, { t: c.amo + 0.9, type: 'creak', dur: 0.9, gain: 0.45 },
      { t: c.amo + 1.3, type: 'fizzle', gain: 0.35 },
    ];
  },
};

// ================================================================== MONITOR (case 2)
// The veterans (theory holders) fix faults at once and need no more documents; the teams with full manuals get stuck.
// Wall panels: 0 factory, 1 bars, 2 graph (fault 1), 3 line counter, 4 graph (fault 2), 5 graph (the manual team's fault).
const WALL = { x: 280, y: 244, w: 1360, h: 222 };
const WALL_C = [WALL.x + WALL.w / 2, WALL.y + WALL.h / 2];
const MON_PANELS = once('monitor_panels', () => {
  const n = 6, pad = 18, gap = 14, pw = (WALL.w - 2 * pad - (n - 1) * gap) / n;
  return Array.from({ length: n }, (_, i) => ({ x: WALL.x + pad + i * (pw + gap), y: WALL.y + pad, w: pw, h: WALL.h - 2 * pad }));
});
const MON = { fy: 935, ps: 0.92 };
// veterans: x in phase 1 (centre stage) and phase 2 (moved left to make room)
const MON_V = [
  { x: 750, x2: 330, shirt: C.teal, skin: C.skin[1], hair: '#CFCAC2', hs: 0, seed: 31 },
  { x: 968, x2: 548, shirt: C.blue, skin: C.skin[4], hair: C.hair[4], hs: 1, seed: 32 },
];
const MON_M = [
  { x: 1336, shirt: C.olive, skin: C.skin[2], hair: C.hair[3], hs: 3, seed: 33, book: C.coralDark, r: -4 },
  { x: 1512, shirt: '#8E9AAF', skin: C.skin[0], hair: C.hair[2], hs: 2, seed: 34, book: C.blue, r: 2 },
  { x: 1688, shirt: C.mustard, skin: C.skin[3], hair: C.hair[0], hs: 0, seed: 35, book: C.tealDark, r: -2 },
];
const monKV = () => once('monitor_KV', () => makeConstellation(53, 10, { rx: 68, ry: 38, minD: 21, extra: 0.45 }));
const monKM = i => once('monitor_KM' + i, () => makeConstellation([59, 71, 83][i], 4, { rx: 54, ry: 28, minD: 30, extra: 0 }));
// a live sensor graph across a w×h box centred on the origin; fault 0…1 turns it coral with a spike
function sensorLine(t, w, h, seed, col, fault) {
  const n = 36, pts = [];
  for (let k = 0; k <= n; k++) {
    const q = k / n;
    let y = 0.3 * Math.sin(q * 8 + t * 2.3 + seed) + 0.13 * Math.sin(q * 23 - t * 3.4 + seed * 2);
    if (fault > 0) y -= fault * Math.exp(-Math.pow((q - 0.8) / 0.07, 2)) * (0.75 + 0.25 * Math.sin(t * 26 + k));
    pts.push([-w / 2 + q * w, y * h * 0.5]);
  }
  return path(poly(pts), { stroke: fault > 0 ? mixColor(col, C.coral, clamp(fault * 1.5)) : col, sw: 3.5 });
}
// a factory glyph for panel 0 (teal, with drifting smoke)
function factoryGlyph(t, col) {
  const out = [path('M-74 44 L-74 -4 L-44 -24 L-44 -4 L-14 -24 L-14 -4 L16 -24 L16 -4 L44 -4 L44 -58 L62 -58 L62 44 Z', { fill: col })];
  [-56, -26, 4].forEach((wx, k) => out.push(rect(wx, 10, 20, 16, { rx: 3, fill: C.goldLight, o: Math.sin(t * 2 + k * 1.9) > -0.4 ? 1 : 0.55 })));
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.45 + k / 3) % 1;
    out.push(circle(53 + ph * 26, -66 - ph * 48, 7 + ph * 12, { fill: C.tealLight, o: 0.55 * (1 - ph) }));
  }
  return out.join('');
}
const fmtInt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// panel i of the control wall; st = { on, fault, fixed, fade, count } (all 0…1)
function wallPanel(t, i, st) {
  const pn = MON_PANELS[i], cx = pn.x + pn.w / 2, cy = pn.y + pn.h / 2;
  const on = st.on;
  const out = [rect(pn.x, pn.y, pn.w, pn.h, { rx: 10, fill: on > 0 ? mixColor('#151D2B', C.night2, on) : '#151D2B' })];
  if (on <= 0) return out.join('');
  const flick = on < 1 ? (Math.sin(t * 90 + i) > 0 ? 1 : 0.35) : 1;
  const f = st.fault * (1 - st.fixed);
  const inner = [rect(pn.x + 14, pn.y + 14, pn.w * 0.36, 8, { rx: 4, fill: C.ink3, o: 0.5 })];
  if (i === 0) inner.push(G({ x: cx - 4, y: cy + 16, s: 0.95 }, factoryGlyph(t, C.teal)));
  else if (i === 1) {
    [0, 1, 2, 3, 4].forEach(k => {
      const hgt = 30 + 60 * (0.5 + 0.5 * Math.sin(t * (1.3 + k * 0.4) + k * 1.7));
      inner.push(rect(pn.x + 26 + k * 34, pn.y + pn.h - 22 - hgt, 22, hgt, { rx: 4, fill: [C.tealLight, C.blueLight, C.goldLight, C.tealLight, C.plumLight][k], o: 0.85 }));
    });
  } else if (i === 3) {
    // the size of the system, counting up
    const n = Math.round(200000 * (st.count ?? 1) / 1000) * 1000;
    inner.push(circle(cx, cy + 4, 90, { fill: 'url(#gGlow)', o: 0.35 * (st.glint ?? 0) }));
    inner.push(T('≈ ' + fmtInt(n), cx, cy + 14, { font: 'mono', size: 34, weight: 600, fill: C.paper, anchor: 'middle' }));
    inner.push(T('LINES', cx, cy + 56, { size: 22, weight: 800, fill: C.ink3, anchor: 'middle', ls: 6 }));
  } else {
    const cols = [null, null, C.tealLight, null, C.blueLight, C.goldLight];
    inner.push(line(pn.x + 14, cy + 10, pn.x + pn.w - 14, cy + 10, { stroke: 'rgba(255,255,255,0.08)', sw: 2 }));
    inner.push(line(pn.x + 14, cy + 46, pn.x + pn.w - 14, cy + 46, { stroke: 'rgba(255,255,255,0.08)', sw: 2 }));
    inner.push(G({ x: cx, y: cy + 18 }, sensorLine(t, pn.w - 30, pn.h - 70, i * 1.9, cols[i], f)));
  }
  // status light, top right
  const blink = f > 0 ? (Math.sin(t * 16) > 0 ? 1 : 0.25) : 0.7 + 0.3 * Math.sin(t * 2 + i);
  inner.push(circle(pn.x + pn.w - 20, pn.y + 18, 16, { fill: 'url(#gGlow)', o: f > 0 ? 0.9 * blink : 0.3 }));
  inner.push(circle(pn.x + pn.w - 20, pn.y + 18, 7, { fill: f > 0 ? C.coral : C.tealLight, o: blink }));
  if (f > 0.05) inner.push(G({ x: pn.x + pn.w - 52, y: pn.y + 20, s: clamp(f * 2) }, path('M0 -13 L12 9 L-12 9 Z', { fill: C.coral }), T('!', 0, 7, { size: 16, weight: 800, fill: C.card, anchor: 'middle' })));
  out.push(G({ o: on * flick }, inner));
  // a coral frame while faulty, and the tick once fixed
  if (f > 0) out.push(rect(pn.x - 3, pn.y - 3, pn.w + 6, pn.h + 6, { rx: 12, stroke: C.coral, sw: 4, o: f * (0.6 + 0.4 * Math.sin(t * 16)) }));
  if (st.fixed > 0) out.push(G({ x: pn.x + pn.w - 6, y: pn.y + pn.h - 4 }, tickBadge(st.fixed * (1 - (st.fade ?? 0)), 24)));
  return out.join('');
}
// a person holding a big MANUAL in front of them (feet at 0,0); person options pass through
function manualHolder(t, o = {}) {
  const { bookCol = C.blue, bookR = -3, bubble = 1, theory = {}, qp = 0, ...rest } = o;
  const skin = rest.skin ?? C.skin[0];
  const hands = [[-62, -126], [62, -126]];
  const bp = clamp(bubble);
  const b = bp > 0 ? G({ x: -96, y: -420, s: 0.35 + 0.65 * Ease.outBack(bp), o: clamp(bp * 2) },
    theoryBubble(t, { tailX: 64, ...theory }),
    qp > 0 ? G({ y: 2 + wobble(t, 0.9, 4), s: lerp(0.4, 1, Ease.outBack(clamp(qp))), o: clamp(qp * 2) }, T('?', 0, 22, { font: 'serif', size: 64, weight: 700, fill: C.coralLight, anchor: 'middle' })) : '') : '';
  return [person(t, { ...rest, arms: hands }),
    G({ y: -124, r: bookR }, book({ title: 'MANUAL', w: 142, h: 150, color: bookCol, size: 24 })),
    circle(hands[0][0] + 5, hands[0][1] + 6, 9.5, { fill: skin }), circle(hands[1][0] - 5, hands[1][1] + 6, 9.5, { fill: skin }), b].join('');
}

function monTimes(S) {
  const c = {
    sys: S.cue('system'), vet: S.cue('veterans'), fk: S.cue('fromknow'), nd: S.cue('nodocs'), man: S.cue('manuals'),
    stuck: S.cue('stuck'), easy: S.cue('easy'), L1: S.line(1).start,
  };
  c.ann = wordT(S, 0, 'annotated', lerp(c.fk, c.nd, 0.6));
  c.f1 = c.fk - 0.3;                  // fault 1, fixed from what they knew
  c.x1 = c.fk + 0.75;
  c.f2 = c.ann - 0.55;                // fault 2, fixed with the annotated code
  c.x2 = c.ann + 0.6;
  c.mv = c.L1 - 0.2;                  // veterans step left for the manual teams
  return c;
}

SCENES.monitor = {
  render(t, S) {
    const c = monTimes(S);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const { fy, ps } = MON;
    // ---- header
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, secLabel('CASE 2 · A REAL-TIME MONITORING SYSTEM', 960, 134)));

    // ---- the control-room wall: big and centred while it powers on, then up to make room for the people
    const eW = enter(t, S.start + 0.1, { dy: 20, d: 0.6 });
    const up = P(t, c.vet - 0.75, 0.85, 'inOut');
    const st = MON_PANELS.map((_, i) => ({ on: P(t, c.sys - 0.3 + i * 0.08, 0.25), fault: 0, fixed: 0 }));
    st[2].fault = P(t, c.f1, 0.25); st[2].fixed = P(t, c.x1, 0.35); st[2].fade = P(t, c.x1 + 1.6, 0.4);
    st[4].fault = P(t, c.f2, 0.25); st[4].fixed = P(t, c.x2, 0.35); st[4].fade = P(t, c.x2 + 1.6, 0.4);
    st[5].fault = P(t, c.stuck - 0.3, 0.25); st[5].fixed = P(t, c.easy + 0.15, 0.3);
    st[3].count = P(t, c.sys - 0.05, 1.6, 'outQuart');
    st[3].glint = P(t, c.sys + 1.4, 0.2) * (1 - P(t, c.sys + 1.7, 0.8));
    const wall = [
      rect(WALL.x + 4, WALL.y + 10, WALL.w, WALL.h, { rx: 20, fill: 'rgba(30,42,58,0.14)' }),
      rect(WALL.x, WALL.y, WALL.w, WALL.h, { rx: 20, fill: '#2B3446' }),
      rect(WALL.x + 6, WALL.y + 6, WALL.w - 12, WALL.h - 12, { rx: 16, stroke: 'rgba(255,255,255,0.08)', sw: 2 }),
      ...MON_PANELS.map((_, i) => wallPanel(t, i, st[i])),
    ];
    const sb = 1 - P(t, c.sys - 0.3, 0.2);   // standby light until it powers on
    if (sb > 0) wall.push(circle(WALL.x + WALL.w - 26, WALL.y + WALL.h - 12, 5, { fill: C.coralLight, o: sb * (Math.sin(t * 5) > 0 ? 0.9 : 0.25) }));
    out.push(G({ x: WALL_C[0], y: lerp(505, WALL_C[1], up) + eW.y, s: lerp(1.12, 1, up), o: eW.o }, G({ x: -WALL_C[0], y: -WALL_C[1] }, wall)));

    // ---- the veterans: there since the design, with bright theories
    const vFlash = a => P(t, a, 0.25) * (1 - P(t, a + 0.9, 0.6));
    const easyGlow = P(t, c.easy - 0.35, 0.3) * (1 - P(t, c.easy + 1.2, 0.6));
    const mv = P(t, c.mv, 1.0, 'inOut');
    const vx = i => lerp(MON_V[i].x, MON_V[i].x2, mv);
    MON_V.forEach((pp, i) => {
      const e = enter(t, c.vet - 0.3 + i * 0.14, { dy: 34, d: 0.6 });
      if (e.o <= 0) return;
      const glow = i === 0 ? vFlash(c.f1 + 0.3) : vFlash(c.f2 + 0.3) + easyGlow;
      const shrug = t > c.nd + 0.2 && t < c.nd + 1.9;
      const glance = i === 1 && t > c.ann - 0.4 && t < c.ann + 0.9;
      const pointing = i === 1 && t > c.easy - 0.35 && t < c.easy + 1.1;
      const walking = mv > 0.02 && mv < 0.98;
      const arms = walking ? 'down' : shrug ? 'shrug' : pointing ? 'point' : glance ? [[-52, -108], [60, -150]] : i === 0 ? 'hips' : 'down';
      out.push(G({ x: vx(i), y: fy + e.y + walkBob(t, c.mv, c.mv + 1.0, i), s: ps * e.s, o: e.o }, holder(t, {
        shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: pp.seed, look: glance ? 1 : 0.5, flip: walking,
        mood: shrug ? 'closed' : 'happy', arms, glowHead: 0.8 * clamp(glow),
        bubble: P(t, c.vet + 0.05 + i * 0.14, 0.6),
        theory: { K: monKV(), w: 190, h: 130, t0: c.vet + 0.25 + i * 0.14, dur: 0.9, glow: 1.1 + 1.2 * clamp(glow) },
      })));
    });
    const lv = P(t, c.vet + 1.0, 0.5);
    if (lv > 0) out.push(G({ o: lv, y: 8 * (1 - lv) }, hand('there since the design', (vx(0) + vx(1)) / 2 + 60, 1008, { fill: C.goldDeep })));
    // threads from what they knew (a bubble) and from the annotated code to the faulty panels
    const bubbleTop = i => [vx(i) + 96 * ps + 30, fy - 420 * ps - 50];
    const bubbleEdge = i => [vx(i) + (96 + 88) * ps, fy - 420 * ps];
    const panelFoot = i => [MON_PANELS[i].x + MON_PANELS[i].w / 2, MON_PANELS[i].y + MON_PANELS[i].h + 4];
    const thread = (a, b, t0, t1, bend) => {
      const p = P(t, t0, 0.5, 'inOut'), o = 1 - P(t, t1, 0.5);
      if (p <= 0 || o <= 0) return;
      out.push(drawPath(arcPath(a[0], a[1], b[0], b[1], bend), p, { stroke: C.goldDeep, sw: 3.5, o: 0.9 * o }));
      if (p >= 1) {
        const ph = ((t - t0) * 1.1) % 1;
        const [qx, qy] = quadPoint(a[0], a[1], b[0], b[1], bend, ph);
        out.push(circle(qx, qy, 16, { fill: 'url(#gGlow)', o: 0.8 * o * Math.sin(ph * Math.PI) }), circle(qx, qy, 4.5, { fill: C.gold, o: o * Math.sin(ph * Math.PI) }));
      }
    };
    thread(bubbleTop(0), panelFoot(2), c.f1 + 0.3, c.x1 + 0.6, 0.2);
    // the annotated code card a veteran glances at
    const cardE = P(t, c.ann - 0.4, 0.45, 'outBack');
    const cardOut = P(t, c.nd - 0.45, 0.4);
    const cardPos = [1392, 712];
    if (cardE > 0 && cardOut < 1) {
      out.push(G({ x: cardPos[0], y: cardPos[1] + wobble(t, 0.5, 3), s: lerp(0.5, 0.95, clamp(cardE)) * (1 - 0.15 * cardOut), r: 3, o: clamp(cardE * 2) * (1 - cardOut) },
        annotatedCard({ w: 250, h: 190, seed: 65, note: P(t, c.ann - 0.1, 0.7) })));
      const la = P(t, c.ann + 0.1, 0.45) * (1 - cardOut);
      if (la > 0) out.push(G({ o: la }, hand('annotated code', cardPos[0] + 4, cardPos[1] + 142, { size: 42 })));
    }
    thread([cardPos[0] + 30, cardPos[1] - 96], panelFoot(4), c.ann + 0.05, c.x2 + 0.6, -0.12);
    // "more documentation?" floats up; the veterans shrug it off
    const pg = P(t, c.nd - 0.35, 0.9, 'out');
    const pgOut = P(t, c.nd + 1.9, 0.7, 'inOut');
    if (pg > 0 && pgOut < 1) {
      const px = lerp(1600, 1380, pg) + 70 * pgOut, py = lerp(1090, 690, pg) - 90 * pgOut + wobble(t, 0.7, 5);
      const page = [
        rect(-88, -112, 176, 224, { rx: 10, fill: C.card, o: 0.55 }),
        rect(-88, -112, 176, 224, { rx: 10, stroke: C.ink3, sw: 3, dash: '11 9' }),
        ...[0, 1, 2, 3].map(k => rect(-64, -80 + k * 24, [110, 124, 96, 70][k], 7, { rx: 3.5, fill: C.ink3, o: 0.35 })),
        T('?', 0, 90, { font: 'serif', size: 72, weight: 700, fill: C.ink3, anchor: 'middle' }),
      ];
      out.push(G({ x: px, y: py, r: lerp(10, -4, pg) + wobble(t, 0.4, 2), o: clamp(pg * 2) * (1 - pgOut) }, page));
      const lq = P(t, c.nd + 0.2, 0.45) * (1 - pgOut);
      if (lq > 0) out.push(G({ o: lq }, hand('more documentation?', px, py + 164, { size: 42 })));
    }

    // ---- the teams with full manuals: sparse, ghostly theories; stuck
    const stuckP = P(t, c.stuck - 0.25, 0.3) * (1 - P(t, c.easy + 0.2, 0.3));
    MON_M.forEach((pp, i) => {
      const t0 = c.man - 0.4 + i * 0.14;
      if (t < t0) return;
      const wk = P(t, t0, 0.95, 'out');
      const x = pp.x + 520 * (1 - wk), y = fy + walkBob(t, t0, t0 + 0.9, i);
      const happy = t > c.easy + 0.35;
      const qp = P(t, c.stuck + 0.05 + i * 0.2, 0.4) * (1 - P(t, c.easy + 0.1, 0.25));
      out.push(G({ x, y, s: ps, o: clamp((t - t0) / 0.2) }, manualHolder(t, {
        shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: pp.seed, flip: true, look: 0.4 - 0.9 * stuckP,
        mood: happy ? 'happy' : stuckP > 0.3 ? 'worried' : 'neutral', bookCol: pp.book, bookR: pp.r, qp,
        bubble: P(t, t0 + 0.6, 0.6),
        theory: { K: monKM(i), w: 170, h: 116, ghost: true, color: C.ink3, lineColor: C.ink3, glow: 0, t0: t0 + 0.8, dur: 0.5, dim: qp },
      })));
    });
    // the clock spins while they are stuck, and stops when the veteran clears it
    const ck = P(t, c.stuck - 0.2, 0.45, 'outBack') * (1 - P(t, c.easy + 1.0, 0.4));
    if (ck > 0) {
      const ph = 0.04 * (t - S.start) + 1.1 * Math.max(0, Math.min(t, c.easy + 0.15) - c.stuck);
      out.push(G({ x: 1782, y: 606 + wobble(t, 0.8, 3), s: clamp(ck) * pulse(t, c.easy + 0.15, 0.35, 0.12), o: clamp(ck * 2) }, clockAt(ph, 42)));
    }
    // the payoff: a veteran clears it at once. The gold link runs up from the veteran's theory into the wall,
    // along the strip under the panels, and into the faulty panel.
    const lk = P(t, c.easy - 0.35, 0.5, 'inOut');
    const lkO = 1 - P(t, c.easy + 1.3, 0.5);
    if (lk > 0 && lkO > 0) {
      const x0 = vx(1) + 96 * ps + 34, y0 = fy - 420 * ps - 52, yw = WALL.y + WALL.h - 9, [x1, y1] = panelFoot(5);
      const pts = [[x0, y0], [x0, yw], [x1, yw], [x1, y1 - 8]];
      const d = `M${r2(x0)} ${r2(y0)} L${r2(x0)} ${r2(yw + 10)} Q${r2(x0)} ${r2(yw)} ${r2(x0 + 10)} ${r2(yw)} L${r2(x1 - 10)} ${r2(yw)} Q${r2(x1)} ${r2(yw)} ${r2(x1)} ${r2(yw - 10)} L${r2(x1)} ${r2(y1 - 8)}`;
      out.push(G({ o: lkO }, drawPath(d, lk, { stroke: C.goldLight, sw: 10, o: 0.35 }), drawPath(d, lk, { stroke: C.gold, sw: 4 })));
      const q = P(t, c.easy - 0.3, 0.45, 'in');
      if (q > 0 && q < 1) {
        const [qx, qy] = polyPoint(pts, q);
        out.push(circle(qx, qy, 24, { fill: 'url(#gGlow)' }), circle(qx, qy, 7, { fill: C.goldLight }));
      }
      const sp = P(t, c.easy + 0.15, 0.5, 'outBack') * lkO;
      const pn = MON_PANELS[5];
      if (sp > 0) out.push(sparkle(pn.x + 26, pn.y + 26, 16 * sp), sparkle(pn.x + pn.w - 44, pn.y + pn.h - 30, 12 * sp, { fill: C.goldLight }));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = monTimes(S);
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.5, gain: 0.4 },
      { t: c.sys - 0.3, type: 'rise', dur: 0.6, gain: 0.4 }, ...[0, 2, 4].map(i => ({ t: c.sys - 0.3 + i * 0.08, type: 'click', gain: 0.35 })),
      { t: c.sys, type: 'typing', dur: 1.4, gain: 0.3 }, { t: c.sys + 1.5, type: 'tick', gain: 0.5 },
      { t: c.vet - 0.75, type: 'whoosh', dur: 0.8, gain: 0.3 },
      { t: c.vet - 0.3, type: 'pop', pitch: 0.9, gain: 0.5 }, { t: c.vet - 0.16, type: 'pop', pitch: 1.05, gain: 0.5 },
      { t: c.vet + 0.3, type: 'chime', note: 1, gain: 0.5 }, { t: c.vet + 1.0, type: 'scribble', dur: 0.6, gain: 0.3 },
      { t: c.f1, type: 'pop', pitch: 0.7, gain: 0.5 }, { t: c.f1 + 0.3, type: 'swish', dur: 0.5, gain: 0.35 },
      { t: c.x1, type: 'pluck', note: 4, gain: 0.55 },
      { t: c.f2, type: 'pop', pitch: 0.75, gain: 0.45 }, { t: c.ann - 0.4, type: 'pop', pitch: 1.2, gain: 0.5 },
      { t: c.ann - 0.1, type: 'scribble', dur: 0.6, gain: 0.35 }, { t: c.x2, type: 'pluck', note: 7, gain: 0.55 },
      { t: c.nd - 0.35, type: 'swish', dur: 0.8, gain: 0.35 }, { t: c.nd + 0.25, type: 'pop', pitch: 0.85, gain: 0.35 },
      { t: c.nd + 1.9, type: 'whoosh', dur: 0.6, gain: 0.3 },
      { t: c.mv, type: 'steps', dur: 0.9, gain: 0.35 }, { t: c.man - 0.4, type: 'steps', dur: 1.0, gain: 0.45 },
      { t: c.man + 0.3, type: 'thud', gain: 0.35 },
      { t: c.stuck - 0.3, type: 'pop', pitch: 0.7, gain: 0.5 },
      ...[0, 1, 2].map(i => ({ t: c.stuck + 0.05 + i * 0.2, type: 'pop', pitch: 1.3 + i * 0.1, gain: 0.35 })),
      ...[0.7, 1.1, 1.5].map(dt => ({ t: c.stuck + dt, type: 'tick', gain: 0.35 })),
      { t: c.easy - 0.3, type: 'swish', dur: 0.45, gain: 0.45 }, { t: c.easy + 0.15, type: 'chime', note: 5, gain: 0.6 },
      { t: c.easy + 0.4, type: 'pluck', note: 9, gain: 0.45 },
    ];
  },
};

})();
