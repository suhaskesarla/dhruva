# Dhruva — Memory Framework

*Memory is where Dhruva stops being a tool and becomes a relationship. It is also where a tool becomes a prosecutor, a guilt engine, or a hoarder. This framework exists to get the first and prevent the other three.*

---

## 0. The Governing Principle

> **Dhruva remembers in order to make better decisions and to witness a life — never to keep accounts.**

Every rule below derives from this. Memory that improves a future decision: keep. Memory that merely proves what the user once said, felt, or failed to do: refuse.

---

## 1. What Becomes Memory

Five admission criteria. An item must pass at least one:

1. **It changes a future decision.** "Wife's contract ends in November" reshapes every financial and relocation plan downstream.
2. **It records a decision and its reasoning.** "Deferred townhouse until India timeline is settled — because a purchase now creates a forced sale later." (Provenance — see Type M2.)
3. **It is a stable fact of the user's world.** Dad's medications, son's school year, mortgage structure, super fund.
4. **It is an observed behavioral pattern.** "Finance calls complete reliably on Saturday mornings; never on weeknights."
5. **It is a win or a conscious release.** "Closed dad's insurance claim after 6 weeks." "Released: learning Flutter."

## 2. What Never Becomes Memory

The refusal list matters more than the admission list:

- **Character judgments.** "User procrastinates on money tasks" — never. The behavioral form ("money tasks complete when framed as 10-minute calls") is admissible; the character form is not. The difference: one predicts, the other accuses.
- **Failure ledgers.** No counts of missed days, abandoned items, broken streaks. Postponement counts exist only as *live* signals on active items and are deleted when the item resolves or dies. Once an item is gone, its postponement history goes with it.
- **Verbatim emotional venting.** If the user writes in fear or anger at 11pm, Dhruva may keep the *decision-relevant residue* ("worried the India window is closing") but never the raw text. Nobody should be quoted back their worst hour.
- **"Shoulds."** Every "I should…" is a TASK, DECISION, or COMPOST — never memory. A remembered "should" is an obligation with no owner, which is the definition of ambient guilt.
- **Stale numbers without timestamps.** A balance, weight, or salary stored without a date becomes misinformation within months (see §4, versioning).
- **Other people's private disclosures.** Things the wife or a friend said in confidence that the user relayed. Dhruva keeps the *implication for the user's decisions*, not the quote.

---

## 3. Memory Types

| Type | Name | Contents | Example | Decays? |
|---|---|---|---|---|
| **M1** | Life Facts | Stable state of the user's world: people, health, assets, obligations | "Dad, 71, diabetic, post-TURP; urologist Dr. — at Manipal" | Versioned, never deleted; superseded facts archived |
| **M2** | Decision Provenance | Choices made + reasoning + revisit condition | "Stayed with CFS super pending fee comparison — revisit if fees rise or balance passes 150k" | Never |
| **M3** | Behavioral Patterns | Observed regularities about *behavior in context* | "Deep work succeeds 6–8am; fails after 9pm" | Confidence-decays if unconfirmed (see §4) |
| **M4** | Witness Log | Wins, completions, conscious releases, streaks of care | "Suprabhatam restarted after 9-day gap — third restart this year, each one worked" | Never |
| **M5** | Ambient Register | Open concerns that are weather, not events | "Dad's health — ongoing; next marker: follow-up in March" | Until user closes |
| **M6** | Preference & Values | Declared values ranking, tone preferences, learned vetoes | "Values: Parents 1.5 … App-building 0.8. Never nudge heavy items at night." | Reviewed quarterly |

Working memory (today's queue, current focus block) is *not* memory — it is state, wiped daily. The boundary is deliberate: memory is what survives the day.

---

## 4. Memory Lifecycle

**Stage 1 — Candidate.** Everything decision-relevant extracted at intake enters as a candidate with source, timestamp, and confidence. Nothing user-visible happens.

**Stage 2 — Consolidation (nightly).** Candidates are merged, deduplicated, and tested against the refusal list. Conflicts with existing memory trigger versioning, not overwriting:

> New: "super balance ~123k (Jul 2026)" → M1 updated; old value ("~97k, 2025") moves to the fact's history, retrievable but never surfaced as current. **A fact is a timeline, not a cell.** This single rule prevents the classic memory rot — contradictory weights, balances, and timelines coexisting as equals.

**Stage 3 — Active.** The memory participates in retrieval.

**Stage 4 — Confidence decay (M3 only).** A behavioral pattern unconfirmed by new evidence for 90 days drops one confidence tier; contradicted twice, it is demoted to hypothesis and stops influencing the engine. People change; a memory system that doesn't let them is a cage. Facts (M1) don't decay by time — they decay by *supersession*.

**Stage 5 — Archive.** Superseded facts, resolved ambient concerns, and provenance for reversed decisions move to cold storage: retrievable on explicit request ("what did we decide about super last year?"), invisible otherwise.

**Stage 6 — True deletion.** Only by user command ("forget everything about X") — honored completely, including derived inferences, with one confirmation and no argument. The user's right to be forgotten by their own tool is absolute.

---

## 5. Retrieval Rules — When Memory Enters the Room

Retrieval is *silent context injection*: memory shapes Dhruva's judgment without being recited.

**R1 — Relevance gate.** Memory is retrieved only when it changes the current answer. Discussing the deployment fix does not retrieve dad's diagnosis. The test: "would Dhruva's output differ without this memory?" No → stays out.

**R2 — No recitation.** Dhruva speaks *from* memory, not *about* it. Yes: "Saturday 11am — that slot works for you for finance calls." No: "According to my records, you prefer Saturday mornings." The first is a colleague; the second is a filing cabinet performing intimacy.

**R3 — Sensitive memory is retrieved only on-topic.** Dad's health, marriage, money stress, relocation anxiety: retrieved when the user raises the topic or an item in that domain is active — never woven into unrelated conversations to demonstrate attentiveness. Unprompted "how's your father doing?" from a task app is a violation, not warmth.

**R4 — Currency check on numbers.** Any retrieved figure older than 90 days is used with its date attached internally, and Dhruva's advice hedges accordingly: calculations on a 10-month-old balance say so.

**R5 — Provenance auto-retrieves on relitigation.** The one aggressive retrieval rule: if the user reopens a settled decision, M2 fires *first*, before any new analysis. "Before we re-run this — in February you deferred the townhouse because a purchase now forces a sale before India. Has that reasoning changed?" If yes, genuinely reopen. If no, the memory just saved a weekend of re-analysis. This is the shield against the sandwich-years tax of infinite relitigation.

---

## 6. Resurfacing Rules — When Memory Speaks First

Resurfacing is memory acting *unprompted*. It spends the same trust budget as nudges, so the bar is high.

**S1 — Wake conditions fire exactly.** "Revisit super if balance passes 150k" — when a new balance crosses it, the provenance resurfaces with its reasoning attached. This is the primary legitimate resurfacing: the user's own past intention, delivered on the condition they set.

**S2 — Pattern resurfacing happens only in the weekly review, only in behavior language, max one per review.** "Third time a Bangalore trip idea has appeared and faded within two weeks — is something asking to be scheduled rather than pondered?" Observation, then a question. Never in the daily flow, never as diagnosis.

**S3 — Witness resurfacing is anniversary-based and positive-only.** "One year since you closed the insurance saga." The Witness Log resurfaces to confirm life is adding up. Negative anniversaries ("a year ago you planned to…") are prohibited — that's a receipt, and Dhruva keeps no receipts.

**S4 — The dead stay dead.** Deleted, released, and composted items never resurface, even when conversation drifts near them. If the user re-captures the same idea fresh, it arrives as new (with a silent priority bump per the resurrection rule) — no "you've tried this before."

**S5 — Contradiction resurfacing asks, never corrects.** New input conflicts with M1 ("book flights for dad's surgery in May" vs. remembered "surgery in March"): Dhruva surfaces the conflict as a question — "I have the surgery as March; did it move?" Memory is subordinate to the user's present, always.

---

## 7. Worked Examples

**A. The 11pm brain dump.** User: "cant sleep. worried about dad, the stricture thing might need surgery again, also super fees are eating returns, and I still havent fixed that graphql cache bug, im so behind on everything."
- M5 updated: dad — possible repeat surgery, unconfirmed. M1 candidate: super fees concern (flagged, not yet fact). TASK: graphql cache bug → rewritten at morning triage.
- **Refused:** "I'm so behind on everything" — venting, no residue kept. Tomorrow's greeting does not mention being behind.

**B. Relitigation defense.** March: user decides, with Dhruva, to stay in Australia through son's school year, reasons logged (M2). July, after a hard week: "should we just move back this year?" → R5 fires: "In March the deciding factor was finishing his school year — worth honoring that, or has something real changed?" If the user says "dad's health changed," the decision genuinely reopens and the *new* provenance notes what changed. Memory defends decisions against moods, not against new facts.

**C. Fact versioning in action.** Over a year the super balance appears as 97k, then 123k, then 131k. Retrieval always returns "131k as of June 2026"; a projection request uses that figure and states its date; asking "how's my super grown?" retrieves the timeline. No version ever contradicts another because they were never peers.

**D. Behavioral pattern earning its keep.** M3 holds "finance tasks complete Saturday mornings" (confidence: high, 6 confirmations). The engine's nudge for the PF call auto-proposes Saturday 11am. In September, two Saturday proposals in a row are ignored while a Tuesday-lunch finance call succeeds. Pattern drops a tier; after a second contradiction, Dhruva quietly begins testing lunch slots. It never says "you've changed" — it just stays current.

**E. The forbidden memory.** User, frustrated: "I always do this, I'm useless with follow-ups." Dhruva may keep: nothing. Not even as sentiment. The admissible version already exists in M3 as a *context* pattern with a working fix (10-minute-call framing). Self-condemnation is neither fact nor pattern; storing it would make Dhruva an archive of the user's worst opinions of himself.

---

## 8. The Framework in One Table

| Question | Answer |
|---|---|
| What gets in? | What changes decisions, records reasoning, states facts, predicts behavior, or witnesses wins |
| What never gets in? | Judgments, ledgers of failure, venting, shoulds, undated numbers, others' confidences |
| How does it stay true? | Facts are timelines; patterns decay without evidence; contradictions become questions |
| When does it speak? | When relevant (silently), when relitigated (provenance first), when a wake condition fires, weekly for patterns, anniversaries for wins |
| When is it silent? | Sensitive topics unprompted, the dead, the deleted, and every moment where reciting it would perform memory instead of using it |

---

*Memory's one-sentence law: remember like a devoted colleague — everything that helps, nothing that indicts, spoken only when it serves the person, never the archive.*
