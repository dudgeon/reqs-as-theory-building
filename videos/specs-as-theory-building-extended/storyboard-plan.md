# Extended cut: storyboard plan

This plan was written before any scene was animated, and it served as the brief for the scene builders. For each scene it gives the narration with its `{cue}` markers, and beat tables of the form *cue → what appears → where*. Timings come from the cues. The seconds shown in brackets are the current offsets from the scene start (Kokoro stand-in voice); they move whenever the voice changes, so scene code only uses `S.cue()`, `S.start` and `S.end`.

The finished frames are in [`storyboard/`](storyboard/README.md). Where the animation departs from this plan, the storyboard is right.

## Rules for every scene

**Stage.** 1920×1080.
- Headline band: y ≈ 136–196, centred at x 960. Headlines are serif 600 at 56–62 px; section labels are sans 800 at 24–30 px, uppercase, with letter-spacing 6–8, in `C.ink2`.
- Content band: y 240–900. Labels go at y ≤ 1040. Keep side margins ≥ 80.

**Chapter chip.** Scenes marked **chapter** get a chip drawn by `main.js` at the top left (x 78–620, y 38–88) from `S.start + 0.3` to `S.start + 4.8`. Keep that corner empty during that window.

**Palette meanings.** Keep these consistent across the whole video:
- **gold**: theory. Constellations, glow, "insight".
- **coral**: specs, plus critique marks (✕, strike-throughs, stamps).
- **teal**: the world, verified facts, success ticks.
- **plum**: agents.
- **mustard**: patches (with `tapeStrip`) and assumptions.
- **grey**: decay, via `mixColor(c, '#A9ADB3', k)`.
- **night**: the inside of heads and thought bubbles.

**Recurring motifs.**

| Idea | How to draw it |
|---|---|
| A theory held by someone | Gold `constellation` inside `bigHead`, or a `holder()` / `theoryBubble()` |
| A lost or missing theory | The same constellation with `ghost: true` (dashed, hollow), often in `C.ink3` |
| A theory rebuilt and different | `perturbConstellation(K, seed, amt)` in coral, drawn over the ghost of the original |
| A spec | `specDoc()` (coral) |
| A governed fact | `factCard()` / `factChip()` with a teal `seal()`; an assumption is the dashed mustard variant |
| Patches | Mustard blocks with `tapeStrip` |
| The world | `iconBank`, `iconPolicy`, `iconBust`, `iconGears`, `iconServer`, in teal |

**Motion.**
- The first element enters at `S.start + 0.02`. The whole scene is wrapped in `exitAt(t, S.end - 0.3, 0.4)`.
- Things land about 0.2–0.3 s before their cue word.
- Something should always be moving (twinkle, blink, wobble, a slow drift). Avoid dead holds longer than about 1.5 s.
- When a scene has phases, clear the stage between them: fade the old group out, or down to about 0.25, before the next one arrives. Keep at most three focal groups on screen at once.

**Sound.** Each scene returns `sfx(S)` events:
- `pop` (vary `pitch`) when something appears
- `whoosh` / `swish` for moves
- `chime` (`note` 0–9) for theory insights
- `pluck` for list items
- `scribble` for strikes and underlines
- `tape` for patches, `fizzle` for failures, `thud` for landings
- `flatline` for death, `typing` for code, `tick` / `click` for small things

Use gains of 0.3–0.8, and no more than about one event every 0.4 s on average.

**Code hygiene.**
- Wrap each file in an IIFE.
- Prefix every `once()` key with the scene id; the cache is shared by every file.
- Don't edit `video/*.js`. If a helper is missing, write it locally in your file.
- Keep each frame under about 2,000 SVG elements, and use no SVG filters.

**Fidelity.** On-screen words must match Naur. Put text in quotation marks only when it is an exact quote from the bank at the end of this file.

## Files

| File | Scenes |
|---|---|
| `scenes/a-opening.js` | title, hook, naur, views, matching |
| `scenes/b-cases.js` | compiler, monitor |
| `scenes/c-theory.js` | ryle, newton, abilities |
| `scenes/d-change.js` | cost, decay, life, revival |
| `scenes/e-method-agents.js` | method, status, agents, enterprise |
| `scenes/f-loops.js` | scratch, loop, governed, compound, naurloop |
| `scenes/g-close.js` | takeaways, close, end |

---

## title (0–3.75 s)

Adapt the short cut's title card (`videos/specs-as-theory-building/scenes.js`, `SCENES.title`). It shows a sparse background constellation and "PETER NAUR · 1985", then "Programming as Theory Building". "Programming" is struck out in coral and "Specs" drops in. Change the subtitle to *The extended cut: Naur, in depth*, with the gold underline. Times are offsets from `S.start`.

## hook (8.6 s)

> What does a software team {q}actually produce? {code}Code, surely. {pile}Piles of it. / In 1985, Peter Naur's {ans}answer was {notcode}not the code.

Adapt the short cut's hook. The team sits at laptops behind a desk, and the headline is *What does a software team actually produce?*

| Cue | Beat |
|---|---|
| q [1.5] | A big coral "?" and *the product?* (hand) at the right |
| code [3.1] | A stack of printouts starts growing at x ≈ 1230 |
| pile [4.0] | The stack keeps rising, and a code card lands on top |
| line 2 start | The question headline exits. Naur's paper (a journal card) drops in at the top left. Use `S.line(1).start`; there is no `{y}` cue in this cut. |
| ans [7.1] | Gold underline on the paper's title |
| notcode [7.7] | A coral ✕ over the stack, which dims. Sparkles and head glow over the team. |

## naur (9.9 s)

> Naur {algol}edited the ALGOL 60 report, {bnf}is the N in BNF, and {turing}won the Turing Award. / His essay, {essay}Programming as Theory Building, {slow}rewards a slower look.

The headline "Peter Naur" (serif 600, 62) is at y 150. Under it, sans 500 26 in `ink2`: "1928–2016 · Datalogisk Institut, Copenhagen".

| Cue | Beat |
|---|---|
| algol [0.7] | Card 1 at x 420 (about 400×330, y ≈ 560): a report cover, *Report on the Algorithmic Language ALGOL 60*, *edited by Peter Naur*. Mock code lines with **begin** … **end** in bold. Hand label: *edited the report (1960)*. |
| bnf [2.9] | Card 2 at x 960: mono productions `<digit> ::= 0 \| 1 \| … \| 9` and `<number> ::= <digit> \| <number><digit>`. Big "B N F" letters with the **N** in gold. Label: *Backus–Naur Form*. |
| turing [4.6] | Card 3 at x 1500: a gold medal with a ribbon, *A.M. TURING AWARD · 2005* |
| essay [6.9] | The three cards shrink up into a row (or fade to 0.3). The essay page enters big and centred: *Programming as Theory Building*, *Peter Naur*, *Microprocessing and Microprogramming 15 (1985)*. |
| slow [8.4] | The page lists the paper's real section headings (1 Introduction … 9 Conclusions; see the quote bank). A magnifier slides down the list and each heading highlights as it passes. This cut's chapters follow those sections. |

## views (13.6 s, chapter "What programming is")

> He contrasts two views. In the {prod}production view, programming {texts}produces a program and some other texts. / In the {tbv}theory building view, programmers {insight}form an insight, a theory, of the matters at hand. {second}The texts are secondary.

The headline "Two views of programming" is at y 150. A dashed divider runs down x = 960 from y 250 to 940.

| Cue | Beat |
|---|---|
| start | Divider and headline |
| prod [2.5] | Left panel label **PRODUCTION VIEW** at (480, 280). A programmer at the left of a conveyor belt (y ≈ 760) feeds out texts. |
| texts [4.0] | Items ride the belt: a code card, docs, a coral SPEC. Hand label: *output: a program + texts*. |
| tbv [7.0] | Right panel label **THEORY BUILDING VIEW** at (1440, 280). `bigHead` at about (1440, 600), scale about 0.7. |
| insight [8.7] | `HEAD_K()` constellation grows in the head. Hand label: *an insight, a theory*. |
| second [12.0] | Small copies of the texts drop onto a little shelf under the head, labelled *secondary* (italic). The left panel dims to about 0.45 and the head glows. |

## matching (11.5 s)

> Programming, for Naur, is {matching}matching part of a real-world activity to {symbols}what a computer can do with symbols. / And since {changes}the world keeps changing, it {mods}includes modifying the program to keep up.

On the left, a panel labelled **THE WORLD** (teal), x about 180–760: bank, customer bust, process gears and a policy. On the right, a panel labelled **SYMBOLS**, x about 1160–1740: a code card, or mono lines such as `hold(payment)` and `balance -= amount`. Headline: *Programming is* **matching** (gold).

| Cue | Beat |
|---|---|
| matching [2.3] | Gold threads draw from each world item to a line of code |
| symbols [4.8] | The code lines light up in turn as the threads land |
| changes [7.3] | The world changes: the policy gets a "v2" tab, a new person arrives, the gears speed up. Threads to the changed items turn coral and dashed, with a small "≠". |
| mods [9.0] | The affected code lines retype, new gold threads draw, and everything matches again. A small `loopArrows` with *modification*. |

## compiler (21.6 s, chapter "Evidence from the field")

> {handover}A team extended another group's compiler, with {docs}full documentation, annotated code, and {advice}advice from its authors. / Still, several of their proposals were {patches}patches that would have {destroyed}destroyed its power and simplicity. {spotted}The authors saw it instantly. / Ten years on, without them, {visible}the structure was still visible, but {amorphous}made ineffective by amorphous additions.

The label **CASE 1 · A COMPILER** is centred at y 150. The machine is `compilerMachine` (shared) at centre. Group A (two `holder()`s, gold theories) stands at the left, around x 260–480. Group B (two people with sparse ghost theories) stands at the right, around x 1440–1660.

| Cue | Beat |
|---|---|
| start | Label and machine (*compiler for L*) |
| handover [0.5] | Group A appears. The machine slides a little toward the right, and group B enters (*group B*, *group A* hand labels). |
| docs [3.3] | A doc stack, a binder and an annotated code card fly from A to B and land at B's feet. Labels: *full documentation*, *annotated code*. |
| advice [6.2] | A speech bubble from A to B, with a small gold constellation in it. Label: *personal advice*. |
| patches [9.7] | B's proposals appear as dashed-outline patches around the machine |
| destroyed [11.0] | The patches fill in mustard with tape, the blocks wobble (`decay` about 0.3), and a coral hand label reads *would destroy its power and simplicity* |
| spotted [13.5] | Group A points, and coral rings circle each patch. The patches vanish and a neat gold block appears inside the existing structure, with a tick (*framed within the existing structure*). |
| visible [17.3] | Pill: *about 10 years later*. Group A walks off. The structure is still visible (outline intact). |
| amorphous [19.2] | Amorphous blobs of many kinds (mustard, grey, olive, coral-light, all taped) pile onto and around the machine, which greys (`decay` → 0.6). Label: *made ineffective by amorphous additions*. |

## monitor (19.4 s)

> Second case: {system}a two-hundred-thousand-line monitoring system. {veterans}The programmers who'd been there since its design {fromknow}fixed faults from what they knew and the annotated code, and {nodocs}couldn't imagine any further documentation that would help. / Teams {manuals}with full manuals {stuck}kept getting stuck on problems {easy}the veterans cleared up easily.

The label **CASE 2 · A REAL-TIME MONITORING SYSTEM** is at y 150.

| Cue | Beat |
|---|---|
| system [1.7] | A control-room wall (about 900×240, top centre, y 250–490) powers on: live sensor graphs, a factory glyph, and the badge *≈ 200,000 lines* counting up |
| veterans [4.7] | Left group: two or three `holder()`s with bright theories. Label: *there since the design*. |
| fromknow [7.1] | A fault light blinks coral on the wall. A veteran glances at an annotated code card (gold highlight), and the fault turns teal with a tick. |
| nodocs [11.0] | A dashed "more documentation?" page floats up to the veterans, who shrug. The page fades. |
| manuals [14.6] | Right group: two or three people holding `book({title: 'MANUAL'})`s, with sparse ghost theories |
| stuck [15.6] | A fault light on their side. They look worried, a `clock()` spins fast, and "?" marks appear. |
| easy [17.4] | A veteran walks over (or a gold dashed link runs from a veteran), the fault clears at once, and the team looks happy |

## ryle (21.6 s, chapter "What a theory is")

> For the kind of knowledge, Naur turns to the philosopher {ryle}Gilbert Ryle. / Intelligent behavior, like {joke}telling jokes or {fish}fishing, means {well}doing things well and {lapses}catching your own lapses. / It {rules}isn't rule-following, or you'd need {rules2}rules for applying the rules, {regress}and so on forever. / Having a theory goes further: you can {explain}explain what you do, {answer}answer questions, and {argue}argue about it.

This scene has four phases; clear the stage between them.

| Cue | Beat |
|---|---|
| start | Headline *What kind of knowledge?* |
| ryle [3.2] | A portrait card: a stylised bust, **Gilbert Ryle**, *The Concept of Mind (1949)* |
| joke [6.2] | Label **INTELLIGENT BEHAVIOUR**, and three panels. Panel 1: one person tells a joke (speech bubble "…"), another laughs ("ha!"). |
| fish [7.1] | Panel 2: a person casts a fishing line; the bobber plops |
| well [8.2] | Teal ticks over panels 1 and 2 (*doing things well*) |
| lapses [9.4] | Panel 3: someone writes "recieve", notices, strikes it and writes "receive". Tick. (Naur's example list includes *talking grammatically*.) |
| rules [11.2] | Panels out. A book, **RULES**. |
| rules2 [13.1] | A second book, **RULES FOR APPLYING THE RULES** |
| regress [14.8] | A Droste regress of ever-smaller books receding to a point, with *… ∞*. Coral hand label: *absurd*. |
| explain [18.3] | Headline swap to *Having a theory goes further*. A `holder()` at centre. Bubble 1: *here's how…* |
| answer [19.6] | Bubble 2: a question from someone else and an answer back |
| argue [20.6] | Bubble 3: *because…*, the two sides debating |

## newton (17.2 s)

> A theory isn't just its laws. {newton}Having Newton's theory means seeing how it applies to {pendulum}pendulums and {planets}planets, and {similar}recognizing similar cases. / That kind of similarity {norules}can't be put into rules, any more than the likeness of {faces}faces or {tunes}tunes. {cantwrite}So a theory can't be fully written down.

| Cue | Beat |
|---|---|
| start | A chalkboard (dark slate, top centre) with **F = m·a** in chalk (hand font). Tiny label: *the laws*. |
| newton [2.6] | Label *Newton's theory*. Gold threads start from the board. |
| pendulum [5.2] | An animated pendulum, swinging, below left |
| planets [5.9] | A small orbit (sun and planet circling), below right |
| similar [6.9] | Similar cases appear with dashed gold links: a playground swing next to the pendulum, a moon or satellite next to the planets. Label: *recognizing similar cases*. |
| norules [10.1] | The board fades. A rulebook tries *IF … THEN similar* and gets a coral ✕ (*can't be put into rules*). |
| faces [13.2] | A row of three stylised faces with a family likeness, joined by gold "≈" |
| tunes [13.9] | A musical staff with two similar melodies, joined by "≈" |
| cantwrite [14.8] | A page tries to hold a constellation. Nodes spill over its edges and float away. Label: *can't be fully written down*. |

## abilities (19.9 s, chapter "What the theory makes possible")

> A program's theory is {howhandled}how certain affairs of the world will be handled by it. Its holder can do {three}three things no document can. / {map}Explain how each part maps to the world, {relevant}including which parts of the world matter at all. / {justify}Justify why each part is as it is. And {adapt}meet a request for change by seeing {similarity}how it resembles what's already there.

| Cue | Beat |
|---|---|
| howhandled [1.8] | Headline *A program's theory: how the world will be handled*. World icons at the left, a head with its theory at centre, the program at the right, joined by gold threads. |
| three [5.8] | Headline swap: *Three things no document can do*. Three cards, 1 **MAP**, 2 **JUSTIFY**, 3 **ADAPT** (about 500×520 at x 360, 960 and 1560, y about 610), with number badges. |
| map [8.0] | Card 1: code parts linked by threads to world icons |
| relevant [10.7] | Card 1: a crowd of eight to ten small world icons; only three stay lit and the rest grey out. Label: *which parts matter*. |
| justify [13.2] | Card 2: a code block with a *why?* sticky and a gold *because…* line tied to it |
| adapt [15.9] | Card 3: a coral CHANGE REQUEST arrives |
| similarity [18.0] | Card 3: the request's shape is compared with existing shapes. The similar one lights up gold with "≈", and the request slots in. |

## cost (17.7 s, chapter "Change and decay")

> We expect change to be cheap because {text}a program is text, and text is easy to edit. Naur calls that argument {false}false: {notcost}text was never the main cost. / Altering {building}a building can cost more than {rebuild}rebuilding it. And {flex}built-in flexibility {futures}costs money now, for needs that may never come.

| Cue | Beat |
|---|---|
| text [2.3] | A big editor window with a fast cursor retyping lines. Label: *program = text*, *easy to edit ⇒ cheap to change?* |
| false [7.1] | The claim is struck in coral, and `stamp('FALSE')` slams on it |
| notcost [8.2] | A price tag slides off the editor to a head with a glowing theory. Label: *text was never the main cost*. |
| building [10.5] | Stage clears. A house under renovation (scaffolding, a crane or ladder) with a big swinging tag *$$$$* |
| rebuild [12.1] | Beside it, a fresh rebuild with a smaller tag *$$* |
| flex [13.4] | Stage clears. A program box bristling with knobs and switches, and coins pouring out now |
| futures [14.4] | Ghost thought bubbles of possible futures (dashed icons) float up and fade unused. Label: *for needs that may never come*. |

## decay (16.8 s)

> Any change can be made {manyways}many ways, all correct. Some {natural}extend the theory. {patches2}Others are patches. {onlyholder}Only someone with the theory can tell which. That's {decay}how programs decay. / Even {quality}simplicity and good structure only make sense {possible}against the programs that could have been written instead.

| Cue | Beat |
|---|---|
| start | A coral CHANGE REQUEST card at the top |
| manyways [1.6] | It fans out into five small variant programs (block structures), each with a teal tick. Label: *all correct*. |
| natural [3.7] | One variant integrates cleanly and grows the structure naturally (gold outline and glow) |
| patches2 [5.1] | The other variants show taped mustard patches |
| onlyholder [6.5] | A `holder()` appears. Their look puts a gold ring on the natural one and coral marks on the patches. A person without a theory beside them shrugs ("?"): they all look the same. |
| decay [9.0] | Time-lapse: v1 → v2 → v3, patches accumulating and colours greying |
| quality [10.8] | Stage clears. A clean program at centre. Label: *simplicity · good structure*. |
| possible [13.7] | Inside a large thought bubble from a holder, ghost alternative programs (dashed, messier) surround it. Label (exact quote): *"exist only as possibilities in the programmer's understanding"* |

## life (13.1 s, chapter "Life, death and revival")

> So a program is {alive}alive while a team holding its theory {control}controls its changes. / It {dies}dies when that team {dissolves}dissolves, even if it {runs}keeps running. {visibledeath}The death shows when requests for change can't be answered intelligently.

| Cue | Beat |
|---|---|
| start | A program machine (a server with an app window) at centre right, and a `heartbeat()` monitor above it |
| alive [1.3] | A team of three `holder()`s at the left, theories glowing. The heartbeat beats. Label **ALIVE** (teal). |
| control [3.4] | Coral change-request cards arrive from the right. Each goes to the team, gets a tick, and the program updates (gold threads). |
| dies [5.3] | The theories dim |
| dissolves [6.2] | The team walks off; their constellations go ghostly and fade. The heartbeat flatlines. Label: *program death*. |
| runs [7.7] | The machine keeps printing results. Label: *…and it still runs*. |
| visibledeath [9.0] | New change requests pile up with "?" and nobody answers. Coral label: *requests can't be answered intelligently*. |

## revival (14.2 s)

> {revive}Rebuilding the theory from code and documents alone is, Naur says, {impossible}strictly impossible. He'd rather {afresh}a new team solved the problem afresh. / A theory is passed on the way {instrument}music is taught: by {alongside}working closely with people who have it.

| Cue | Beat |
|---|---|
| revive [0.5] | A newcomer at a desk with a code card and a doc stack. A bubble forms a coral `perturbConstellation` beside a dashed ghost of the original; they don't match. |
| impossible [5.0] | `stamp('STRICTLY IMPOSSIBLE')` slams across |
| afresh [6.8] | The old code pile slides away (discarded). A new team of two or three at a blank page grows a fresh gold theory. Label: *solve the problem afresh*. |
| instrument [10.8] | Stage clears. A teacher and a student at a piano, with notes floating |
| alongside [12.2] | The student's bubble fills with the teacher's constellation as nodes copy across. Label: *working in close contact*. |

## method (13.3 s, chapter "Method and the programmer")

> Can a {method}method stand in for it? A method is {workrules}a set of work rules: steps, order, notations, documents. / But a theory has {noorder}no inherent parts or order. So {noright}there is no right method, though methods {educate}help as education.

| Cue | Beat |
|---|---|
| method [0.7] | A flowchart titled **METHOD**: boxes 1 → 2 → 3 → 4 |
| workrules [2.7] | Box labels type in: *steps*, *order*, *notations*, *documents* |
| noorder [7.6] | A big gold theory constellation. Number badges try to attach to its nodes and tumble off. Label: *no inherent parts or order*. |
| noright [9.9] | Coral ✕ over the flowchart, or `stamp('NO RIGHT METHOD')` |
| educate [11.8] | The flowchart folds into a textbook (`book({title: 'METHODS'})`) that a student reads. Label: *useful as education*. |

## status (11.7 s)

> And programmers aren't {components}replaceable parts on a production line. They're {responsible}responsible, permanent developers of the activity the computer is part of, with {standing}the standing of engineers and lawyers.

| Cue | Beat |
|---|---|
| components [1.6] | A production line of identical grey figures being swapped in and out. Label: *replaceable component?* It is then crossed out in coral. |
| responsible [4.6] | One programmer (`holder()`, glowing) at centre, with the activity around them: a computer, world icons, people. Label: *responsible, permanent developer*. |
| standing [9.4] | Engineer (hard hat), lawyer (book or briefcase) and programmer (laptop), side by side at the same height. Label: *the same standing*. |

## agents (26.0 s, chapter "Specs, in the age of agents")

> Now {agents}agents write the code, and text {free}really is nearly free. On Naur's argument, the cost {moved}hasn't gone. It has moved {tospec}to specifying. / An agent {dropped}dropped into a codebase with only code and documents is attempting {revival}what Naur called revival. {differs}Its picture of the system can differ from the original. / So the spec is {handoff}the handoff, and writing it is {tbuild}where the theory gets built. The agent {getsspec}gets the spec. {keep}You keep the theory.

You can lift parts of the short cut's `SCENES.agents`.

| Cue | Beat |
|---|---|
| agents [0.7] | A plum robot streams code into cards |
| free [2.5] | Tag **$0.00** on the code (*text ≈ free*) |
| moved [6.0] | The cost (a weight or price tag) slides from the code across to a **SPECIFYING** station |
| tospec [7.7] | The spec station glows and the cost lands there |
| dropped [9.6] | Stage clears. The robot is lowered on a cable into a maze of code, with a doc stack beside it |
| revival [13.6] | The robot forms its own constellation (coral, `perturbConstellation`). Label *revival*, with a small "Naur" tag. |
| differs [16.2] | The ghost of the original (dashed gold) appears over it, and the differences are marked in coral |
| handoff [20.0] | Stage clears. A PM at a desk writing a SPEC |
| tbuild [21.5] | The PM's thought-bubble theory grows as they write |
| getsspec [23.7] | The spec flies along an arc to the robot |
| keep [25.0] | The PM keeps the glowing constellation (pulse). Label: *you keep the theory*. |

## enterprise (13.0 s)

> In a {reg}regulated enterprise, that theory is {scattered}scattered: {rule}a rule buried in policy, {quirk}a platform quirk one engineer knows, {unsaid}a constraint nobody says out loud. / {rgtb}Requirements gathering is theory building.

Reuse the short cut's `SCENES.enterprise` verbatim; the cues are identical. Prefix its `once()` keys.

## scratch (9.2 s, chapter "Loops that compound")

> But if each spec starts {scratch}from scratch, each team {again}rediscovers the same rules, quirks and owners. {longer}Longer documents won't fix that. {loopword}A loop will.

| Cue | Beat |
|---|---|
| scratch [1.5] | Three horizontal lanes (y about 330, 530, 730). Lane 1: a small team walks into fog (soft paper-coloured blobs) and uncovers § rule, a *batch 2 a.m.* note and an owner bust. |
| again [2.9] | Lanes 2 and 3 uncover exactly the same three things. Déjà-vu marks; label *same rules, same quirks, same owners*. |
| longer [6.3] | A document grows taller and taller while the fog stays. Coral label: *longer docs won't fix it*. |
| loopword [8.3] | A big loop arrow draws around everything and the fog starts to thin |

## loop (13.6 s)

> Each piece of product shaping runs a loop: {discover}discover what's true, {verify}verify it with the people who own it, {specify}specify, {build}build with agents, and {learn}learn from what building reveals. / Then it {writeback}writes back what it learned, as {governed}governed facts.

A ring of radius about 300 centred at (960, 600), with five stations at −90°, −18°, 54°, 126° and 198°. A glowing token travels the ring from station to station.

| Cue | Beat |
|---|---|
| discover [3.3] | **DISCOVER**: a magnifier over fog (teal) |
| verify [4.4] | **VERIFY**: an owner bust with a `seal()` |
| specify [6.5] | **SPECIFY**: a `specDoc()` |
| build [7.4] | **BUILD**: a robot |
| learn [8.6] | **LEARN**: a gold spark or light bulb |
| writeback [10.9] | An arrow runs from Learn into the centre, where a ledger labelled **GOVERNED FACTS** fills with `factChip()`s |
| governed [12.4] | The chips get their seals one by one |

## governed (10.3 s)

> A governed fact {source}cites its source, {owner}names an owner who vouches for it, {dated}carries a date, and says whether it's {verified}verified or {assumed}still assumed. {decision}Decisions keep their reasons.

This scene continues the enterprise scene's examples (§4.2(b), *batch posts 2 a.m. only*).

| Cue | Beat |
|---|---|
| start | A `factCard` at about (600, 420), w about 720, claim *Unverified payments are held, not rejected*, rows hidden |
| source [1.2] | Row: SOURCE, *Payments Policy vol. 3 §4.2(b)* |
| owner [2.5] | Row: OWNER, *Payments Compliance* |
| dated [4.3] | Row: DATED, *verified Sep 2026* |
| verified [6.2] | The seal stamps |
| assumed [7.0] | A dashed card at about (1400, 330): *Batch posts at 2 a.m. only*, ASSUMED, SOURCE *one engineer's memory*, OWNER *needs an owner* |
| decision [8.5] | A DECISION card at about (1400, 720): *Hold for review*; WHY *rejecting would harm customers*; REJECTED *auto-reject* |

## compound (20.9 s)

> The next loop {startsfrom}starts from those facts. {adjacent}An adjacent feature inherits most of them. {orthogonal}An unrelated one still reuses {shared}the rules, platforms and people they share. / Each loop has {fewer}fewer unknowns to resolve, so it {faster}moves faster, and {judgment}what's left is the work that needs judgment. / And when a rule changes, {impact}you can see every spec that relied on it.

A fog-of-war hex map fills about 1500×600 (y 270–880). Cleared hexes show small fact glyphs (§, server, bust) with seals. Fogged hexes are soft paper-grey.

| Cue | Beat |
|---|---|
| start | Loop 1's region, at the left, is already cleared |
| startsfrom [1.0] | Loop 2's outline appears |
| adjacent [2.7] | Loop 2 sits beside loop 1. Most of its hexes are already cleared (inherited), and only a few fogged ones get explored. |
| orthogonal [5.5] | Loop 3 is far to the right |
| shared [7.2] | Gold paths link loop 3's shared hexes (a rule, a platform, a person) back to loop 1's. Label: *rules · platforms · people*. |
| fewer [11.0] | Small bars per loop (unknowns) shrink from loop 1 to loop 3. No numbers. |
| faster [13.2] | Time bars shrink the same way, with a small `clock()` |
| judgment [14.5] | The few fogged hexes left get a person glyph and a gold ring: *the work that needs judgment* |
| impact [18.6] | A rule hex pulses coral (*rule changed*). Lines run from it to three SPEC icons in different loops, and each lights coral. |

## naurloop (12.3 s)

> This works with Naur, not around him. {factsnot}Facts aren't the theory, {builton}but they're what it's built on. / And the loop keeps {inloop}the people who hold the theory in it, verifying and deciding. {alivelong}That's what keeps a product alive.

| Cue | Beat |
|---|---|
| start | Headline *With Naur, not around him* |
| factsnot [3.2] | A stack of `factChip`s at the left, a head with its theory at the right, and a coral "≠" between them. Label: *facts ≠ theory*. |
| builton [4.1] | The chips slide under the head and form its plinth. The constellation brightens. Label: *built on*. |
| inloop [6.5] | A small version of the loop ring, with `holder()`s at the Verify and Specify stations. Labels: *verifying*, *deciding*. |
| alivelong [10.3] | A strong, glowing `heartbeat()`. Label: *that's what keeps a product alive*. |

## takeaways (15.0 s, chapter "Takeaways")

> So: {t1}trace every requirement to a governed fact. / {t2}Write down the why, and what you rejected. / {t3}Rehearse change: does a new rule fit, or need a patch? / {t4}Close each loop by writing back what you learned. / And {t5}keep the theory's holders in the loop as agents build.

The headline *Five habits for PMs writing specs* is at y 150. Five rows at y 300, 440, 580, 720 and 860. Each row has a badge, a small icon, a title in serif 40 and a sub-line, plus a tag pill: *map*, *justify*, *adapt*, *compounds*, *keeps it alive*.

## close (7.0 s)

> {c1}Code is the output. {c2}The spec is the handoff. {c3}Governed facts are the memory. {c4}The theory is the product.

Four tiers build upward (y 860, 680, 500, 320): **Code** / **The spec** (coral) / **Governed facts** (teal) / **The theory** (gold, glowing).

## end (4.0 s)

The end card: *Specs as Theory Building*, *The extended cut*, the citation and the voice credit.

---

## Quote bank for on-screen text

From Peter Naur, "Programming as Theory Building," *Microprocessing and Microprogramming* 15 (1985), 253–261.

- Section headings (use on the essay page): 1 Introduction · 2 Programming and the programmers' knowledge · 3 Ryle's notion of theory · 4 The theory to be built by the programmer · 5 Problems and costs of program modifications · 6 Program life, death and revival · 7 Method and theory building · 8 Programmers' status and the Theory Building View · 9 Conclusions
- "programmers form or achieve a certain kind of insight, a theory, of the matters at hand" (p. 253)
- "a production of a program and certain other texts" (p. 253)
- "any documentation being an auxiliary, secondary product" (p. 253)
- "matching some significant part and aspect of an activity in the real world to the formal symbol manipulation that can be done by a program running on a computer" (p. 253)
- "patches that effectively destroyed its power and simplicity" (p. 254)
- "the original powerful structure was still visible, but made entirely ineffective by amorphous additions of many different kinds" (p. 254)
- "unable to conceive of any kind of additional documentation that would be useful to them" (p. 254)
- "in an infinite regress, which is absurd" (p. 255; the regress sentence itself is misprinted "rules above how to follow rules", so paraphrase it)
- "to explain them, to answer queries about them, to argue about them" (p. 255)
- "human faces, tunes, or tastes of wine" (p. 255)
- "a theory of how certain affairs of the world will be handled by, or supported by, a computer program" (p. 255)
- "the decision that a part of the world is relevant can only be made by someone who understands the whole world" (p. 256)
- "On the Theory Building View this whole argument is false." (p. 257)
- "many different ways, all correct" (p. 257)
- "unintegrated patches" (p. 257)
- "exist only as possibilities in the programmer's understanding" (p. 258)
- "A dead program may continue to be used for execution in a computer and to produce useful results." (p. 258)
- "strictly impossible" (p. 258)
- "solve the given problem afresh" (p. 258)
- "work in close contact with the programmers who already possess the theory" (p. 258)
- "a set of work rules for the programmers" (p. 259)
- "no inherent division into parts and no inherent ordering" (p. 259)
- "there can be no right method" (p. 259)
- "responsible developer and manager of the activity in which the computer is a part" (p. 261)
- "such as engineers and lawyers" (p. 261)
