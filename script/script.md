# Specs as Theory Building: script

**Runtime:** about 90 s, 234 narrated words (1080p, 30 fps)
**Source text:** Peter Naur, "Programming as Theory Building," *Microprocessing and Microprogramming* 15 (1985): 253–261. It was first given as the keynote at Euromicro 84.
**Narration source of truth:** [`pipeline/narration.json`](../pipeline/narration.json). The `{cue}` markers there drive the animation timing.

---

## Narration

| # | Time | Scene | Narration | On screen |
|---|------|-------|-----------|-----------|
| 0 | 0:00 | Title | *(music only)* | "Programming as Theory Building" → "Programming" is struck out → **"Specs** as Theory Building." Subtitle: *Naur's big idea, for the age of coding agents* |
| 1 | 0:03 | Hook | What does a software team *actually* produce? In 1985, Peter Naur's surprising answer: **not the code.** | A team at laptops produces a growing stack of printouts ("the product?"). Naur's paper slides in. The stack is crossed out and sparks light up over the team's heads. |
| 2 | 0:11 | Thesis | Programming, he argued, is **theory building**: working out how part of the world will be handled by a program. Code and documents, even specs, come second. | A head in profile, with a constellation (the theory) inside. Threads run from THE WORLD (institutions, rules, people, processes) through the head to THE PROGRAM. Code, docs and SPEC drop onto a shelf labelled *secondary products*. *primary: the theory* |
| 3 | 0:20 | Ryle | It's theory in **Gilbert Ryle's** sense: knowing how, and being able to explain it. Whoever holds it can **map** the program to the world, **justify** each part, and judge which changes fit (**adapt**). | *Knowing that* is shown as an index card of facts. *Knowing how* is a person casting a fishing line who then says "…and here's why." Three cards follow: **Map / Justify / Adapt**. |
| 4 | 0:31 | Naur's compiler case | Naur saw successive teams **inherit a compiler**, with full code and full docs, and still **patch its design apart**. The theory didn't travel. And when its holders **leave**, a program **dies**, even while it still runs. | The compiler and its docs move from Team A (constellations in their thought bubbles) to Team B (empty bubbles). Taped-on patches pile up. A theory orb tries to cross to Team B and fizzles: **code + docs ≠ theory**. Team A walks off, the heart monitor flatlines (*program death*), and outputs keep coming (*…and it still runs*). |
| 5 | 0:43 | Agents | Now **agents** write the code. Text is **nearly free**. But for Naur, text was never the expensive part. **The theory is.** And **specifying** is how you build it. The agent **gets your spec**. **You keep the theory.** | A robot streams code into a card tagged **$0.00** (*text ≈ free*). A balance weighs TEXT against THEORY and tips hard toward theory. A PM writes a SPEC while a constellation grows in their thought bubble. The spec flies to the agent, and the constellation stays with the PM. |
| 6 | 0:56 | Enterprise | In a **regulated enterprise**, that theory is **scattered**: a rule buried in policy, a platform quirk one engineer knows, a constraint nobody says out loud. **Requirements gathering is theory building.** | An enterprise skyline. Three vignettes: a policy binder with §4.2(b) under a magnifier; a "CORE v7" platform with the sticky note *batch posts 2 a.m. only* and the one engineer who knows it; a stakeholder whose thought bubble reads "…". Fragments of theory glow in each and then fly together into one head. |
| 7 | 1:09 | Takeaways | So: **trace** every requirement to its source. **Write down the why**, and what you rejected. **Rehearse change**: does a new rule fit, or need a patch? And **sit with the people who hold the theory**. Keep them in the loop as agents build. | Four cards, each tagged with the Naur ability it trains: ① map, ② justify, ③ adapt, and *keep it alive*. |
| 8 | 1:22 | Close | **Code** is the output. **The spec** is the handoff. **The theory** is the product. | A three-tier stack builds upward: code, then spec, then theory, which glows. |
| 9 | 1:27 | End card | *(music)* | **Specs as Theory Building**, with the citation and voice credit. |

Word-level timings come from aligning the synthesized voice (see `build/timeline.json` after a build), so the visual beats land on the words in bold whichever voice is used.

---

## What Naur actually argued (and where the video stays faithful)

The script paraphrases. These are the passages it rests on. Page numbers refer to the 1985 journal printing.

1. **The thesis.** "…the proper, primary aim of programming is, not to produce programs, but to have the programmers build theories of the manner in which the problems at hand are solved by program execution." (p. 253)
2. **What kind of theory.** Naur takes the idea from Gilbert Ryle (*The Concept of Mind*, 1949): "a person who has or possesses a theory in this sense knows how to do certain things and in addition can support the actual doing with explanations, justifications, and answers to queries, about the activity of concern." (p. 255) The video's "knowing how, and being able to explain it" compresses this sentence. Naur also stresses that such knowledge cannot be reduced to rules, because it rests on perceiving *similarities* between situations in the world (p. 255).
3. **Theory of what.** "…what has to be built by the programmer is a theory of how certain affairs of the world will be handled by, or supported by, a computer program." That theory "has primacy over such other products as program texts, user documentation, and additional documentation **such as specifications**." (pp. 255–256) This is why the video says "even specs come second," and why it treats *specifying* (the activity) as the theory building, not the spec document.
4. **The three abilities** that go beyond anything written down (p. 256):
   - explain how the solution relates to the affairs of the world, part by part. Naur adds that "the decision that a part of the world is relevant can only be made by someone who understands the whole world." (**Map**)
   - explain why each part of the program is what it is. (**Justify**)
   - "respond constructively to any demand for a modification," which depends on perceiving how similar the new demand is to what the program already does. (**Adapt**)
5. **Case 1, the compiler.** (The video compresses two stages into "successive teams.") Group B received "full documentation, including annotated program texts and much additional written design discussion, and also personal advice." Their proposed extensions were still "patches that effectively destroyed its power and simplicity." Ten years later, without group A, "the original powerful structure was still visible, but made entirely ineffective by amorphous additions of many different kinds." (p. 254)
6. **Text was never the cost.** The hope for cheap modification assumes "that the dominating cost is one of text manipulation… On the Theory Building View this whole argument is false." (p. 257) This is the hinge of the video's agent section: agents make text almost free, and Naur's point is that text was never where the cost lay.
7. **Correct is not the same as consistent.** A change "may usually be realized in many different ways, all correct," yet only some conform to the theory while others are "unintegrated patches." (pp. 257–258)
8. **Life, death, revival.** "The death of a program happens when the programmer team possessing its theory is dissolved. A dead program may continue to be used for execution in a computer and to produce useful results. The actual state of death becomes visible when demands for modifications of the program cannot be intelligently answered." Rebuilding the theory "merely from the documentation, is strictly impossible." (p. 258)
9. **How theory transfers.** Newcomers need "to work in close contact with the programmers who already possess the theory," which includes discussing "the relation between the program and the relevant aspects and activities of the real world." (p. 258)
10. **Method.** "…for the primary activity of the programming there can be no right method." Methods help mostly as education. (p. 259)

## Why specs now play the role Naur gave to programming

| Naur (1985) | Agentic coding (now) | For a PM in a regulated enterprise |
|---|---|---|
| Program text is a secondary product of theory building | The **spec** is the main human-written text, and agents turn it into code | The spec is the handoff. It is not the theory, so write it knowing it carries only part of what you know. |
| Text manipulation was never the dominating cost | Agents make code generation almost free | Almost all of the remaining cost and risk is in the theory: which rules, systems and people matter, and how |
| Ability 1: map the program to the world | Agents can't tell which parts of the world are relevant | **Trace** every requirement to its rule, system and owner, and say what is deliberately out of scope |
| Ability 2: justify each part | Agents can't infer intent from a list of *whats* | **Write down the why**, plus the alternatives you rejected and the reason |
| Ability 3: fit modifications to the theory | Agents will happily produce "correct" patches | **Rehearse change** before sign-off. If a likely change needs a patch, your theory has a gap. |
| Theory transfers through close contact, not documents | Handing an agent a doc is a document-only transfer | **Sit with** compliance, operations and platform engineers. Treat docs as evidence, not the theory. |
| A program dies when its theory-holders leave | Generated code that nobody can modify intelligently is dead on arrival | Keep theory-holders **in the loop** and in control of changes as agents build |

**Where Naur would push back.** He would not accept that a better spec template can replace the theory ("there can be no right method"). He treats the theory as "inextricably bound to human beings." The practical version for teams using agents: the spec is the best projection of the theory you can hand over, and people who hold the theory still have to be there to answer questions and judge changes.

## Voice

The narration can be synthesized with any OpenRouter text-to-speech model (`/api/v1/audio/speech`). The default is `google/gemini-3.8-flash-tts`, voice `Charon`, with the delivery style "a warm, curious science-explainer narrator." Alternatives are listed in the README. The current render uses a local stand-in voice (`hexgrad/Kokoro-82M`, voice `af_heart`) because no OpenRouter key was available when it was built. Pronunciation note: *Naur* is said "NOW-er."
