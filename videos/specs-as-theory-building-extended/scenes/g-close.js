// Scenes: takeaways, close, end. Wrapped in an IIFE so helpers stay local to this file.
'use strict';
(() => {

// ================================================================== TAKEAWAYS
// Five rows, one per habit, each tagged with what it trains or buys.
SCENES.takeaways = {
  render(t, S) {
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const eH = enter(t, S.start + 0.02, { dy: 12 });
    out.push(G({ o: eH.o, y: eH.y }, richText([{ t: 'Five habits for PMs ' }, { t: 'writing specs', fill: C.goldDeep }], 960, 150, { font: 'serif', size: 54, weight: 600, anchor: 'middle' })));
    const rows = [
      { cue: 't1', title: 'Trace every requirement to a governed fact', sub: 'source · owner · date · verified or assumed', tag: 'map' },
      { cue: 't2', title: 'Write down the why', sub: '…and what you rejected', tag: 'justify' },
      { cue: 't3', title: 'Rehearse change', sub: 'does a new rule fit, or need a patch?', tag: 'adapt' },
      { cue: 't4', title: 'Close each loop by writing back', sub: 'what you learned is where the next loop starts', tag: 'compounds' },
      { cue: 't5', title: 'Keep the theory’s holders in the loop', sub: 'as agents build', tag: 'keeps it alive' },
    ];
    const ys = [296, 440, 584, 728, 872];
    const active = rows.reduce((k, r, i) => (t >= S.cue(r.cue) - 0.3 ? i : k), -1);
    rows.forEach((r, i) => {
      const c = S.cue(r.cue), e = enter(t, c - 0.3, { d: 0.55, dy: 22 });
      if (e.o <= 0) return;
      const lt = t - c, y = ys[i];
      const now = i === active ? P(t, c - 0.3, 0.4) : 0;
      const inner = [shadowCard(-800, -60, 1600, 120, { rx: 22 })];
      inner.push(rect(-786, -40, 8, 80, { rx: 4, fill: C.gold, o: 0.3 + 0.7 * now }));
      inner.push(G({ x: -730, y: 0 }, badge(i + 1, { r: 25, size: 26, fill: i === active ? C.goldDeep : C.ink })));
      inner.push(circle(-615, 0, 50, { fill: C.paper2 }));
      inner.push(G({ x: -615, y: 0 }, rowIcon(i, t, lt)));
      inner.push(T(r.title, -535, -6, { font: 'serif', size: 38, weight: 600 }));
      inner.push(T(r.sub, -535, 34, { size: 24, weight: 500, fill: C.ink2 }));
      inner.push(G({ x: 640, y: 4 }, pill(r.tag, { size: 20 })));
      out.push(G({ x: 960 + (1 - e.p) * -30, y: y + e.y, o: e.o }, inner));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    ...['t1', 't2', 't3', 't4', 't5'].map((n, i) => ({ t: S.cue(n) - 0.3, type: 'pluck', note: [0, 2, 4, 7, 9][i] })),
    { t: S.cue('t1') + 0.4, type: 'thud', gain: 0.35 }, { t: S.cue('t2') + 0.5, type: 'scribble', dur: 0.35, gain: 0.4 },
    { t: S.cue('t3') + 0.35, type: 'click' }, { t: S.cue('t4') + 0.2, type: 'swish', dur: 0.5, gain: 0.3 },
    { t: S.cue('t5') + 0.4, type: 'chime', note: 7, gain: 0.6 },
  ],
};

// the little animated icon in each takeaway row (drawn inside a circle of radius 50)
function rowIcon(i, t, lt) {
  if (i === 0) {  // a fact card gets its seal
    return G({ s: 0.52 }, factChip({ status: 'verified', sealP: P(lt, 0.35, 0.45) }));
  }
  if (i === 1) {  // why? note over a struck-out option
    const k = P(lt, 0.45, 0.4, 'inOut');
    return [G({ x: 0, y: -8, s: 0.5 }, stickyNote('why?', { w: 130, h: 84, size: 40, r: -6 })),
      rect(-30, 22, 60, 7, { rx: 3.5, fill: C.ink3 }), drawPath('M-34 26 L34 25', k, { stroke: C.coral, sw: 4 })].join('');
  }
  if (i === 2) {  // a piece slides into a slot that fits it
    const f = P(lt, 0.2, 0.55, 'outBack');
    return [rect(-18, -18, 36, 36, { rx: 5, stroke: C.ink3, sw: 2.5, dash: '5 5' }),
      G({ x: lerp(-26, 0, f), y: lerp(-30, 0, f), s: 0.26, o: clamp(f * 3) }, puzzlePiece({ color: C.teal })),
      P(lt, 0.7, 0.3) > 0 ? G({ x: 26, y: 26, s: 0.5 }, checkMark(P(lt, 0.7, 0.3), { sw: 9 })) : ''].join('');
  }
  if (i === 3) {  // a fact drops into the loop
    const spin = lt > 0 ? (lt * 120) % 360 : 0, d = P(lt, 0.25, 0.5, 'outBack');
    return [G({ s: 0.8 }, loopArrows(t, { r: 44, color: C.tealDark, spin })),
      G({ y: lerp(-40, 0, d), s: 0.28, o: clamp(d * 3) }, factChip({ status: 'verified' }))].join('');
  }
  // a theory-holder inside the loop with an agent
  const spin = lt > 0 ? (lt * 90) % 360 : 0;
  return [G({ s: 0.84 }, loopArrows(t, { r: 44, color: C.tealDark, spin })),
    circle(-10, -10, 26, { fill: 'url(#gGlow)', o: 0.7 + 0.2 * Math.sin(t * 3) }),
    G({ x: -12, y: 2, s: 0.32 }, iconBust({ skin: C.skin[2], hair: C.hair[1] })),
    G({ x: 18, y: 26, s: 0.16 }, robot(t))].join('');
}

// ================================================================== CLOSE
// Four tiers build upward: output, handoff, memory, product.
SCENES.close = {
  render(t, S) {
    const X = exitAt(t, S.end - 0.3, 0.4);
    const out = [];
    const tiers = [
      { cue: 'c1', y: 866, lead: 'Code', rest: ' is the output', col: C.ink, icon: () => G({ s: 0.3 }, codeCard({ w: 300, h: 240, seed: 61 })) },
      { cue: 'c2', y: 682, lead: 'The spec', rest: ' is the handoff', col: C.coral, icon: () => G({ s: 0.34 }, specDoc({ w: 220, h: 270, accent: C.coral })) },
      { cue: 'c3', y: 498, lead: 'Governed facts', rest: ' are the memory', col: C.tealDark, icon: () => [G({ x: -16, y: -14, s: 0.62 }, factChip({ status: 'verified' })), G({ x: 0, y: 0, s: 0.62 }, factChip({ status: 'verified' })), G({ x: 16, y: 14, s: 0.62 }, factChip({ status: 'verified' }))].join('') },
      { cue: 'c4', y: 314, lead: 'The theory', rest: ' is the product', col: C.goldDeep, icon: () => G({ s: 0.3, x: -6, y: -6 }, bigHead(t), constellation(t, HEAD_K(), { t0: S.cue('c4') - 0.2, dur: 0.8, size: 8, lineW: 3, glow: 1.2 })) },
    ];
    const focus = P(t, S.cue('c4') + 0.35, 0.6);
    // a gold spine rising through the tiers
    const spine = P(t, S.cue('c1') - 0.1, S.cue('c4') - S.cue('c1') + 0.4, 'inOut');
    out.push(drawPath('M420 900 L420 300', spine, { stroke: C.goldLight, sw: 5, o: 0.8 }));
    tiers.forEach((tr, i) => {
      const c = S.cue(tr.cue);
      const e = enter(t, i === 0 ? Math.min(c - 0.1, S.start + 0.06) : c - 0.1, { dy: 30, d: 0.55 });
      if (e.o <= 0) return;
      const dim = i < 3 ? 1 - 0.45 * focus : 1;
      const glow = i === 3 ? circle(0, 0, 150, { fill: 'url(#gGlow)', o: 0.45 + 0.3 * Math.sin(t * 3) }) : '';
      out.push(circle(420, tr.y, 9, { fill: i === 3 ? C.gold : C.card, stroke: C.goldDeep, sw: 3, o: e.o }));
      out.push(G({ x: 560, y: tr.y + e.y, o: e.o * dim }, G({ s: e.s }, glow, tr.icon()),
        richText([{ t: tr.lead, fill: tr.col, weight: 700 }, { t: tr.rest, fill: C.ink2, weight: 400 }], 130, 22, { font: 'serif', size: 64 })));
    });
    return G({ o: X.o, y: X.y }, out);
  },
  sfx: S => [
    { t: S.cue('c1') - 0.1, type: 'pluck', note: 0 }, { t: S.cue('c2') - 0.1, type: 'pluck', note: 2 },
    { t: S.cue('c3') - 0.1, type: 'pluck', note: 4 }, { t: S.cue('c4') - 0.1, type: 'pluck', note: 7 },
    { t: S.cue('c4') + 0.1, type: 'chime', note: 7 },
  ],
};

// ================================================================== END CARD
SCENES.end = {
  post: 1, zoom: 0.01,
  render(t, S) {
    const out = [];
    const fadeAll = 1 - P(t, S.end - 0.6, 0.6, 'in');
    const K = once('end_K', () => makeConstellation(77, 18, { cx: 960, cy: 520, rx: 820, ry: 400, minD: 170, extra: 0.25 }));
    out.push(constellation(t, K, { t0: S.start, dur: 1.6, size: 4.5, lineW: 1.6, o: 0.3, glow: 0.5 }));
    const e1 = enter(t, S.start + 0.1, { dy: 20, d: 0.7 });
    out.push(G({ o: e1.o, y: e1.y }, richText([{ t: 'Specs', fill: C.coral }, { t: ' as Theory Building', fill: C.ink }], 960, 470, { font: 'serif', size: 96, weight: 700, anchor: 'middle' })));
    const e2 = enter(t, S.start + 0.35, { dy: 14 });
    out.push(G({ o: e2.o, y: e2.y }, T('The extended cut', 960, 540, { font: 'serif', size: 40, italic: true, fill: C.goldDeep, anchor: 'middle' })));
    const e3 = enter(t, S.start + 0.6, { dy: 14 });
    out.push(G({ o: e3.o, y: e3.y }, T('After Peter Naur, “Programming as Theory Building” (1985)', 960, 620, { font: 'serif', size: 36, italic: true, fill: C.ink2, anchor: 'middle' }),
      T('Microprocessing and Microprogramming 15, pp. 253–261', 960, 666, { size: 22, weight: 500, fill: C.ink3, anchor: 'middle', ls: 1 })));
    const v = TL.voice || {};
    const voice = v.provider === 'openrouter' ? `Voice: ${v.model} (${v.voice}) via OpenRouter` : `Voice: ${v.model || 'Kokoro-82M'} (${v.voice || ''}), local stand-in`;
    const e4 = enter(t, S.start + 0.9, { dy: 8 });
    out.push(G({ o: e4.o * 0.9 }, T(voice, 960, 1010, { size: 19, weight: 500, fill: C.ink3, anchor: 'middle', ls: 1 })));
    return G({ o: fadeAll }, out);
  },
  sfx: S => [{ t: S.start + 0.1, type: 'chime', note: 0 }],
};

})();
