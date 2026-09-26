// Tiny immediate-mode SVG motion-graphics engine.
// Every frame is a pure function of time t: scenes return SVG markup strings.
'use strict';

const W = 1920, H = 1080;

const C = {
  paper: '#F3EDE2', paper2: '#E9E0D0', paper3: '#DDD2BF', card: '#FFFDF8',
  ink: '#1E2A3A', ink2: '#5B6576', ink3: '#9AA1AB', faint: '#D9CFBE',
  night: '#1C2638', night2: '#2A3650',
  gold: '#F2A93B', goldDeep: '#C9800C', goldLight: '#FFD98A',
  teal: '#2A9D8F', tealDark: '#1D7166', tealLight: '#A7DCD3',
  coral: '#E4572E', coralDark: '#B8401C', coralLight: '#F6B49D',
  blue: '#3D5A80', blueLight: '#A9C6DE', sky: '#DCE9F2',
  plum: '#7A6AD8', plumLight: '#CFC8F5',
  mustard: '#E9C46A', olive: '#8AA05B', grey: '#A7A9AC',
  skin: ['#F2C9A0', '#D9A07A', '#A86B4B', '#7A4A33', '#EFC7B0'],
  hair: ['#2B2118', '#5A3A22', '#B7652B', '#1E1E1E', '#8C7A6B'],
};

// ------------------------------------------------------------------ math & easing
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const Ease = {
  linear: p => p,
  in: p => p * p * p,
  out: p => 1 - Math.pow(1 - p, 3),
  inOut: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outQuart: p => 1 - Math.pow(1 - p, 4),
  inOutSine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  outBack: p => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  outBackSoft: p => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
  outElastic: p => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -9 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI) / 3.2) + 1),
};
// progress of an animation starting at t0 lasting d seconds
function P(t, t0, d = 0.5, ease = 'out') {
  if (t0 == null || isNaN(t0)) return 0;
  if (d <= 0) return t >= t0 ? 1 : 0;
  return Ease[ease](clamp((t - t0) / d));
}
// visible envelope: fade in at a (over di), fade out ending at b (over do_)
function env(t, a, b, di = 0.45, do_ = 0.35) {
  return Math.min(P(t, a, di, 'out'), 1 - P(t, b - do_, do_, 'in'));
}

// deterministic PRNG
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const memo = new Map();
function once(key, fn) { if (!memo.has(key)) memo.set(key, fn()); return memo.get(key); }

// ------------------------------------------------------------------ svg builders
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = v => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
function attrs(o) {
  let s = '';
  for (const k in o) {
    const v = o[k];
    if (v === undefined || v === null || v === false) continue;
    s += ` ${k}="${typeof v === 'number' ? r2(v) : v}"`;
  }
  return s;
}
const el = (tag, o, inner) => (inner == null ? `<${tag}${attrs(o)}/>` : `<${tag}${attrs(o)}>${inner}</${tag}>`);
const join = parts => (Array.isArray(parts) ? parts.flat(Infinity).filter(Boolean).join('') : parts || '');

// group with transform: x,y translate; s scale; r rotate (deg); o opacity
function G(o, ...children) {
  const { x = 0, y = 0, s = 1, sx, sy, r = 0, o: op = 1, filter, clip, id, cls } = o || {};
  if (op <= 0.001) return '';
  let tf = '';
  if (x || y) tf += `translate(${r2(x)} ${r2(y)})`;
  if (r) tf += ` rotate(${r2(r)})`;
  if (sx != null || sy != null) tf += ` scale(${r2(sx ?? s)} ${r2(sy ?? s)})`;
  else if (s !== 1) tf += ` scale(${r2(s)})`;
  return el('g', { transform: tf || undefined, opacity: op < 0.999 ? r2(op) : undefined, filter, 'clip-path': clip, id, class: cls }, join(children));
}

const rect = (x, y, w, h, o = {}) => el('rect', { x, y, width: Math.max(0, w), height: Math.max(0, h), rx: o.rx, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, opacity: o.o, 'stroke-dasharray': o.dash, filter: o.filter });
const circle = (cx, cy, r, o = {}) => el('circle', { cx, cy, r: Math.max(0, r), fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, opacity: o.o, 'stroke-dasharray': o.dash, filter: o.filter });
const ellipse = (cx, cy, rx, ry, o = {}) => el('ellipse', { cx, cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, opacity: o.o });
const line = (x1, y1, x2, y2, o = {}) => el('line', { x1, y1, x2, y2, stroke: o.stroke ?? C.ink, 'stroke-width': o.sw ?? 3, 'stroke-linecap': o.cap ?? 'round', opacity: o.o, 'stroke-dasharray': o.dash });
function path(d, o = {}) {
  return el('path', {
    d, fill: o.fill ?? 'none', stroke: o.stroke, 'stroke-width': o.sw, 'stroke-linecap': o.cap ?? 'round',
    'stroke-linejoin': o.join ?? 'round', opacity: o.o, 'stroke-dasharray': o.dash, 'fill-rule': o.rule, filter: o.filter,
  });
}
// path drawn on from 0..1 (uses normalised pathLength)
function drawPath(d, p, o = {}) {
  if (p <= 0) return '';
  return el('path', {
    d, pathLength: 1, fill: 'none', stroke: o.stroke ?? C.ink, 'stroke-width': o.sw ?? 4,
    'stroke-linecap': o.cap ?? 'round', 'stroke-linejoin': 'round',
    'stroke-dasharray': p >= 1 ? undefined : '1 2', 'stroke-dashoffset': p >= 1 ? undefined : r2(1 - p) + 0.0001,
    opacity: o.o,
  });
}
function poly(pts, close = false) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join(' ') + (close ? ' Z' : '');
}
// smooth curve through points (Catmull-Rom -> cubic)
function smooth(pts, close = false) {
  if (pts.length < 2) return '';
  const n = pts.length;
  const get = i => (close ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  const segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d + (close ? ' Z' : '');
}
// quadratic arc between two points with bend (positive bends left of travel direction)
function arcPath(x1, y1, x2, y2, bend = 0.25) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  const cx = mx - dy * bend, cy = my + dx * bend;
  return `M${r2(x1)} ${r2(y1)} Q${r2(cx)} ${r2(cy)} ${r2(x2)} ${r2(y2)}`;
}
function quadPoint(x1, y1, x2, y2, bend, p) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  const cx = mx - dy * bend, cy = my + dx * bend;
  const a = (1 - p) * (1 - p), b = 2 * (1 - p) * p, c = p * p;
  return [a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2];
}

// ------------------------------------------------------------------ text
const FONTS = {
  serif: 'Fraunces', sans: 'Inter', mono: 'JetBrains Mono', hand: 'Caveat',
};
const measureCtx = (() => { const c = document.createElement('canvas'); return c.getContext('2d'); })();
function measure(str, size, family = 'sans', weight = 400, italic = false) {
  measureCtx.font = `${italic ? 'italic ' : ''}${weight} ${size}px "${FONTS[family] || family}"`;
  return measureCtx.measureText(str).width;
}
function T(str, x, y, o = {}) {
  const fam = FONTS[o.font || 'sans'] || o.font;
  return el('text', {
    x, y, 'font-family': `'${fam}'`, 'font-size': o.size ?? 32, 'font-weight': o.weight ?? 400,
    'font-style': o.italic ? 'italic' : undefined, fill: o.fill ?? C.ink, 'text-anchor': o.anchor ?? 'start',
    'letter-spacing': o.ls, opacity: o.o, 'dominant-baseline': o.baseline, stroke: o.stroke, 'stroke-width': o.sw,
    'paint-order': o.stroke ? 'stroke' : undefined, style: 'white-space:pre',
  }, esc(str));
}
// rich text line: segments [{t, fill, weight, italic, font}], laid out left to right
function richText(segs, x, y, o = {}) {
  const size = o.size ?? 32;
  const widths = segs.map(s => measure(s.t, size, s.font || o.font || 'sans', s.weight ?? o.weight ?? 400, s.italic ?? o.italic));
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.anchor === 'middle' ? x - total / 2 : o.anchor === 'end' ? x - total : x;
  return segs.map((s, i) => {
    const out = T(s.t, cx, y, { ...o, ...s, anchor: 'start', size, fill: s.fill ?? o.fill });
    cx += widths[i];
    return out;
  }).join('');
}
// typewriter reveal by character count
function typeText(str, p, x, y, o = {}) {
  const n = Math.round(clamp(p) * str.length);
  return n > 0 ? T(str.slice(0, n), x, y, o) : '';
}

// ------------------------------------------------------------------ common motion helpers
// standard entrance: returns {o, s, y}
function enter(t, t0, o = {}) {
  const d = o.d ?? 0.55;
  const p = P(t, t0, d, 'out');
  const pb = P(t, t0, d, o.ease ?? 'outBackSoft');
  return { o: p, s: lerp(o.from ?? 0.9, 1, pb), y: lerp(o.dy ?? 26, 0, p), p };
}
function exitAt(t, t1, d = 0.4) {
  const q = P(t, t1, d, 'inOut');
  return { o: 1 - q, y: -14 * q, q };
}
// pulse 1 -> peak -> 1 around time tp
function pulse(t, tp, d = 0.5, amt = 0.08) {
  if (tp == null || t < tp || t > tp + d) return 1;
  const p = (t - tp) / d;
  return 1 + amt * Math.sin(Math.PI * p);
}
const wobble = (t, f = 0.5, a = 1, ph = 0) => a * Math.sin(2 * Math.PI * f * t + ph);
