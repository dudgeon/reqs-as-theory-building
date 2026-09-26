# Specs as Theory Building, extended cut: script

**Runtime:** about 6 min 5 s, 981 narrated words in 24 scenes and 10 chapters (1080p, 30 fps).
**Source text:** Peter Naur, "Programming as Theory Building," *Microprocessing and Microprogramming* 15 (1985): 253–261. It was first given as the keynote at Euromicro 84.
**Narration source of truth:** [`narration.json`](narration.json). The `{cue}` markers there drive the animation timing. The visual design for each scene is in [`storyboard-plan.md`](storyboard-plan.md), and the frames from the actual cut are in [`storyboard/`](storyboard/README.md).

The 90-second cut ([`../specs-as-theory-building/script.md`](../specs-as-theory-building/script.md)) states the thesis and jumps to agents. This cut follows the essay section by section, since its chapters mirror Naur's sections 1–8, and then spends about 70 seconds on one idea the short cut doesn't have: loops that write back governed facts, so each new spec starts with fewer unknowns.

---

## Narration

Times are for the current stand-in voice. The last column points to the passage each line rests on. Lines marked *extension* are this video's application, not Naur's claim.

| Time | Scene (chapter) | Narration | Source |
|---|---|---|---|
| 0:03 | hook | What does a software team actually produce? Code, surely. Piles of it. In 1985, Peter Naur's answer was not the code. | Abstract, p. 253 |
| 0:12 | naur | Naur edited the ALGOL 60 report, is the N in BNF, and won the Turing Award. His essay, Programming as Theory Building, rewards a slower look. | Biography (not in the essay) |
| 0:22 | views (**1 What programming is**) | He contrasts two views. In the production view, programming produces a program and some other texts. In the theory building view, programmers form an insight, a theory, of the matters at hand. The texts are secondary. | §1, p. 253 |
| 0:35 | matching | Programming, for Naur, is matching part of a real-world activity to what a computer can do with symbols. And since the world keeps changing, it includes modifying the program to keep up. | §2, p. 253 |
| 0:47 | compiler (**2 Evidence from the field**) | A team extended another group's compiler, with full documentation, annotated code, and advice from its authors. Still, several of their proposals were patches that would have destroyed its power and simplicity. The authors saw it instantly. Ten years on, without them, the structure was still visible, but made ineffective by amorphous additions. | §2, case 1, p. 254 |
| 1:08 | monitor | Second case: a two-hundred-thousand-line monitoring system. The programmers who'd been there since its design fixed faults from what they knew and the annotated code, and couldn't imagine any further documentation that would help. Teams with full manuals kept getting stuck on problems the veterans cleared up easily. | §2, case 2, p. 254 |
| 1:28 | ryle (**3 What a theory is**) | For the kind of knowledge, Naur turns to the philosopher Gilbert Ryle. Intelligent behavior, like telling jokes or fishing, means doing things well and catching your own lapses. It isn't rule-following, or you'd need rules for applying the rules, and so on forever. Having a theory goes further: you can explain what you do, answer questions, and argue about it. | §3, pp. 254–255 |
| 1:49 | newton | A theory isn't just its laws. Having Newton's theory means seeing how it applies to pendulums and planets, and recognizing similar cases. That kind of similarity can't be put into rules, any more than the likeness of faces or tunes. So a theory can't be fully written down. | §3, p. 255; §6, p. 258 |
| 2:07 | abilities (**4 What the theory makes possible**) | A program's theory is how certain affairs of the world will be handled by it. Its holder can do three things no document can. Explain how each part maps to the world, including which parts of the world matter at all. Justify why each part is as it is. And meet a request for change by seeing how it resembles what's already there. | §4, pp. 255–256 |
| 2:26 | cost (**5 Change and decay**) | We expect change to be cheap because a program is text, and text is easy to edit. Naur calls that argument false: text was never the main cost. Altering a building can cost more than rebuilding it. And built-in flexibility costs money now, for needs that may never come. | §5, pp. 256–257 |
| 2:44 | decay | Any change can be made many ways, all correct. Some extend the theory. Others are patches. Only someone with the theory can tell which. That's how programs decay. Even simplicity and good structure only make sense against the programs that could have been written instead. | §5, pp. 257–258 |
| 3:01 | life (**6 Life, death and revival**) | So a program is alive while a team holding its theory controls its changes. It dies when that team dissolves, even if it keeps running. The death shows when requests for change can't be answered intelligently. | §6, p. 258 |
| 3:14 | revival | Rebuilding the theory from code and documents alone is, Naur says, strictly impossible. He'd rather a new team solved the problem afresh. A theory is passed on the way music is taught: by working closely with people who have it. | §6, pp. 258–259 |
| 3:28 | method (**7 Method and the programmer**) | Can a method stand in for it? A method is a set of work rules: steps, order, notations, documents. But a theory has no inherent parts or order. So there is no right method, though methods help as education. | §7, pp. 259–260 |
| 3:42 | status | And programmers aren't replaceable parts on a production line. They're responsible, permanent developers of the activity the computer is part of, with the standing of engineers and lawyers. | §8, pp. 260–261; §9 |
| 3:53 | agents (**8 Specs, in the age of agents**) | Now agents write the code, and text really is nearly free. On Naur's argument, the cost hasn't gone. It has moved to specifying. An agent dropped into a codebase with only code and documents is attempting what Naur called revival. Its picture of the system can differ from the original. So the spec is the handoff, and writing it is where the theory gets built. The agent gets the spec. You keep the theory. | *Extension*, resting on §5, p. 257 and §6, p. 258 |
| 4:19 | enterprise | In a regulated enterprise, that theory is scattered: a rule buried in policy, a platform quirk one engineer knows, a constraint nobody says out loud. Requirements gathering is theory building. | *Extension* |
| 4:32 | scratch (**9 Loops that compound**) | But if each spec starts from scratch, each team rediscovers the same rules, quirks and owners. Longer documents won't fix that. A loop will. | *Extension* |
| 4:41 | loop | Each piece of product shaping runs a loop: discover what's true, verify it with the people who own it, specify, build with agents, and learn from what building reveals. Then it writes back what it learned, as governed facts. | *Extension* |
| 4:55 | governed | A governed fact cites its source, names an owner who vouches for it, carries a date, and says whether it's verified or still assumed. Decisions keep their reasons. | *Extension* |
| 5:05 | compound | The next loop starts from those facts. An adjacent feature inherits most of them. An unrelated one still reuses the rules, platforms and people they share. Each loop has fewer unknowns to resolve, so it moves faster, and what's left is the work that needs judgment. And when a rule changes, you can see every spec that relied on it. | *Extension* |
| 5:26 | naurloop | This works with Naur, not around him. Facts aren't the theory, but they're what it's built on. And the loop keeps the people who hold the theory in it, verifying and deciding. That's what keeps a product alive. | *Extension*, checked against §6, p. 258 |
| 5:39 | takeaways (**10 Takeaways**) | So: trace every requirement to a governed fact. Write down the why, and what you rejected. Rehearse change: does a new rule fit, or need a patch? Close each loop by writing back what you learned. And keep the theory's holders in the loop as agents build. | §4 (map, justify, adapt); *extension* |
| 5:53 | close | Code is the output. The spec is the handoff. Governed facts are the memory. The theory is the product. | |

---

## What Naur actually argued, and how the script stays faithful

Page numbers refer to the 1985 journal printing. The quotations are kept short. Read the essay itself for the full passages.

1. **Two views.** Naur opposes the common notion of programming as "a production of a program and certain other texts" to programming as the programmers forming "a certain kind of insight, a theory, of the matters at hand." Documentation is "an auxiliary, secondary product." (p. 253)
2. **Matching and modification.** His subject is "matching some significant part and aspect of an activity in the real world to the formal symbol manipulation that can be done by a program running on a computer," and it therefore includes program modifications as the world changes. (p. 253)
3. **Case 1, the compiler.** Group B had full documentation, annotated program texts, written design discussion and personal advice from group A. Still, in several major cases, their suggestions were patches that "effectively destroyed its power and simplicity," and group A spotted them instantly. About ten years later, without group A, "the original powerful structure was still visible, but made entirely ineffective by amorphous additions of many different kinds." (p. 254)
4. **Case 2, the monitoring system.** Each installation was about 200,000 lines. Its installation and fault-finding programmers had worked on it full time since the design. They relied almost entirely on their own knowledge and the annotated text, and could not conceive of additional documentation that would help. Other groups with documentation and full guidance regularly hit difficulties those programmers cleared up easily. (p. 254)
5. **Ryle.** Intelligent behaviour, such as making jokes, talking grammatically or fishing, means doing things well and being able to detect and correct lapses. It does not depend on following rules; if it did, there would have to be rules about following rules, "in an infinite regress, which is absurd." Having a theory goes further: the knowledge needed "to explain them, to answer queries about them, to argue about them." (p. 255)
6. **Newton and similarity.** Having Newton's mechanics requires more than the central laws: seeing how they apply to pendulums and planets, and recognizing similar phenomena. Such similarities cannot be expressed in criteria, any more than those of "human faces, tunes, or tastes of wine." (p. 255) Later: the theory "could not conceivably be expressed, but is inextricably bound to human beings." (p. 258)
7. **The three abilities.** The theory is "of how certain affairs of the world will be handled by, or supported by, a computer program" (p. 255). Its holder can explain how the solution maps to the world, including which parts of the world are relevant; justify each part; and respond to a demand for modification by perceiving its similarity to existing facilities. (p. 256)
8. **Cost.** Cheap modification would require "that the dominating cost is one of text manipulation… On the Theory Building View this whole argument is false." Buildings are often cheaper to demolish and rebuild than to alter, and flexibility is paid for now for usefulness that "depends entirely on future events." (p. 257)
9. **Decay.** A modification can be made "in many different ways, all correct," some extending the theory, others "unintegrated patches." Only the holder of the theory can tell them apart. Simplicity and good structure are judged against programs that "exist only as possibilities in the programmer's understanding." (pp. 257–258)
10. **Life, death, revival.** A program lives while a team holding its theory controls its modifications. It dies when that team is dissolved, although "a dead program may continue to be used for execution in a computer and to produce useful results." Revival from the documentation is "strictly impossible," and may yield a theory that differs from the original. Naur would rather the new team "solve the given problem afresh." Newcomers need "to work in close contact with the programmers who already possess the theory," learning the way one learns to play an instrument. (pp. 258–259)
11. **Method.** A method is "a set of work rules for the programmers": what to do, in what order, with which notations and documents. A theory has "no inherent division into parts and no inherent ordering," so "there can be no right method." What remains is methods' value in education. (pp. 259–260)
12. **Status.** The programmer is not "an easily replaceable component" but "a responsible developer and manager of the activity in which the computer is a part," with a permanent position like "engineers and lawyers." (pp. 260–261)

### Fidelity fixes made before synthesis

After the first draft, the whole essay was re-read against the script. Six lines changed:

| Draft | Final | Why |
|---|---|---|
| "their proposed extensions were patches" | "several of their proposals were patches" | Naur says "in several major cases," not all |
| "the design was still visible, buried under amorphous additions" | "the structure was still visible, but made ineffective by amorphous additions" | Naur's words are "made entirely ineffective," not buried |
| "…monitoring system, the programmers who'd been there…" | a sentence break, and "any further documentation" | Naur says they could not conceive of *additional* documentation |
| "argue for it" | "argue about it" | Ryle, via Naur: "to argue about them" |
| "Newton's theory means seeing…" | "Having Newton's theory means seeing…" | The claim is about what having the theory requires |
| "Facts… they're what it's built from" | "…what it's built on" | A theory is not made of facts; facts are the ground it is built on |

### Compressions to know about

- "Naur edited the ALGOL 60 report, is the N in BNF, and won the Turing Award" is biography, not the essay: the *Report on the Algorithmic Language ALGOL 60* (1960, Naur editor), Backus–Naur Form, and the 2005 A.M. Turing Award.
- "Extended another group's compiler" compresses group B's task: a compiler for L + M, a modest extension of L, for a different computer, starting from group A's compiler for L.
- "The way music is taught" compresses Naur's comparison with learning "writing and playing a music instrument."

## Where this cut goes beyond Naur

Naur wrote about programmers and programs. Everything from the agents chapter on applies his argument to people who write specs for coding agents. The script labels it as an application ("on Naur's argument", "this works with Naur, not around him").

- **The cost moved to specifying.** It rests on §5: if text was never the dominating cost, making text free doesn't remove the cost.
- **Agents as revival.** An agent that gets only code and documents is in the position Naur calls revival. His warning that a revived theory "differs from the one originally had by the program authors" (p. 258) is why the spec, and the people behind it, matter.
- **Loops and governed facts.** This is the video's own proposal, not Naur's. Each piece of product shaping discovers, verifies with the people who own the facts, specifies, builds with agents and learns. It then writes back what it learned as governed facts: each cites a source, names an owner, carries a date and says whether it is verified or assumed, and decisions keep their reasons.
- **Where Naur would push back, and how the loop answers.** Naur would reject any claim that a store of facts is the theory, or that the loop is "the right method." The script says the opposite: facts aren't the theory but what it's built on, and the loop keeps the theory's holders in it, verifying and deciding. In Naur's terms, the loop is a way to keep a program alive (§6), not a method that replaces the people (§7).

## Voice

As for the 90 s cut, the narration can be synthesized with any OpenRouter text-to-speech model. The default is `google/gemini-3.8-flash-tts`, voice `Charon`. The current render uses the local stand-in, `hexgrad/Kokoro-82M` (`af_heart`), at about 176 wpm, because no OpenRouter key was available. A slower hosted voice makes the video longer; at about 155 wpm it would run about 7 minutes. Pronunciation: *Naur* is "NOW-er", *Ryle* is "rile".
