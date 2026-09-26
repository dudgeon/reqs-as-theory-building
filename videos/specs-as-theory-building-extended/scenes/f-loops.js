// Scenes: scratch, loop, governed, compound, naurloop. Wrapped in an IIFE so helpers stay local to this file.
'use strict';
(() => {
// ================================================================== local helpers
const DEG = Math.PI / 180;
const sstep = x => { const c = clamp(x); return c * c * (3 - 2 * c); };
// start time of a spoken word in line li (fb if the script no longer has it)
function wordAt(S, li, word, fb) {
  const L = S.line(li);
  const w = L && L.words.find(x => x.w.toLowerCase().replace(/[^a-z0-9']/g, '') === word);
  return w ? w.start : fb;
}
// keyframes [[t, v], ...], eased within each segment (so a walker slows into each stop)
function glide(t, K) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) return lerp(K[i - 1][1], K[i][1], Ease.inOutSine(clamp((t - K[i - 1][0]) / Math.max(1e-3, K[i][0] - K[i - 1][0]))));
  return K[K.length - 1][1];
}

// ---- mist: light, paper-toned puffs that hide what is not known yet. Each puff is a whitish ellipse over a faint
// paper3 underside, both radial gradients (no filters). The <defs> ships with each scene that draws mist.
const FOG = 'fLoopsMist', FOG_SH = 'fLoopsMistShade';
const fogDefs = () => `<defs><radialGradient id="${FOG}"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.94"/><stop offset="0.55" stop-color="#FFFDF8" stop-opacity="0.74"/><stop offset="1" stop-color="#FFFDF8" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="${FOG_SH}"><stop offset="0" stop-color="#DDD2BF" stop-opacity="0.5"/><stop offset="1" stop-color="#E9E0D0" stop-opacity="0"/></radialGradient>` +
  `<clipPath id="fLoopsAvatar"><circle cx="0" cy="0" r="50"/></clipPath></defs>`;
// one puff; asp is its height/width ratio
const fogBlob = (t, x, y, r, ph, o, asp = 0.64) => {
  if (o <= 0.01) return '';
  const fx = x + wobble(t, 0.06, 12, ph), fy = y + wobble(t, 0.045, 5, ph * 1.7);
  return ellipse(fx + 5, fy + r * asp * 0.42, r * 1.15, r * asp * 0.75, { fill: `url(#${FOG_SH})`, o: o * 0.8 }) +
    ellipse(fx, fy, r * 1.32, r * 1.32 * asp, { fill: `url(#${FOG})`, o });
};
// a person in a round frame (an owner, a stakeholder): needs fogDefs() for the clip
const avatar = (col, skin, hair) => [circle(0, 0, 56, { fill: C.card, stroke: col, sw: 5 }),
  G({ clip: 'url(#fLoopsAvatar)' }, circle(0, 0, 50, { fill: mixColor(C.card, col, 0.14) }), G({ y: 14, s: 0.78 }, iconBust({ color: col, skin, hair })))].join('');

// ---- the product-shaping loop (shared by `scratch`, `loop`, `naurloop`, and in miniature by `compound`)
const RING = [
  { label: 'DISCOVER', a: -90, col: C.teal, dark: C.tealDark },
  { label: 'VERIFY', a: -18, col: C.teal, dark: C.tealDark },
  { label: 'SPECIFY', a: 54, col: C.coral, dark: C.coralDark },
  { label: 'BUILD', a: 126, col: C.plum, dark: C.plum },
  { label: 'LEARN', a: 198, col: C.gold, dark: C.goldDeep },
];
const ringPt = (rx, ry, a) => [rx * Math.cos(a * DEG), ry * Math.sin(a * DEG)];
function bulb(t, a) {
  const lit = clamp(a), out = [];
  if (lit > 0) {
    out.push(circle(0, -8, 56 * lit, { fill: 'url(#gGlow)', o: 0.95 * lit }));
    [-160, -125, -90, -55, -20].forEach((d, i) => {
      const r0 = 28, r1 = 38 + 3 * Math.sin(t * 5 + i);
      out.push(line(Math.cos(d * DEG) * r0, -8 + Math.sin(d * DEG) * r0, Math.cos(d * DEG) * r1, -8 + Math.sin(d * DEG) * r1, { stroke: C.goldDeep, sw: 3.5, o: lit }));
    });
  }
  out.push(circle(0, -8, 20, { fill: mixColor(C.paper2, C.goldLight, lit), stroke: C.goldDeep, sw: 3.5 }));
  out.push(path('M-6 -6 Q0 -16 6 -6', { stroke: C.goldDeep, sw: 2.5 }));
  out.push(rect(-9, 10, 18, 13, { rx: 3, fill: C.ink3 }), line(-8, 16, 8, 16, { stroke: C.paper2, sw: 2 }));
  return out.join('');
}
// station icons, drawn to fit a disc of radius ~50; a = 0…1 activity
const RING_ICONS = [
  (t, a) => {   // DISCOVER: a magnifier over fog, finding a rule
    const sw = Math.sin(t * 1.7) * 7;
    return [circle(-20, 17, 16, { fill: C.paper3 }), circle(2, 12, 21, { fill: C.paper3 }), circle(24, 19, 14, { fill: C.paper3 }),
      G({ x: -5 + sw, y: -9, s: 0.62 }, circle(0, 0, 30, { fill: C.card, stroke: C.teal, sw: 9 }),
        T('§', 0, 14, { font: 'serif', size: 38, weight: 700, fill: C.teal, anchor: 'middle', o: clamp(a * 2) }),
        line(22, 22, 50, 50, { stroke: C.teal, sw: 12 }))].join('');
  },
  (t, a) => [G({ x: -8, y: -2, s: 0.5 }, iconBust({ color: C.teal, skin: C.skin[3], hair: C.hair[3] })), G({ x: 22, y: 22 }, seal(clamp(a * 1.6 - 0.3), { r: 17 }))].join(''),   // VERIFY
  (t, a) => G({ y: 2, s: 0.4, r: -4 }, specDoc({ w: 150, h: 190, reveal: clamp(a), accent: C.coral })),   // SPECIFY
  (t, a) => G({ y: 42, s: 0.37 }, robot(t, { typing: a > 0.02 ? 1 : 0 })),   // BUILD
  (t, a) => bulb(t, a),   // LEARN
];
// The ring, centred at (0,0). rx/ry: radii (an ellipse while morphing); draw: 0…1 draw-on; st[i]: station pop 0…1;
// act[i]: icon activity; tok: token angle (deg) or null; hi[i]: station glow; k: size factor; labels: show station names;
// slots: 0…1 shows dashed empty slots where stations have not arrived yet.
function loopRing(t, o = {}) {
  const { rx = 300, ry = rx, draw = 1, st = null, act = null, tok = null, hi = null, k = 1, labels = true, labO = 1, slots = 0 } = o;
  const out = [];
  const d = `M0 ${r2(-ry)} A${r2(rx)} ${r2(ry)} 0 1 1 0 ${r2(ry)} A${r2(rx)} ${r2(ry)} 0 1 1 0 ${r2(-ry)}`;
  out.push(drawPath(d, draw, { stroke: C.paper3, sw: 30 * k, o: 0.6 }));
  out.push(drawPath(d, draw, { stroke: C.ink2, sw: 5 * k }));
  if (draw >= 1) out.push(el('path', { d, fill: 'none', stroke: C.card, 'stroke-width': r2(2 * k), 'stroke-dasharray': `${r2(3 * k)} ${r2(21 * k)}`, 'stroke-dashoffset': r2(-t * 46 * k), 'stroke-linecap': 'round', opacity: 0.9 }));
  RING.forEach(s => {   // chevrons between stations, pointing clockwise
    const am = s.a + 36, frac = (((am + 90) % 360) + 360) % 360 / 360;
    const p = clamp((draw - frac) / 0.05);
    if (p <= 0) return;
    const [x, y] = ringPt(rx, ry, am);
    const ang = Math.atan2(ry * Math.cos(am * DEG), -rx * Math.sin(am * DEG)) / DEG;
    out.push(G({ x, y, r: ang, s: k * lerp(0.4, 1, Ease.outBack(p)), o: p }, path('M-9 -13 L6 0 L-9 13', { stroke: C.ink2, sw: 6 })));
  });
  if (slots > 0) RING.forEach((s, i) => {   // empty stations, waiting for their cue
    const so = slots * (1 - clamp((st ? st[i] : 0) * 3));
    if (so <= 0.01) return;
    const [x, y] = ringPt(rx, ry, s.a);
    out.push(circle(x, y, 66 * k, { fill: C.paper, stroke: s.col, sw: 3 * k, dash: `${r2(9 * k)} ${r2(9 * k)}`, o: 0.55 * so }));
  });
  if (tok != null) {   // the token runs under the station discs
    const [x, y] = ringPt(rx, ry, tok);
    out.push(circle(x, y, 48 * k, { fill: 'url(#gGlow)', o: 0.95 }), circle(x, y, 14.5 * k, { fill: C.gold }), circle(x - 4 * k, y - 4 * k, 5 * k, { fill: '#FFF6DE', o: 0.9 }));
  }
  if (st) RING.forEach((s, i) => {
    const p = clamp(st[i]);
    if (p <= 0) return;
    const [x, y] = ringPt(rx, ry, s.a);
    const R = 66 * k, h = hi ? clamp(hi[i]) : 0;
    out.push(G({ x, y, s: lerp(0.3, 1, Ease.outBack(p)) * (1 + 0.06 * h), o: clamp(p * 3) },
      h > 0 ? circle(0, 0, R * 2.1, { fill: 'url(#gGlow)', o: 0.55 * h }) : '',
      circle(0, 0, R + 10 * k, { fill: s.col, o: 0.16 + 0.22 * h }),
      circle(0, 0, R, { fill: C.card, stroke: s.col, sw: 5 * k }),
      G({ s: 1.14 * k }, RING_ICONS[i](t, act ? act[i] : 1))));
    if (labels) {
      const lp = clamp(p * 2 - 0.4) * labO;
      if (lp <= 0) return;
      const size = 31 * k, gap = R + 20 * k;
      const [lx, ly, anc] = i === 0 ? [x, y - gap, 'middle'] : i === 1 || i === 2 ? [x + gap, y + size * 0.36, 'start'] : [x - gap, y + size * 0.36, 'end'];
      out.push(T(s.label, lx, ly, { size, weight: 800, fill: s.dark, anchor: anc, ls: 5.5 * k, o: lp }));
    }
  });
  return out.join('');
}
// a tiny version for badges: the same five coloured stations and a gold token going round
function miniRing(t, r, spin) {
  const out = [circle(0, 0, r, { stroke: C.ink2, sw: Math.max(2, r * 0.14) })];
  RING.forEach(s => { const [x, y] = ringPt(r, r, s.a); out.push(circle(x, y, r * 0.27, { fill: s.col })); });
  const [tx, ty] = ringPt(r, r, spin - 90);
  out.push(circle(tx, ty, r * 0.75, { fill: 'url(#gGlow)', o: 0.9 }), circle(tx, ty, r * 0.2, { fill: C.gold }));
  return out.join('');
}
// a small spec page (for badges); hot 0…1 turns it into an alert
function miniSpec(hot = 0) {
  const c = C.coral, f = mixColor(C.card, C.coralLight, hot);
  return [rect(-16, -20, 32, 40, { rx: 4, fill: f, stroke: c, sw: 3 }), path('M6 -20 L16 -10', { stroke: c, sw: 2.5 }),
    line(-9, -8, 7, -8, { stroke: c, sw: 2.5 }), line(-9, 0, 9, 0, { stroke: c, sw: 2.5 }), line(-9, 8, 3, 8, { stroke: c, sw: 2.5 })].join('');
}
// a gold-glowing person glyph (someone holding the theory), centred
const judgePerson = () => [circle(0, 0, 30, { fill: 'url(#gGlow)', o: 0.9 }), circle(0, -8, 8.5, { fill: C.skin[2] }), path('M-13 15 Q-13 2 0 2 Q13 2 13 15 Z', { fill: C.goldDeep })].join('');

// ================================================================== SCRATCH (chapter: Loops that compound)
// Three lanes, one team each. Every team walks into the same mist and finds the same three things.
const SCR = { GY: [405, 612, 819], IX: [800, 1110, 1450], X0: 470, STAND: [110, 125, 110], ITEM: 100 };
// when each lane's team sets off and when each of its three finds surfaces (shared by render and sfx)
function scratchPlan(S) {
  const scr = S.cue('scratch'), again = S.cue('again');
  const wR = wordAt(S, 0, 'rules', again + 1.1), wQ = wordAt(S, 0, 'quirks', again + 1.8), wO = wordAt(S, 0, 'owners', again + 2.3);
  return [
    { go: S.start + 0.05, rev: [scr - 0.6, scr + 0.1, scr + 0.8], team: [[C.teal, C.skin[0], C.hair[0], 0], [C.blue, C.skin[3], C.hair[3], 3]] },
    { go: again - 0.45, rev: [wR - 0.3, wQ - 0.3, wO - 0.3], team: [[C.coral, C.skin[2], C.hair[1], 2], [C.olive, C.skin[1], C.hair[4], 4]] },
    { go: again - 0.3, rev: [wR - 0.12, wQ - 0.12, wO - 0.12], team: [[C.plum, C.skin[4], C.hair[2], 1], [C.mustard, C.skin[3], C.hair[0], 0]] },
  ];
}
// what every team finds: a rule, a platform quirk, an owner
const SCR_ITEMS = [
  () => G({ s: 0.88 }, iconPolicy()),
  () => stickyNote(['batch', '2 a.m.'], { w: 150, h: 112, size: 36, r: 5 }),
  () => avatar(C.teal, C.skin[3], C.hair[0]),
];
SCENES.scratch = {
  render(t, S) {
    const longer = S.cue('longer'), lw = S.cue('loopword');
    const { GY, IX, X0, STAND, ITEM } = SCR;
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [fogDefs()];
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'From ' }, { t: 'scratch', fill: C.coral }, { t: ', every time' }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    const lanes = scratchPlan(S);
    const dimL = 1 - 0.5 * P(t, longer - 0.45, 0.5);          // the lanes step back for the long document…
    const fogBack = P(t, longer - 0.45, 1.0, 'inOut');         // …and the mist rolls back over what they found
    const thin = P(t, lw - 0.2, 1.1, 'inOut');                 // the loop starts to thin it
    const blobs = once('scratch_mist', () => GY.map((gy, li) => {
      const R = rng(40 + li), b = [];
      for (let x = 545; x < 1850; x += 66) {
        b.push([x + (R() - 0.5) * 30, gy - 132 + (R() - 0.5) * 26, 46 + R() * 34, R() * 6.28, 0.55 + R() * 0.3]);
        b.push([x + 22 + (R() - 0.5) * 30, gy - 88 + (R() - 0.5) * 26, 50 + R() * 34, R() * 6.28, 0.5 + R() * 0.3]);
        b.push([x + 44 + (R() - 0.5) * 30, gy - 44 + (R() - 0.5) * 20, 44 + R() * 30, R() * 6.28, 0.5 + R() * 0.25]);
      }
      return b;
    }));
    lanes.forEach((L, li) => {
      const gy = GY[li], iy = gy - ITEM;
      const eL = enter(t, S.start + 0.02 + li * 0.1, { dy: 16 });
      const stop = k => IX[k] - STAND[k];
      const front = glide(t, [[L.go, X0], [L.rev[0] - 0.05, stop(0)], [L.rev[0] + 0.12, stop(0)], [L.rev[1] - 0.05, stop(1)], [L.rev[1] + 0.1, stop(1)], [L.rev[2] + 0.25, stop(2)]]);
      const walking = t > L.go && t < L.rev[2] + 0.25;
      // ground, the blank spec each team starts from, and what it finds
      const base = [line(300, gy, 1800, gy, { stroke: C.ink3, sw: 2.5, dash: '3 12', o: 0.7 })];
      base.push(G({ x: 200, y: gy - 74, r: -3 }, docCard({ w: 112, h: 142, title: 'SPEC', titleColor: C.coral, lines: 0, accent: C.coral, seed: 70 + li })));
      SCR_ITEMS.forEach((f, k) => {
        const p = P(t, L.rev[k], 0.5, 'outBack');
        if (p <= 0) return;
        const ring = P(t, L.rev[k], 0.7, 'out');
        if (ring < 1) base.push(circle(IX[k], iy, 40 + 62 * ring, { stroke: li ? C.coral : C.teal, sw: 4, o: 1 - ring }));
        base.push(G({ x: IX[k], y: iy - 12 * (1 - p), s: lerp(0.4, 1, p), o: clamp(p * 2) }, f()));
      });
      out.push(G({ o: eL.o * dimL, y: eL.y }, base));
      // the mist: the trail behind the team is clear, and it parts around each find (until it rolls back)
      const found = IX.map((ix, k) => P(t, L.rev[k] - 0.05, 0.55, 'out'));
      const mist = blobs[li].map(([bx, by, br, ph, asp]) => {
        let c = sstep((front + 60 - bx) / 150);
        found.forEach((fp, k) => { if (fp > 0) c = Math.max(c, fp * (1 - sstep((Math.hypot((bx - IX[k]) / 1.3, by - iy) - 60) / 100))); });
        return fogBlob(t, bx, by, br * (1 - 0.25 * thin), ph + li * 2.1, (1 - 0.5 * thin) * (1 - c * (1 - fogBack)), asp);
      });
      out.push(G({ o: eL.o, y: eL.y }, mist));
      // the team (lane 1 is pleased with its finds; lanes 2 and 3 have seen them before)
      const team = L.team.map(([shirt, skin, hair, hs], m) => {
        const bob = walking ? -Math.abs(Math.sin((t - L.go) * 8.5 + m * 1.3)) * 7 : 0;
        const mood = li === 0 ? (t > L.rev[0] + 0.2 ? 'happy' : 'neutral') : (t > L.rev[1] + 0.15 ? 'worried' : 'neutral');
        return G({ x: front - m * 88, y: gy + bob, s: 0.6 }, person(t, { shirt, skin, hair, hairStyle: hs, seed: 20 + li * 2 + m, look: 0.6, mood }));
      });
      out.push(G({ o: eL.o * (1 - 0.68 * fogBack), y: eL.y }, team));
    });
    // déjà vu: the same three things, found three times
    const same = [];
    IX.forEach((ix, k) => [0, 1].forEach(j => {
      const tj = lanes[j + 1].rev[k] + 0.1;
      const p = P(t, tj, 0.35, 'inOut');
      if (p <= 0) return;
      const y1 = GY[j] - ITEM + 64, y2 = GY[j + 1] - ITEM - 64;
      same.push(drawPath(`M${ix} ${y1} L${ix} ${y2}`, p, { stroke: C.coral, sw: 4, o: 0.9 }));
      const bp = P(t, tj + 0.15, 0.35, 'outBack');
      if (bp > 0) same.push(G({ x: ix, y: (y1 + y2) / 2, s: bp }, circle(0, 0, 23, { fill: C.card, stroke: C.coral, sw: 3.5 }), T('=', 0, 12, { size: 36, weight: 800, fill: C.coral, anchor: 'middle' })));
    }));
    const sameO = 1 - P(t, longer - 0.45, 0.4);
    out.push(G({ o: sameO }, same));
    const wS = wordAt(S, 0, 'same', S.cue('again') + 0.8);
    const eS = enter(t, wS - 0.2, { dy: 10 });
    if (eS.o * sameO > 0) out.push(G({ o: eS.o * sameO, y: eS.y }, richText([
      { t: 'same', fill: C.coral }, { t: ' rules, ' }, { t: 'same', fill: C.coral }, { t: ' quirks, ' }, { t: 'same', fill: C.coral }, { t: ' owners' },
    ], 960, 935, { font: 'hand', size: 52, weight: 700, anchor: 'middle', fill: C.ink })));
    // a longer document: it grows and grows, and the mist stays
    const dIn = enter(t, longer - 0.35, { dy: 20, d: 0.45 });
    const dOut = 1 - P(t, lw - 0.4, 0.4);
    if (dIn.o * dOut > 0) {
      const h = lerp(150, 560, P(t, longer - 0.25, 1.4, 'out')) + 70 * P(t, longer + 1.1, 1.0, 'inOut');
      const w = 320, x0 = -w / 2, y0 = 0, f = 36;
      const D = [];
      D.push(rect(x0 + 3, y0 + 9, w, h, { rx: 10, fill: 'rgba(30,42,58,0.12)' }));
      D.push(path(`M${x0 + 10} ${y0} L${x0 + w - f} ${y0} L${x0 + w} ${y0 + f} L${x0 + w} ${y0 + h - 10} Q${x0 + w} ${y0 + h} ${x0 + w - 10} ${y0 + h} L${x0 + 10} ${y0 + h} Q${x0} ${y0 + h} ${x0} ${y0 + h - 10} L${x0} ${y0 + 10} Q${x0} ${y0} ${x0 + 10} ${y0} Z`, { fill: C.card, stroke: C.coral, sw: 4 }));
      D.push(path(`M${x0 + w - f} ${y0} L${x0 + w - f} ${y0 + f} L${x0 + w} ${y0 + f} Z`, { fill: C.paper3 }));
      D.push(T('SPEC', x0 + 24, y0 + 48, { font: 'mono', size: 28, weight: 600, fill: C.coral }));
      const R = rng(77), n = Math.floor((h - 84) / 24);
      for (let i = 0; i < n; i++) {
        const ly = y0 + 80 + i * 24, wv = 0.45 + R() * 0.5;
        if (i % 8 === 7) { D.push(line(x0 + 18, ly + 2, x0 + w - 18, ly + 2, { stroke: C.faint, sw: 2, dash: '8 7' })); continue; }
        D.push(rect(x0 + 24, ly - 2, (w - 48) * wv, 8, { rx: 4, fill: C.ink3, o: 0.65 }));
      }
      out.push(G({ x: 960, y: 250 + dIn.y, r: wobble(t, 0.4, 1.2), o: dIn.o * dOut, s: dIn.s }, D));
      const lb = P(t, wordAt(S, 0, "won't", longer + 0.7) - 0.25, 0.45);
      if (lb > 0) out.push(G({ o: lb * dOut }, T('longer docs won’t fix it', 960, 962, { font: 'hand', size: 56, weight: 700, fill: C.coral, anchor: 'middle' }),
        drawPath('M752 984 C880 994 1030 978 1172 988', P(t, wordAt(S, 0, 'fix', longer + 1.0) - 0.1, 0.45, 'inOut'), { stroke: C.coral, sw: 5 })));
    }
    // a loop draws around everything (the `loop` scene picks this ring up and tightens it)
    const lp = P(t, lw - 0.35, 0.85, 'inOut');
    if (lp > 0) out.push(G({ x: 960, y: 575 }, loopRing(t, { rx: 830, ry: 370, draw: lp })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => {
    const lanes = scratchPlan(S), longer = S.cue('longer'), lw = S.cue('loopword');
    return [
      { t: lanes[0].go, type: 'steps', dur: 2.2, gain: 0.3 },
      ...lanes[0].rev.map((v, k) => ({ t: v, type: 'pop', pitch: 0.9 + k * 0.1, gain: 0.6 })),
      { t: lanes[1].go, type: 'steps', dur: 2.6, gain: 0.3 },
      ...lanes[1].rev.map((v, k) => ({ t: v, type: 'pluck', note: [0, 2, 4][k], gain: 0.5 })),
      ...lanes[2].rev.map(v => ({ t: v + 0.1, type: 'scribble', dur: 0.3, gain: 0.3 })),
      { t: longer - 0.35, type: 'whoosh', dur: 0.5, gain: 0.4 }, { t: longer - 0.2, type: 'typing', dur: 1.4, gain: 0.35 },
      { t: wordAt(S, 0, 'fix', longer + 1.0) - 0.1, type: 'fizzle', gain: 0.4 },
      { t: lw - 0.35, type: 'whoosh', dur: 0.85, gain: 0.55 }, { t: lw + 0.35, type: 'chime', note: 2 },
    ];
  },
};

// ================================================================== LOOP
SCENES.loop = {
  render(t, S) {
    const cT = ['discover', 'verify', 'specify', 'build', 'learn'].map(n => S.cue(n) - 0.3);
    const wb = S.cue('writeback'), gv = S.cue('governed');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Product shaping runs a ' }, { t: 'loop', fill: C.tealDark }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    // the ring from `scratch` tightens into the loop
    const m = P(t, S.start + 0.05, 1.15, 'inOut');
    const cx = 960, cy = lerp(575, 612, m), rx = lerp(830, 300, m), ry = lerp(370, 300, m);
    const A = RING.map(s => s.a);
    const lap0 = S.start + 0.9;
    let tok = null;
    if (t >= lap0) {
      if (t < cT[0]) tok = lerp(-90, 270, P(t, lap0, cT[0] - lap0, 'inOut'));
      else {
        tok = -90;
        for (let i = 1; i < 5; i++) if (t >= cT[i] - 0.5) tok = lerp(A[i - 1], A[i], P(t, cT[i] - 0.5, 0.5, 'inOut'));
        if (t >= gv + 0.3) tok = lerp(198, 270, P(t, gv + 0.3, 0.6, 'inOut'));
      }
    }
    const st = cT.map(v => P(t, v, 0.55, 'linear'));
    const act = cT.map(v => P(t, v + 0.2, 1.1, 'inOut'));
    const hi = A.map((a, i) => {
      if (tok == null || st[i] <= 0) return 0;
      const dd = Math.abs((((tok - a) % 360) + 540) % 360 - 180);
      return clamp(1 - dd / 24);
    });
    out.push(G({ x: cx, y: cy }, loopRing(t, { rx, ry, draw: 1, st, act, tok, hi, slots: P(t, S.start + 0.75, 0.6) })));
    // write back: Learn → the ledger of governed facts at the centre
    const [lx0, ly0] = ringPt(300, 300, 198);
    const LX = cx + lx0, LY = cy + ly0;
    const ledX = 960, ledY = cy + 20;
    out.push(handArrow(LX + 50, LY + 50, ledX - 194, ledY - 34, P(t, wb - 0.35, 0.5, 'inOut'), { color: C.goldDeep, bend: 0.28, sw: 5, head: 16 }));
    const eL = enter(t, wb - 0.2, { d: 0.5, dy: 18 });
    if (eL.o > 0) {
      const slots = [[-82, -18], [82, -18], [-82, 82], [82, 82]];
      const L = [shadowCard(-182, -128, 364, 262, { rx: 20 })];
      L.push(T('GOVERNED FACTS', 0, -84, { size: 24, weight: 800, fill: C.tealDark, anchor: 'middle', ls: 4 }));
      L.push(underline(-128, -72, 256, P(t, gv - 0.1, 0.5, 'inOut'), { color: C.teal, sw: 5 }));
      slots.forEach(([sx, sy]) => L.push(rect(sx - 72, sy - 44, 144, 88, { rx: 10, stroke: C.faint, sw: 2, dash: '6 6' })));
      out.push(G({ x: ledX, y: ledY + eL.y, s: eL.s, o: eL.o }, L));
      slots.forEach(([sx, sy], j) => {
        const f = P(t, wb + 0.05 + j * 0.2, 0.55, 'inOut');
        if (f <= 0) return;
        const [x, y] = quadPoint(LX, LY, ledX + sx, ledY + sy, 0.25, f);
        const sealP = P(t, gv - 0.25 + j * 0.18, 0.5, 'linear');
        out.push(G({ x, y: y + eL.y, s: lerp(0.35, 1, f) * pulse(t, gv - 0.1 + j * 0.18, 0.35, 0.07), r: lerp(-14, 0, f), o: clamp(f * 4) }, factChip({ w: 144, h: 88, sealP })));
      });
    }
    // …and the next lap starts from them
    const nx = P(t, gv + 0.35, 0.45, 'inOut');
    if (nx > 0) out.push(handArrow(960, ledY - 140, 960, cy - 300 + 70, nx, { color: C.tealDark, bend: 0, sw: 4, head: 14 }));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => {
    const cT = ['discover', 'verify', 'specify', 'build', 'learn'].map(n => S.cue(n) - 0.3);
    const wb = S.cue('writeback'), gv = S.cue('governed');
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 1.0, gain: 0.45 }, { t: S.start + 1.0, type: 'swish', dur: 1.2, gain: 0.3 },
      ...cT.map((v, i) => ({ t: v, type: 'pluck', note: [0, 2, 4, 7, 9][i], gain: 0.6 })),
      { t: cT[1] + 0.45, type: 'thud', gain: 0.35 }, { t: cT[3] + 0.25, type: 'typing', dur: 0.9, gain: 0.3 }, { t: cT[4] + 0.3, type: 'chime', note: 3 },
      { t: wb - 0.35, type: 'whoosh', dur: 0.6, gain: 0.5 },
      ...[0, 1, 2, 3].map(j => ({ t: wb + 0.55 + j * 0.2, type: 'tick', gain: 0.4, pitch: 0.9 + j * 0.06 })),
      ...[0, 1, 2, 3].map(j => ({ t: gv - 0.15 + j * 0.18, type: 'click', gain: 0.5 })),
      { t: gv + 0.5, type: 'chime', note: 5, gain: 0.7 },
    ];
  },
};

// ================================================================== GOVERNED
SCENES.governed = {
  render(t, S) {
    const src = S.cue('source'), own = S.cue('owner'), dat = S.cue('dated'), ver = S.cue('verified'), ass = S.cue('assumed'), dec = S.cue('decision');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'A ' }, { t: 'governed', fill: C.tealDark }, { t: ' fact' }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    // phase 2 reframe: the verified card moves left to make room
    const mv = P(t, ass - 0.8, 0.65, 'inOut');
    const side = 1 - P(t, ass - 0.85, 0.4);                     // provenance props leave
    const cx = lerp(1010, 590, mv), cy = lerp(548, 540, mv), cs = lerp(1.1, 0.95, mv);
    // the source: the policy clause from the enterprise scene
    const eP = enter(t, S.start + 0.02, { dy: 20 });
    const hl = P(t, S.start + 0.2, 0.35);
    const px = 330, py = 570;
    const pageO = eP.o * side;
    if (pageO > 0) out.push(G({ x: px, y: py + eP.y, r: -3, s: eP.s, o: pageO }, [
      G({ x: -40, y: -30, r: -4 }, binder({ color: C.blue })),
      shadowCard(-80, -150, 220, 290, { rx: 6 }),
      ...[0, 1, 2, 3, 4, 5, 6].map(k => rect(-56, -118 + k * 34, [150, 170, 120, 160, 140, 170, 100][k], 8, { rx: 4, fill: C.ink3, o: 0.5 })),
      rect(-66, -38, 190, 44, { rx: 6, fill: C.goldLight, o: 0.85 * hl }),
      T('§4.2(b)', -50, -6, { font: 'mono', size: 26, weight: 600, fill: C.ink, o: 0.4 + 0.6 * hl }),
    ]));
    // the clause lifts off and becomes the fact card
    const fly = P(t, S.start + 0.3, 0.55, 'inOut');
    if (fly > 0 && fly < 1) {
      const [fx, fy] = quadPoint(px + 30, py - 22, cx - 200, cy - 80, -0.25, fly);
      out.push(G({ x: fx, y: fy, s: lerp(1, 1.5, fly), o: 1 - P(t, S.start + 0.7, 0.2) }, rect(-95, -22, 190, 44, { rx: 6, fill: C.goldLight }), T('§4.2(b)', 0, 9, { font: 'mono', size: 26, weight: 600, anchor: 'middle' })));
    }
    const cIn = P(t, S.start + 0.62, 0.5, 'out');
    const k1 = cIn + P(t, src - 0.3, 0.4) + P(t, own - 0.3, 0.4) + P(t, dat - 0.3, 0.4);
    const card1 = { w: 720, claim: ['Unverified payments are', 'held, not rejected'], rows: [['SOURCE', 'Payments Policy vol. 3 §4.2(b)'], ['OWNER', 'Payments Compliance'], ['DATED', 'verified Sep 2026']], reveal: k1 / 4 };
    const vO = P(t, ver - 0.3, 0.25);
    const sealP = P(t, ver - 0.25, 0.55, 'linear');
    const cardPulse = pulse(t, ver - 0.05, 0.4, 0.035);
    if (cIn > 0) out.push(G({ x: cx, y: cy, s: cs * lerp(0.6, 1, Ease.outBack(cIn)) * cardPulse, o: clamp(cIn * 2) },
      factCard({ ...card1, status: null, accent: C.teal }),
      vO > 0 ? G({ o: vO }, factCard({ ...card1, status: 'verified', sealP })) : ''));
    // card-local → page coordinates
    const toP = (lx, ly) => [cx + lx * cs, cy + ly * cs];
    // SOURCE ↔ the clause
    const sp = P(t, src - 0.15, 0.55, 'inOut');
    if (sp > 0 && side > 0) {
      const [ax, ay] = toP(-322, 36);
      out.push(G({ o: side }, drawPath(arcPath(px + 128, py - 16, ax, ay, 0.18), sp, { stroke: C.goldDeep, sw: 3.5 }),
        circle(px + 128, py - 16, 6 * clamp(sp * 4), { fill: C.goldDeep }), circle(ax, ay, 6 * clamp(sp * 2 - 1), { fill: C.goldDeep })));
    }
    // OWNER ↔ the person who vouches for it
    const eO = enter(t, own - 0.3);
    const ox = 1660, oy = 560;
    if (eO.o * side > 0) {
      const ck = P(t, ver + 0.1, 0.4, 'outBack');
      out.push(G({ o: eO.o * side, y: eO.y }, G({ x: ox, y: oy, s: 0.95 * eO.s }, iconBust({ color: C.teal, skin: C.skin[3], hair: C.hair[3] })),
        T('Payments Compliance', ox, oy + 96, { size: 22, weight: 700, fill: C.tealDark, anchor: 'middle' }),
        ck > 0 ? G({ x: ox + 52, y: oy - 34, s: ck }, circle(0, 0, 24, { fill: C.teal }), G({ s: 0.7 }, checkMark(1, { color: C.card, sw: 9 }))) : ''));
      const [bx, by] = toP(360, 76);
      out.push(G({ o: side }, drawPath(arcPath(bx + 6, by, ox - 62, oy + 8, -0.12), P(t, own - 0.1, 0.5, 'inOut'), { stroke: C.tealDark, sw: 3.5 })));
    }
    // DATED ↔ a calendar leaf
    const eD = enter(t, dat - 0.3);
    if (eD.o * side > 0) {
      const dx = 1660, dy = 800;
      out.push(G({ x: dx, y: dy + eD.y, s: eD.s, o: eD.o * side, r: wobble(t, 0.5, 1.5) }, shadowCard(-54, -56, 108, 112, { rx: 12 }),
        rect(-54, -56, 108, 34, { rx: 12, fill: C.ink2 }), rect(-54, -34, 108, 12, { fill: C.ink2 }),
        circle(-26, -56, 5, { fill: C.card }), circle(26, -56, 5, { fill: C.card }),
        T('SEP', 0, -31, { size: 22, weight: 800, fill: C.card, anchor: 'middle', ls: 2 }),
        T('2026', 0, 30, { font: 'serif', size: 34, weight: 600, fill: C.ink, anchor: 'middle' })));
      const [bx, by] = toP(360, 116);
      out.push(G({ o: side }, drawPath(arcPath(bx + 6, by, dx - 62, dy - 10, 0.12), P(t, dat - 0.1, 0.5, 'inOut'), { stroke: C.ink2, sw: 3 })));
    }
    // the sticky note from the enterprise scene becomes an ASSUMED fact
    const nIn = P(t, ass - 0.75, 0.5, 'out');
    const morph = P(t, ass - 0.3, 0.45, 'inOut');
    const ax = 1400, ay = 355;
    if (nIn > 0 && morph < 1) {
      const nx = lerp(2080, ax - 40, nIn), ny = lerp(260, ay, nIn);
      out.push(G({ x: nx, y: ny, s: lerp(1, 2.1, morph), r: lerp(14, 4, nIn), o: 1 - morph }, stickyNote(['batch posts', '2 a.m. only'], { w: 200, h: 120, size: 34, r: 0 })));
    }
    if (morph > 0) {
      const kA = clamp(morph * 1.3) + P(t, ass + 0.2, 0.4) + P(t, ass + 0.55, 0.4);
      out.push(G({ x: ax, y: ay, s: lerp(0.45, 1, Ease.outBack(morph)), o: clamp(morph * 2) },
        factCard({ w: 600, claim: 'Batch posts at 2 a.m. only', rows: [['SOURCE', 'one engineer’s memory'], ['OWNER', 'needs an owner']], status: 'assumed', reveal: kA / 3 })));
    }
    // a decision keeps its reasons
    const eDc = enter(t, dec - 0.3, { dy: 22 });
    if (eDc.o > 0) {
      const dy0 = 725;
      const kD = 1 + P(t, dec + 0.1, 0.4) + P(t, dec + 0.5, 0.4);
      const strike = P(t, dec + 0.95, 0.35, 'inOut');
      out.push(G({ x: ax, y: dy0 + eDc.y, s: eDc.s, o: eDc.o },
        factCard({ w: 600, kind: 'DECISION', claim: 'Hold for review', rows: [['WHY', 'rejecting would harm customers'], ['REJECTED', 'auto-reject']], status: null, reveal: kD / 3 }),
        drawPath('M-138 71 L6 69', strike, { stroke: C.coral, sw: 4 })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => {
    const src = S.cue('source'), own = S.cue('owner'), dat = S.cue('dated'), ver = S.cue('verified'), ass = S.cue('assumed'), dec = S.cue('decision');
    return [
      { t: S.start + 0.05, type: 'pop', pitch: 0.85, gain: 0.5 }, { t: S.start + 0.3, type: 'whoosh', dur: 0.55, gain: 0.45 },
      { t: S.start + 0.75, type: 'thud', gain: 0.4 },
      { t: src - 0.3, type: 'pluck', note: 0 }, { t: src - 0.1, type: 'scribble', dur: 0.5, gain: 0.35 },
      { t: own - 0.3, type: 'pluck', note: 2 }, { t: dat - 0.3, type: 'pluck', note: 4 },
      { t: ver - 0.2, type: 'thud', gain: 0.75 }, { t: ver + 0.15, type: 'chime', note: 4, gain: 0.6 },
      { t: ass - 0.8, type: 'whoosh', dur: 0.6, gain: 0.5 }, { t: ass - 0.3, type: 'pop', pitch: 0.8 },
      { t: dec - 0.3, type: 'pop', pitch: 1.1 }, { t: dec + 0.95, type: 'scribble', dur: 0.35, gain: 0.5 },
    ];
  },
};

// ================================================================== COMPOUND
// a fog-of-war hex map: loop 1 cleared; loop 2 (adjacent) inherits most of it; loop 3 (unrelated) reuses shared rules,
// platforms and people; unknowns and time shrink; what is left needs judgment; a changed rule shows its impact.
const HEXMAP = () => once('compound_hexmap', () => {
  const R = 40, w = Math.sqrt(3) * R, rowH = 1.5 * R, cx = 960, cy = 575, ex = 820, ey = 292;
  const hexes = [];
  for (let row = -5; row <= 5; row++) for (let col = -14; col <= 14; col++) {
    const x = cx + col * w + (row & 1 ? w / 2 : 0), y = cy + row * rowH;
    const d = Math.hypot((x - cx) / ex, (y - cy) / ey);
    if (d <= 1) hexes.push({ x, y, d, id: hexes.length, tint: 0 });
  }
  const near = (px, py, r) => hexes.filter(h => Math.hypot(h.x - px, h.y - py) <= r);
  const at = (px, py) => hexes.reduce((b, h) => (Math.hypot(h.x - px, h.y - py) < Math.hypot(b.x - px, b.y - py) ? h : b));
  const c1 = at(440, 635), c2 = at(544, 575), c3 = at(1480, 515);
  const L1 = near(c1.x, c1.y, 140), L2 = near(c2.x, c2.y, 125), L3 = near(c3.x, c3.y, 75);
  const inL1 = new Set(L1.map(h => h.id));
  const L2new = L2.filter(h => !inL1.has(h.id)).sort((a, b) => a.y - b.y || a.x - b.x);
  // hex outline (pointy top) and region borders
  const V = r => [0, 1, 2, 3, 4, 5].map(j => [r * Math.cos((-90 + 60 * j) * DEG), r * Math.sin((-90 + 60 * j) * DEG)]);
  const tile = poly(V(R - 2.5), true);
  const border = reg => {
    const ids = reg.map(h => h.id), edges = [];
    reg.forEach(h => {
      const v = V(R).map(([x, y]) => [h.x + x, h.y + y]);
      for (let j = 0; j < 6; j++) {
        const a = (-60 + 60 * j) * DEG, nx = h.x + w * Math.cos(a), ny = h.y + w * Math.sin(a);
        if (reg.some(o => Math.hypot(o.x - nx, o.y - ny) < 4)) continue;
        edges.push([v[j], v[(j + 1) % 6]]);
      }
    });
    const pts = [edges[0][0]]; let cur = edges[0]; const used = new Set([0]);
    for (let guard = 0; guard < edges.length; guard++) {
      pts.push(cur[1]);
      const ni = edges.findIndex((e, i) => !used.has(i) && Math.hypot(e[0][0] - cur[1][0], e[0][1] - cur[1][1]) < 1);
      if (ni < 0) break;
      used.add(ni); cur = edges[ni];
    }
    void ids;
    return poly(pts, true);
  };
  // fact glyph kinds on cleared hexes
  const R0 = rng(12), kinds = ['rule', 'platform', 'person', 'process'];
  hexes.forEach(h => { h.kind = kinds[Math.floor(R0() * 4)]; h.tint = (R0() - 0.5) * 0.08; });
  const pick = (reg, px, py) => reg.reduce((b, h) => (Math.hypot(h.x - px, h.y - py) < Math.hypot(b.x - px, b.y - py) ? h : b));
  const rule1 = pick(L1.filter(h => L2.includes(h)), 510, 515), plat1 = pick(L1, 371, 635), pers1 = pick(L1, 475, 695);
  rule1.kind = 'rule'; plat1.kind = 'platform'; pers1.kind = 'person';
  const rule3 = pick(L3, 1445, 455), plat3 = pick(L3, 1410, 515), pers3 = pick(L3, 1514, 575);
  rule3.kind = 'rule'; plat3.kind = 'platform'; pers3.kind = 'person';
  const shared = [[rule1, rule3], [plat1, plat3], [pers1, pers3]];
  const L3rest = L3.filter(h => ![rule3, plat3, pers3].includes(h)).sort((a, b) => b.x - a.x);
  return { R, w, hexes, L1, L2, L3, L2new, L3rest, inL1, tile, b1: border(L1), b2: border(L2), b3: border(L3), shared, rule1 };
});
function hexGlyph(t, kind) {
  if (kind === 'rule') return T('§', 0, 12, { font: 'serif', size: 36, weight: 700, fill: C.teal, anchor: 'middle' });
  if (kind === 'platform') return [rect(-13, -16, 26, 31, { rx: 5, fill: C.blue }), rect(-8, -10, 16, 4, { rx: 2, fill: 'rgba(255,255,255,0.4)' }),
    rect(-8, -2, 16, 4, { rx: 2, fill: 'rgba(255,255,255,0.4)' }), circle(6, 8, 2.8, { fill: C.tealLight })].join('');
  if (kind === 'person') return [circle(0, -7, 8.5, { fill: C.skin[1] }), path('M-14 16 Q-14 2 0 2 Q14 2 14 16 Z', { fill: C.teal })].join('');
  return G({ r: t * 25 }, path(gearPath(14, 8), { fill: C.teal, o: 0.85 }), circle(0, 0, 5, { fill: C.card }));
}
SCENES.compound = {
  render(t, S) {
    const sf = S.cue('startsfrom'), adj = S.cue('adjacent'), orth = S.cue('orthogonal'), sh = S.cue('shared');
    const few = S.cue('fewer'), fast = S.cue('faster'), jd = S.cue('judgment'), imp = S.cue('impact');
    const l2 = S.line(1).start, l3 = S.line(2).start;
    const wRu = wordAt(S, 0, 'rules', sh + 0.25), wPl = wordAt(S, 0, 'platforms', sh + 1.1), wPe = wordAt(S, 0, 'people', sh + 1.8);
    const wCh = wordAt(S, 2, 'changes', l3 + 0.5);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const M = HEXMAP();
    const out = [fogDefs()];
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Each loop starts ' }, { t: 'further ahead', fill: C.tealDark }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    // when each hex clears (flips from fog to a verified fact)
    const clearAt = new Map(), pocketAt = new Map();
    M.L1.forEach(h => clearAt.set(h.id, -1e9));
    M.L2new.forEach((h, j) => { if (j < 3) clearAt.set(h.id, adj + 0.45 + j * 0.32); else pocketAt.set(h.id, jd - 0.3 + (j - 3) * 0.12); });
    const arrive = [wRu, wPl, wPe].map(v => v - 0.3 + 0.75);
    M.shared.forEach(([, b], j) => clearAt.set(b.id, arrive[j]));
    M.L3rest.forEach((h, j) => { if (j === 0) clearAt.set(h.id, wPe + 1.0); else pocketAt.set(h.id, jd - 0.06 + j * 0.12); });
    const inL2 = new Set(M.L2.map(h => h.id));
    const inherit = P(t, adj - 0.35, 0.5) * (1 - P(t, orth - 0.6, 0.6));
    const spot = P(t, imp - 0.45, 0.5);   // impact spotlight
    const eC = enter(t, few - 0.4, { dy: 24 });              // the bars panel: up for fewer/faster…
    const panelO = eC.o * (1 - P(t, jd - 0.45, 0.45, 'inOut'));   // …and cleared for the judgment beat
    const mapO = 1 - 0.3 * panelO;
    // tiles
    const T1 = [];
    M.hexes.forEach(h => {
      const edgeO = clamp((1 - h.d) * 5);
      const ent = P(t, S.start + 0.02 + (h.x - 150) / 1640 * 0.55, 0.4);
      const ca = clearAt.get(h.id);
      const f = ca == null ? 0 : ca < -1e8 ? 1 : P(t, ca, 0.5, 'inOut');
      const clear = f >= 0.5;
      const isRule = h === M.rule1;
      const hot = isRule ? P(t, wCh - 0.25, 0.4) : 0;
      const affected = isRule || M.shared.some(([, b]) => b === h);
      const o = edgeO * ent * mapO * (1 - 0.45 * spot * (affected ? 0 : 1));
      if (o <= 0.01) return;
      const sx = f > 0 && f < 1 ? Math.max(0.04, Math.abs(Math.cos(Math.PI * f))) : 1;
      const fogFill = mixColor('#D6CDBD', '#CFC5B3', 0.5 + h.tint * 6);
      const inh = inL2.has(h.id) && M.inL1.has(h.id) ? inherit : 0;
      const fill = clear ? (hot > 0 ? mixColor(C.card, C.coralLight, hot) : inh > 0 ? mixColor(C.card, C.tealLight, 0.55 * inh) : C.card) : fogFill;
      const stroke = clear ? (hot > 0 ? C.coral : 'rgba(42,157,143,0.5)') : '#E3DBCD';
      const inner = [path(M.tile, { fill, stroke, sw: hot > 0 ? 4 : 2 })];
      if (clear) {
        inner.push(G({ y: -3 }, hot > 0.5 ? T('§', 0, 12, { font: 'serif', size: 36, weight: 700, fill: C.coral, anchor: 'middle' }) : hexGlyph(t, h.kind)));
        if (hot < 0.5) inner.push(G({ x: 17, y: 18 }, seal(ca < -1e8 ? 1 : P(t, ca + 0.25, 0.4, 'linear'), { r: 9, rot: 0 })));
      }
      T1.push(G({ x: h.x, y: h.y, sx, sy: 1, o }, inner));
    });
    out.push(T1.join(''));
    // drifting fog over what is still unknown
    const blobs = once('compound_fog', () => { const R = rng(33), b = []; for (let i = 0; i < 200 && b.length < 30; i++) { const x = 190 + R() * 1540, y = 330 + R() * 490; if (Math.hypot((x - 960) / 790, (y - 575) / 270) > 0.95) continue; b.push([x, y, 58 + R() * 44, R() * 6.28]); } return b; });
    const clearNow = M.hexes.filter(h => { const ca = clearAt.get(h.id); return ca != null && t >= ca + 0.25; });
    const FG = [];
    blobs.forEach(([bx, by, br, ph]) => {
      let c = 0;
      for (const h of clearNow) { const dd = Math.hypot(h.x - bx, h.y - by); if (dd < 130) c = Math.max(c, 1 - dd / 130); }
      FG.push(fogBlob(t, bx, by, br, ph, 0.6 * mapO * P(t, S.start + 0.1, 0.6) * (1 - sstep(c * 1.6)) * (1 - 0.4 * spot)));
    });
    out.push(FG.join(''));
    // region borders
    const bO = (1 - 0.5 * spot) * mapO;
    out.push(G({ o: bO * P(t, S.start + 0.2, 0.5) }, path(M.b1, { stroke: C.ink2, sw: 4 })));
    out.push(G({ o: bO }, drawPath(M.b2, P(t, sf - 0.25, 1.0, 'inOut'), { stroke: C.ink, sw: 4 })));
    out.push(G({ o: bO }, drawPath(M.b3, P(t, orth - 0.35, 0.8, 'inOut'), { stroke: C.ink, sw: 4 })));
    // badges: which loop, and the spec it produced
    const badges = [
      { x: 336, y: 850, t0: S.start + 0.3, n: 1 },
      { x: 790, y: 376, t0: sf + 0.3, n: 2 },
      { x: 1480, y: 376, t0: orth - 0.1, n: 3 },
    ];
    const specPos = [];
    badges.forEach((b, i) => {
      const e = enter(t, b.t0, { dy: 10 });
      const hot = P(t, imp - 0.1 + i * 0.22 + 0.45, 0.3);
      specPos.push([b.x + 94, b.y]);
      if (e.o <= 0) return;
      const running = i === 0 ? 0 : clamp((t - b.t0) / 3) < 1 ? 1 : 0;
      out.push(G({ x: b.x, y: b.y + e.y, s: e.s, o: e.o }, shadowCard(-132, -36, 264, 72, { rx: 36 }),
        G({ x: -92 }, miniRing(t, 21, (t - b.t0) * (running ? 220 : 40))),
        T(`LOOP ${b.n}`, -58, 10, { size: 27, weight: 800, fill: C.ink, ls: 3 }),
        G({ x: 94, s: 1.2 * pulse(t, imp - 0.1 + i * 0.22 + 0.45, 0.4, 0.25) }, miniSpec(hot)),
        hot > 0 ? G({ x: 122, y: -28, s: Ease.outBack(hot) }, circle(0, 0, 16, { fill: C.coral }), T('!', 0, 9, { size: 25, weight: 800, fill: C.card, anchor: 'middle' })) : ''));
    });
    // labels for the first beats (each leaves when its beat is done)
    const lab = (txt, x, y, t0, t1, col, anchor = 'middle') => {
      const o = P(t, t0, 0.4) * (1 - P(t, t1, 0.4));
      return o > 0 ? T(txt, x, y, { font: 'hand', size: 48, weight: 700, fill: col, anchor, o }) : '';
    };
    out.push(lab('inherits most', 790, 610, adj - 0.2, orth - 0.6, C.tealDark, 'start'));
    const inhA = P(t, adj, 0.45, 'inOut') * (1 - P(t, orth - 0.6, 0.4));
    if (inhA > 0) out.push(G({ o: clamp(inhA * 3) * (1 - P(t, orth - 0.6, 0.4)) }, handArrow(784, 596, 640, 560, inhA, { color: C.tealDark, bend: 0.2, sw: 3.5, head: 13 })));
    out.push(lab('unrelated', 1480, 720, orth - 0.1, l2 - 0.5, C.ink2));
    // shared rules, platforms, people: gold paths back to loop 1
    const pathsO = 1 - P(t, l2 - 0.4, 0.5);
    [wRu, wPl, wPe].forEach((w0, j) => {
      const [a, b] = M.shared[j];
      const p = P(t, w0 - 0.3, 0.75, 'inOut');
      if (p <= 0 || pathsO <= 0) return;
      const d = arcPath(a.x, a.y, b.x, b.y, -0.2 + j * 0.035);
      out.push(G({ o: pathsO }, drawPath(d, p, { stroke: C.gold, sw: 7, o: 0.35 }), drawPath(d, p, { stroke: C.goldDeep, sw: 3.5 }),
        circle(a.x, a.y, 30, { stroke: C.goldDeep, sw: 3.5, o: clamp(p * 3) }), circle(b.x, b.y, 30, { stroke: C.goldDeep, sw: 3.5, o: clamp(p * 2 - 1) })));
      if (p > 0 && p < 1) { const [qx, qy] = quadPoint(a.x, a.y, b.x, b.y, -0.2 + j * 0.035, p); out.push(G({ o: pathsO }, circle(qx, qy, 26, { fill: 'url(#gGlow)' }), circle(qx, qy, 7, { fill: C.gold }))); }
    });
    const eSh = P(t, sh + 0.05, 0.4) * pathsO;
    if (eSh > 0) out.push(G({ o: eSh }, richText([{ t: 'rules', fill: C.goldDeep }, { t: '  ·  ', fill: C.ink3 }, { t: 'platforms', fill: C.goldDeep }, { t: '  ·  ', fill: C.ink3 }, { t: 'people', fill: C.goldDeep }], 1010, 646, { font: 'hand', size: 52, weight: 700, anchor: 'middle' })));
    // fewer unknowns, less time: bars per loop (badged 1, 2, 3; no values), in the open middle of the map
    if (panelO > 0) {
      const Cc = [shadowCard(-330, -212, 660, 424, { rx: 24 }), line(0, -150, 0, 150, { stroke: C.faint, sw: 2 })];
      const groups = [
        { x: -165, title: 'unknowns', col: '#CFC4AF', edge: '#A99C84', hs: [236, 112, 62], t0: few - 0.25 },
        { x: 165, title: 'time', col: C.blue, hs: [236, 128, 80], t0: fast - 0.3 },
      ];
      groups.forEach((g, gi) => {
        const gp = P(t, g.t0 - 0.1, 0.35);
        if (gp <= 0) return;
        Cc.push(T(g.title, g.x + (gi ? 26 : 0), -150, { font: 'hand', size: 54, weight: 700, fill: C.ink2, anchor: 'middle', o: gp }));
        if (gi) Cc.push(G({ x: g.x - 60, y: -168, o: gp }, clock(t, { r: 23, speed: 1.6 })));
        Cc.push(line(g.x - 124, 130, g.x + 124, 130, { stroke: C.ink3, sw: 3, o: gp }));
        g.hs.forEach((hh, j) => {
          const bp = P(t, g.t0 + j * 0.2, 0.5, 'outBack');
          const bx = g.x - 82 + j * 82;
          if (bp > 0) Cc.push(rect(bx - 27, 130 - hh * bp, 54, hh * bp, { rx: 8, fill: g.col, stroke: g.edge, sw: g.edge ? 2.5 : undefined, dash: g.edge ? '7 5' : undefined }));
          Cc.push(G({ x: bx, y: 170, o: gp }, badge(j + 1, { r: 19, size: 24, fill: C.ink2 })));
        });
      });
      out.push(G({ x: 1030, y: 652 + eC.y + 24 * (1 - panelO / Math.max(0.001, eC.o)), s: eC.s, o: panelO }, Cc));
    }
    // what is left needs judgment: people who hold the theory, gold rings
    pocketAt.forEach((t0, id) => {
      const h = M.hexes[id];
      const p = P(t, t0, 0.5, 'outBack');
      if (p <= 0) return;
      const glowP = 0.75 + 0.25 * Math.sin(t * 3 + id);
      out.push(G({ x: h.x, y: h.y, o: clamp(p * 2) * (1 - 0.4 * spot) }, circle(0, 0, 36 * p, { stroke: C.gold, sw: 5, o: glowP }), G({ s: p, y: -2 }, judgePerson())));
    });
    out.push(lab('the work that needs judgment', 1030, 668, jd - 0.08, l3 - 0.3, C.goldDeep));
    // a rule changes: every spec that relied on it lights up
    const r = M.rule1;
    const rc = P(t, wCh - 0.25, 0.5, 'out');
    if (rc > 0) {
      for (let k = 0; k < 2; k++) { const q = ((t - wCh + 0.25) * 0.8 + k * 0.5) % 1; out.push(circle(r.x, r.y, 36 + 70 * q, { stroke: C.coral, sw: 3, o: (1 - q) * rc })); }
      out.push(lab('rule changed', r.x - 150, r.y - 70, wCh - 0.2, S.end, C.coral));
    }
    specPos.forEach(([sx, sy], i) => {
      const p = P(t, imp - 0.3 + i * 0.22, 0.6, 'inOut');
      if (p <= 0) return;
      const bend = i === 0 ? 0.25 : i === 1 ? -0.2 : -0.18;
      out.push(drawPath(arcPath(r.x, r.y, sx, sy, bend), p, { stroke: C.coral, sw: 4 }));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => {
    const sf = S.cue('startsfrom'), adj = S.cue('adjacent'), orth = S.cue('orthogonal'), sh = S.cue('shared');
    const few = S.cue('fewer'), fast = S.cue('faster'), jd = S.cue('judgment'), imp = S.cue('impact');
    const wRu = wordAt(S, 0, 'rules', sh + 0.25), wPl = wordAt(S, 0, 'platforms', sh + 1.1), wPe = wordAt(S, 0, 'people', sh + 1.8);
    const wCh = wordAt(S, 2, 'changes', S.line(2).start + 0.5);
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.6, gain: 0.45 },
      { t: sf - 0.25, type: 'scribble', dur: 0.9, gain: 0.3 }, { t: sf + 0.3, type: 'pop', pitch: 1.0, gain: 0.5 },
      { t: adj - 0.3, type: 'chime', note: 1, gain: 0.6 },
      ...[0, 1, 2].map(j => ({ t: adj + 0.45 + j * 0.32, type: 'click', gain: 0.45 })),
      { t: orth - 0.35, type: 'scribble', dur: 0.8, gain: 0.3 }, { t: orth - 0.1, type: 'pop', pitch: 1.15, gain: 0.5 },
      ...[wRu, wPl, wPe].map((w, j) => ({ t: w - 0.3, type: 'rise', dur: 0.7, gain: 0.35 })),
      ...[wRu, wPl, wPe].map((w, j) => ({ t: w + 0.45, type: 'pluck', note: [4, 5, 7][j], gain: 0.55 })),
      ...[0, 1, 2].map(j => ({ t: few - 0.2 + j * 0.2, type: 'pluck', note: [7, 4, 2][j], gain: 0.5 })),
      { t: fast - 0.25, type: 'tick', gain: 0.4 }, { t: fast + 0.1, type: 'tick', gain: 0.4 }, { t: fast + 0.45, type: 'tick', gain: 0.4 },
      { t: jd - 0.3, type: 'chime', note: 6, gain: 0.6 },
      { t: wCh - 0.25, type: 'thud', gain: 0.6 }, { t: wCh - 0.2, type: 'fizzle', gain: 0.3 },
      ...[0, 1, 2].map(i => ({ t: imp - 0.3 + i * 0.22 + 0.55, type: 'pop', pitch: 0.8 + i * 0.1, gain: 0.55 })),
    ];
  },
};

// ================================================================== NAURLOOP
// the holders' theory is the head's own constellation, fitted into a thought bubble
const NL_KB = () => once('naurloop_Kbub', () => {
  const K = HEAD_K();
  return { pts: K.pts.map(([x, y, s, ph]) => [(x + 8) * 0.72, (y + 38) * 0.46, s, ph]), edges: K.edges, rank: K.rank };
});
SCENES.naurloop = {
  render(t, S) {
    const fn = S.cue('factsnot'), bo = S.cue('builton'), il = S.cue('inloop'), al = S.cue('alivelong');
    const wV = wordAt(S, 1, 'verifying', il + 1.9), wD = wordAt(S, 1, 'deciding', il + 2.7);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 14 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'With ' }, { t: 'Naur', fill: C.goldDeep }, { t: ', not around him' }], 960, 150, { font: 'serif', size: 60, weight: 600, anchor: 'middle' })));
    // the head group; its origin is the top of the plinth its facts will form. It starts right of centre, moves to the
    // middle and rises onto its facts ("built on"), then steps left to make room for the loop.
    const toC = P(t, bo - 0.5, 0.9, 'inOut');
    const lift = P(t, bo - 0.05, 0.7, 'outBack');
    const sl = P(t, il - 0.95, 0.85, 'inOut');
    const gx = lerp(lerp(1350, 960, toC), 420, sl);
    const gy = lerp(lerp(772, 684, lift), 664, sl);
    const gs = lerp(1, 0.74, sl);
    const hs = 0.88, K = HEAD_K();
    const bright = P(t, bo + 0.1, 0.6) + 0.5 * P(t, al, 0.5) * (1 - P(t, al + 1.2, 0.8));
    const eHd = enter(t, S.start + 0.4, { d: 0.6 });
    out.push(G({ x: gx, y: gy, s: gs }, G({ x: -10, y: -262 * hs + eHd.y, s: hs * eHd.s, o: eHd.o },
      circle(0, -40, 240, { fill: 'url(#gGlow)', o: (0.3 + 0.1 * Math.sin(t * 2.4)) * bright }),
      bigHead(t), constellation(t, K, { t0: S.start + 0.6, dur: 1.4, size: 7 + 1.2 * bright, lineW: 2.6, glow: 1 + 0.7 * bright }))));
    // the facts: a loose pile at the left, then the plinth under the head (bottom row first)
    const plinth = [[-160, 146], [0, 146], [160, 146], [-80, 52], [80, 52]];
    const pile = [[-10, 173, -4], [9, 124, 3], [-7, 76, -2], [10, 27, 4], [-4, -22, -1]];
    const pX = 575, pY = 482, pS = 1.35;
    for (let f = 0; f < 5; f++) {
      const pi = 4 - f;
      const [dx, dy, rr] = pile[pi];
      const e = P(t, S.start + 0.25 + pi * 0.1, 0.4, 'outBack');
      if (e <= 0) continue;
      const fl = P(t, bo - 0.45 + f * 0.09, 0.7, 'inOut');
      const [sx, sy] = [pX + dx + wobble(t, 0.3, 2, pi) * (1 - fl), pY + dy - 40 * (1 - e)];
      const [tx, ty] = [gx + plinth[f][0] * gs, gy + plinth[f][1] * gs];
      const [x, y] = fl > 0 ? quadPoint(sx, sy, tx, ty, -0.16, fl) : [sx, sy];
      out.push(G({ x, y, s: lerp(pS, 0.98 * gs, fl), r: lerp(rr, 0, fl), o: clamp(e * 2) }, factChip({ sealP: 1 })));
    }
    // facts ≠ theory
    const ne = P(t, fn - 0.3, 0.45, 'outBack');
    const neOut = 1 - P(t, bo - 0.45, 0.35);
    if (ne > 0 && neOut > 0) {
      out.push(G({ x: 928, y: 560, s: ne * pulse(t, fn + 0.2, 0.4, 0.06), o: neOut }, T('≠', 0, 70, { font: 'serif', size: 210, weight: 700, fill: C.coral, anchor: 'middle' })));
      out.push(G({ o: clamp(ne * 2) * neOut }, T('facts', pX, 838, { font: 'hand', size: 58, weight: 700, fill: C.tealDark, anchor: 'middle' }),
        T('theory', 1335, 848, { font: 'hand', size: 58, weight: 700, fill: C.goldDeep, anchor: 'middle' })));
    }
    // …but it is built on them
    const eB = P(t, bo + 0.2, 0.45);
    const bOut = 1 - P(t, il - 0.95, 0.4);
    if (eB * bOut > 0) {
      const lx = gx - 262 * gs, ly = gy + 112 * gs;
      out.push(G({ o: eB * bOut }, T('built on', lx - 28, ly + 16, { font: 'hand', size: 58, weight: 700, fill: C.tealDark, anchor: 'end' }),
        handArrow(lx - 18, ly - 2, lx + 24, ly - 8, P(t, bo + 0.35, 0.35, 'inOut'), { color: C.tealDark, bend: -0.2, sw: 4, head: 13 })));
    }
    // the loop keeps the people who hold the theory in it: holders at Verify and Specify
    const rx0 = 1010, ry0 = 560, rr0 = 200, k = 0.8;
    const rIn = P(t, il - 0.45, 0.7, 'inOut');
    if (rIn > 0) {
      const A = RING.map(s => s.a);
      const st = A.map((a, i) => P(t, il - 0.1 + i * 0.09, 0.45, 'linear'));
      const lapT = il + 0.4;
      const tok = t < lapT ? null : -90 + ((t - lapT) * 95) % 360;
      const hi = A.map(a => { if (tok == null) return 0; const dd = Math.abs((((tok - a) % 360) + 540) % 360 - 180); return clamp(1 - dd / 26); });
      out.push(G({ x: rx0, y: ry0 }, loopRing(t, { rx: rr0, ry: rr0, draw: rIn, st, act: [1, 1, 1, 1, 1], tok, hi, k, labels: false })));
      // …which keeps the product alive: a strong heartbeat in the middle of the loop
      const hb = P(t, al - 0.3, 0.5, 'outBack');
      if (hb > 0) out.push(G({ x: rx0, y: ry0, s: hb * pulse(t, al + 0.3, 0.5, 0.06), o: clamp(hb * 2) }, circle(0, 0, 230, { fill: 'url(#gGlowTeal)', o: 0.55 + 0.2 * Math.sin(t * 4) }), heartbeat(t, { w: 210, alive: 1, color: C.tealLight })));
      const KB = NL_KB(), hS = 0.78;
      const [vx, vy] = ringPt(rr0, rr0, -18), [spx, spy] = ringPt(rr0, rr0, 54);
      const people = [
        { x: 1420, y: 640, st: [rx0 + vx, ry0 + vy], shirt: C.teal, skin: C.skin[3], hair: C.hair[3], hs: 3, seed: 41, t0: il - 0.3, lab: 'verifying', lt: wV, lc: C.tealDark },
        { x: 1590, y: 912, st: [rx0 + spx, ry0 + spy], shirt: C.coral, skin: C.skin[0], hair: C.hair[1], hs: 2, seed: 43, t0: il - 0.1, lab: 'deciding', lt: wD, lc: C.coralDark },
      ];
      people.forEach(pp => {
        const e = enter(t, pp.t0, { d: 0.55 });
        if (e.o <= 0) return;
        // a gold link from the pointing hand to the holder's station
        const hx = pp.x - 100 * hS, hy = pp.y - 170 * hS;
        const dx = hx - pp.st[0], dy = hy - pp.st[1], dl = Math.hypot(dx, dy);
        out.push(G({ o: e.o }, drawPath(`M${r2(hx)} ${r2(hy)} L${r2(pp.st[0] + dx / dl * 62)} ${r2(pp.st[1] + dy / dl * 62)}`, P(t, pp.t0 + 0.3, 0.5, 'inOut'), { stroke: C.goldDeep, sw: 3.5, o: 0.85 })));
        out.push(G({ x: pp.x, y: pp.y + e.y, s: hS * e.s, o: e.o }, holder(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: pp.seed, flip: true, look: -0.7,
          arms: [[-52, -108], [100, -170]], mood: 'happy', bubble: P(t, pp.t0 + 0.1, 0.55), theory: { K: KB, w: 240, h: 166, t0: pp.t0 + 0.12, dur: 0.55 } })));
        const lp = P(t, pp.lt - 0.25, 0.4);
        if (lp > 0) out.push(G({ o: lp }, T(pp.lab, pp.x, pp.y + 64, { font: 'hand', size: 52, weight: 700, fill: pp.lc, anchor: 'middle' })));
      });
    }
    const eA = enter(t, al - 0.1, { dy: 12 });
    if (eA.o > 0) out.push(G({ o: eA.o, y: eA.y }, richText([{ t: 'that’s what keeps a product ' }, { t: 'alive', fill: C.tealDark }], 960, 1010, { font: 'hand', size: 58, weight: 700, anchor: 'middle', fill: C.ink })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => {
    const fn = S.cue('factsnot'), bo = S.cue('builton'), il = S.cue('inloop'), al = S.cue('alivelong');
    const wV = wordAt(S, 1, 'verifying', il + 1.9), wD = wordAt(S, 1, 'deciding', il + 2.7);
    return [
      { t: S.start + 0.05, type: 'whoosh', dur: 0.5, gain: 0.4 },
      ...[0, 1, 2, 3, 4].map(i => ({ t: S.start + 0.25 + i * 0.1, type: 'tick', gain: 0.35, pitch: 0.9 + i * 0.05 })),
      { t: S.start + 0.6, type: 'chime', note: 0, gain: 0.5 },
      { t: fn - 0.3, type: 'scribble', dur: 0.35, gain: 0.5 },
      { t: bo - 0.45, type: 'whoosh', dur: 0.7, gain: 0.5 }, { t: bo + 0.2, type: 'chime', note: 2 }, { t: bo + 0.3, type: 'thud', gain: 0.5 },
      { t: il - 0.95, type: 'swish', dur: 0.8, gain: 0.4 }, { t: il - 0.45, type: 'whoosh', dur: 0.7, gain: 0.35 },
      { t: il - 0.3, type: 'pop', pitch: 1.0, gain: 0.5 }, { t: il - 0.1, type: 'pop', pitch: 1.15, gain: 0.5 },
      { t: wV - 0.25, type: 'pluck', note: 4, gain: 0.5 }, { t: wD - 0.25, type: 'pluck', note: 7, gain: 0.5 },
      { t: al - 0.3, type: 'rise', dur: 0.5, gain: 0.4 }, { t: al + 0.2, type: 'chime', note: 4 },
    ];
  },
};
})();
