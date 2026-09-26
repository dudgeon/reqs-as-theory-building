// Illustration library. Every component draws around its own local origin and returns SVG markup.
'use strict';

// ------------------------------------------------------------------ people
// Feet at (0,0); ~255px tall at s=1.
function person(t, o = {}) {
  const {
    shirt = C.teal, skin = C.skin[0], hair = C.hair[0], hairStyle = 0, pants = C.ink,
    mood = 'neutral', arms = 'down', seed = 1, look = 0, flip = false, noLegs = false,
    bubble = null, glowHead = 0, blinkOff = false,
  } = o;
  const phase = (seed * 1.37) % 3.7;
  const bt = (t + phase) % 3.7;
  const blink = blinkOff ? 1 : bt < 0.12 ? Math.abs(bt - 0.06) / 0.06 : 1;
  const parts = [];
  if (!noLegs) {
    parts.push(rect(-25, -96, 20, 94, { rx: 9, fill: pants }), rect(5, -96, 20, 94, { rx: 9, fill: pants }));
    parts.push(ellipse(-17, -3, 17, 7, { fill: C.ink }), ellipse(17, -3, 17, 7, { fill: C.ink }));
  }
  // arms behind torso when hanging down
  const shoulderL = [-40, -188], shoulderR = [40, -188];
  const poses = {
    down: [[-52, -108], [52, -108]],
    typing: [[-30, -128], [30, -128]],
    hold: [[-24, -148], [24, -148]],
    write: [[-40, -118], [34, -126]],
    wave: [[-52, -108], [74, -262]],
    point: [[-52, -108], [104, -196]],
    shrug: [[-72, -170], [72, -170]],
    hips: [[-58, -118], [58, -118]],
  };
  const [hl, hr] = typeof arms === 'object' ? arms : poses[arms] || poses.down;
  const armPath = (s, h, bendSign) => {
    const mx = (s[0] + h[0]) / 2 + bendSign * 10, my = (s[1] + h[1]) / 2 + 6;
    return `M${s[0]} ${s[1]} Q${mx} ${my} ${h[0]} ${h[1]}`;
  };
  const armsSvg = [
    path(armPath(shoulderL, hl, -1), { stroke: shirt, sw: 21 }),
    path(armPath(shoulderR, hr, 1), { stroke: shirt, sw: 21 }),
    circle(hl[0], hl[1], 9.5, { fill: skin }), circle(hr[0], hr[1], 9.5, { fill: skin }),
  ].join('');
  const torso = path('M-45 -178 Q-47 -206 -18 -208 L18 -208 Q47 -206 45 -178 L41 -101 Q39 -86 25 -86 L-25 -86 Q-39 -86 -41 -101 Z', { fill: shirt });
  const collar = path('M-12 -207 Q0 -194 12 -207', { stroke: 'rgba(0,0,0,0.18)', sw: 3 });
  const neck = rect(-9, -224, 18, 20, { rx: 6, fill: skin });
  // head
  const hy = -252;
  const head = circle(0, hy, 34, { fill: skin });
  const hairSvg = {
    0: path(`M-35 ${hy + 2} Q-39 ${hy - 42} 0 ${hy - 41} Q37 ${hy - 42} 35 ${hy - 2} Q29 ${hy - 24} 10 ${hy - 25} Q-12 ${hy - 16} -35 ${hy + 2} Z`, { fill: hair }),
    1: [path(`M-35 ${hy + 2} Q-39 ${hy - 42} 0 ${hy - 41} Q37 ${hy - 42} 35 ${hy - 2} Q20 ${hy - 26} -35 ${hy + 2} Z`, { fill: hair }), circle(0, hy - 44, 15, { fill: hair })].join(''),
    2: path(`M-36 ${hy + 34} Q-44 ${hy - 44} 0 ${hy - 42} Q44 ${hy - 44} 36 ${hy + 34} L26 ${hy + 34} Q30 ${hy - 20} 4 ${hy - 26} Q-20 ${hy - 14} -26 ${hy + 34} Z`, { fill: hair }),
    3: [[-24, -24], [-8, -34], [10, -33], [26, -22], [-34, -6], [34, -6]].map(([dx, dy]) => circle(dx, hy + dy, 14, { fill: hair })).join(''),
    4: path(`M-34 ${hy - 4} Q-30 ${hy - 30} -10 ${hy - 36} Q-26 ${hy - 20} -30 ${hy + 4} Z M34 ${hy - 4} Q30 ${hy - 30} 10 ${hy - 36} Q26 ${hy - 20} 30 ${hy + 4} Z`, { fill: hair }),
  }[hairStyle];
  const ex = look * 5;
  const eyes = [ellipse(-12 + ex, hy + 2, 3.6, 4.2 * blink, { fill: C.ink }), ellipse(12 + ex, hy + 2, 3.6, 4.2 * blink, { fill: C.ink })].join('');
  const mouths = {
    neutral: path(`M${-7 + ex} ${hy + 17} Q${ex} ${hy + 20} ${7 + ex} ${hy + 17}`, { stroke: C.ink, sw: 3 }),
    happy: path(`M${-10 + ex} ${hy + 14} Q${ex} ${hy + 25} ${10 + ex} ${hy + 14}`, { stroke: C.ink, sw: 3 }),
    worried: path(`M${-8 + ex} ${hy + 20} Q${ex} ${hy + 14} ${8 + ex} ${hy + 20}`, { stroke: C.ink, sw: 3 }),
    closed: line(-7 + ex, hy + 18, 7 + ex, hy + 18, { stroke: C.ink, sw: 3 }),
    o: circle(ex, hy + 18, 4.5, { fill: C.ink }),
  };
  const brows = mood === 'worried' ? [line(-18 + ex, hy - 10, -7 + ex, hy - 13, { sw: 2.5 }), line(18 + ex, hy - 10, 7 + ex, hy - 13, { sw: 2.5 })].join('') : '';
  const cheeks = [circle(-20 + ex, hy + 11, 5, { fill: C.coral, o: 0.18 }), circle(20 + ex, hy + 11, 5, { fill: C.coral, o: 0.18 })].join('');
  const glow = glowHead > 0 ? circle(0, hy, 60, { fill: 'url(#gGlow)', o: glowHead }) : '';
  const body = [glow, arms === 'down' || arms === 'hips' ? armsSvg : '', torso, collar, neck, head, hairSvg, eyes, cheeks, mouths[mood] || mouths.neutral, brows, arms === 'down' || arms === 'hips' ? '' : armsSvg];
  return G({ sx: flip ? -1 : 1, sy: 1 }, parts, body, bubble || '');
}

// big side-profile head (facing right), origin at cranium centre
const HEAD_PATH = 'M-88 262 C-90 214 -98 176 -118 148 C-176 96 -192 -36 -142 -108 C-92 -182 38 -200 104 -150 C150 -114 162 -70 156 -30 C158 -10 176 16 200 46 C208 58 196 68 172 69 C175 81 180 92 169 100 C177 107 177 119 165 125 C169 146 160 170 130 182 C100 192 80 200 72 216 C65 231 62 246 60 262 Z';
function bigHead(t, o = {}) {
  const { fill = C.night, stroke = null, o: op = 1 } = o;
  return G({ o: op }, path(HEAD_PATH, { fill, stroke, sw: stroke ? 4 : undefined }));
}

// ------------------------------------------------------------------ constellation (the "theory")
function makeConstellation(seed, n, shape) {
  const R = rng(seed);
  const pts = [];
  let guard = 0;
  const minD = shape.minD ?? 34;
  while (pts.length < n && guard++ < 5000) {
    const u = R() * 2 - 1, v = R() * 2 - 1;
    if (u * u + v * v > 1) continue;
    const x = (shape.cx ?? 0) + u * shape.rx, y = (shape.cy ?? 0) + v * shape.ry;
    if (pts.some(p => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
    pts.push([x, y, 0.75 + R() * 0.6, R() * 6.28]);
  }
  // minimum spanning tree (Prim) + a few short extra links = connected, airy network
  const inT = new Set([0]); const edges = [];
  while (inT.size < pts.length) {
    let best = null;
    for (const a of inT) for (let b = 0; b < pts.length; b++) {
      if (inT.has(b)) continue;
      const d = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
      if (!best || d < best[2]) best = [a, b, d];
    }
    inT.add(best[1]); edges.push([best[0], best[1]]);
  }
  const extra = Math.round(pts.length * (shape.extra ?? 0.35));
  const cand = [];
  for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
    if (edges.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a))) continue;
    cand.push([a, b, Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1])]);
  }
  cand.sort((p, q) => p[2] - q[2]);
  cand.slice(0, extra).forEach(c => edges.push([c[0], c[1]]));
  // reveal order: BFS from the left-most node, so the web "grows"
  const start = pts.reduce((bi, p, i) => (p[0] < pts[bi][0] ? i : bi), 0);
  const order = [start]; const seen = new Set([start]);
  for (let k = 0; k < order.length; k++) {
    for (const [a, b] of edges) {
      const nb = a === order[k] ? b : b === order[k] ? a : null;
      if (nb != null && !seen.has(nb)) { seen.add(nb); order.push(nb); }
    }
  }
  const rank = new Array(pts.length); order.forEach((idx, k) => (rank[idx] = k));
  return { pts, edges, rank };
}
// draws the constellation revealed between t0 and t0+dur
function constellation(t, K, o = {}) {
  const { t0 = 0, dur = 1.5, color = C.gold, lineColor = C.goldLight, size = 6, lineW = 2.2, glow = 1, o: op = 1, twinkle = 1, lineO = 0.75, dim = 0 } = o;
  const n = K.pts.length;
  const appear = i => t0 + dur * (K.rank[i] / Math.max(1, n - 1));
  const out = [];
  for (const [a, b] of K.edges) {
    const ts = Math.max(appear(a), appear(b)) + 0.05;
    const p = P(t, ts, 0.4, 'inOut');
    if (p <= 0) continue;
    const [x1, y1] = K.pts[a], [x2, y2] = K.pts[b];
    out.push(line(x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), { stroke: lineColor, sw: lineW, o: lineO * (1 - dim * 0.6) }));
  }
  for (let i = 0; i < n; i++) {
    const [x, y, sz, ph] = K.pts[i];
    const p = P(t, appear(i), 0.45, 'outBack');
    if (p <= 0) continue;
    const tw = 1 + 0.18 * twinkle * Math.sin(t * 2.6 + ph);
    const r = size * sz * p * tw;
    if (glow > 0) out.push(circle(x, y, r * 4.2, { fill: 'url(#gGlow)', o: glow * 0.8 * (1 - dim) }));
    out.push(circle(x, y, r, { fill: color, o: 1 - dim * 0.5 }));
    out.push(circle(x - r * 0.25, y - r * 0.25, r * 0.35, { fill: '#FFF6DE', o: 0.8 * (1 - dim) }));
  }
  return G({ o: op }, out);
}

// ------------------------------------------------------------------ cards & documents
function shadowCard(x, y, w, h, o = {}) {
  return [
    rect(x + 2, y + 8, w, h, { rx: o.rx ?? 18, fill: 'rgba(30,42,58,0.10)' }),
    rect(x, y, w, h, { rx: o.rx ?? 18, fill: o.fill ?? C.card, stroke: o.stroke ?? 'rgba(30,42,58,0.10)', sw: o.sw ?? 2 }),
  ].join('');
}
const CODE_COLORS = [C.plum, C.blue, C.teal, C.coral, C.ink3, C.goldDeep];
function codeLines(seed, n) {
  return once('code' + seed + '_' + n, () => {
    const R = rng(seed); const ls = []; let ind = 0;
    for (let i = 0; i < n; i++) {
      const segs = []; let x = 0; const k = 1 + Math.floor(R() * 3);
      for (let j = 0; j < k; j++) { const w = 0.12 + R() * 0.3; segs.push([x, w, CODE_COLORS[Math.floor(R() * CODE_COLORS.length)]]); x += w + 0.04; }
      ls.push({ ind, segs: segs.filter(s => s[0] + s[1] <= 0.92) });
      const r = R(); ind = clamp(ind + (r < 0.3 ? 1 : r < 0.55 ? -1 : 0), 0, 3);
    }
    return ls;
  });
}
function codeCard(o = {}) {
  const { w = 300, h = 360, reveal = 1, seed = 3, dark = false, title = null, highlight = -1, hlColor = C.gold, lineH = 26 } = o;
  const x = -w / 2, y = -h / 2;
  const n = Math.floor((h - 64) / lineH);
  const L = codeLines(seed, n);
  const out = [shadowCard(x, y, w, h, { fill: dark ? C.night : C.card })];
  out.push(circle(x + 22, y + 22, 6, { fill: C.coral }), circle(x + 40, y + 22, 6, { fill: C.mustard }), circle(x + 58, y + 22, 6, { fill: C.teal }));
  if (title) out.push(T(title, x + w - 18, y + 28, { font: 'mono', size: 17, fill: dark ? C.ink3 : C.ink2, anchor: 'end', weight: 600 }));
  const avail = w - 48;
  const shown = reveal * n;
  for (let i = 0; i < n; i++) {
    const lp = clamp(shown - i);
    if (lp <= 0) break;
    const ly = y + 52 + i * lineH;
    if (i === highlight) out.push(rect(x + 10, ly - 4, w - 20, lineH - 4, { rx: 6, fill: hlColor, o: 0.28 }));
    const lx = x + 24 + L[i].ind * 18;
    for (const [sx, sw, col] of L[i].segs) {
      const segW = Math.min(sw * avail, Math.max(0, (lp * 0.92 - sx) * avail));
      if (segW > 0) out.push(rect(lx + sx * avail, ly + 2, segW, 11, { rx: 5.5, fill: col, o: dark ? 0.9 : 0.8 }));
    }
  }
  return out.join('');
}
function docCard(o = {}) {
  const { w = 220, h = 280, title = null, titleColor = C.ink, lines = 7, reveal = 1, accent = null, seed = 5, fold = true, heading = true, checks = false } = o;
  const x = -w / 2, y = -h / 2;
  const R = rng(seed);
  const widths = once('doc' + seed + lines, () => Array.from({ length: lines }, () => 0.55 + R() * 0.4));
  const out = [];
  out.push(rect(x + 2, y + 8, w, h, { rx: 10, fill: 'rgba(30,42,58,0.10)' }));
  const f = fold ? 34 : 0;
  out.push(path(`M${x + 10} ${y} L${x + w - f} ${y} L${x + w} ${y + f} L${x + w} ${y + h - 10} Q${x + w} ${y + h} ${x + w - 10} ${y + h} L${x + 10} ${y + h} Q${x} ${y + h} ${x} ${y + h - 10} L${x} ${y + 10} Q${x} ${y} ${x + 10} ${y} Z`, { fill: C.card, stroke: accent ?? 'rgba(30,42,58,0.16)', sw: accent ? 4 : 2 }));
  if (fold) out.push(path(`M${x + w - f} ${y} L${x + w - f} ${y + f} L${x + w} ${y + f} Z`, { fill: C.paper3 }));
  let ly = y + 40;
  if (title) { out.push(T(title, x + 22, y + 44, { font: 'mono', size: 24, weight: 600, fill: titleColor })); ly = y + 74; }
  else if (heading) { out.push(rect(x + 22, y + 30, w * 0.45, 13, { rx: 6.5, fill: C.ink, o: 0.75 })); ly = y + 66; }
  const shown = reveal * lines;
  const gap = Math.min(26, (h - (ly - y) - 18) / lines);
  for (let i = 0; i < lines; i++) {
    const lp = clamp(shown - i);
    if (lp <= 0) break;
    const lx = x + 22 + (checks ? 26 : 0);
    if (checks) out.push(rect(x + 22, ly + i * gap - 5, 14, 14, { rx: 3, stroke: C.ink2, sw: 2 }));
    out.push(rect(lx, ly + i * gap - 2, (w - 44 - (checks ? 26 : 0)) * widths[i] * lp, 8, { rx: 4, fill: C.ink3, o: 0.7 }));
  }
  return out.join('');
}
function specDoc(o = {}) {
  return docCard({ title: 'SPEC', titleColor: C.coral, accent: o.accent, lines: o.lines ?? 6, checks: true, seed: 11, ...o });
}

// ------------------------------------------------------------------ icons (≈120px boxes, centred)
function iconBank(o = {}) {
  const c = o.color ?? C.teal;
  return [
    path('M-62 -22 L0 -58 L62 -22 Z', { fill: c }),
    rect(-58, -22, 116, 10, { fill: c }),
    ...[-42, -14, 14, 42].map(x => rect(x - 7, -8, 14, 52, { rx: 3, fill: c, o: 0.85 })),
    rect(-64, 44, 128, 12, { rx: 3, fill: c }),
    circle(0, -34, 6, { fill: C.card }),
  ].join('');
}
function iconPolicy(o = {}) {
  const c = o.color ?? C.teal;
  return [
    docCard({ w: 96, h: 124, lines: 4, heading: false, seed: 21, fold: true }),
    T('§', -26, -6, { font: 'serif', size: 44, weight: 700, fill: c }),
    circle(22, 40, 17, { fill: C.coral }),
    path('M14 52 L10 72 L22 64 L34 72 L30 52', { fill: C.coral }),
    circle(22, 40, 8, { stroke: C.card, sw: 2.5 }),
  ].join('');
}
function iconBust(o = {}) {
  const c = o.color ?? C.teal, skin = o.skin ?? C.skin[1];
  return [
    path('M-44 58 Q-44 8 0 8 Q44 8 44 58 Z', { fill: c }),
    circle(0, -22, 26, { fill: skin }),
    path('M-27 -26 Q-28 -56 0 -54 Q28 -56 27 -26 Q18 -42 0 -42 Q-18 -40 -27 -26 Z', { fill: o.hair ?? C.hair[0] }),
  ].join('');
}
function gearPath(r, teeth = 10, depth = 0.22) {
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * (1 - depth);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return poly(pts, true);
}
function iconGears(t = 0, o = {}) {
  const c = o.color ?? C.teal, spin = o.spin ?? 1;
  return [
    G({ x: -18, y: 6, r: t * 40 * spin }, path(gearPath(40, 10), { fill: c }), circle(0, 0, 13, { fill: C.card })),
    G({ x: 38, y: -30, r: -t * 64 * spin + 12 }, path(gearPath(25, 8), { fill: c, o: 0.75 }), circle(0, 0, 8, { fill: C.card })),
  ].join('');
}
function iconServer(t = 0, o = {}) {
  const c = o.color ?? C.blue, w = o.w ?? 130, h = o.h ?? 150;
  const out = [shadowCard(-w / 2, -h / 2, w, h, { fill: c, rx: 14, stroke: 'none' })];
  for (let i = 0; i < 3; i++) {
    const y = -h / 2 + 18 + i * (h - 30) / 3;
    out.push(rect(-w / 2 + 14, y, w - 28, (h - 30) / 3 - 10, { rx: 6, fill: 'rgba(255,255,255,0.14)' }));
    const on = Math.sin(t * 5 + i * 2.1) > -0.2;
    out.push(circle(w / 2 - 26, y + ((h - 30) / 3 - 10) / 2, 5, { fill: on ? C.tealLight : C.ink2 }));
    out.push(rect(-w / 2 + 26, y + ((h - 30) / 3 - 10) / 2 - 3, w * 0.35, 6, { rx: 3, fill: 'rgba(255,255,255,0.35)' }));
  }
  return out.join('');
}
function magnifier(o = {}) {
  const c = o.color ?? C.ink;
  return [circle(0, 0, 34, { fill: 'rgba(255,255,255,0.35)', stroke: c, sw: 8 }), line(24, 24, 58, 58, { stroke: c, sw: 12 })].join('');
}
function checkMark(p, o = {}) { return drawPath('M-22 2 L-6 18 L24 -16', p, { stroke: o.color ?? C.teal, sw: o.sw ?? 9 }); }
function crossMark(p, o = {}) {
  const sz = o.size ?? 60;
  return [drawPath(`M${-sz} ${-sz} L${sz} ${sz}`, clamp(p * 2), { stroke: o.color ?? C.coral, sw: o.sw ?? 14 }),
    drawPath(`M${sz} ${-sz} L${-sz} ${sz}`, clamp(p * 2 - 1), { stroke: o.color ?? C.coral, sw: o.sw ?? 14 })].join('');
}
function tapeStrip(w = 70, o = {}) {
  const h = o.h ?? 22;
  const zig = (x0, dir) => Array.from({ length: 5 }, (_, i) => [x0 + (i % 2 ? 4 : 0) * dir, -h / 2 + i * h / 4]);
  const left = zig(-w / 2, -1), right = zig(w / 2, 1).reverse();
  return path(poly([...left, ...right], true), { fill: o.color ?? C.mustard, o: o.o ?? 0.85 });
}
function puzzlePiece(o = {}) {
  const c = o.color ?? C.teal, s = o.size ?? 60;
  const d = `M${-s} ${-s} L${-s * 0.25} ${-s} C${-s * 0.3} ${-s * 1.5} ${s * 0.3} ${-s * 1.5} ${s * 0.25} ${-s} L${s} ${-s} L${s} ${-s * 0.25} C${s * 1.5} ${-s * 0.3} ${s * 1.5} ${s * 0.3} ${s} ${s * 0.25} L${s} ${s} L${-s} ${s} Z`;
  return path(d, { fill: c, stroke: o.stroke, sw: o.stroke ? 4 : undefined });
}
function priceTag(label, o = {}) {
  const w = o.w ?? 170, h = 64;
  return [
    path(`M0 0 L28 ${-h / 2} L${w} ${-h / 2} Q${w + 10} ${-h / 2} ${w + 10} ${-h / 2 + 10} L${w + 10} ${h / 2 - 10} Q${w + 10} ${h / 2} ${w} ${h / 2} L28 ${h / 2} Z`, { fill: o.fill ?? C.mustard }),
    circle(22, 0, 7, { fill: C.paper }),
    T(label, 42 + (w - 32) / 2, 12, { font: 'mono', size: 30, weight: 600, fill: C.ink, anchor: 'middle' }),
  ].join('');
}
function robot(t, o = {}) {
  const c = o.color ?? C.plum, look = o.look ?? 0, typing = o.typing ?? 0;
  const bt = (t + 1.1) % 4.1; const blink = bt < 0.12 ? Math.abs(bt - 0.06) / 0.06 : 1;
  const tap = typing ? Math.sin(t * 22) * 5 : 0;
  return [
    line(0, -212, 0, -182, { stroke: C.ink2, sw: 5 }),
    circle(0, -218, 10, { fill: C.gold }),
    circle(0, -218, 22, { fill: 'url(#gGlow)', o: 0.7 }),
    rect(-66, -186, 132, 104, { rx: 30, fill: c }),
    rect(-50, -166, 100, 58, { rx: 20, fill: C.night }),
    ellipse(-18 + look * 6, -137, 8, 9 * blink, { fill: C.tealLight }),
    ellipse(18 + look * 6, -137, 8, 9 * blink, { fill: C.tealLight }),
    rect(-8, -84, 16, 12, { fill: c }),
    rect(-54, -74, 108, 84, { rx: 24, fill: c }),
    circle(0, -38, 11, { fill: C.plumLight }),
    path(`M-54 -52 Q-78 -24 -46 ${-8 + tap}`, { stroke: c, sw: 18 }),
    path(`M54 -52 Q78 -24 46 ${-8 - tap}`, { stroke: c, sw: 18 }),
  ].join('');
}
// laptop seen from behind (lid towards viewer)
function laptopBack(o = {}) {
  const w = o.w ?? 160, h = o.h ?? 100;
  return [
    path(`M${-w / 2 + 8} ${-h} L${w / 2 - 8} ${-h} Q${w / 2} ${-h} ${w / 2} ${-h + 8} L${w / 2 + 6} -6 L${-w / 2 - 6} -6 L${-w / 2} ${-h + 8} Q${-w / 2} ${-h} ${-w / 2 + 8} ${-h} Z`, { fill: o.color ?? '#C9CED6' }),
    circle(0, -h / 2 - 3, 9, { fill: 'rgba(255,255,255,0.7)' }),
    rect(-w / 2 - 14, -8, w + 28, 10, { rx: 5, fill: '#AEB4BE' }),
  ].join('');
}
// laptop seen from the front (screen towards viewer)
function laptopFront(t, o = {}) {
  const w = o.w ?? 200, h = o.h ?? 128;
  return [
    rect(-w / 2, -h - 8, w, h, { rx: 10, fill: '#3A4458' }),
    rect(-w / 2 + 10, -h + 2, w - 20, h - 20, { rx: 4, fill: o.screen ?? C.night }),
    o.inner || '',
    path(`M${-w / 2 - 22} -8 L${w / 2 + 22} -8 L${w / 2 + 34} 6 L${-w / 2 - 34} 6 Z`, { fill: '#AEB4BE' }),
  ].join('');
}
function desk(w = 700, o = {}) {
  return [
    rect(-w / 2 + 30, 8, 16, 120, { fill: '#B08A5E' }), rect(w / 2 - 46, 8, 16, 120, { fill: '#B08A5E' }),
    rect(-w / 2, -4, w, 22, { rx: 8, fill: o.color ?? '#D6B384' }),
    rect(-w / 2, 12, w, 6, { rx: 3, fill: '#B8925F' }),
  ].join('');
}
function speechBubble(w, h, o = {}) {
  const tail = o.tail ?? 'left';
  const x = -w / 2, y = -h / 2, r = Math.min(22, h / 2);
  // tail: base from a to b along the bottom edge, tip below
  const [a, tip, b] = tail === 'left' ? [x + 30, x + 6, x + 62] : tail === 'right' ? [x + w - 62, x + w - 6, x + w - 30] : [-18, 0, 18];
  const d = `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
    ` H${Math.max(a, b)} L${tip} ${y + h + 28} L${Math.min(a, b)} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  return [
    G({ x: 2, y: 6 }, path(d, { fill: 'rgba(30,42,58,0.08)' })),
    path(d, { fill: o.fill ?? C.card, stroke: o.stroke ?? 'rgba(30,42,58,0.18)', sw: 2 }),
  ].join('');
}
function thoughtBubble(w, h, o = {}) {
  const fill = o.fill ?? C.card, stroke = o.stroke ?? 'rgba(30,42,58,0.18)';
  const tx = o.tailX ?? -w * 0.28, ty = h / 2;
  return [
    ellipse(2, 6, w / 2, h / 2, { fill: 'rgba(30,42,58,0.08)' }),
    ellipse(0, 0, w / 2, h / 2, { fill, stroke, sw: o.dash ? 3 : 2, dash: o.dash }),
    circle(tx * 0.9, ty + 16, 11, { fill, stroke, sw: 2 }),
    circle(tx * 1.15, ty + 40, 6.5, { fill, stroke, sw: 2 }),
  ].join('');
}
function binder(o = {}) {
  const c = o.color ?? C.blue;
  return [
    rect(-70 + 3, -95 + 8, 140, 190, { rx: 10, fill: 'rgba(30,42,58,0.12)' }),
    rect(-70, -95, 140, 190, { rx: 10, fill: c }),
    rect(-70, -95, 26, 190, { rx: 8, fill: 'rgba(0,0,0,0.18)' }),
    rect(-30, -60, 84, 44, { rx: 6, fill: C.card }),
    T('POLICY', 12, -32, { font: 'sans', size: 17, weight: 800, fill: c, anchor: 'middle', ls: 2 }),
    T('vol. 3', 12, 60, { font: 'serif', size: 20, italic: true, fill: 'rgba(255,255,255,0.8)', anchor: 'middle' }),
  ].join('');
}
function stickyNote(text, o = {}) {
  const w = o.w ?? 190, h = o.h ?? 110;
  const lines = Array.isArray(text) ? text : [text];
  return G({ r: o.r ?? -4 }, [
    rect(-w / 2 + 3, -h / 2 + 6, w, h, { fill: 'rgba(30,42,58,0.12)' }),
    rect(-w / 2, -h / 2, w, h, { fill: o.fill ?? '#FFE58F' }),
    rect(-w / 2, -h / 2, w, 14, { fill: 'rgba(0,0,0,0.05)' }),
    lines.map((l, i) => T(l, 0, -h / 2 + 44 + i * 34, { font: 'hand', size: o.size ?? 32, weight: 700, fill: C.ink, anchor: 'middle' })),
  ]);
}
function heartbeat(t, o = {}) {
  const w = o.w ?? 260, alive = o.alive ?? 1, col = o.color ?? C.teal;
  const pts = [];
  const speed = 160;
  for (let x = 0; x <= w; x += 4) {
    const ph = ((x + t * speed) % 130) / 130;
    let y = 0;
    if (ph > 0.42 && ph < 0.47) y = -10;
    else if (ph >= 0.47 && ph < 0.52) y = 34;
    else if (ph >= 0.52 && ph < 0.58) y = -44;
    else if (ph >= 0.58 && ph < 0.63) y = 14;
    pts.push([x - w / 2, y * alive]);
  }
  return [
    rect(-w / 2 - 20, -62, w + 40, 124, { rx: 16, fill: C.night }),
    path(poly(pts), { stroke: col, sw: 4 }),
  ].join('');
}
function loopArrows(t, o = {}) {
  const r = o.r ?? 48, c = o.color ?? C.teal, spin = o.spin ?? 0;
  const arc = (a0, a1) => {
    const p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r];
    return `M${r2(p0[0])} ${r2(p0[1])} A${r} ${r} 0 0 1 ${r2(p1[0])} ${r2(p1[1])}`;
  };
  const head = a => {
    const x = Math.cos(a) * r, y = Math.sin(a) * r; const tx = -Math.sin(a), ty = Math.cos(a);
    return path(`M${r2(x + tx * 16)} ${r2(y + ty * 16)} L${r2(x + Math.cos(a) * 12)} ${r2(y + Math.sin(a) * 12)} L${r2(x - Math.cos(a) * 12)} ${r2(y - Math.sin(a) * 12)} Z`, { fill: c });
  };
  return G({ r: spin }, path(arc(0.25, Math.PI - 0.35), { stroke: c, sw: 9 }), head(Math.PI - 0.35),
    path(arc(Math.PI + 0.25, 2 * Math.PI - 0.35), { stroke: c, sw: 9 }), head(2 * Math.PI - 0.35));
}
// numbered badge
function badge(n, o = {}) {
  return [circle(0, 0, o.r ?? 26, { fill: o.fill ?? C.ink }), T(String(n), 0, 10, { font: 'sans', size: o.size ?? 28, weight: 800, fill: o.color ?? C.paper, anchor: 'middle' })].join('');
}
function pill(text, o = {}) {
  const size = o.size ?? 22;
  const w = measure(text, size, 'sans', 700) + 36;
  return [rect(-w / 2, -size, w, size * 2, { rx: size, fill: o.fill ?? 'none', stroke: o.stroke ?? C.goldDeep, sw: 2.5 }),
    T(text, 0, size * 0.36, { font: 'sans', size, weight: 700, fill: o.color ?? C.goldDeep, anchor: 'middle', ls: 1 })].join('');
}
// hand-drawn looking arrow from (x1,y1) to (x2,y2)
function handArrow(x1, y1, x2, y2, p, o = {}) {
  const d = arcPath(x1, y1, x2, y2, o.bend ?? 0.2);
  const [ax, ay] = quadPoint(x1, y1, x2, y2, o.bend ?? 0.2, 0.9);
  const ang = Math.atan2(y2 - ay, x2 - ax);
  const hs = o.head ?? 18;
  const hp = clamp((p - 0.85) / 0.15);
  const headD = `M${r2(x2 - Math.cos(ang - 0.5) * hs)} ${r2(y2 - Math.sin(ang - 0.5) * hs)} L${r2(x2)} ${r2(y2)} L${r2(x2 - Math.cos(ang + 0.5) * hs)} ${r2(y2 - Math.sin(ang + 0.5) * hs)}`;
  return [drawPath(d, p, { stroke: o.color ?? C.ink, sw: o.sw ?? 4 }), hp > 0 ? drawPath(headD, hp, { stroke: o.color ?? C.ink, sw: o.sw ?? 4 }) : ''].join('');
}
// scribbled underline
function underline(x, y, w, p, o = {}) {
  const d = `M${x} ${y} C${x + w * 0.3} ${y + 5} ${x + w * 0.6} ${y - 4} ${x + w} ${y + 2}`;
  return drawPath(d, p, { stroke: o.color ?? C.gold, sw: o.sw ?? 7 });
}
