// Scenes: cost, decay, life, revival (Naur's sections 5 and 6: costs of modification, decay, program life, death and revival).
// Wrapped in an IIFE so helpers stay local to this file. Timing comes only from cues, lines and scene bounds.
'use strict';
(() => {

// ================================================================== local helpers
const GREY = '#A9ADB3';
const WOOD = '#B08A5E', WOOD_D = '#8A6A45';
// serif headline centred on the stage
const headline = (segs, o = {}) => richText(segs, 960, o.y ?? 150, { font: 'serif', size: o.size ?? 56, weight: 600, anchor: 'middle' });
// hand-lettered label (centred by default)
const hand = (s, x, y, o = {}) => T(s, x, y, { font: 'hand', size: 46, weight: 700, anchor: 'middle', fill: C.ink2, ...o });
const frac = v => v - Math.floor(v);
// visible from a (fade in di) until b (fade out do_ starting at b)
const win = (t, a, b, di = 0.45, do_ = 0.4) => Math.min(P(t, a, di, 'out'), 1 - P(t, b, do_, 'inOut'));
// damped swing in degrees after t0 (the price-tag recipe)
const swing = (t, t0, amp = 26) => { const lt = t - t0; return lt <= 0 ? 0 : amp * Math.exp(-3 * lt) * Math.sin(lt * 9); };
// start time of a spoken word in line li (fb when the script no longer has it)
function wordAt(S, li, word, fb) {
  const L = S.line(li);
  const w = L && L.words.find(x => String(x.w).toLowerCase().replace(/[^a-z0-9']/g, '') === word);
  return w ? w.start : fb;
}
// teal success badge with a tick, centred (p 0…1)
function tickBadge(p, r = 26) {
  if (p <= 0) return '';
  return G({ s: lerp(0.4, 1, Ease.outBack(clamp(p * 1.3))), o: clamp(p * 3) },
    circle(0, 0, r, { fill: C.teal }), circle(0, 0, r, { stroke: C.card, sw: 3 }),
    G({ s: r / 34 }, checkMark(clamp(p * 1.6 - 0.3), { color: C.card, sw: 8 })));
}
// a hand-drawn loop around the origin, drawn on with p (gold ring, coral critique mark)
function ringMark(rx, ry, p, o = {}) {
  if (p <= 0) return '';
  const pts = [], N = 30, a0 = o.a0 ?? -2.2;
  for (let i = 0; i < N; i++) {
    const a = a0 + (i / (N - 1)) * Math.PI * 2.14, k = 1 + 0.045 * Math.sin(i * 1.9 + (o.seed ?? 0));
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  return drawPath(smooth(pts), p, { stroke: o.color ?? C.coral, sw: o.sw ?? 5 });
}
// a price tag hanging from a pin at the origin; sx flips it on its string
const hangTag = (label, w, r, o = {}) => G({ r, s: o.s ?? 1 }, circle(0, 0, 4, { fill: C.ink2 }),
  G({ sx: o.sx ?? 1, sy: 1 }, line(0, 0, 12, 0, { stroke: C.ink2, sw: 2.5 }), G({ x: 8 }, priceTag(label, { w, fill: o.fill }))));
// rubber stamp with a paper backing, so it stays legible over whatever it lands on
function slam(text, p, o = {}) {
  if (p <= 0) return '';
  const size = o.size ?? 34, ls = size * 0.12, q = clamp(p);
  const w = measure(text, size, 'sans', 800) + ls * text.length + 48, h = size * 1.75;
  return G({ r: o.rot ?? -7, s: lerp(1.8, 1, Ease.out(q)), o: clamp(q * 2.5) * (o.back ?? 0.9) }, rect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, { rx: 14, fill: C.paper })) + stamp(text, p, o);
}
// small coral change-request card, centred (about 150×100)
function reqCard(o = {}) {
  const w = 150, h = 100;
  return [
    rect(-w / 2 + 3, -h / 2 + 7, w, h, { rx: 12, fill: 'rgba(30,42,58,0.10)' }),
    rect(-w / 2, -h / 2, w, h, { rx: 12, fill: C.card, stroke: o.stroke ?? C.coral, sw: 3.5 }),
    T('CHANGE', 0, -12, { size: 22, weight: 800, fill: C.coral, anchor: 'middle', ls: 2 }),
    rect(-52, 6, 104, 8, { rx: 4, fill: C.ink3, o: 0.6 }), rect(-52, 24, 72, 8, { rx: 4, fill: C.ink3, o: 0.6 }),
  ].join('');
}
// a "?" token
const qMark = (p, o = {}) => (p <= 0 ? '' : G({ s: lerp(0.3, 1, Ease.outBack(clamp(p))), o: clamp(p * 2.5) },
  circle(0, 0, o.r ?? 22, { fill: o.fill ?? C.card, stroke: o.stroke ?? C.ink3, sw: 3 }),
  T('?', 0, (o.r ?? 22) * 0.5, { font: 'serif', size: (o.r ?? 22) * 1.5, weight: 700, fill: o.color ?? C.ink2, anchor: 'middle' })));

// ================================================================== COST (chapter: Change and decay)
// A text editor whose cursor keeps deleting and retyping lines. Centred, w×h.
function editorWindow(t, o = {}) {
  const { w = 760, h = 450, seed = 81, t0 = 0, cyc = 0.56 } = o;
  const x = -w / 2, y = -h / 2, n = 11, lineH = 31, top = y + 84, avail = w - 130;
  const out = [shadowCard(x, y, w, h, { rx: 18 })];
  out.push(path(`M${x} ${y + 18} Q${x} ${y} ${x + 18} ${y} L${x + w - 18} ${y} Q${x + w} ${y} ${x + w} ${y + 18} L${x + w} ${y + 52} L${x} ${y + 52} Z`, { fill: C.paper2 }));
  out.push(circle(x + 28, y + 26, 7, { fill: C.coral }), circle(x + 50, y + 26, 7, { fill: C.mustard }), circle(x + 72, y + 26, 7, { fill: C.teal }));
  out.push(T('program', x + w / 2, y + 34, { font: 'mono', size: 22, weight: 600, fill: C.ink2, anchor: 'middle' }));
  const lt = t - t0, k = lt > 0 ? Math.floor(lt / cyc) : -1, ph = lt > 0 ? frac(lt / cyc) : 0;
  const lineOf = kk => (kk * 5 + 2) % n;
  const li = k >= 0 ? lineOf(k) : -1;
  for (let i = 0; i < n; i++) {
    const ly = top + i * lineH;
    let v = 0;   // how many times this line has been retyped so far
    for (let kk = 0; kk <= k; kk++) if (lineOf(kk) === i && (kk < k || ph >= 0.42)) v++;
    const L = codeLines(seed + v * 13, n)[i];
    let lp = 1;
    if (i === li) {
      lp = ph < 0.3 ? 1 - ph / 0.3 : ph < 0.42 ? 0 : clamp((ph - 0.42) / 0.5);
      out.push(rect(x + 62, ly - 8, w - 78, lineH - 3, { rx: 6, fill: C.sky, o: 0.75 }));
    }
    out.push(T(String(i + 1), x + 50, ly + 14, { font: 'mono', size: 22, fill: C.ink3, anchor: 'end', o: 0.75 }));
    const lx = x + 78 + L.ind * 22;
    let endX = lx;
    for (const [sx, sw, col] of L.segs) {
      const segW = Math.min(sw * avail, Math.max(0, (lp * 0.92 - sx) * avail));
      if (segW > 0) { out.push(rect(lx + sx * avail, ly + 1, segW, 12, { rx: 6, fill: col, o: 0.82 })); endX = lx + sx * avail + segW; }
    }
    if (i === li) out.push(rect(endX + 5, ly - 6, 4, 24, { rx: 2, fill: C.ink }));
  }
  return out.join('');
}

function costEdit(t, S, c) {
  const out = [];
  // the claim, as the headline; struck and stamped FALSE
  const size = 56, part = 'cheap to change?';
  const hw = measure('Easy to edit, so ' + part, size, 'serif', 600), pw = measure(part, size, 'serif', 600);
  const sx0 = 960 + hw / 2 - pw;
  const eH = enter(t, S.start + 0.02, { dy: 14 });
  const dimH = 1 - 0.3 * P(t, c.notcost - 0.2, 0.5);
  out.push(G({ o: eH.o * dimH, y: eH.y }, headline([{ t: 'Easy to edit, so ' }, { t: part }], { size }),
    drawPath(`M${r2(sx0 - 10)} 137 C${r2(sx0 + pw * 0.3)} 128 ${r2(sx0 + pw * 0.7)} 145 ${r2(sx0 + pw + 12)} 131`, P(t, c.fals - 0.62, 0.35, 'inOut'), { stroke: C.coral, sw: 8 })));
  const sp = P(t, c.fals - 0.27, 0.26, 'linear');
  if (sp > 0) out.push(G({ x: sx0 + pw / 2 + 6, y: 222, o: dimH }, slam('FALSE', sp, { size: 64, rot: -9 })));
  // the editor: centred, then it slides left to make room for the head
  const slide = P(t, c.notcost - 0.6, 0.8, 'inOut');
  const ex = lerp(960, 580, slide), ey = lerp(600, 600, slide), es = lerp(1, 0.84, slide);
  const eE = enter(t, S.start + 0.02, { dy: 30, d: 0.6, from: 0.94 });
  const edDim = 1 - 0.25 * P(t, c.notcost + 0.4, 0.6);
  out.push(G({ x: ex, y: ey + eE.y, s: es * eE.s, o: eE.o * edDim }, editorWindow(t, { t0: S.start + 0.5 })));
  const lb1 = P(t, c.text - 0.25, 0.45);
  if (lb1 > 0) out.push(G({ o: lb1 * edDim, y: (1 - lb1) * 10 }, hand('program = text', ex, lerp(890, 860, slide), { size: 48, fill: C.ink })));
  // the head that holds the theory
  const hx = 1400, hy = 590, hs = 0.72;
  const eHd = enter(t, c.notcost - 0.4, { dy: 24, d: 0.6, from: 0.9 });
  const landT = c.notcost + 0.62;
  const glow = 1 + 0.6 * P(t, landT, 0.3) * (1 - P(t, landT + 0.9, 0.8));
  if (eHd.o > 0) {
    out.push(G({ x: hx, y: hy + eHd.y, o: eHd.o }, circle(-10, -30, 280, { fill: 'url(#gGlow)', o: 0.28 * glow }),
      G({ sx: -hs * eHd.s, sy: hs * eHd.s }, bigHead(t), constellation(t, HEAD_K(), { t0: c.notcost - 0.38, dur: 1.2, size: 7, lineW: 2.6, glow }))));
  }
  // the price tag: "$" on the editor, then it slides off to the head and turns into "$$$"
  const tagIn = P(t, c.easy - 0.15, 0.35);
  if (tagIn > 0) {
    const f = P(t, c.notcost - 0.12, 0.75, 'inOut');
    const p0 = [ex + 372 * es, ey - 214 * es], p1 = [hx + 92, hy - 80];
    const [px, py] = f > 0 ? quadPoint(p0[0], p0[1], p1[0], p1[1], 0.3, f) : p0;
    const big = f >= 0.5;
    const rot = 24 + swing(t, c.easy - 0.15, 30) + (f >= 1 ? swing(t, c.notcost + 0.63, 28) : 0) + wobble(t, 0.35, 2.5) + Math.sin(f * Math.PI) * -18;
    out.push(G({ x: px, y: py, o: tagIn, s: lerp(1.3, 1.25, f) }, hangTag(big ? '$$$' : '$', big ? 150 : 74, rot, { sx: Math.max(0.04, Math.abs(Math.cos(Math.PI * f))) })));
  }
  const lb2 = P(t, c.notcost + 0.5, 0.45);
  if (lb2 > 0) out.push(G({ o: lb2, y: (1 - lb2) * 10 }, hand('text was never the main cost', hx - 10, 905, { size: 46, fill: C.ink })));
  return out;
}

// A small house, ground centre at the origin (about 350×310). age greys it; grow raises the walls, then drops the roof.
function house(t, o = {}) {
  const { age = 0, grow = 1, lit = 0 } = o;
  const col = cc => (age > 0 ? mixColor(cc, GREY, age) : cc);
  const wallH = 196, w = 300, out = [];
  const g = clamp(grow / 0.65), rf = clamp((grow - 0.6) / 0.4);
  if (rf > 0) {
    const rb = Ease.outBack(rf);
    out.push(G({ y: -wallH - (1 - rb) * 70, o: clamp(rf * 2.5) }, rect(70, -104, 32, 64, { fill: col('#9C6B43') }),
      path(`M${-w / 2 - 26} 4 L0 -112 L${w / 2 + 26} 4 Z`, { fill: col(C.coral) }), rect(-w / 2 - 26, -2, w + 52, 12, { rx: 5, fill: col(C.coralDark) })));
  }
  if (g > 0) {
    const hh = wallH * g;
    out.push(rect(-w / 2 + 4, -hh + 8, w, hh - 8, { fill: 'rgba(30,42,58,0.10)' }));
    out.push(rect(-w / 2, -hh, w, hh, { fill: col('#EEDFC6'), stroke: col('#B89F7A'), sw: 3 }));
    if (g >= 1) {
      out.push(rect(-28, -112, 56, 112, { rx: 6, fill: col('#9C6B43') }), circle(15, -56, 4, { fill: col(C.gold) }));
      [-96, 96].forEach(wx => {
        out.push(rect(wx - 32, -162, 64, 56, { rx: 4, fill: col(lit > 0 ? mixColor(C.sky, C.goldLight, lit) : C.sky), stroke: col('#B89F7A'), sw: 3 }));
        out.push(line(wx, -162, wx, -106, { stroke: col('#B89F7A'), sw: 3 }), line(wx - 32, -134, wx + 32, -134, { stroke: col('#B89F7A'), sw: 3 }));
      });
    }
  }
  return out.join('');
}
// the house under renovation: old and greyed, a tarp, a boarded window, scaffolding and a ladder assembling from t0
function renovation(t, t0) {
  const out = [house(t, { age: 0.32 })];
  out.push(path('M-142 -214 L-52 -273 L-34 -246 L-122 -192 Z', { fill: C.blue, o: 0.9 }), line(-100, -242, -88, -222, { stroke: C.ink2, sw: 2 }), line(-70, -262, -58, -240, { stroke: C.ink2, sw: 2 }));
  out.push(G({ x: 96, y: -134, r: 18 }, rect(-40, -9, 80, 18, { rx: 3, fill: WOOD })), G({ x: 96, y: -134, r: -20 }, rect(-40, -9, 80, 18, { rx: 3, fill: WOOD_D })));
  out.push(path('M-112 -40 L-100 -62 L-114 -78 L-98 -104', { stroke: C.ink3, sw: 2.5 }));
  const parts = [
    ['M-176 0 L-176 -236', C.ink2, 6], ['M40 0 L40 -286', C.ink2, 6], ['M196 0 L196 -286', C.ink2, 6],
    ['M-186 -98 L206 -98', WOOD_D, 11], ['M-186 -200 L206 -200', WOOD_D, 11], ['M30 -278 L206 -278', C.ink2, 6],
    ['M40 -98 L196 -200', C.ink2, 4], ['M-176 -98 L40 -200', C.ink2, 4],
  ];
  parts.forEach(([d, col, sw], i) => out.push(drawPath(d, P(t, t0 + 0.1 + i * 0.07, 0.35, 'inOut'), { stroke: col, sw })));
  const lad = P(t, t0 + 0.55, 0.4, 'outBack');
  if (lad > 0) {
    const L = [line(0, 0, -18, -178, { stroke: WOOD_D, sw: 6 }), line(32, 0, 14, -178, { stroke: WOOD_D, sw: 6 })];
    for (let k = 1; k < 6; k++) { const yy = -k * 31, dx = -18 * k * 31 / 178; L.push(line(dx, yy, dx + 32, yy, { stroke: WOOD, sw: 4 })); }
    out.push(G({ x: 236, y: 0, r: lerp(20, 0, lad), o: clamp(lad * 3) }, L));
  }
  return out.join('');
}
function costBuild(t, S, c) {
  const out = [];
  const eH = enter(t, c.building - 0.3, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Altering can cost ' }, { t: 'more', italic: true, fill: C.coral }, { t: ' than rebuilding' }], { size: 56 })));
  out.push(drawPath('M150 884 L1770 884', P(t, c.building - 0.35, 0.7, 'inOut'), { stroke: C.paper3, sw: 10 }));
  // altering: the old house under renovation, with a big swinging tag
  const hx1 = 540, hx2 = 1400, gy = 880, hs = 1.3;
  const e1 = enter(t, c.building - 0.32, { d: 0.6, dy: 30 });
  out.push(G({ x: hx1, y: gy + e1.y, s: hs * e1.s, o: e1.o }, renovation(t, c.building - 0.3)));
  const tg1 = P(t, c.building + 0.2, 0.3);
  if (tg1 > 0) out.push(G({ x: hx1 + 196 * hs, y: gy - 278 * hs, o: tg1 }, hangTag('$$$$', 176, 30 + swing(t, c.building + 0.2, 34) + wobble(t, 0.4, 3), { s: 1.45 })));
  const l1 = P(t, c.building + 0.1, 0.4);
  if (l1 > 0) out.push(G({ o: l1 }, hand('altering', hx1, 965, { size: 46 })));
  // rebuilding: the same house, new, rising fast, with a small tag
  const grow = P(t, c.rebuild - 0.35, 0.75, 'linear');
  if (grow > 0) {
    const lit = P(t, c.rebuild + 0.35, 0.4);
    out.push(G({ x: hx2, y: gy, s: hs }, house(t, { grow, lit })));
    [[-120, -260], [150, -300], [200, -150]].forEach(([sx, sy], i) => {
      const sp = P(t, c.rebuild + 0.35 + i * 0.1, 0.4, 'outBack') * (1 - P(t, c.rebuild + 1.1 + i * 0.1, 0.5));
      if (sp > 0) out.push(sparkle(hx2 + sx * hs, gy + sy * hs, 18 * sp * (1 + 0.12 * Math.sin(t * 6 + i)), { fill: C.gold }));
    });
    const tg2 = P(t, c.rebuild + 0.3, 0.3);
    if (tg2 > 0) out.push(G({ x: hx2 + 160 * hs, y: gy - 196 * hs, o: tg2 }, hangTag('$$', 96, 30 + swing(t, c.rebuild + 0.3, 30) + wobble(t, 0.45, 2.5), { s: 1.1 })));
    const l2 = P(t, c.rebuild - 0.05, 0.4);
    if (l2 > 0) out.push(G({ o: l2 }, hand('rebuilding', hx2, 965, { size: 46 })));
  }
  return out;
}

// Program box bristling with knobs, switches, sliders and levers. Controls: [type, x, y] around the box centre.
const KNOBS = [
  ['knob', -165, -58], ['knob', -98, -58], ['dial', -14, -54], ['switch', 66, -58], ['switch', 114, -58], ['knob', 176, -58],
  ['slider', -122, 22], ['button', -16, 22], ['button', 26, 22], ['knob', 98, 22], ['switch', 168, 22],
  ['slider', -122, 94], ['knob', -16, 94], ['knob', 54, 94], ['button', 116, 94], ['switch', 170, 94],
  ['ant', -126, -130], ['ant', 20, -130], ['ant', 148, -130], ['lever', 220, -40], ['lever', 220, 58], ['crank', -220, 20],
  ['antd', -150, 130], ['antd', 60, 130], ['lever', -220, -70],
];
function knobControl(t, type, ph, grey, side = 1) {
  const col = cc => (grey > 0 ? mixColor(cc, GREY, grey) : cc);
  switch (type) {
    case 'knob': {
      const a = -40 + 38 * Math.sin(t * 1.4 + ph * 7);
      return [circle(1, 3, 21, { fill: 'rgba(30,42,58,0.16)' }), circle(0, 0, 21, { fill: col(C.blue) }), circle(0, 0, 13, { fill: C.card, o: 0.18 }),
        G({ r: a }, line(0, -2, 0, -16, { stroke: C.card, sw: 4 }))].join('');
    }
    case 'dial': {
      const a = -60 + 60 * Math.sin(t * 0.9 + ph * 3);
      return [path('M-34 8 A34 34 0 0 1 34 8 Z', { fill: C.card, stroke: col(C.ink2), sw: 3 }),
        ...[-60, -30, 0, 30, 60].map(d => G({ r: d }, line(0, -24, 0, -30, { stroke: col(C.ink3), sw: 2.5 }))),
        G({ y: 6, r: a }, line(0, 0, 0, -28, { stroke: col(C.coral), sw: 3.5 })), circle(0, 6, 4.5, { fill: col(C.ink2) })].join('');
    }
    case 'switch': {
      const on = Math.sin(t * 0.8 + ph * 5) > 0;
      return [rect(-12, -22, 24, 44, { rx: 12, fill: col(on ? C.teal : C.ink3) }), circle(0, on ? -10 : 10, 9, { fill: C.card })].join('');
    }
    case 'slider': {
      const v = 0.5 + 0.38 * Math.sin(t * 0.7 + ph * 3);
      return [rect(-52, -4, 104, 8, { rx: 4, fill: C.paper3 }), rect(-52, -4, 104 * v, 8, { rx: 4, fill: col(C.coral) }), rect(-52 + 104 * v - 8, -15, 16, 30, { rx: 5, fill: col(C.ink2) })].join('');
    }
    case 'button': {
      const lit = Math.sin(t * 2.6 + ph * 11) > 0.2;
      return [circle(0, 2, 14, { fill: 'rgba(30,42,58,0.16)' }), circle(0, 0, 14, { fill: col(lit ? C.tealLight : C.coralLight) }), circle(-4, -4, 4, { fill: C.card, o: 0.7 })].join('');
    }
    case 'ant': return [line(0, 0, 0, -34, { stroke: col(C.ink2), sw: 5 }), circle(0, -40, 10, { fill: col(C.plum) })].join('');
    case 'antd': return [line(0, 0, 0, 30, { stroke: col(C.ink2), sw: 5 }), rect(-14, 28, 28, 14, { rx: 5, fill: col(C.teal) })].join('');
    case 'lever': { const a = 6 * Math.sin(t * 1.1 + ph * 4); return G({ sx: side, sy: 1 }, G({ r: a }, line(0, 0, 40, -26, { stroke: col(C.ink2), sw: 6 }), circle(42, -28, 11, { fill: col(C.coral) }))); }
    case 'crank': { const a = t * 90 + ph * 50; return G({ x: -34, y: 0 }, line(34, 0, 0, 0, { stroke: col(C.ink2), sw: 6 }), G({ r: a }, line(0, 0, 0, 26, { stroke: col(C.ink2), sw: 5 }), circle(0, 30, 8, { fill: col(C.plum) }))); }
  }
  return '';
}
function knobBox(t, t0, greys) {
  const out = [];
  KNOBS.forEach(([type, x, y], i) => {
    if (!['ant', 'antd', 'lever', 'crank'].includes(type)) return;
    const p = P(t, t0 + i * 0.035, 0.4, 'outBack');
    if (p > 0) out.push(G({ x, y, s: p }, knobControl(t, type, i * 0.37, greys[i] || 0, x < 0 ? -1 : 1)));
  });
  out.push(rect(-84, -146, 64, 24, { rx: 8, fill: C.ink2 }), rect(-72, -140, 40, 6, { rx: 3, fill: C.night }));
  out.push(shadowCard(-220, -130, 440, 260, { rx: 22 }));
  out.push(T('program', -196, -96, { font: 'mono', size: 22, weight: 600, fill: C.ink2 }));
  KNOBS.forEach(([type, x, y], i) => {
    if (['ant', 'antd', 'lever', 'crank'].includes(type)) return;
    const p = P(t, t0 + i * 0.035, 0.4, 'outBack');
    if (p > 0) out.push(G({ x, y, s: p }, knobControl(t, type, i * 0.37, greys[i] || 0)));
  });
  return out.join('');
}
const coinFace = (s = 1) => G({ sx: s, sy: 1 }, circle(0, 0, 22, { fill: C.mustard, stroke: C.goldDeep, sw: 3 }), circle(0, 0, 15, { stroke: C.goldDeep, sw: 1.5, o: 0.55 }),
  T('$', 0, 8, { font: 'serif', size: 22, weight: 700, fill: C.goldDeep, anchor: 'middle' }));
// dashed icons for possible future needs
function futureIcon(kind) {
  const st = { stroke: C.ink3, sw: 3, dash: '5 5' };
  switch (kind) {
    case 'globe': return [circle(0, 0, 24, st), ellipse(0, 0, 10, 24, st), line(-24, 0, 24, 0, { stroke: C.ink3, sw: 3, dash: '5 5' })].join('');
    case 'phone': return [rect(-15, -26, 30, 52, { rx: 6, ...st }), circle(0, 18, 3, { fill: C.ink3 })].join('');
    case 'euro': return T('€', 0, 15, { font: 'serif', size: 46, weight: 700, fill: 'none', stroke: C.ink3, sw: 2, anchor: 'middle' });
    case 'chart': return [rect(-22, -2, 11, 22, st), rect(-5, -14, 11, 34, st), rect(12, -24, 11, 44, st)].join('');
    default: return [path('M-24 12 Q-30 -6 -12 -8 Q-6 -24 10 -16 Q26 -18 26 0 Q34 12 20 14 Z', st)].join('');
  }
}
const FUTS = [
  { k: 16, to: [1210, 330], icon: 'globe' }, { k: 18, to: [1450, 300], icon: 'phone' }, { k: 19, to: [1670, 390], icon: 'euro' },
  { k: 20, to: [1590, 600], icon: 'chart' }, { k: 5, to: [1350, 530], icon: 'cloud' },
];
function costFlex(t, S, c) {
  const out = [];
  const eH = enter(t, c.flex - 0.3, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Built-in flexibility costs money ' }, { t: 'now', italic: true, fill: C.coral }], { size: 56 })));
  const bx = lerp(930, 760, P(t, c.needs - 1.35, 0.8, 'inOut')), by = 615, bs = 1.3;
  const bT = FUTS.map((f, i) => c.needs - 0.95 + i * 0.18);
  const greys = [];
  FUTS.forEach((f, i) => { greys[f.k] = 0.8 * P(t, bT[i] + 1.25, 0.5); });
  const eB = enter(t, c.flex - 0.3, { d: 0.5, dy: 30 });
  out.push(G({ x: bx, y: by + eB.y, s: bs * eB.s, o: eB.o }, knobBox(t, c.flex - 0.2, greys)));
  // coins leave a stack and pour into the box: paid now
  const sx = 320, sy = 880, N = 16, fly = 12, dz = 17, gap = 0.12;
  const eS = enter(t, c.flex - 0.1, { d: 0.5 });
  const st = [];
  for (let k = 0; k < N; k++) {
    const j = N - 1 - k;   // the top coin leaves first
    const dep = c.futures - 0.3 + j * gap;
    if (j < fly && t > dep) continue;
    st.push(ellipse(sx, sy - k * dz + 7, 46, 15, { fill: C.goldDeep }), ellipse(sx, sy - k * dz, 46, 15, { fill: C.mustard, stroke: C.goldDeep, sw: 2.5 }));
  }
  if (eS.o > 0) out.push(G({ o: eS.o, y: eS.y }, st));
  for (let j = 0; j < fly; j++) {
    const dep = c.futures - 0.3 + j * gap, f = P(t, dep, 0.75, 'inOut');
    if (f <= 0 || f >= 1) continue;
    const k = N - 1 - j;
    const [x, y] = quadPoint(sx, sy - k * dz, bx - 52 * bs, by - 140 * bs, -0.45, f);
    out.push(G({ x, y, s: 1.3, o: clamp((1 - f) * 6) }, coinFace(0.3 + 0.7 * Math.abs(Math.cos((t - dep) * 6)))));
  }
  // possible futures float up from the knobs, and fade unused
  FUTS.forEach((fu, i) => {
    const p = P(t, bT[i], 0.9, 'out');
    if (p <= 0) return;
    const [, kx, ky] = KNOBS[fu.k];
    const from = [bx + kx * bs, by + ky * bs];
    const fade = 1 - P(t, bT[i] + 1.25, 0.5);
    const x = lerp(from[0], fu.to[0], p) + wobble(t, 0.3, 4, i), y = lerp(from[1], fu.to[1], p) - Math.max(0, t - bT[i] - 0.9) * 14;
    const o = clamp(p * 3) * fade;
    if (o <= 0) return;
    out.push(G({ o: o * 0.6 }, line(from[0], from[1], x, y + 50, { stroke: C.ink3, sw: 2, dash: '4 7' })));
    out.push(G({ x, y, s: lerp(0.3, 1.12, p) * (1 + 0.08 * (1 - fade)), o }, thoughtBubble(150, 108, { fill: C.card, stroke: C.ink3, dash: '8 6', tailX: -34 }),
      futureIcon(fu.icon), T('?', 50, -22, { font: 'serif', size: 30, weight: 700, fill: C.ink3, anchor: 'middle' })));
  });
  const lb = P(t, c.needs - 0.25, 0.45);
  if (lb > 0) out.push(G({ o: lb, y: (1 - lb) * 10 }, hand('for needs that may never come', 1400, 790, { size: 46, fill: C.ink2 })));
  return out;
}

SCENES.cost = {
  render(t, S) {
    const c = {
      text: S.cue('text'), fals: S.cue('false'), notcost: S.cue('notcost'), building: S.cue('building'),
      rebuild: S.cue('rebuild'), flex: S.cue('flex'), futures: S.cue('futures'),
    };
    c.easy = wordAt(S, 0, 'easy', lerp(c.text, c.fals, 0.3));
    c.needs = wordAt(S, 1, 'needs', c.futures + 1.6);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const o1 = 1 - P(t, c.building - 0.62, 0.42, 'inOut');
    if (o1 > 0) out.push(G({ o: o1, y: -12 * (1 - o1) }, costEdit(t, S, c)));
    const o2 = 1 - P(t, c.flex - 0.6, 0.4, 'inOut');
    if (t > c.building - 0.4 && o2 > 0) out.push(G({ o: o2, y: -12 * (1 - o2) }, costBuild(t, S, c)));
    if (t > c.flex - 0.35) out.push(costFlex(t, S, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n);
    const easy = wordAt(S, 0, 'easy', lerp(c('text'), c('false'), 0.3)), needs = wordAt(S, 1, 'needs', c('futures') + 1.6);
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: S.start + 0.5, type: 'typing', dur: 2.2, gain: 0.3 },
      { t: c('text') - 0.25, type: 'pop', pitch: 1.0, gain: 0.5 }, { t: easy - 0.15, type: 'swing', gain: 0.5 },
      { t: easy + 0.4, type: 'typing', dur: 1.6, gain: 0.25 },
      { t: c('false') - 0.62, type: 'scribble', dur: 0.35, gain: 0.55 }, { t: c('false') - 0.13, type: 'thud', gain: 0.85 },
      { t: c('notcost') - 0.6, type: 'whoosh', dur: 0.6, gain: 0.4 }, { t: c('notcost') - 0.25, type: 'chime', note: 2, gain: 0.55 },
      { t: c('notcost') - 0.12, type: 'swish', gain: 0.45 }, { t: c('notcost') + 0.63, type: 'swing', gain: 0.5 },
      { t: c('building') - 0.62, type: 'whoosh', dur: 0.45, gain: 0.35 }, { t: c('building') - 0.3, type: 'pop', pitch: 0.8, gain: 0.5 },
      { t: c('building') - 0.1, type: 'creak', dur: 0.6, gain: 0.45 }, { t: c('building') + 0.2, type: 'swing', gain: 0.6 },
      { t: c('rebuild') - 0.35, type: 'rise', dur: 0.5, gain: 0.4 }, { t: c('rebuild') + 0.1, type: 'thud', gain: 0.45 },
      { t: c('rebuild') + 0.3, type: 'swing', gain: 0.35 },
      { t: c('flex') - 0.6, type: 'whoosh', dur: 0.45, gain: 0.35 },
      ...[0, 1, 2, 3].map(i => ({ t: c('flex') - 0.2 + i * 0.18, type: 'click', gain: 0.4, pitch: 0.9 + i * 0.1 })),
      ...[0, 2, 4, 6, 8].map(j => ({ t: c('futures') - 0.3 + j * 0.15 + 0.62, type: 'tick', gain: 0.35, pitch: 1.5 + (j % 3) * 0.15 })),
      ...[0, 1, 2].map(i => ({ t: needs - 0.95 + i * 0.36, type: 'pop', pitch: 1.2 + i * 0.1, gain: 0.3 })),
      { t: needs + 0.4, type: 'fizzle', gain: 0.3 },
    ];
  },
};

// ================================================================== DECAY
// A small program: a card with a structure of blocks. The change adds a part: the natural slot (ext null) or a patch rect.
const PROG_CELLS = [[-62, 30, 'blue'], [0, 30, 'teal'], [62, 30, 'plum'], [-62, -30, 'teal'], [0, -30, 'blue']];
const PROG_LINKS = [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4]];
function patchRect(t, pr, p, i, grey) {
  const col = cc => (grey > 0 ? mixColor(cc, GREY, grey) : cc);
  const fill = mixColor(C.coralLight, col(C.mustard), clamp(p));
  const tp = clamp(p * 1.6 - 0.4);
  return G({ x: pr.x, y: pr.y, r: pr.r + (p > 0 ? Math.sin(t * 2.2 + i * 1.7) * 3 * clamp(p) : 0) },
    rect(-pr.w / 2, -pr.h / 2, pr.w, pr.h, { rx: 6, fill, stroke: 'rgba(30,42,58,0.25)', sw: 2 }),
    tp > 0 ? G({ x: -pr.w / 2 + 6, y: -pr.h / 2 + 5, r: -35, s: tp }, tapeStrip(34, { h: 14, color: col(C.mustard) })) : '',
    tp > 0 ? G({ x: pr.w / 2 - 6, y: pr.h / 2 - 5, r: -35, s: tp }, tapeStrip(34, { h: 14, color: col(C.mustard) })) : '');
}
function miniProg(t, o = {}) {
  const { part = 0, nat = 0, patch = 0, ext = null, grey = 0, jit = 0, extra = [], glow = 0, ring = 0, flow = 0, trace = 0 } = o;
  const col = cc => (grey > 0 ? mixColor(cc, GREY, grey) : cc);
  const jy = i => jit * Math.sin(i * 2.3 + t * 1.6) * 6;
  const out = [];
  if (glow > 0) out.push(circle(0, 0, 200, { fill: 'url(#gGlow)', o: 0.5 * glow }));
  out.push(shadowCard(-115, -88, 230, 176, { rx: 16, fill: col(C.card) }));
  if (ring > 0) out.push(rect(-115, -88, 230, 176, { rx: 16, stroke: C.gold, sw: 4, o: ring }));
  PROG_LINKS.forEach(([a, b]) => { const A = PROG_CELLS[a], B = PROG_CELLS[b]; out.push(line(A[0], A[1] + jy(a), B[0], B[1] + jy(b), { stroke: col(C.ink3), sw: 4 })); });
  if (flow > 0) PROG_LINKS.forEach(([a, b], i) => {
    const A = PROG_CELLS[a], B = PROG_CELLS[b], f = frac(t * 0.8 + i * 0.29);
    out.push(circle(lerp(A[0], B[0], f), lerp(A[1], B[1], f), 4, { fill: C.gold, o: flow * Math.sin(f * Math.PI) }));
  });
  if (trace > 0) PROG_LINKS.forEach(([a, b], i) => { const A = PROG_CELLS[a], B = PROG_CELLS[b]; out.push(drawPath(`M${A[0]} ${A[1]} L${B[0]} ${B[1]}`, clamp(trace * 2.2 - i * 0.25), { stroke: C.goldDeep, sw: 5 })); });
  PROG_CELLS.forEach(([x, y, cn], i) => out.push(rect(x - 24, y - 24 + jy(i), 48, 48, { rx: 10, fill: col(C[cn]) })));
  if (trace > 0) PROG_CELLS.forEach(([x, y], i) => { const p = clamp(trace * 2.5 - i * 0.3); if (p > 0) out.push(rect(x - 28, y - 28, 56, 56, { rx: 13, stroke: C.gold, sw: 3, o: p })); });
  if (part > 0 && !ext) {   // the natural extension: completes the structure
    const s = lerp(0.4, 1, Ease.outBack(clamp(part))) * (1 + 0.1 * Math.sin(Math.PI * clamp(nat * 1.5)));
    if (nat > 0) out.push(circle(62, -30, 46, { fill: 'url(#gGlow)', o: 0.9 * nat }));
    out.push(drawPath('M62 -30 L0 -30', clamp(nat * 1.4), { stroke: C.goldDeep, sw: 4 }), drawPath('M62 -30 L62 30', clamp(nat * 1.4 - 0.2), { stroke: C.goldDeep, sw: 4 }));
    out.push(G({ x: 62, y: -30, s, o: clamp(part * 3) }, rect(-24, -24, 48, 48, { rx: 10, fill: mixColor(C.coralLight, C.gold, clamp(nat * 1.3)) }),
      nat > 0 ? rect(-24, -24, 48, 48, { rx: 10, stroke: C.goldDeep, sw: 3, o: nat }) : ''));
  } else if (part > 0 && ext) {
    out.push(G({ s: 1, o: clamp(part * 3) }, line(ext.x * 0.55, ext.y * 0.55, ext.x, ext.y, { stroke: C.ink3, sw: 2.5, dash: '4 5' }), patchRect(t, ext, patch, 0, grey)));
  }
  extra.forEach((pr, i) => out.push(patchRect(t, pr, 1, i + 1, grey)));
  return out.join('');
}
function changeCard(o = {}) {
  const w = o.w ?? 420, h = o.h ?? 92;
  return [
    rect(-w / 2 + 3, -h / 2 + 8, w, h, { rx: 16, fill: 'rgba(30,42,58,0.10)' }),
    rect(-w / 2, -h / 2, w, h, { rx: 16, fill: C.card, stroke: C.coral, sw: 4 }),
    rect(-w / 2 + 16, -h / 2 + 16, 8, h - 32, { rx: 4, fill: C.coral }),
    T('CHANGE REQUEST', 14, 11, { size: 28, weight: 800, fill: C.coral, anchor: 'middle', ls: 5 }),
  ].join('');
}
const VAR_X = [370, 665, 960, 1255, 1550], VAR_Y = 455, NAT = 1;
const VAR_EXT = [{ x: -122, y: -24, w: 54, h: 42, r: -14 }, null, { x: -6, y: -98, w: 76, h: 34, r: -8 }, { x: -30, y: 90, w: 70, h: 36, r: -10 }, { x: 34, y: 4, w: 64, h: 38, r: 22 }];
const DECAY_PATCHES = [{ x: 118, y: -40, w: 54, h: 42, r: 14 }, { x: -10, y: -98, w: 76, h: 34, r: -8 }, { x: -120, y: 66, w: 56, h: 40, r: -18 },
  { x: 40, y: 6, w: 62, h: 38, r: 22 }, { x: 104, y: 80, w: 62, h: 34, r: -12 }, { x: -118, y: -52, w: 46, h: 40, r: 10 }];

function decayVariants(t, S, c) {
  const out = [];
  const eC = enter(t, S.start + 0.02, { dy: -22, d: 0.55 });
  out.push(G({ x: 960, y: 200 + eC.y, s: eC.s * pulse(t, c.manyways - 0.4, 0.4, 0.06), o: eC.o }, changeCard()));
  const nat = P(t, c.natural - 0.25, 0.7);
  const e0 = enter(t, S.start + 0.12, { d: 0.55, dy: 24 });
  const tv = i => c.manyways - 0.4 + Math.abs(i - 2) * 0.08;   // the middle variant is the original program; the others fan out of it
  if (t < tv(2)) out.push(G({ x: 960, y: VAR_Y + e0.y, s: 1.08 * e0.s, o: e0.o }, miniProg(t, {})));
  const ar = P(t, S.start + 0.45, 0.45, 'inOut') * (1 - P(t, c.manyways - 0.45, 0.3));
  if (ar > 0) out.push(G({ o: clamp(ar * 3) }, handArrow(960, 256, 960, 348, ar, { color: C.coral, bend: 0.12, sw: 4, head: 14 })));
  VAR_X.forEach((vx, i) => {
    const t0 = tv(i);
    if (t < t0) return;
    const f = P(t, t0, 0.65, 'outBack');
    const [px, py] = quadPoint(960, VAR_Y, vx, VAR_Y, 0.12, clamp(f, 0, 1.08));
    const ext = VAR_EXT[i];
    const patch = ext ? P(t, c.patches2 - 0.25 + [0, 0, 1, 2, 3][i] * 0.12, 0.5) : 0;
    const isNat = i === NAT, mid = i === 2;
    out.push(G({ x: px, y: py + (mid ? 0 : wobble(t, 0.25, 3, i) * clamp(f)), s: mid ? 1.08 : 1.08 * lerp(0.7, 1, clamp(f, 0, 1.1)), r: (1 - clamp(f)) * (i - 2) * 8, o: mid ? 1 : clamp(f * 3) },
      miniProg(t, { part: P(t, t0 + 0.3, 0.4), ext, nat: isNat ? nat : 0, patch, glow: isNat ? nat : 0, ring: isNat ? nat : 0 }),
      G({ x: 104, y: -80 }, tickBadge(P(t, c.manyways + 0.4 + i * 0.09, 0.4), 22))));
  });
  const lb = win(t, c.manyways + 0.75, c.onlyholder - 0.6, 0.4, 0.35);
  if (lb > 0) out.push(G({ o: lb }, hand('all correct', 960, 640, { size: 48, fill: C.tealDark })));
  // the theory holder sees which is which; someone without the theory cannot
  const eP = enter(t, c.onlyholder - 0.45, { d: 0.6, dy: 40 });
  if (eP.o > 0) {
    const hx = 760, px2 = 1160, fy = 1010, s = 0.9;
    const look = P(t, c.onlyholder + 0.15, 0.4);
    out.push(G({ x: hx, y: fy + eP.y, s, o: eP.o }, holder(t, { shirt: C.teal, skin: C.skin[1], hair: C.hair[1], hairStyle: 2, seed: 3, mood: 'happy', look: -0.6 * look,
      arms: look > 0.5 ? [[-52, -108], [-92, -214]] : 'down', bubble: P(t, c.onlyholder - 0.3, 0.6), bubbleSide: 1, theory: { seed: 14, n: 9, t0: c.onlyholder - 0.15, dur: 0.7 } })));
    const shrug = P(t, c.onlyholder + 0.45, 0.35);
    out.push(G({ x: px2, y: fy + eP.y, s, o: eP.o }, person(t, { shirt: C.grey, skin: C.skin[4], hair: C.hair[3], hairStyle: 0, seed: 6, mood: shrug > 0.5 ? 'worried' : 'neutral', look: 0.2,
      arms: shrug > 0.5 ? 'shrug' : 'down' }), G({ x: -96, y: -420 }, thoughtBubble(190, 124, { fill: C.card, stroke: C.ink2, dash: '8 7', tailX: 52 }),
      G({ y: 4 }, qMark(P(t, c.onlyholder + 0.5, 0.4, 'outBack'), { r: 34, fill: 'none', stroke: 'none', color: C.ink2 })))));
    const lb2 = P(t, c.onlyholder + 0.75, 0.4);
    if (lb2 > 0) out.push(G({ o: lb2 * eP.o }, hand('they all look the same', 1266, 890, { size: 40, fill: C.ink2, anchor: 'start' })));
    // their look: a gold ring on the natural extension, coral marks on the patches
    out.push(G({ x: VAR_X[NAT], y: VAR_Y }, ringMark(156, 120, P(t, c.onlyholder + 0.2, 0.55, 'inOut'), { color: C.gold, sw: 6 })));
    let k = 0;
    VAR_X.forEach((vx, i) => {
      const ext = VAR_EXT[i];
      if (!ext) return;
      const p = P(t, c.onlyholder + 0.55 + k * 0.12, 0.4, 'inOut');
      out.push(G({ x: vx + ext.x * 1.08, y: VAR_Y + ext.y * 1.08 }, ringMark(ext.w * 0.8 + 12, ext.h * 0.8 + 12, p, { color: C.coral, sw: 4.5, seed: k })));
      k++;
    });
  }
  return out;
}

function decayLapse(t, S, c) {
  // v1 → v2 → v3, patches piling up; v1 stays on as the clean program of the last beat
  const out = [];
  const vs = [{ x: 560, n: 0, g: 0 }, { x: 960, n: 3, g: 0.28 }, { x: 1360, n: 6, g: 0.62 }];
  const mv = P(t, c.quality - 0.45, 0.85, 'inOut'), mv2 = P(t, c.possible - 0.6, 0.75, 'inOut');
  const oOld = 1 - P(t, c.quality - 0.5, 0.4, 'inOut');
  vs.forEach((v, i) => {
    const e = enter(t, c.decay - 0.35 + i * 0.3, { d: 0.5, dy: 24 });
    if (e.o <= 0) return;
    let x = v.x, y = 555, s = 1.3, o = e.o;
    if (i === 0) { x = lerp(lerp(560, 960, mv), 1010, mv2); y = lerp(lerp(555, 575, mv), 565, mv2); s = lerp(lerp(1.3, 1.9, mv), 1.0, mv2); }
    else o *= oOld;
    if (o <= 0) return;
    const glow = i === 0 ? P(t, c.quality - 0.1, 0.6) * (1 + 0.15 * Math.sin(t * 2.4)) : 0;
    out.push(G({ x, y: y + e.y, s: s * e.s, o }, miniProg(t, { extra: DECAY_PATCHES.slice(0, v.n), grey: v.g, jit: v.g, glow, flow: glow, trace: i === 0 ? P(t, c.quality + 0.25, 1.4, 'linear') : 0 })));
    const pl = i === 0 ? oOld : 1;
    if (pl > 0) out.push(G({ x, y: y - 88 * s - 78 + e.y, o: o * pl }, pill('v' + (i + 1), { size: 24, stroke: i ? mixColor(C.ink2, GREY, v.g) : C.ink2, color: i ? mixColor(C.ink2, GREY, v.g) : C.ink2 })));
    if (i > 0) out.push(G({ o: o }, handArrow(vs[i - 1].x + 160, 555, v.x - 160, 555, P(t, c.decay - 0.45 + i * 0.3, 0.35, 'inOut'), { color: C.ink3, bend: -0.15, sw: 4, head: 14 })));
  });
  const eH = enter(t, c.decay - 0.3, { dy: 14 });
  const hO = eH.o * (1 - P(t, c.quality - 0.6, 0.35));
  if (hO > 0) out.push(G({ o: hO, y: eH.y }, headline([{ t: 'That’s how programs ' }, { t: 'decay', italic: true, fill: '#8A8F96' }], { size: 56 })));
  return out;
}

function decayPossible(t, S, c) {
  const out = [];
  const eH = enter(t, c.quality - 0.25, { dy: 14 });
  if (eH.o > 0) out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Simplicity' }, { t: ' · ', fill: C.ink3 }, { t: 'good structure' }], { size: 56 })));
  const bx = 1010, by = 565;
  const grow = P(t, c.possible - 0.55, 0.75, 'outBack');
  // the holder whose understanding holds the alternatives
  const eP = enter(t, c.possible - 0.75, { d: 0.6, dy: 30 });
  if (eP.o > 0) {
    const tails = [[372, 716, 11], [430, 704, 16], [498, 700, 22]];
    tails.forEach(([x, y, r], i) => { const p = P(t, c.possible - 0.6 + i * 0.07, 0.3, 'outBack'); if (p > 0) out.push(circle(x, y, r * p, { fill: C.night })); });
    out.push(G({ x: 300, y: 1010 + eP.y, s: 0.95, o: eP.o }, person(t, { shirt: C.plum, skin: C.skin[0], hair: C.hair[2], hairStyle: 1, seed: 9, mood: 'happy', look: 0.6, arms: 'hips' })));
  }
  if (grow > 0) out.unshift(G({ x: bx, y: by, s: lerp(0.3, 1, grow), o: clamp(grow * 2) }, ellipse(4, 10, 560, 300, { fill: 'rgba(30,42,58,0.10)' }), ellipse(0, 0, 560, 300, { fill: C.night, stroke: 'rgba(30,42,58,0.35)', sw: 2 })));
  // the programs that could have been written instead: dashed and messier, drifting round the real one
  const G6 = once('decay_ghosts', () => [0, 1, 2, 3, 4, 5].map(i => {
    const R = rng(300 + i * 7);
    const n = 4 + Math.floor(R() * 3);
    return Array.from({ length: n }, () => ({ x: (R() * 2 - 1) * 74, y: (R() * 2 - 1) * 46, w: 30 + R() * 44, h: 26 + R() * 30, r: (R() * 2 - 1) * 28 }));
  }));
  const angs = [-150, -90, -30, 30, 90, 150];
  G6.forEach((blocks, i) => {
    const p = P(t, c.possible - 0.15 + i * 0.12, 0.6, 'out');
    if (p <= 0) return;
    const a = angs[i] * Math.PI / 180 + wobble(t, 0.05, 0.06, i);
    const gx = bx + Math.cos(a) * 395 + wobble(t, 0.13, 6, i), gy = by + Math.sin(a) * 212 + wobble(t, 0.11, 5, i * 2);
    out.push(G({ o: p * 0.45 }, line(bx + Math.cos(a) * 130, by + Math.sin(a) * 96, gx - Math.cos(a) * 84, gy - Math.sin(a) * 60, { stroke: C.goldLight, sw: 2, dash: '3 8' })));
    const gh = [rect(-115, -88, 230, 176, { rx: 16, stroke: C.goldLight, sw: 3, dash: '10 8', o: 0.7 })];
    blocks.forEach((b, k) => gh.push(G({ x: b.x, y: b.y, r: b.r + wobble(t, 0.2, 3, k + i) }, rect(-b.w / 2, -b.h / 2, b.w, b.h, { rx: 6, stroke: k % 3 ? C.ink3 : C.goldLight, sw: 3, dash: '7 6' }))));
    out.push(G({ x: gx, y: gy, s: 0.7 * lerp(0.6, 1, p), o: p * (0.75 + 0.2 * Math.sin(t * 1.7 + i)) }, gh));
  });
  const q = P(t, c.possible + 0.35, 0.5);
  if (q > 0) out.push(G({ o: q, y: (1 - q) * 10 }, T('“exist only as possibilities in the programmer’s understanding”', 1070, 1000, { font: 'serif', size: 34, italic: true, fill: C.ink2, anchor: 'middle' })));
  return out;
}

SCENES.decay = {
  render(t, S) {
    const c = {
      manyways: S.cue('manyways'), natural: S.cue('natural'), patches2: S.cue('patches2'), onlyholder: S.cue('onlyholder'),
      decay: S.cue('decay'), quality: S.cue('quality'), possible: S.cue('possible'),
    };
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const oA = 1 - P(t, c.decay - 0.5, 0.4, 'inOut');
    if (oA > 0) out.push(G({ o: oA, y: -12 * (1 - oA) }, decayVariants(t, S, c)));
    if (t > c.quality - 0.4) out.push(decayPossible(t, S, c));
    if (t > c.decay - 0.4) out.push(decayLapse(t, S, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n);
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.45, gain: 0.4 }, { t: S.start + 0.3, type: 'pop', pitch: 0.8, gain: 0.5 },
      { t: c('manyways') - 0.4, type: 'whoosh', dur: 0.6, gain: 0.45 },
      ...[0, 1, 2, 3, 4].map(i => ({ t: c('manyways') + 0.4 + i * 0.09, type: 'tick', gain: 0.4, pitch: 0.9 + i * 0.1 })),
      { t: c('natural') - 0.25, type: 'chime', note: 2, gain: 0.55 },
      ...[0, 1, 2, 3].map(i => ({ t: c('patches2') - 0.2 + i * 0.12, type: 'tape', gain: 0.4 })),
      { t: c('onlyholder') - 0.45, type: 'pop', pitch: 0.9, gain: 0.45 }, { t: c('onlyholder') - 0.3, type: 'pop', pitch: 1.05, gain: 0.4 },
      { t: c('onlyholder') + 0.2, type: 'scribble', dur: 0.5, gain: 0.4 }, { t: c('onlyholder') + 0.5, type: 'pop', pitch: 0.7, gain: 0.4 },
      { t: c('onlyholder') + 0.6, type: 'scribble', dur: 0.6, gain: 0.35 },
      { t: c('decay') - 0.5, type: 'whoosh', dur: 0.45, gain: 0.35 },
      ...[0, 1, 2].map(i => ({ t: c('decay') - 0.35 + i * 0.3, type: i ? 'tape' : 'pop', gain: 0.45, pitch: 1 - i * 0.1 })),
      { t: c('quality') - 0.45, type: 'whoosh', dur: 0.7, gain: 0.35 }, { t: c('quality') - 0.1, type: 'chime', note: 4, gain: 0.5 },
      { t: c('possible') - 0.6, type: 'rise', dur: 0.6, gain: 0.4 }, { t: c('possible'), type: 'chime', note: 6, gain: 0.45 },
      { t: c('possible') + 0.4, type: 'scribble', dur: 0.5, gain: 0.25 },
    ];
  },
};

// ================================================================== LIFE (chapter: Life, death and revival)
// A team member's theory bubble that turns into a ghost: g 0 (alive) … 1 (a dashed, hollow outline). Centred.
function fadingBubble(t, K, o = {}) {
  const { w = 200, h = 140, g = 0, t0 = -99, dur = 0.8, dim = 0, tailX = -56 } = o;
  const gh = g > 0.35;
  return [
    g < 1 ? G({ o: 1 - g }, thoughtBubble(w, h, { fill: C.night, stroke: 'rgba(30,42,58,0.35)', tailX })) : '',
    g > 0 ? G({ o: g }, thoughtBubble(w, h, { fill: 'none', stroke: C.ink3, dash: '7 7', tailX })) : '',
    constellation(t, K, { t0, dur, size: 4.2, lineW: 1.8, glow: 0.8 * (1 - g) * (1 - dim * 0.6), ghost: gh, dim, color: gh ? C.ink3 : C.gold, lineColor: gh ? C.ink3 : C.goldLight }),
  ].join('');
}

// The program: an app window over a server. Centred on the window/server pair (about 380×400).
function appMachine(t, o = {}) {
  const { upd = 0, flash = 0 } = o;
  const out = [];
  out.push(G({ y: 150 }, iconServer(t, { w: 300, h: 110, color: C.blue })));
  const w = 380, h = 270, x = -w / 2, y = -195;
  if (flash > 0) out.push(circle(0, -60, 260, { fill: 'url(#gGlow)', o: 0.7 * flash }));
  out.push(shadowCard(x, y, w, h, { rx: 16 }));
  out.push(path(`M${x} ${y + 16} Q${x} ${y} ${x + 16} ${y} L${x + w - 16} ${y} Q${x + w} ${y} ${x + w} ${y + 16} L${x + w} ${y + 44} L${x} ${y + 44} Z`, { fill: C.paper2 }));
  out.push(circle(x + 24, y + 22, 6, { fill: C.coral }), circle(x + 42, y + 22, 6, { fill: C.mustard }), circle(x + 60, y + 22, 6, { fill: C.teal }));
  out.push(T('app', x + w / 2, y + 30, { font: 'mono', size: 22, weight: 600, fill: C.ink2, anchor: 'middle' }));
  // live chart
  const pts = [];
  for (let i = 0; i <= 24; i++) pts.push([x + 26 + i * 13.5, y + 128 - 26 * (0.5 + 0.5 * Math.sin(i * 0.7 + t * 2.2)) - 10 * Math.sin(i * 0.31 + t)]);
  out.push(rect(x + 20, y + 62, w - 40, 84, { rx: 8, fill: C.sky, o: 0.6 }), path(poly(pts), { stroke: C.teal, sw: 3.5 }));
  // rows: one more for every applied change
  const nRows = 2 + Math.floor(upd);
  for (let i = 0; i < Math.min(nRows, 4); i++) {
    const ry = y + 166 + i * 24;
    const isNew = i === nRows - 1 && upd >= 1;
    const np = isNew ? clamp(frac(upd) === 0 ? 1 : 1) : 1;
    out.push(rect(x + 22, ry, 14, 14, { rx: 4, fill: isNew && flash > 0 ? C.gold : C.tealLight, o: np }), rect(x + 46, ry + 3, [220, 180, 240, 160][i], 8, { rx: 4, fill: C.ink3, o: 0.6 * np }));
    if (isNew && flash > 0) out.push(rect(x + 14, ry - 5, w - 28, 24, { rx: 6, stroke: C.gold, sw: 2.5, o: flash }));
  }
  return out.join('');
}

SCENES.life = {
  render(t, S) {
    const c = { alive: S.cue('alive'), control: S.cue('control'), dies: S.cue('dies'), dissolves: S.cue('dissolves'), runs: S.cue('runs'), visibledeath: S.cue('visibledeath') };
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const mx = 1330, my = 650;
    const eM = enter(t, S.start + 0.02, { d: 0.6, dy: 26 });
    // headline: life, then death
    const tSwap = c.dies - 0.1;
    const eH1 = enter(t, S.start + 0.02, { dy: 12 });
    const o1 = eH1.o * (1 - P(t, tSwap - 0.35, 0.35));
    if (o1 > 0) out.push(G({ o: o1, y: eH1.y }, richText([{ t: 'A program ' }, { t: 'lives', fill: C.tealDark }, { t: ' while its team holds the theory' }], 960, 150, { font: 'serif', size: 54, weight: 600, anchor: 'middle' })));
    const eH2 = enter(t, tSwap - 0.05, { dy: 12 });
    if (eH2.o > 0) out.push(G({ o: eH2.o, y: eH2.y }, richText([{ t: 'It ' }, { t: 'dies', fill: C.coral }, { t: ' when the team dissolves' }], 960, 150, { font: 'serif', size: 54, weight: 600, anchor: 'middle' })));
    // heartbeat monitor above the program
    const alive = 1 - P(t, c.dissolves - 0.1, 0.7, 'inOut');
    const beatGlow = alive * P(t, c.alive - 0.3, 0.4);
    out.push(G({ x: mx, y: 290 + eM.y, o: eM.o }, beatGlow > 0 ? circle(0, 0, 200, { fill: 'url(#gGlow)', o: 0.25 * beatGlow * (0.7 + 0.3 * Math.sin(t * 7.7)) }) : '',
      heartbeat(t, { w: 300, alive: lerp(0.35, 1, P(t, c.alive - 0.3, 0.5)) * alive, color: mixColor(C.tealLight, C.coral, 1 - alive) })));
    const aL = P(t, c.alive - 0.2, 0.4) * (1 - P(t, c.dissolves - 0.15, 0.3));
    if (aL > 0) out.push(G({ o: aL }, T('ALIVE', mx + 196, 302, { size: 30, weight: 800, fill: C.tealDark, ls: 8 })));
    const dL = P(t, c.dissolves + 0.35, 0.4);
    if (dL > 0) out.push(G({ o: dL, y: (1 - dL) * 8 }, T('program death', mx + 196, 306, { font: 'hand', size: 48, weight: 700, fill: C.coral })));
    // change requests: to the team, ticked, then applied to the program along a gold thread
    const reqs = [0, 1].map(j => c.control - 0.4 + j * 0.5);
    let upd = 0, flash = 0;
    const land = j => [470 + j * 60, 420 - j * 16];
    const win0 = [mx - 170, my - 112];
    reqs.forEach((t0, j) => {
      const f = P(t, t0, 0.8, 'inOut');
      if (f <= 0) return;
      const [lx, ly] = land(j);
      const u = P(t, t0 + 1.1, 0.55, 'inOut');
      upd += P(t, t0 + 1.62, 0.01);
      flash = Math.max(flash, P(t, t0 + 1.6, 0.15) * (1 - P(t, t0 + 1.85, 0.5)));
      out.push(drawPath(arcPath(lx, ly, win0[0], win0[1], -0.18), P(t, t0 + 0.95, 0.5, 'inOut'), { stroke: C.goldDeep, sw: 3, o: 0.7 * (1 - P(t, c.dies, 0.6)) }));
      if (u >= 1) return;
      const [x, y] = u > 0 ? quadPoint(lx, ly, win0[0], win0[1], -0.18, u) : quadPoint(2020, 130, lx, ly, 0.22, f);
      const tk = P(t, t0 + 0.82, 0.35);
      out.push(G({ x, y, s: lerp(0.9, 0.4, u), r: lerp(lerp(-14, 4, f), 0, u), o: 1 - P(t, t0 + 1.45, 0.2) },
        reqCard({ stroke: mixColor(C.coral, C.goldDeep, tk) }), G({ x: 64, y: -46 }, tickBadge(tk * (1 - u), 20))));
    });
    // the program
    out.push(G({ x: mx, y: my + eM.y, s: 1.12 * eM.s, o: eM.o }, appMachine(t, { upd, flash })));
    // it keeps running: results come out
    const run = P(t, c.runs - 0.3, 0.3);
    if (run > 0) {
      for (let k = 0; k < 5; k++) {
        const lt = t - (c.runs - 0.3) - k * 0.26;
        if (lt < 0) continue;
        const ph = frac(lt * 0.75);
        out.push(G({ x: mx + 176 + ph * 290, y: my + 168 + Math.sin(ph * Math.PI) * -30 + ph * 56, o: run * Math.min(1, (1 - ph) * 3, ph * 8) },
          rect(-18, -18, 36, 36, { rx: 8, fill: C.tealLight }), G({ s: 0.7 }, checkMark(1, { sw: 7, color: C.tealDark }))));
      }
      out.push(G({ o: run }, hand('…and it still runs', 1560, 960, { size: 46, fill: C.ink2 })));
    }
    // the team that holds the theory: alive, then dimming, then gone
    const team = [
      { x: 250, shirt: C.teal, skin: C.skin[0], hair: C.hair[0], hs: 0 },
      { x: 450, shirt: C.coral, skin: C.skin[3], hair: C.hair[3], hs: 3 },
      { x: 650, shirt: C.blue, skin: C.skin[1], hair: C.hair[2], hs: 2 },
    ];
    const wk = clamp((t - c.dissolves + 0.05) / 1.6), walk = 0.45 * wk + 0.55 * wk * wk;
    const dim = P(t, c.dies - 0.25, 0.7);
    const gK = P(t, c.dissolves + 0.05, 0.7), bFade = 1 - P(t, c.dissolves + 1.1, 1.7, 'inOut'), bRise = -30 * P(t, c.dissolves + 0.2, 2.6, 'inOut');
    team.forEach((pp, i) => {
      const e = enter(t, c.alive - 0.35 + i * 0.12, { d: 0.6, dy: 40 });
      if (e.o <= 0) return;
      const dx = -760 * walk, bob = walk > 0 ? -Math.abs(Math.sin((t - c.dissolves) * 9 + i)) * 8 : 0;
      const bp = P(t, c.alive - 0.2 + i * 0.12, 0.6);
      // the bubbles stay behind when the team leaves: the theory goes ghostly and fades where it was
      if (bp > 0 && bFade > 0) out.push(G({ x: pp.x, y: 950 + e.y + bRise, s: 0.82, o: e.o }, G({ x: 96, y: -420, s: 0.35 + 0.65 * Ease.outBack(bp), o: clamp(bp * 2) * bFade },
        fadingBubble(t, once('life_K' + i, () => makeConstellation(31 + i, 8, { rx: 72, ry: 42, minD: 24, extra: 0.3 })), { g: gK, t0: c.alive - 0.1 + i * 0.15, dim: dim * 0.75 }))));
      const bub = '';
      out.push(G({ x: pp.x + dx, y: 950 + bob + e.y, s: 0.82, o: e.o },
        person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: 4 + i, mood: walk > 0 ? 'neutral' : 'happy', flip: walk > 0, look: walk > 0 ? -0.5 : 0.5,
          arms: walk > 0 ? 'down' : i === 1 && t > c.control ? 'point' : 'down', glowHead: (1 - dim) * 0.5 * P(t, c.alive, 0.5) }), bub));
    });
    // requests keep arriving; nobody answers them
    [0, 1, 2, 3].forEach(k => {
      const t0 = c.visibledeath - 0.4 + k * 0.4;
      const f = P(t, t0, 0.85, 'inOut');
      if (f <= 0) return;
      const tx = 470 + [0, 46, -40, 16][k], ty = 800 - k * 40;
      const [x, y] = quadPoint(2020, 90, tx, ty, 0.3, f);
      out.push(G({ x, y, s: 1.15, r: lerp(-16, [-8, 6, -4, 9][k], f) }, reqCard(), G({ x: 66, y: -44 }, qMark(P(t, t0 + 0.9, 0.35), { r: 22, stroke: C.coral, color: C.coral }))));
    });
    const vL = P(t, c.visibledeath + 0.45, 0.45);
    if (vL > 0) out.push(G({ o: vL, y: (1 - vL) * 10 }, hand('requests can’t be answered intelligently', 540, 960, { size: 46, fill: C.coral })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n);
    const beats = [];
    for (let bt = c('alive') - 0.2; bt < c('dissolves') - 0.2; bt += 0.81) beats.push({ t: bt, type: 'click', gain: 0.22, pitch: 1.4 });
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.5, gain: 0.4 },
      ...[0, 1, 2].map(i => ({ t: c('alive') - 0.35 + i * 0.12, type: 'pop', pitch: 0.9 + i * 0.1, gain: 0.45 })),
      { t: c('alive') - 0.1, type: 'chime', note: 0, gain: 0.5 }, ...beats,
      ...[0, 1].map(j => ({ t: c('control') - 0.4 + j * 0.5, type: 'whoosh', dur: 0.7, gain: 0.35 })),
      ...[0, 1].map(j => ({ t: c('control') - 0.4 + j * 0.5 + 0.82, type: 'tick', gain: 0.5 })),
      ...[0, 1].map(j => ({ t: c('control') - 0.4 + j * 0.5 + 1.6, type: 'pop', pitch: 1.25, gain: 0.4 })),
      { t: c('dies') - 0.25, type: 'fizzle', gain: 0.3 },
      { t: c('dissolves') - 0.1, type: 'flatline', dur: 1.4, gain: 0.6 }, { t: c('dissolves'), type: 'steps', dur: 1.5, gain: 0.5 },
      ...[0, 1, 2].map(k => ({ t: c('runs') - 0.3 + k * 0.26, type: 'tick', gain: 0.35 })),
      ...[0, 1, 2, 3].map(k => ({ t: c('visibledeath') - 0.4 + k * 0.4 + 0.85, type: 'thud', gain: 0.35 })),
      { t: c('visibledeath') + 0.5, type: 'pop', pitch: 0.7, gain: 0.35 },
    ];
  },
};

// ================================================================== REVIVAL
// piano, seen from the players' side: origin at the centre of the keyboard's front edge
function piano(t, o = {}) {
  const w = o.w ?? 660, out = [];
  out.push(rect(-w / 2 + 34, 100, 24, 58, { rx: 6, fill: '#3B2A20' }), rect(w / 2 - 58, 100, 24, 58, { rx: 6, fill: '#3B2A20' }));
  out.push(rect(-w / 2 + 4, 12, w, 104, { rx: 12, fill: 'rgba(30,42,58,0.14)' }));
  out.push(rect(-w / 2, 4, w, 104, { rx: 12, fill: '#4A3426' }), rect(-w / 2 + 20, 22, w - 40, 68, { rx: 8, stroke: '#6B4E36', sw: 3 }));
  out.push(path(`M${-w / 2 - 6} 6 L${w / 2 + 6} 6 L${w / 2 - 6} -22 L${-w / 2 + 6} -22 Z`, { fill: C.card, stroke: '#CFC6B4', sw: 2 }));
  const nk = 30, kw = (w - 12) / nk;
  for (let i = 1; i < nk; i++) { const x0 = -w / 2 + 6 + i * kw; out.push(line(x0 - 1, -21, x0, 5, { stroke: '#CFC6B4', sw: 1.5 })); }
  for (let i = 0; i < nk - 1; i++) {
    if ([2, 6, 9, 13, 16, 20, 23, 27].includes(i % 28) || i % 7 === 2 || i % 7 === 6) continue;
    const x0 = -w / 2 + 6 + (i + 1) * kw;
    out.push(rect(x0 - 5, -22, 10, 14, { rx: 2, fill: C.ink }));
  }
  (o.pressed || []).forEach(([k, p]) => { if (p > 0) out.push(rect(-w / 2 + 6 + k * kw + 1, -20, kw - 2, 24, { rx: 2, fill: C.goldLight, o: p })); });
  return out.join('');
}
// an eighth note (kind 0) or a beamed pair (kind 1), head at the origin
function note(kind, col) {
  if (kind === 0) return [G({ r: -22 }, ellipse(0, 0, 11, 8, { fill: col })), line(9, -3, 9, -44, { stroke: col, sw: 3.5 }), path('M9 -44 Q24 -34 21 -16', { stroke: col, sw: 3.5 })].join('');
  return [G({ r: -22 }, ellipse(0, 0, 10, 7.5, { fill: col })), G({ x: 30, y: -6, r: -22 }, ellipse(0, 0, 10, 7.5, { fill: col })),
    line(8, -3, 8, -40, { stroke: col, sw: 3.5 }), line(38, -9, 38, -46, { stroke: col, sw: 3.5 }), path('M8 -40 L38 -46', { stroke: col, sw: 7 })].join('');
}

function revivalRebuild(t, S, c) {
  const out = [];
  const eH = enter(t, S.start + 0.02, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Rebuild the ' }, { t: 'theory', fill: C.goldDeep }, { t: ' from code and documents?' }], { size: 54 })));
  const Ko = once('revival_Ko', () => makeConstellation(51, 12, { rx: 132, ry: 74, minD: 38, extra: 0.35 }));
  const Kr = once('revival_Kr', () => perturbConstellation(Ko, 57, 30, { drop: 0.3, add: 0.25 }));
  const wrong = once('revival_wrong', () => { const s = new Set(Ko.edges.map(([a, b]) => a < b ? a + '-' + b : b + '-' + a)); return Kr.edges.filter(([a, b]) => !s.has(a < b ? a + '-' + b : b + '-' + a)); });
  // the newcomer at a desk, reading
  const nx = 430, fy = 905;
  const eN = enter(t, S.start + 0.1, { d: 0.6, dy: 36 });
  const worried = t > c.alone + 0.5;
  out.push(G({ x: nx, y: fy + eN.y, o: eN.o }, person(t, { shirt: C.olive, skin: C.skin[2], hair: C.hair[3], hairStyle: 3, seed: 12, arms: 'typing', mood: worried ? 'worried' : 'neutral',
    look: t < c.alone + 0.3 ? 0.6 * Math.sin((t - S.start) * 1.3) : 0.8 })));
  out.push(G({ x: nx, y: 772 + eN.y, o: eN.o }, desk(560)));
  // reading: coral sparks rise from the code and documents into the bubble
  const read = win(t, c.revive, c.impossible - 0.6, 0.4, 0.4);
  if (read > 0) for (let k = 0; k < 6; k++) {
    const ph = frac((t - c.revive) * 0.7 + k / 6);
    const src = k % 2 ? [560, 668] : [300, 660];
    const [x, y] = quadPoint(src[0], src[1], 640 + (k - 2.5) * 30, 470, k % 2 ? 0.2 : -0.2, ph);
    out.push(circle(x, y, 5, { fill: C.coral, o: read * Math.sin(ph * Math.PI) * 0.8 }));
  }
  // the newcomer's bubble: a theory rebuilt from the texts, in coral
  const bb = P(t, c.revive - 0.25, 0.6);
  if (bb > 0) out.push(G({ x: 700, y: 400, s: lerp(0.4, 1, Ease.outBack(bb)), o: clamp(bb * 2) }, thoughtBubble(400, 250, { fill: C.night, stroke: 'rgba(30,42,58,0.35)', tailX: -236 }),
    constellation(t, Kr, { t0: c.revive + 0.2, dur: 2.2, color: C.coral, lineColor: C.coralLight, size: 5.5, lineW: 2.2, glow: 0.5 }),
    ...wrong.map(([a, b], i) => { const p = P(t, c.alone + 0.55 + i * 0.1, 0.3); return p > 0 ? line(Kr.pts[a][0], Kr.pts[a][1], Kr.pts[b][0], Kr.pts[b][1], { stroke: C.coral, sw: 3 + 1.5 * Math.sin(t * 6 + i), o: p }) : ''; })));
  // the original theory: only a ghost now
  const eg = P(t, c.orig - 0.25, 0.6);
  if (eg > 0) {
    out.push(G({ x: 1370, y: 440, o: eg, s: lerp(0.85, 1, eg) }, G({ sx: -0.9, sy: 0.9 }, path(HEAD_PATH, { fill: 'rgba(28,38,56,0.06)', stroke: C.ink3, sw: 4, dash: '14 11' })),
      G({ x: 8, y: -34 }, constellation(t, Ko, { t0: c.orig - 0.15, dur: 0.9, ghost: true, color: C.goldDeep, lineColor: C.goldDeep, size: 5.5, lineW: 2.2 }))));
    out.push(G({ o: eg }, hand('the original', 1370, 745, { size: 42, fill: C.ink2 })));
  }
  const ne = P(t, c.alone + 0.3, 0.45, 'outBack');
  if (ne > 0) out.push(G({ x: 1030, y: 410, s: ne, o: clamp(ne * 2) }, T('≠', 0, 30, { font: 'serif', size: 96, weight: 700, fill: C.coral, anchor: 'middle' })));
  // the code and documents on the desk (they slide away when the new team starts afresh)
  const gone = P(t, c.afresh - 0.55, 0.75, 'in');
  out.push(G({ x: -780 * gone, y: 20 * gone, r: -18 * gone, o: eN.o * (1 - P(t, c.afresh + 0.05, 0.25)) },
    G({ x: 300, y: 700, r: -4, s: 0.62 }, codeCard({ w: 220, h: 170, seed: 91 })),
    G({ x: 548, y: 712, r: -8, s: 0.5 }, docCard({ w: 150, h: 190, seed: 93 })), G({ x: 568, y: 706, r: 3, s: 0.5 }, docCard({ w: 150, h: 190, seed: 94 })),
    G({ x: 590, y: 700, r: 10, s: 0.5 }, docCard({ w: 150, h: 190, seed: 95 }))));
  return out;
}

function revivalAfresh(t, S, c) {
  const out = [];
  const eH = enter(t, c.afresh - 0.25, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Solve the problem ' }, { t: 'afresh', fill: C.goldDeep }], { size: 56 })));
  // a blank page on an easel
  const eE = enter(t, c.afresh - 0.15, { d: 0.55, dy: 30 });
  out.push(G({ o: eE.o, y: eE.y }, line(610, 560, 560, 905, { stroke: WOOD_D, sw: 8 }), line(690, 560, 740, 905, { stroke: WOOD_D, sw: 8 }), line(650, 600, 650, 890, { stroke: WOOD, sw: 7 }),
    rect(560, 752, 180, 12, { rx: 5, fill: WOOD }),
    G({ x: 650, y: 555 }, docCard({ w: 280, h: 360, lines: 7, heading: true, seed: 97, reveal: P(t, c.afresh + 1.0, 2.0, 'linear') }))));
  // the new team grows a fresh theory together
  const team = [
    { x: 960, shirt: C.coral, skin: C.skin[1], hair: C.hair[2], hs: 2, arms: 'point', flip: true },
    { x: 1160, shirt: C.teal, skin: C.skin[4], hair: C.hair[0], hs: 1, arms: 'hips' },
    { x: 1360, shirt: C.plum, skin: C.skin[3], hair: C.hair[1], hs: 3, arms: 'down' },
  ];
  const fy = 950, s = 0.85;
  const bx = 1160, by = 380;
  const bp = P(t, c.afresh + 0.05, 0.6, 'outBack');
  team.forEach((pp, i) => {
    const e = enter(t, c.afresh - 0.1 + i * 0.12, { d: 0.6, dy: 40 });
    if (e.o <= 0) return;
    out.push(G({ x: pp.x, y: fy + e.y, s, o: e.o }, person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: 20 + i, mood: 'happy', flip: pp.flip, look: -0.6, arms: pp.arms,
      glowHead: 0.5 * P(t, c.afresh + 1.2, 0.8) })));
    const hxh = pp.x, hyh = fy - 290 * s;
    [0.28, 0.52, 0.76].forEach((k, j) => {
      const p = P(t, c.afresh + j * 0.06, 0.3, 'outBack');
      if (p > 0) out.push(circle(lerp(hxh, lerp(bx, pp.x, 0.55), k), lerp(hyh, by + 116, k), (5 + j * 4) * p, { fill: C.night, o: e.o }));
    });
  });
  if (bp > 0) {
    const Kf = once('revival_Kf', () => makeConstellation(64, 14, { rx: 180, ry: 80, minD: 40, extra: 0.35 }));
    out.push(G({ x: bx, y: by, s: lerp(0.3, 1, bp), o: clamp(bp * 2) }, ellipse(3, 8, 250, 132, { fill: 'rgba(30,42,58,0.10)' }), ellipse(0, 0, 250, 132, { fill: C.night, stroke: 'rgba(30,42,58,0.35)', sw: 2 }),
      constellation(t, Kf, { t0: c.afresh + 0.3, dur: 2.2, size: 6, lineW: 2.4, glow: 1 })));
  }
  return out;
}

function revivalMusic(t, S, c) {
  const out = [];
  const eH = enter(t, c.instrument - 0.4, { dy: 14 });
  out.push(G({ o: eH.o, y: eH.y }, headline([{ t: 'Passed on the way ' }, { t: 'music', fill: C.goldDeep }, { t: ' is taught' }], { size: 56 })));
  const e = enter(t, c.instrument - 0.35, { d: 0.6, dy: 30 });
  const fy = 900, sx = 850, tx = 1010, kx = 945, ky = 798;
  // warm light
  out.push(circle(930, 650, 520, { fill: 'url(#gGlow)', o: e.o * (0.3 + 0.04 * Math.sin(t * 2)) }));
  // shared theory: the teacher's constellation copies across, node by node
  const K = once('revival_Kpiano', () => makeConstellation(71, 10, { rx: 230 * 0.36, ry: 160 * 0.3, minD: 27, extra: 0.3 }));
  const sB = [sx - 96, fy - 420], tB = [tx + 96, fy - 420];
  const t0s = c.alongside - 0.05, durS = 1.4, n = K.pts.length;
  const play = Math.sin(t * 9) * 3;
  const Z = [];
  Z.push(G({ o: e.o, y: e.y }, [
    G({ x: sx, y: fy }, holder(t, { shirt: C.teal, skin: C.skin[0], hair: C.hair[2], hairStyle: 1, seed: 31, mood: 'happy', look: 0.5, noLegs: true,
      arms: [[-30 + play, -128], [30 - play, -128]], bubble: P(t, c.instrument + 0.15, 0.6), bubbleSide: -1, theory: { K, t0: t0s, dur: durS, glow: 1 } })),
    G({ x: tx, y: fy }, holder(t, { shirt: C.plum, skin: C.skin[3], hair: C.hair[4], hairStyle: 4, seed: 33, mood: 'happy', look: -0.6, noLegs: true,
      arms: [[-112, -184], [52, -126 + Math.sin(t * 7) * 3]], bubble: P(t, c.instrument - 0.2, 0.6), bubbleSide: 1,
      theory: { K, t0: c.instrument - 0.1, dur: 0.8, glow: 1 + 0.4 * P(t, t0s - 0.3, 0.4) } })),
    G({ x: kx, y: ky }, piano(t, { pressed: [[9 + (Math.floor(t * 4) % 3), 1], [19 + (Math.floor(t * 3 + 1) % 4), 1]] })),
  ]));
  // notes float up from both ends of the keyboard
  if (e.o > 0) for (let i = 0; i < 8; i++) {
    const ph = frac((t - c.instrument) * 0.42 + i / 8), left = i % 2 === 0;
    if (t - c.instrument + 0.3 < i * 0.25) continue;
    const x0 = left ? 610 : 1290, x1 = left ? 420 : 1470;
    const x = lerp(x0, x1, ph) + Math.sin(ph * 7 + i) * 16, y = lerp(760, 330, ph);
    Z.push(G({ x, y, r: Math.sin(ph * 5 + i) * 12, s: 0.9 + 0.2 * Math.sin(i), o: e.o * Math.sin(ph * Math.PI) * 0.9 }, note(i % 3 === 1 ? 1 : 0, [C.goldDeep, C.coral, C.teal, C.plum][i % 4])));
  }
  // copy sparks, teacher → student
  for (let i = 0; i < n; i++) {
    const a = t0s + durS * (K.rank[i] / Math.max(1, n - 1));
    const p = P(t, a - 0.5, 0.5, 'inOut');
    if (p <= 0 || p >= 1) continue;
    const [x, y] = quadPoint(tB[0] + K.pts[i][0], tB[1] + K.pts[i][1], sB[0] + K.pts[i][0], sB[1] + K.pts[i][1], 0.35, p);
    Z.push(circle(x, y, 16, { fill: 'url(#gGlow)', o: 0.9 }), circle(x, y, 5, { fill: C.gold }));
  }
  const zs = 1.18, pvx = 945, pvy = 690;
  out.push(G({ x: pvx * (1 - zs), y: pvy * (1 - zs) - 18, s: zs }, Z));
  const lb = P(t, c.alongside + 0.35, 0.45);
  if (lb > 0) out.push(G({ o: lb, y: (1 - lb) * 10 }, hand('working in close contact', 945, 1018, { size: 46, fill: C.goldDeep })));
  return out;
}

SCENES.revival = {
  render(t, S) {
    const c = { revive: S.cue('revive'), impossible: S.cue('impossible'), afresh: S.cue('afresh'), instrument: S.cue('instrument'), alongside: S.cue('alongside') };
    c.orig = wordAt(S, 0, 'theory', c.revive + 0.5);
    c.alone = wordAt(S, 0, 'alone', lerp(c.revive, c.impossible, 0.45));
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // phase 1: rebuild from the texts; STRICTLY IMPOSSIBLE slams across (with a small shake)
    const oA = 1 - P(t, c.afresh - 0.45, 0.4, 'inOut');
    const lt = t - (c.impossible - 0.13);
    const shake = lt > 0 && lt < 0.5 ? 9 * Math.exp(-9 * lt) * Math.sin(lt * 70) : 0;
    if (oA > 0 || t < c.afresh + 0.3) {
      const A = revivalRebuild(t, S, c);
      const pile = A.pop();
      out.push(G({ o: oA, x: shake, y: shake * 0.5 }, A), pile);
      const sp = P(t, c.impossible - 0.28, 0.24, 'linear');
      if (sp > 0) out.push(G({ x: 1000 + shake, y: 440, o: oA }, slam('STRICTLY IMPOSSIBLE', sp, { size: 60, rot: -8 })));
    }
    // phase 2: a new team, afresh
    const oB = win(t, c.afresh - 0.3, c.instrument - 0.75, 0.4, 0.4);
    if (oB > 0) out.push(G({ o: oB }, revivalAfresh(t, S, c)));
    // phase 3: apprenticeship at the piano
    if (t > c.instrument - 0.45) out.push(revivalMusic(t, S, c));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx(S) {
    const c = n => S.cue(n);
    const orig = wordAt(S, 0, 'theory', c('revive') + 0.5), alone = wordAt(S, 0, 'alone', lerp(c('revive'), c('impossible'), 0.45));
    const ins = c('instrument');
    return [
      { t: S.start + 0.02, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: c('revive') - 0.25, type: 'pop', pitch: 0.9, gain: 0.45 },
      ...[0, 1, 2].map(i => ({ t: c('revive') + 0.3 + i * 0.6, type: 'pop', pitch: 1.1 + i * 0.08, gain: 0.25 })),
      { t: orig - 0.25, type: 'whoosh', dur: 0.5, gain: 0.3 }, { t: alone + 0.3, type: 'pop', pitch: 0.7, gain: 0.5 },
      { t: alone + 0.55, type: 'scribble', dur: 0.4, gain: 0.3 },
      { t: c('impossible') - 0.14, type: 'thud', gain: 1.0 }, { t: c('impossible') + 0.05, type: 'fizzle', gain: 0.3 },
      { t: c('afresh') - 0.55, type: 'whoosh', dur: 0.7, gain: 0.55 },
      ...[0, 1, 2].map(i => ({ t: c('afresh') - 0.1 + i * 0.12, type: 'pop', pitch: 0.95 + i * 0.1, gain: 0.35 })),
      { t: c('afresh') + 0.3, type: 'chime', note: 0, gain: 0.5 }, { t: c('afresh') + 1.0, type: 'scribble', dur: 1.8, gain: 0.25 },
      { t: ins - 0.75, type: 'whoosh', dur: 0.5, gain: 0.35 },
      ...[[0, 0], [0.3, 2], [0.6, 4], [0.9, 2], [1.3, 7]].map(([d, nn]) => ({ t: ins - 0.1 + d, type: 'pluck', note: nn, gain: 0.4 })),
      { t: c('alongside') - 0.05, type: 'chime', note: 4, gain: 0.5 }, { t: c('alongside') + 0.6, type: 'pluck', note: 9, gain: 0.3 },
      { t: c('alongside') + 1.3, type: 'chime', note: 7, gain: 0.4 },
    ];
  },
};

})();
