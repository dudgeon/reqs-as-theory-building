// Scene choreography. Each scene renders from absolute time t and its cue times (S.cue).
'use strict';

// Shared helpers (HEAD_K, toGlobal, sparkle, compilerMachine, mixColor) live in video/shapes.js and video/engine.js.

// ================================================================== TITLE
SCENES.title = {
  post: 0.6, zoom: 0.015,
  render(t, S) {
    const X = exitAt(t, S.end - 0.1, 0.5);
    const K = once('K_title', () => makeConstellation(42, 22, { cx: 960, cy: 540, rx: 860, ry: 430, minD: 150, extra: 0.25 }));
    const out = [constellation(t, K, { t0: 0.05, dur: 2.0, size: 4.5, lineW: 1.6, o: 0.28, glow: 0.5 })];
    const e1 = enter(t, 0.15, { dy: 12 });
    out.push(G({ o: e1.o, y: e1.y }, T('PETER NAUR  ·  1985', 960, 402, { size: 26, weight: 700, fill: C.ink2, anchor: 'middle', ls: 7 })));
    const size = 104, y = 540;
    const A = 'Programming', B = 'Specs', R = ' as Theory Building';
    const wA = measure(A, size, 'serif', 700), wB = measure(B, size, 'serif', 700), wR = measure(R, size, 'serif', 700);
    const x0 = 960 - (wA + wR) / 2, x1 = 960 - (wB + wR) / 2;
    const e2 = enter(t, 0.3, { dy: 30, d: 0.7 });
    const strike = P(t, 1.05, 0.38, 'inOut');
    const goneA = P(t, 1.5, 0.4, 'in');
    const m = P(t, 1.55, 0.75, 'inOut');
    const dropB = P(t, 1.75, 0.65, 'outBack');
    const inB = P(t, 1.75, 0.25, 'out');
    out.push(G({ o: e2.o, y: e2.y }, [
      G({ o: 1 - goneA, y: -26 * goneA }, T(A, x0, y, { font: 'serif', size, weight: 700 }),
        drawPath(`M${x0 - 10} ${y - 30} C${x0 + wA * 0.35} ${y - 40} ${x0 + wA * 0.7} ${y - 26} ${x0 + wA + 12} ${y - 38}`, strike, { stroke: C.coral, sw: 10 })),
      G({ o: inB, y: lerp(-60, 0, dropB) }, T(B, x1, y, { font: 'serif', size, weight: 700, fill: C.coral })),
      T(R, lerp(x0 + wA, x1 + wB, m), y, { font: 'serif', size, weight: 700 }),
    ]));
    const e3 = enter(t, 2.15, { dy: 16 });
    out.push(G({ o: e3.o, y: e3.y }, T('Naur’s big idea, for the age of coding agents', 960, 626, { font: 'serif', size: 42, italic: true, fill: C.ink2, anchor: 'middle' })));
    out.push(underline(960 - 250, 660, 500, P(t, 2.45, 0.6, 'inOut'), { color: C.gold, sw: 6 }));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: 0.1, type: 'chime', note: 0 }, { t: 1.05, type: 'scribble', dur: 0.38 },
    { t: 1.75, type: 'pop', pitch: 1.0 }, { t: 2.15, type: 'whoosh', dur: 0.5, gain: 0.5 },
  ],
};

// ================================================================== HOOK
SCENES.hook = {
  render(t, S) {
    const q = S.cue('q'), y85 = S.cue('y'), ans = S.cue('ans'), nc = S.cue('notcode');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // team behind a desk
    const eT = enter(t, S.start + 0.1, { dy: 40, d: 0.7 });
    const glow = P(t, nc + 0.35, 0.6);
    const people = [
      { x: 430, shirt: C.teal, skin: C.skin[0], hair: C.hair[0], hs: 0, seed: 1 },
      { x: 630, shirt: C.coral, skin: C.skin[2], hair: C.hair[3], hs: 3, seed: 2 },
      { x: 830, shirt: C.blue, skin: C.skin[4], hair: C.hair[2], hs: 2, seed: 3 },
    ];
    const team = people.map((pp, i) => {
      const bob = Math.sin(t * 7 + i * 2) * 1.2;
      return G({ x: pp.x, y: 890 + bob, s: 1.05 }, person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, arms: 'typing', seed: pp.seed, mood: t > nc + 0.4 ? 'happy' : 'neutral', glowHead: glow * 0.9 }));
    });
    const laptops = people.map(pp => G({ x: pp.x, y: 758 }, laptopBack({ w: 150, h: 92 })));
    out.push(G({ o: eT.o, y: eT.y }, team, laptops, G({ x: 630, y: 770 }, desk(820))));
    // sparkles over heads once "not the code" lands
    people.forEach((pp, i) => {
      const sp = P(t, nc + 0.3 + i * 0.12, 0.5, 'outBack');
      if (sp > 0) out.push(sparkle(pp.x + 34, 590 - 18 * sp, 16 * sp * (1 + 0.1 * Math.sin(t * 5 + i)), { fill: C.gold }));
    });
    // growing stack of printouts
    const sx = 1230, sBase = 885, N = 22;
    const stack = [];
    for (let i = 0; i < N; i++) {
      const ti = S.start + 0.45 + i * 0.075;
      const p = P(t, ti, 0.22, 'out');
      if (p <= 0) continue;
      const jit = Math.sin(i * 12.9898) * 14;
      stack.push(rect(sx - 150 + jit, sBase - (i + 1) * 13 - (1 - p) * 40, 300, 11, { rx: 3, fill: C.card, stroke: C.faint, sw: 2, o: p }));
    }
    const topP = P(t, S.start + 0.45 + N * 0.075, 0.45, 'outBack');
    if (topP > 0) stack.push(G({ x: sx + 6, y: sBase - N * 13 - 112, r: -3, s: lerp(0.8, 1, topP), o: clamp(topP * 2) }, codeCard({ w: 300, h: 200, seed: 9, reveal: P(t, S.start + 2.2, 1.0, 'linear') })));
    const dim = 1 - 0.55 * P(t, nc + 0.1, 0.5);
    out.push(G({ o: dim }, stack));
    // cross it out
    out.push(G({ x: sx, y: 640 }, crossMark(P(t, nc, 0.5, 'inOut'), { size: 130, sw: 18 })));
    // "?" + label
    const qp = P(t, q - 0.1, 0.55, 'outBack');
    const qFade = 1 - P(t, nc - 0.1, 0.4);
    if (qp > 0) out.push(G({ x: 1530, y: 560, s: qp, r: lerp(-20, 6, qp), o: qFade }, T('?', 0, 60, { font: 'serif', size: 230, weight: 700, fill: C.coral, anchor: 'middle' })));
    const lp = P(t, q + 0.25, 0.5);
    if (lp > 0) out.push(G({ o: lp * qFade }, T('the product?', 1545, 700, { font: 'hand', size: 50, weight: 700, fill: C.coral, anchor: 'middle' })));
    // the opening question, then the paper that answers it
    const eQ = enter(t, S.voStart - 0.2, { dy: 14 });
    const qOut = exitAt(t, y85 - 0.45, 0.35);
    if (eQ.o * qOut.o > 0) out.push(G({ o: eQ.o * qOut.o, y: eQ.y + qOut.y }, richText([{ t: 'What does a software team ' }, { t: 'actually', italic: true, fill: C.coral }, { t: ' produce?' }], 960, 190, { font: 'serif', size: 64, weight: 600, anchor: 'middle' })));
    const jp = enter(t, y85 - 0.15, { dy: -40, d: 0.6 });
    const hl = P(t, ans, 0.6, 'inOut');
    if (jp.o > 0) {
      const card = [
        shadowCard(-320, -145, 640, 290, { rx: 6 }),
        T('MICROPROCESSING AND MICROPROGRAMMING 15 (1985)', -284, -100, { size: 15, weight: 700, fill: C.ink2, ls: 1.5 }),
        line(-284, -84, 284, -84, { stroke: C.faint, sw: 2 }),
        T('Programming as Theory Building', -284, -32, { font: 'serif', size: 38, weight: 600 }),
        T('Peter Naur', -284, 12, { font: 'serif', size: 27, italic: true, fill: C.ink2 }),
        underline(-286, -16, 560 * hl, 1, { color: C.gold, sw: 6 }),
        ...[0, 1, 2, 3].map(k => rect(-284, 46 + k * 20, [540, 560, 510, 360][k], 8, { rx: 4, fill: C.ink3, o: 0.45 })),
      ];
      out.push(G({ x: 640, y: 300 + jp.y, r: -2, o: jp.o, s: jp.s }, card));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    ...Array.from({ length: 22 }, (_, i) => ({ t: S.start + 0.45 + i * 0.075, type: 'tick', gain: 0.35, pitch: 0.9 + (i % 5) * 0.05 })),
    { t: S.cue('q') - 0.1, type: 'pop', pitch: 0.8 }, { t: S.cue('y') - 0.15, type: 'whoosh', dur: 0.45 },
    { t: S.cue('ans'), type: 'scribble', dur: 0.5, gain: 0.5 }, { t: S.cue('notcode'), type: 'scribble', dur: 0.5 },
    { t: S.cue('notcode') + 0.35, type: 'chime', note: 2 },
  ],
};

// ================================================================== THESIS
SCENES.thesis = {
  render(t, S) {
    const tb = S.cue('tb'), world = S.cue('world'), prog = S.cue('prog'), sec = S.cue('sec'), specs = S.cue('specs');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const K = HEAD_K();
    const hx = 960, hy = 575, hs = 0.95;
    // headline
    const eH = enter(t, S.voStart - 0.1, { dy: 16 });
    const hl = P(t, tb, 0.35);
    out.push(G({ o: eH.o, y: eH.y }, richText([
      { t: 'Programming', fill: C.ink }, { t: ' is ', fill: C.ink2, weight: 400, italic: true },
      { t: 'theory building', fill: hl > 0.5 ? C.goldDeep : C.ink },
    ], 960, 150, { font: 'serif', size: 62, weight: 600, anchor: 'middle' })));
    const wAll = measure('Programming is theory building', 62, 'serif', 600);
    const wTB = measure('theory building', 62, 'serif', 600);
    out.push(underline(960 + wAll / 2 - wTB, 170, wTB, P(t, tb + 0.15, 0.6, 'inOut')));
    // head + theory
    const eHead = enter(t, S.start + 0.02, { from: 0.94, dy: 20, d: 0.7 });
    const lift = P(t, sec, 0.8, 'inOut');
    const headY = hy - 20 * lift;
    out.push(G({ x: hx, y: headY + eHead.y, s: hs * eHead.s, o: eHead.o }, bigHead(t),
      constellation(t, K, { t0: tb - 0.3, dur: 2.4, size: 7, lineW: 2.6, glow: 1 + 0.4 * lift })));
    // world column
    const icons = [
      { f: () => iconBank(), label: 'INSTITUTIONS' },
      { f: () => iconPolicy(), label: 'RULES' },
      { f: () => iconBust({ skin: C.skin[3], hair: C.hair[3] }), label: 'PEOPLE' },
      { f: () => iconGears(t), label: 'PROCESSES' },
    ];
    const wx = 300, ys = [355, 520, 685, 850];
    const eW = enter(t, world - 0.25, { dy: 10 });
    out.push(G({ o: eW.o }, T('THE WORLD', wx, 262, { size: 24, weight: 800, fill: C.tealDark, anchor: 'middle', ls: 5 })));
    icons.forEach((ic, i) => {
      const e = enter(t, world - 0.2 + i * 0.12, { d: 0.5 });
      out.push(G({ x: wx, y: ys[i] + e.y, s: 0.72 * e.s, o: e.o }, ic.f()));
      out.push(G({ o: e.o }, T(ic.label, wx, ys[i] + 70, { size: 17, weight: 700, fill: C.ink2, anchor: 'middle', ls: 3 })));
    });
    // world -> theory threads
    const left = [...K.pts.keys()].sort((a, b) => K.pts[a][0] - K.pts[b][0]).slice(0, 4).sort((a, b) => K.pts[a][1] - K.pts[b][1]);
    const right = [...K.pts.keys()].sort((a, b) => K.pts[b][0] - K.pts[a][0]).slice(0, 3).sort((a, b) => K.pts[a][1] - K.pts[b][1]);
    left.forEach((ni, i) => {
      const [gx, gy] = toGlobal(K, ni, hx, headY, hs);
      const p = P(t, world + 0.35 + i * 0.12, 0.7, 'inOut');
      out.push(drawPath(arcPath(wx + 60, ys[i] - 10, gx, gy, i < 2 ? -0.12 : 0.12), p, { stroke: C.goldDeep, sw: 2.5, o: 0.8 }));
    });
    // program card (moves to the shelf when "secondary")
    const cx = lerp(1600, 1360, lift), cy = lerp(560, 865, lift), cs = lerp(1, 0.42, lift);
    const eP = enter(t, prog - 0.25, { d: 0.5 });
    out.push(G({ o: eP.o * (1 - lift) }, T('THE PROGRAM', 1600, 262, { size: 24, weight: 800, fill: C.blue, anchor: 'middle', ls: 5 })));
    const codeReveal = P(t, prog - 0.1, 0.9, 'linear');
    out.push(G({ x: cx, y: cy + eP.y, s: cs * eP.s, o: eP.o }, codeCard({ w: 330, h: 400, seed: 4, reveal: codeReveal, title: 'program' })));
    right.forEach((ni, i) => {
      const [gx, gy] = toGlobal(K, ni, hx, headY, hs);
      const p = P(t, prog + 0.1 + i * 0.12, 0.6, 'inOut');
      out.push(drawPath(arcPath(gx, gy, cx - 165 * cs + 20, cy - 110 * cs + i * 90 * cs, 0.1), p * (1 - lift), { stroke: C.goldDeep, sw: 2.5, o: 0.8 * (1 - lift) }));
    });
    // shelf of secondary products
    const eS = P(t, sec - 0.1, 0.5);
    if (eS > 0) {
      out.push(line(1225, 965, 1845, 965, { stroke: C.ink3, sw: 5, o: eS }));
      out.push(G({ o: eS }, T('secondary products', 1535, 1020, { font: 'hand', size: 42, weight: 700, fill: C.ink2, anchor: 'middle' })));
    }
    const eD = P(t, sec + 0.25, 0.55, 'outBack');
    if (eD > 0) out.push(G({ x: 1535, y: 865 - (1 - eD) * 60, s: 0.62, o: clamp(eD * 2) }, docCard({ w: 220, h: 280, seed: 6, title: 'docs' })));
    const eSp = P(t, specs - 0.05, 0.6, 'outBack');
    const spPulse = pulse(t, specs + 0.45, 0.5, 0.1);
    if (eSp > 0) out.push(G({ x: 1710, y: 865 - (1 - eSp) * 120, s: 0.62 * spPulse, r: lerp(-12, 3, eSp), o: clamp(eSp * 2) }, specDoc({ w: 220, h: 280, accent: C.coral })));
    // "primary" label
    const eL = P(t, sec + 0.5, 0.5);
    if (eL > 0) {
      out.push(G({ o: eL }, T('primary: the theory', 1270, 390, { font: 'hand', size: 50, weight: 700, fill: C.goldDeep })));
      out.push(handArrow(1262, 380, 1130, 430, P(t, sec + 0.6, 0.5, 'inOut'), { color: C.goldDeep, bend: 0.25 }));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: S.start, type: 'whoosh', dur: 0.5, gain: 0.5 }, { t: S.cue('tb') - 0.3, type: 'chime', note: 0 },
    { t: S.cue('tb') + 0.15, type: 'scribble', dur: 0.5, gain: 0.5 },
    ...[0, 1, 2, 3].map(i => ({ t: S.cue('world') - 0.2 + i * 0.12, type: 'pop', pitch: 0.9 + i * 0.08, gain: 0.6 })),
    { t: S.cue('prog') - 0.25, type: 'pop', pitch: 1.2 }, { t: S.cue('prog'), type: 'typing', dur: 0.8 },
    { t: S.cue('sec'), type: 'whoosh', dur: 0.6 }, { t: S.cue('sec') + 0.3, type: 'thud', gain: 0.5 },
    { t: S.cue('specs') + 0.2, type: 'thud' }, { t: S.cue('sec') + 0.6, type: 'scribble', dur: 0.45, gain: 0.45 },
  ],
};

// ================================================================== RYLE
SCENES.ryle = {
  render(t, S) {
    const ry = S.cue('ryle'), how = S.cue('how'), expl = S.cue('explain');
    const map = S.cue('map'), just = S.cue('justify'), adapt = S.cue('adapt');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const partA = exitAt(t, map - 1.0, 0.45);
    // ---- part A: knowing that vs knowing how
    if (partA.o > 0) {
      const A = [];
      const eH = enter(t, S.start + 0.02, { dy: 14 });
      A.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Theory', fill: C.goldDeep }, { t: ', in Gilbert Ryle’s sense', fill: C.ink }], 960, 160, { font: 'serif', size: 58, weight: 600, anchor: 'middle' }),
        T('after The Concept of Mind (1949)', 960, 210, { size: 22, weight: 500, fill: C.ink2, anchor: 'middle', ls: 1 })));
      // knowing that (index card)
      const eC = enter(t, ry + 0.1);
      const dimC = 1 - 0.5 * P(t, how + 0.2, 0.5);
      A.push(G({ x: 560, y: 560 + eC.y, r: -3, s: eC.s, o: eC.o * dimC }, [
        shadowCard(-230, -150, 460, 300, { rx: 8 }),
        line(-230, -92, 230, -92, { stroke: C.coralLight, sw: 2 }),
        ...[-38, 12, 62, 112].map(yy => line(-230, yy, 230, yy, { stroke: C.sky, sw: 2 })),
        T('F = m · a', -196, -38 + 2, { font: 'mono', size: 30, weight: 600 }),
        T('§4.2(b): hold if unverified', -196, 12 + 2, { font: 'mono', size: 25 }),
        T('batch posts at 02:00', -196, 62 + 2, { font: 'mono', size: 25 }),
      ]));
      A.push(G({ o: eC.o * dimC }, T('knowing that', 560, 790, { font: 'serif', size: 44, italic: true, fill: C.ink2, anchor: 'middle' })));
      // knowing how (fishing)
      const eF = enter(t, how - 0.35);
      const cast = P(t, how, 0.9, 'inOut');
      const back = Math.sin(clamp((t - how) / 0.9) * Math.PI) * (t < how + 0.45 ? 1 : 0);
      const rodA = t < how ? -60 : t < how + 0.35 ? lerp(-60, -100, P(t, how, 0.35, 'out')) : lerp(-100, -25, P(t, how + 0.35, 0.4, 'outBack'));
      const fishX = 1230, fishY = 700;
      const rodLen = 230;
      const tipX = fishX + 40 + Math.cos((rodA * Math.PI) / 180) * rodLen, tipY = fishY - 170 + Math.sin((rodA * Math.PI) / 180) * rodLen;
      const land = P(t, how + 0.55, 0.6, 'out');
      const bobX = lerp(tipX, 1560, land), bobY = lerp(tipY, 742, land) - Math.sin(land * Math.PI) * 120;
      const F = [];
      F.push(path('M1400 742 Q1470 734 1540 742 T1680 742 T1820 742 L1820 800 L1400 800 Z', { fill: C.tealLight, o: 0.55 }));
      F.push(rect(1080, 700, 330, 18, { rx: 5, fill: '#C69C6D' }), rect(1110, 718, 14, 80, { fill: '#A77E52' }), rect(1360, 718, 14, 80, { fill: '#A77E52' }));
      F.push(G({ x: fishX, y: fishY }, person(t, { shirt: C.olive, skin: C.skin[1], hair: C.hair[1], hairStyle: 1, arms: [[-30, -150], [40, -168]], seed: 4, mood: 'happy', look: 0.6 })));
      F.push(line(fishX + 40, fishY - 168, tipX, tipY, { stroke: '#6B4E2E', sw: 6 }));
      if (t >= how + 0.5) {
        F.push(path(`M${r2(tipX)} ${r2(tipY)} Q${r2((tipX + bobX) / 2)} ${r2(Math.min(tipY, bobY) - 30 + 60 * land)} ${r2(bobX)} ${r2(bobY)}`, { stroke: C.ink2, sw: 2 }));
        F.push(circle(bobX, bobY, 9, { fill: C.coral }), circle(bobX, bobY - 4, 4.5, { fill: C.card }));
        const rp = P(t, how + 1.15, 1.2, 'out');
        if (rp > 0) F.push(ellipse(1560, 748, 20 + 60 * rp, 5 + 12 * rp, { stroke: C.teal, sw: 3, o: 1 - rp }));
      } else {
        F.push(path(`M${r2(tipX)} ${r2(tipY)} L${r2(tipX)} ${r2(tipY + 60)}`, { stroke: C.ink2, sw: 2 }));
      }
      A.push(G({ o: eF.o, y: eF.y }, F));
      A.push(G({ o: eF.o }, T('knowing how', 1380, 860, { font: 'serif', size: 44, italic: true, fill: C.goldDeep, anchor: 'middle' })));
      const eB = P(t, expl - 0.05, 0.5, 'outBack');
      if (eB > 0) A.push(G({ x: 1050, y: 318, s: eB, o: clamp(eB * 2) }, speechBubble(330, 110, { tail: 'right' }),
        T('…and here’s why.', 0, 12, { font: 'hand', size: 44, weight: 700, anchor: 'middle' })));
      void back; void cast;
      out.push(G({ o: partA.o, y: partA.y }, A));
    }
    // ---- part B: three abilities
    const eH2 = enter(t, map - 0.8, { dy: 14 });
    if (eH2.o > 0) out.push(G({ o: eH2.o, y: eH2.y }, richText([{ t: 'Whoever holds the ' }, { t: 'theory', fill: C.goldDeep }, { t: ' can…' }], 960, 170, { font: 'serif', size: 56, weight: 600, anchor: 'middle' })));
    const cards = [
      { cue: map, n: 1, title: 'Map', cap: 'the world ↔ the program' },
      { cue: just, n: 2, title: 'Justify', cap: 'why each part is so' },
      { cue: adapt, n: 3, title: 'Adapt', cap: 'judge which changes fit' },
    ];
    cards.forEach((c, i) => {
      const e = enter(t, c.cue - 0.35, { d: 0.55 });
      if (e.o <= 0) return;
      const cx = 400 + i * 560, cy = 600;
      const inner = [shadowCard(-230, -250, 460, 500, { rx: 22 }), G({ x: -186, y: -206 }, badge(c.n)),
        T(c.title, 0, 168, { font: 'serif', size: 54, weight: 600, anchor: 'middle' }),
        T(c.cap, 0, 212, { size: 24, weight: 500, fill: C.ink2, anchor: 'middle' })];
      const lt = t - c.cue;
      if (i === 0) {
        inner.push(G({ x: -110, y: -50, s: 0.62 }, iconBank()));
        inner.push(G({ x: 95, y: -50 }, codeCard({ w: 150, h: 190, seed: 12, lineH: 24 })));
        [0, 1, 2].forEach(k => inner.push(drawPath(arcPath(-62, -80 + k * 30, 36, -100 + k * 48, -0.15 + k * 0.1), P(lt, 0.15 + k * 0.15, 0.6, 'inOut'), { stroke: C.goldDeep, sw: 3 })));
        [0, 1, 2].forEach(k => { const pp = P(lt, 0.7 + k * 0.15, 0.3, 'outBack'); if (pp > 0) inner.push(circle(36, -100 + k * 48, 6 * pp, { fill: C.gold })); });
      } else if (i === 1) {
        inner.push(G({ x: -50, y: -60 }, codeCard({ w: 190, h: 190, seed: 13, lineH: 24, highlight: lt > 0.1 ? 2 : -1 })));
        const n1 = P(lt, 0.2, 0.45, 'outBack');
        if (n1 > 0) inner.push(G({ x: 110, y: -160, s: n1, r: 8 }, stickyNote('why?', { w: 130, h: 80, size: 38 })));
        const n2 = P(lt, 0.75, 0.5, 'outBack');
        if (n2 > 0) inner.push(G({ x: 72, y: 40, s: n2 }, speechBubble(236, 72, { tail: 'left' }), T('because §4.2(b)…', 0, 10, { font: 'hand', size: 32, weight: 700, anchor: 'middle' })));
      } else {
        const slide = P(lt, 0.15, 0.7, 'outBack');
        inner.push(G({ x: -95, y: -40, s: 0.62 }, puzzlePiece({ color: C.teal })));
        inner.push(G({ x: -95, y: 44, s: 0.62, r: 90 }, puzzlePiece({ color: C.tealDark })));
        inner.push(rect(-26, -80, 104, 104, { rx: 8, stroke: C.ink3, sw: 3, dash: '8 7' }));
        inner.push(G({ x: lerp(160, 26, slide), y: lerp(-150, -28, slide), s: 0.62, r: lerp(40, 0, slide) }, puzzlePiece({ color: C.gold })));
        const ck = P(lt, 0.9, 0.4, 'out');
        if (ck > 0) inner.push(G({ x: 120, y: 60 }, circle(0, 0, 30, { fill: C.tealLight, o: ck }), checkMark(ck, { sw: 8 })));
      }
      out.push(G({ x: cx, y: cy + e.y, s: e.s, o: e.o }, inner));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: S.start, type: 'whoosh', dur: 0.45, gain: 0.45 }, { t: S.cue('ryle') + 0.1, type: 'pop', pitch: 0.85 },
    { t: S.cue('how'), type: 'swish' }, { t: S.cue('how') + 1.15, type: 'plop' }, { t: S.cue('explain'), type: 'pop', pitch: 1.1 },
    { t: S.cue('map') - 1.0, type: 'whoosh', dur: 0.5, gain: 0.5 },
    { t: S.cue('map') - 0.35, type: 'pop', pitch: 0.9 }, { t: S.cue('justify') - 0.35, type: 'pop', pitch: 1.0 }, { t: S.cue('adapt') - 0.35, type: 'pop', pitch: 1.12 },
    { t: S.cue('justify') + 0.2, type: 'tick' }, { t: S.cue('adapt') + 0.6, type: 'click' }, { t: S.cue('adapt') + 0.9, type: 'chime', note: 3 },
  ],
};

// ================================================================== COMPILER (Naur's case 1) + program death
SCENES.compiler = {
  render(t, S) {
    const inh = S.cue('inherit'), docs = S.cue('docs'), patch = S.cue('patch'), nt = S.cue('notravel');
    const leave = S.cue('leave'), dies = S.cue('dies'), runs = S.cue('runs');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eIn = enter(t, S.start + 0.1, { d: 0.6 });
    // teams
    const walk = P(t, leave, 1.6, 'in');
    const teamA = [{ x: 250, shirt: C.teal, skin: C.skin[0], hair: C.hair[0], hs: 0 }, { x: 410, shirt: C.blue, skin: C.skin[3], hair: C.hair[3], hs: 3 }];
    const teamB = [{ x: 1560, shirt: C.mustard, skin: C.skin[1], hair: C.hair[4], hs: 4 }, { x: 1720, shirt: C.grey, skin: C.skin[4], hair: C.hair[2], hs: 1 }];
    const KA = once('K_mini', () => makeConstellation(3, 7, { rx: 44, ry: 28, minD: 18, extra: 0.3 }));
    teamA.forEach((pp, i) => {
      const dx = -560 * walk;
      const bob = walk > 0 ? -Math.abs(Math.sin((t - leave) * 9 + i)) * 8 : 0;
      const bub = G({ x: 58, y: -408 }, thoughtBubble(140, 96, { fill: C.night, stroke: C.night, tailX: -40 }), constellation(t, KA, { t0: S.start + 0.4 + i * 0.2, dur: 0.8, size: 4.2, lineW: 1.6, glow: 0.8 }));
      out.push(G({ x: pp.x + dx, y: 900 + bob + eIn.y, o: eIn.o }, person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: 5 + i, mood: 'happy', flip: walk > 0, look: walk > 0 ? -0.5 : 0.4 }), bub));
    });
    out.push(G({ o: eIn.o * (1 - walk) }, T('Team A', 330, 975, { size: 28, weight: 700, fill: C.tealDark, anchor: 'middle', ls: 2 })));
    teamB.forEach((pp, i) => {
      const puzzled = t > patch + 1.5;
      const bub = G({ x: -58, y: -408 }, thoughtBubble(140, 96, { fill: 'none', stroke: C.ink3, dash: '6 7', tailX: 40 }), puzzled ? T('?', 0, 16, { font: 'serif', size: 50, weight: 700, fill: C.ink3, anchor: 'middle' }) : '');
      out.push(G({ x: pp.x, y: 900 + eIn.y, o: eIn.o }, person(t, { shirt: pp.shirt, skin: pp.skin, hair: pp.hair, hairStyle: pp.hs, seed: 7 + i, mood: puzzled ? 'worried' : 'neutral', look: -0.4 }), bub));
    });
    out.push(G({ o: eIn.o }, T('Team B', 1640, 975, { size: 28, weight: 700, fill: C.ink2, anchor: 'middle', ls: 2 })));
    // compiler moves from A to B
    const mv = P(t, inh, 1.1, 'inOut');
    const mx = lerp(760, 1110, mv), my = 540;
    const decay = P(t, patch + 0.6, 1.6, 'inOut');
    const eM = enter(t, S.start + 0.25, { d: 0.6 });
    // heartbeat monitor above the machine
    const alive = 1 - P(t, dies, 0.5, 'inOut');
    const hbCol = mixColor(C.tealLight, C.coral, 1 - alive);
    out.push(G({ x: mx, y: my - 262, o: eM.o }, heartbeat(t, { w: 250, alive, color: hbCol })));
    const deadL = P(t, dies + 0.2, 0.4);
    if (deadL > 0) out.push(G({ o: deadL }, T('program death', mx + 170, my - 268, { font: 'hand', size: 44, weight: 700, fill: C.coral })));
    // outputs keep coming: "still runs"
    const run = P(t, runs - 0.2, 0.3);
    if (run > 0) {
      for (let k = 0; k < 5; k++) {
        const ph = ((t - runs) * 0.9 + k / 5) % 1;
        if (t - runs + 0.2 < k * 0.22) continue;
        out.push(G({ x: mx - 300 - ph * 330, y: my + 20 - Math.sin(ph * Math.PI) * 40, o: run * Math.min(1, (1 - ph) * 2.5) }, rect(-20, -20, 40, 40, { rx: 9, fill: C.tealLight }), G({ s: 0.8 }, checkMark(1, { sw: 7, color: C.tealDark }))));
      }
      out.push(G({ o: run }, T('…and it still runs', mx - 470, my + 130, { font: 'hand', size: 46, weight: 700, fill: C.ink2, anchor: 'middle' })));
    }
    out.push(G({ x: mx, y: my + eM.y, o: eM.o }, compilerMachine(t, { patch: t >= patch ? 1 : 0, patchT: patch, decay })));
    // docs travel with it
    const dp = P(t, docs - 0.2, 0.9, 'inOut');
    if (dp > 0) {
      const dx = lerp(420, 1060, dp), dy = 815;
      out.push(G({ x: dx, y: dy, o: clamp(dp * 3) }, G({ x: -70, r: -6, s: 0.55 }, docCard({ w: 220, h: 280, seed: 21, title: 'code' })),
        G({ x: 20, r: 4, s: 0.55 }, docCard({ w: 220, h: 280, seed: 22, title: 'docs' })), G({ x: 105, r: 9, s: 0.55 }, docCard({ w: 220, h: 280, seed: 23, title: 'notes' }))));
      const lab = P(t, docs + 0.5, 0.4);
      if (lab > 0) out.push(G({ o: lab }, T('full code, full docs', dx + 190, dy + 20, { font: 'hand', size: 40, weight: 700, fill: C.ink2 })));
    }
    // the theory tries to travel, and can't
    const fly = P(t, nt - 0.1, 1.1, 'out');
    if (fly > 0 && t < nt + 2.2) {
      const [ox, oy] = [480, 550];
      const reach = 0.42;
      const pp = fly < 0.7 ? (fly / 0.7) * reach : reach;
      const [bx, by] = quadPoint(ox, oy, 1560, 520, -0.25, pp);
      const fall = P(t, nt + 0.55, 0.9, 'in');
      const fade = 1 - P(t, nt + 0.9, 0.6);
      out.push(drawPath(arcPath(ox, oy, 1560, 520, -0.25), 1, { stroke: C.goldDeep, sw: 3, o: 0.35 * fade }));
      out.push(G({ x: bx, y: by + fall * 160, o: fade }, circle(0, 0, 60, { fill: 'url(#gGlow)' }), circle(0, 0, 16, { fill: C.gold })));
      const pf = P(t, nt + 0.5, 0.35, 'outBack');
      if (pf > 0) out.push(G({ x: bx, y: by - 60, s: pf, o: fade }, crossMark(1, { size: 18, sw: 8 })));
    }
    const eN = enter(t, nt - 0.1, { dy: 12 });
    if (eN.o > 0) out.push(G({ o: eN.o, y: eN.y }, richText([{ t: 'code + docs ' }, { t: '≠', fill: C.coral }, { t: ' theory', fill: C.goldDeep }], 960, 150, { font: 'serif', size: 64, weight: 600, anchor: 'middle' })));
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: S.cue('inherit'), type: 'whoosh', dur: 1.0, gain: 0.6 }, { t: S.cue('docs') - 0.2, type: 'whoosh', dur: 0.8, gain: 0.45 },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ t: S.cue('patch') + i * 0.22, type: 'tape', gain: 0.55 })),
    { t: S.cue('notravel') - 0.1, type: 'rise', dur: 0.6 }, { t: S.cue('notravel') + 0.55, type: 'fizzle' },
    { t: S.cue('leave'), type: 'steps', dur: 1.4 }, { t: S.cue('dies'), type: 'flatline', dur: 1.0 },
    { t: S.cue('runs'), type: 'tick', gain: 0.35 }, { t: S.cue('runs') + 0.22, type: 'tick', gain: 0.35 }, { t: S.cue('runs') + 0.44, type: 'tick', gain: 0.35 },
  ],
};

// ================================================================== AGENTS
SCENES.agents = {
  render(t, S) {
    const ag = S.cue('agents'), free = S.cue('free'), never = S.cue('never'), th = S.cue('theory');
    const spec = S.cue('specify'), gets = S.cue('getsspec'), keep = S.cue('keep');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // agent at laptop
    const eA = enter(t, Math.min(ag - 0.45, S.start + 0.05), { d: 0.6 });
    const slideR = P(t, never - 0.7, 0.9, 'inOut');
    const ax = lerp(1130, 1450, slideR), ay = 790;
    const receive = P(t, gets + 0.75, 0.3);
    const screenGlow = receive > 0 ? mixColor(C.night, C.teal, 0.6 * (1 - P(t, gets + 1.1, 0.8))) : C.night;
    const scr = [0, 1, 2, 3].map(k => rect(-70, -114 + k * 20, 40 + ((k * 37 + Math.floor(t * 12)) % 90), 8, { rx: 4, fill: [C.plumLight, C.tealLight, C.blueLight, C.goldLight][k], o: 0.9 })).join('');
    out.push(G({ x: ax, y: ay + eA.y, o: eA.o, s: eA.s }, G({ y: -40 }, robot(t, { typing: t > ag && t < ag + 2.6 ? 1 : 0, look: t > gets ? -0.6 : 0.2 })), G({ y: 70 }, laptopFront(t, { w: 230, h: 140, screen: screenGlow, inner: G({ y: 0 }, scr) })), G({ y: 90 }, desk(420))));
    out.push(G({ o: eA.o }, T('agent', ax, 985, { size: 26, weight: 800, fill: C.plum, anchor: 'middle', ls: 4 })));
    // code streaming into a card
    const cardP = enter(t, ag + 0.1, { d: 0.5 });
    const fill = P(t, ag + 0.2, 1.8, 'linear');
    const cardX = ax + 90, cardY = 318;
    const codeDim = 1 - 0.35 * P(t, never - 0.2, 0.5);
    if (cardP.o > 0) out.push(G({ x: cardX, y: cardY + cardP.y, s: cardP.s, o: cardP.o * codeDim }, codeCard({ w: 360, h: 330, seed: 31, reveal: fill, title: 'generated' })));
    if (t > ag && t < ag + 2.3) {
      for (let k = 0; k < 7; k++) {
        const ph = ((t - ag) * 1.6 + k / 7) % 1;
        const [px, py] = quadPoint(ax, ay - 70, cardX - 60, cardY + 60, -0.3, ph);
        out.push(rect(px - 22, py - 5, 44, 10, { rx: 5, fill: CODE_COLORS[k % CODE_COLORS.length], o: 0.8 * Math.sin(ph * Math.PI) }));
      }
    }
    // price tag swing
    const tagP = P(t, free - 0.1, 0.3);
    if (tagP > 0) {
      const lt = Math.max(0, t - free + 0.1);
      const sw = 28 * Math.exp(-3 * lt) * Math.sin(lt * 9);
      out.push(G({ x: cardX + 168, y: cardY - 150, r: 24 + sw, o: tagP * codeDim }, line(0, 0, -10, 0, { stroke: C.ink2, sw: 2 }), priceTag('$0.00', { w: 160 })));
      const lab = P(t, free + 0.35, 0.4);
      if (lab > 0) out.push(G({ o: lab * codeDim }, T('text ≈ free', cardX - 330, cardY + 10, { font: 'hand', size: 52, weight: 700, fill: C.ink2, anchor: 'middle' }),
        handArrow(cardX - 250, cardY + 26, cardX - 196, cardY + 60, P(t, free + 0.45, 0.4, 'inOut'), { color: C.ink2, bend: -0.3, sw: 3.5, head: 14 })));
    }
    // balance scale: text vs theory
    const scaleIn = enter(t, never - 0.35, { d: 0.6 });
    const scaleOut = exitAt(t, spec - 0.35, 0.4);
    const so = scaleIn.o * scaleOut.o;
    if (so > 0) {
      const tilt = lerp(0, 13, P(t, never + 0.4, 0.9, 'outBack')) + lerp(0, 5, P(t, th, 0.6, 'outBack'));
      const bx = 760, by = 470, arm = 230;
      const rad = (tilt * Math.PI) / 180;
      const Lx = bx - Math.cos(rad) * arm, Ly = by - Math.sin(rad) * arm, Rx = bx + Math.cos(rad) * arm, Ry = by + Math.sin(rad) * arm;
      const pan = (px, py, content, label, col) => G({ x: px, y: py }, line(-70, 110, 0, 0, { stroke: C.ink2, sw: 3 }), line(70, 110, 0, 0, { stroke: C.ink2, sw: 3 }),
        path('M-92 110 Q0 170 92 110 Z', { fill: C.paper3, stroke: C.ink2, sw: 3 }), content, T(label, 0, 205, { size: 28, weight: 800, fill: col, anchor: 'middle', ls: 3 }));
      const KT = once('K_orb', () => makeConstellation(19, 8, { rx: 50, ry: 40, minD: 22, extra: 0.4 }));
      const glowUp = 1 + 0.6 * P(t, th, 0.5);
      out.push(G({ o: so, y: scaleIn.y + scaleOut.y }, [
        path(`M${bx - 90} 860 L${bx + 90} 860 L${bx + 40} 830 L${bx - 40} 830 Z`, { fill: C.ink }),
        rect(bx - 8, by, 16, 840 - by, { fill: C.ink }),
        line(Lx, Ly, Rx, Ry, { stroke: C.ink, sw: 12 }), circle(bx, by, 14, { fill: C.gold }),
        pan(Lx, Ly, G({ y: 96, s: 0.36 }, codeCard({ w: 200, h: 120, seed: 41 })), 'TEXT', C.ink2),
        pan(Rx, Ry, G({ y: 70 }, circle(0, 0, 70 * glowUp, { fill: 'url(#gGlow)' }), circle(0, 0, 52, { fill: C.night }), constellation(t, KT, { t0: never + 0.2, dur: 0.8, size: 4, lineW: 1.8, glow: 0.8 * glowUp })), 'THEORY', C.goldDeep),
      ]));
    }
    // PM writes the spec; theory grows while specifying
    const eP = enter(t, spec - 0.3, { d: 0.6 });
    if (eP.o > 0) {
      const px = 380, py = 905;
      const write = P(t, spec + 0.1, 1.9, 'linear');
      const KP = once('K_pm', () => makeConstellation(23, 11, { rx: 92, ry: 58, minD: 26, extra: 0.35 }));
      const keepGlow = 1 + 0.5 * Math.sin(Math.max(0, t - keep) * 5) * P(t, keep, 0.3) * (1 - P(t, keep + 1.2, 0.5));
      const pm = [
        G({ x: px, y: py }, person(t, { shirt: C.coral, skin: C.skin[2], hair: C.hair[1], hairStyle: 2, seed: 11, mood: 'happy', look: 0.5,
          arms: (() => { const q = P(t, gets + 0.2, 0.5, 'inOut'); return [[lerp(-40, -52, q), lerp(-118, -108, q)], [lerp(34, 52, q), lerp(-126, -108, q)]]; })() })),
        G({ x: px + 40, y: 440 }, thoughtBubble(250, 170, { fill: C.night, stroke: C.night, tailX: -60 }), constellation(t, KP, { t0: spec + 0.2, dur: 1.9, size: 5.5 * keepGlow, lineW: 2, glow: 0.9 * keepGlow })),
      ];
      out.push(G({ o: eP.o, y: eP.y }, pm));
      // the spec document (flies to the agent)
      const fly = P(t, gets - 0.05, 0.85, 'inOut');
      const land = [ax + 160, ay + 28];
      const [sx, sy] = fly > 0 ? quadPoint(610, 700, land[0], land[1], -0.32, fly) : [610, 700];
      const ss = lerp(1, 0.42, fly) * pulse(t, gets + 0.8, 0.35, 0.12);
      if (fly > 0) out.unshift(drawPath(arcPath(610, 700, land[0], land[1], -0.32), fly, { stroke: C.coral, sw: 3, o: 0.35 * (1 - P(t, keep + 0.6, 0.6)) }));
      out.push(G({ x: sx, y: sy + eP.y, s: ss, r: lerp(-4, 8, fly), o: eP.o }, specDoc({ w: 210, h: 270, reveal: write, accent: C.coral })));
      const l1 = P(t, gets + 0.6, 0.4), l2 = P(t, keep + 0.1, 0.4);
      if (l1 > 0) out.push(G({ o: l1 }, richText([{ t: 'gets ', weight: 500, fill: C.ink2 }, { t: 'the spec', weight: 800, fill: C.coral }], ax, 1030, { size: 30, anchor: 'middle' })));
      if (l2 > 0) out.push(G({ o: l2 }, richText([{ t: 'you keep ', weight: 500, fill: C.ink2 }, { t: 'the theory', weight: 800, fill: C.goldDeep }], px + 40, 1030, { size: 30, anchor: 'middle' })));
    }
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: Math.min(S.cue('agents') - 0.45, S.start + 0.05), type: 'pop', pitch: 0.9 }, { t: S.cue('agents'), type: 'typing', dur: 2.2 },
    { t: S.cue('free') - 0.1, type: 'swing' }, { t: S.cue('never') - 0.35, type: 'whoosh', dur: 0.5, gain: 0.5 },
    { t: S.cue('never') + 0.4, type: 'creak', dur: 0.8 }, { t: S.cue('theory'), type: 'chime', note: 1 },
    { t: S.cue('specify') - 0.3, type: 'whoosh', dur: 0.5, gain: 0.45 }, { t: S.cue('specify') + 0.1, type: 'scribble', dur: 1.9, gain: 0.35 },
    { t: S.cue('getsspec') - 0.05, type: 'whoosh', dur: 0.85 }, { t: S.cue('getsspec') + 0.75, type: 'pop', pitch: 1.2 },
    { t: S.cue('keep'), type: 'chime', note: 4 },
  ],
};

// ================================================================== ENTERPRISE
SCENES.enterprise = {
  render(t, S) {
    const reg = S.cue('reg'), sc = S.cue('scattered'), rule = S.cue('rule'), quirk = S.cue('quirk'), uns = S.cue('unsaid'), rg = S.cue('rgtb');
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    // skyline
    const sky = P(t, S.start + 0.02, 1.0, 'out');
    const blds = once('skyline', () => { const R = rng(99); let x = -20; const b = []; while (x < 1940) { const w = 90 + R() * 130, h = 70 + R() * 150; b.push([x, w, h]); x += w + 8; } return b; });
    out.push(G({ y: (1 - sky) * 200 }, blds.map(([x, w, h], i) => [rect(x, 1080 - h, w, h + 10, { fill: C.paper3, o: 0.85 }),
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
    const zones = [{ x: 380, cue: rule }, { x: 960, cue: quirk }, { x: 1540, cue: uns }];
    const frag = once('frags', () => [0, 1, 2].map(i => makeConstellation(60 + i, 4, { rx: 46, ry: 34, minD: 22, extra: 0.2 })));
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

// ================================================================== TAKEAWAYS
SCENES.takeaways = {
  render(t, S) {
    const c = n => S.cue(n);
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 12 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Four habits for PMs ' }, { t: 'writing specs', fill: C.goldDeep }], 960, 136, { font: 'serif', size: 50, weight: 600, anchor: 'middle' })));
    const cards = [
      { cue: c('t1'), x: 540, y: 372, title: ['Trace every requirement', 'to its source'], sub: 'the rule · the system · the owner', tag: '① map' },
      { cue: c('t2'), x: 1380, y: 372, title: ['Write down the why'], sub: '…and what you rejected', tag: '② justify' },
      { cue: c('t3'), x: 540, y: 762, title: ['Rehearse change'], sub: 'does a new rule fit, or need a patch?', tag: '③ adapt' },
      { cue: c('t4'), x: 1380, y: 762, title: ['Stay close to the', 'theory-holders'], sub: 'keep them in the loop as agents build', tag: 'keep it alive' },
    ];
    cards.forEach((cd, i) => {
      const e = enter(t, cd.cue - 0.3, { d: 0.55 });
      if (e.o <= 0) return;
      const lt = t - cd.cue;
      const inner = [shadowCard(-400, -165, 800, 330, { rx: 24 }), circle(-265, 0, 112, { fill: C.paper2 }), G({ x: -372, y: -135 }, badge(i + 1, { r: 24, size: 26 }))];
      cd.title.forEach((ln, k) => inner.push(T(ln, -120, (cd.title.length === 1 ? -22 : -52) + k * 50, { font: 'serif', size: 40, weight: 600 })));
      inner.push(T(cd.sub, -120, cd.title.length === 1 ? 32 : 58, { size: 25, weight: 500, fill: C.ink2 }));
      inner.push(G({ x: 290, y: 120 }, pill(cd.tag, { size: 18 })));
      if (i === 0) {
        inner.push(G({ x: -265, y: 0, s: 0.42 }, docCard({ w: 170, h: 210, seed: 51, heading: true, lines: 5 })));
        const spots = [[-340, -60], [-340, 60], [-180, 50]];
        const ic = [G({ s: 0.3 }, iconPolicy()), G({ s: 0.24 }, iconServer(t)), G({ s: 0.3 }, iconBust({ skin: C.skin[1] }))];
        spots.forEach(([sx, sy], k) => {
          const p = P(lt, 0.2 + k * 0.2, 0.5, 'inOut');
          inner.push(drawPath(`M-265 0 L${sx} ${sy}`, p, { stroke: C.goldDeep, sw: 3 }));
          const pp = P(lt, 0.45 + k * 0.2, 0.4, 'outBack');
          if (pp > 0) inner.push(G({ x: sx, y: sy, s: pp }, circle(0, 0, 30, { fill: C.card, stroke: C.faint, sw: 2 }), ic[k]));
        });
      } else if (i === 1) {
        inner.push(G({ x: -250, y: -30, r: -6 }, stickyNote('why?', { w: 130, h: 84, size: 40 })));
        inner.push(T('option A', -320, 60, { font: 'hand', size: 30, weight: 700, fill: C.ink }));
        inner.push(T('option B', -320, 96, { font: 'hand', size: 30, weight: 700, fill: C.ink2 }));
        inner.push(drawPath('M-326 88 L-222 84', P(t, c('rejected') + 0.1, 0.4, 'inOut'), { stroke: C.coral, sw: 5 }));
        const ck = P(t, c('rejected') + 0.4, 0.3);
        if (ck > 0) inner.push(G({ x: -196, y: 50, s: 0.6 }, checkMark(ck, { sw: 9 })));
      } else if (i === 2) {
        const fit = P(t, c('fit'), 0.5, 'outBack');
        inner.push(rect(-330, -60, 60, 60, { rx: 6, stroke: C.ink3, sw: 3, dash: '6 6' }));
        inner.push(G({ x: lerp(-360, -300, fit), y: lerp(-110, -30, fit), s: 0.36, o: clamp(fit * 3) }, puzzlePiece({ color: C.teal })));
        const ok = P(t, c('fit') + 0.35, 0.3);
        if (ok > 0) inner.push(G({ x: -300, y: 45, s: 0.55 }, checkMark(ok, { sw: 9 })));
        const pat = P(t, c('patch'), 0.45, 'outBack');
        if (pat > 0) inner.push(G({ x: -210, y: -30, r: 14, s: pat }, rect(-36, -30, 72, 60, { rx: 6, fill: C.mustard }), G({ r: -40 }, tapeStrip(70, { color: C.grey }))));
        const no = P(t, c('patch') + 0.35, 0.3);
        if (no > 0) inner.push(G({ x: -210, y: 45 }, crossMark(no, { size: 16, sw: 7 })));
      } else {
        inner.push(G({ x: -320, y: 40, s: 0.42 }, iconBust({ skin: C.skin[2], hair: C.hair[1] })));
        inner.push(G({ x: -210, y: 40, s: 0.42 }, iconBust({ color: C.coral, skin: C.skin[0] })));
        inner.push(G({ x: -265, y: -18, s: 0.3 }, G({ y: 120 }, robot(t))));
        inner.push(G({ x: -265, y: 0 }, loopArrows(t, { r: 96, color: C.tealDark, spin: (t - c('loop')) > 0 ? ((t - c('loop')) * 180) % 360 : 0 })));
      }
      out.push(G({ x: cd.x, y: cd.y + e.y, s: e.s, o: e.o }, inner));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    ...['t1', 't2', 't3', 't4'].map((n, i) => ({ t: S.cue(n) - 0.3, type: 'pluck', note: [0, 2, 4, 7][i] })),
    { t: S.cue('rejected') + 0.1, type: 'scribble', dur: 0.4, gain: 0.5 }, { t: S.cue('fit'), type: 'click' },
    { t: S.cue('patch'), type: 'tape', gain: 0.6 }, { t: S.cue('loop'), type: 'whoosh', dur: 0.7, gain: 0.35 },
  ],
};

// ================================================================== CLOSE
SCENES.close = {
  render(t, S) {
    const c1 = S.cue('c1'), c2 = S.cue('c2'), c3 = S.cue('c3');
    const X = exitAt(t, S.end - 0.2, 0.45);
    const out = [];
    const rows = [
      { cue: c1, y: 790, lead: 'Code', rest: ' is the output', col: C.ink, icon: () => G({ s: 0.36 }, codeCard({ w: 300, h: 240, seed: 61 })) },
      { cue: c2, y: 560, lead: 'The spec', rest: ' is the handoff', col: C.coral, icon: () => G({ s: 0.4 }, specDoc({ w: 220, h: 270, accent: C.coral })) },
      { cue: c3, y: 330, lead: 'The theory', rest: ' is the product', col: C.goldDeep, icon: () => G({ s: 0.36, x: -6, y: -8 }, bigHead(t), constellation(t, HEAD_K(), { t0: c3, dur: 0.8, size: 8, lineW: 3, glow: 1.2 })) },
    ];
    const focus = P(t, c3 + 0.3, 0.6);
    rows.forEach((rw, i) => {
      const e = enter(t, i === 0 ? Math.min(rw.cue - 0.1, S.start + 0.08) : rw.cue - 0.1, { dy: 30, d: 0.55 });
      if (e.o <= 0) return;
      const dim = i < 2 ? 1 - 0.45 * focus : 1;
      const glow = i === 2 ? circle(0, 0, 150, { fill: 'url(#gGlow)', o: 0.5 + 0.3 * Math.sin(t * 3) }) : '';
      out.push(G({ x: 560, y: rw.y + e.y, o: e.o * dim }, G({ s: e.s }, glow, rw.icon()),
        richText([{ t: rw.lead, fill: rw.col, weight: 700 }, { t: rw.rest, fill: C.ink2, weight: 400 }], 130, 24, { font: 'serif', size: 72 })));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [{ t: S.cue('c1') - 0.1, type: 'pluck', note: 0 }, { t: S.cue('c2') - 0.1, type: 'pluck', note: 4 }, { t: S.cue('c3') - 0.1, type: 'pluck', note: 7 }, { t: S.cue('c3'), type: 'chime', note: 7 }],
};

// ================================================================== END CARD
SCENES.end = {
  post: 1, zoom: 0.01,
  render(t, S) {
    const out = [];
    const fadeAll = 1 - P(t, S.end - 0.6, 0.6, 'in');
    const K = once('K_end', () => makeConstellation(77, 18, { cx: 960, cy: 520, rx: 820, ry: 400, minD: 170, extra: 0.25 }));
    out.push(constellation(t, K, { t0: S.start, dur: 1.6, size: 4.5, lineW: 1.6, o: 0.3, glow: 0.5 }));
    const e1 = enter(t, S.start + 0.1, { dy: 20, d: 0.7 });
    out.push(G({ o: e1.o, y: e1.y }, richText([{ t: 'Specs', fill: C.coral }, { t: ' as Theory Building', fill: C.ink }], 960, 500, { font: 'serif', size: 96, weight: 700, anchor: 'middle' })));
    const e2 = enter(t, S.start + 0.5, { dy: 14 });
    out.push(G({ o: e2.o, y: e2.y }, T('After Peter Naur, “Programming as Theory Building” (1985)', 960, 580, { font: 'serif', size: 38, italic: true, fill: C.ink2, anchor: 'middle' }),
      T('Microprocessing and Microprogramming 15, pp. 253–261', 960, 628, { size: 22, weight: 500, fill: C.ink3, anchor: 'middle', ls: 1 })));
    const v = TL.voice || {};
    const voice = v.provider === 'openrouter' ? `Voice: ${v.model} (${v.voice}) via OpenRouter` : `Voice: ${v.model || 'Kokoro-82M'} (${v.voice || ''}), local stand-in`;
    const e3 = enter(t, S.start + 0.9, { dy: 8 });
    out.push(G({ o: e3.o * 0.9 }, T(voice, 960, 1010, { size: 19, weight: 500, fill: C.ink3, anchor: 'middle', ls: 1 })));
    return G({ o: fadeAll }, out);
  },
  sfx: S => [{ t: S.start + 0.1, type: 'chime', note: 0 }],
};
