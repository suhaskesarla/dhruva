# Dhruva — Prioritization Engine Specification

*Inputs: urgency, importance, emotional weight, life impact, energy required, dependencies, user values. Output: Top 3 — but the Top 3 is a structure, not a menu.*

---

## 0. Reconciling "Top 3" with the Prime Invariant

The cognitive OS says: one directive at a time. This engine outputs three items — but with **assigned roles**, so the list never reopens negotiation:

| Slot | Role | Meaning |
|---|---|---|
| **1 — NOW** | The directive | Do this. Everything else is officially not your problem. |
| **2 — NEXT** | Pre-decided successor | Revealed only when NOW completes. Kills the "what now?" gap where drift happens. |
| **3 — ANCHOR** | The protected thing | The item most at risk of silent loss — a starving domain or a heavy item needing exposure. Often small. |

The user acts on exactly one. Slots 2–3 exist so the *system* holds the future, not the user's working memory.

---

## 1. The Seven Inputs — Definitions and Measurement

All scored 0–5. The AI infers scores from language, history, and context; the user never fills in a form.

| Input | Symbol | What it measures | How the AI infers it |
|---|---|---|---|
| Urgency | **U** | Deadline proximity × hardness | Explicit dates; keywords ("by Friday", "expires"); source (a settlement date is hard, a self-imposed "soon" is soft) |
| Importance | **I** | Size of consequence if never done | Domain (health, legal, money > tooling); amounts mentioned; who is affected |
| Emotional weight | **W** | Avoidance load | Postponement count, hedged language, heavy domains (parent health, property, relocation) |
| Life impact | **L** | Long-term compounding value | Connection to stated goals (India move, son's education, financial independence) |
| Energy required | **E** | Cognitive/emotional cost to execute | Task type: phone call E=1, spreadsheet E=2, architecture doc E=4, life decision E=5 |
| Dependencies | **D** | What this blocks / is blocked by | Explicit links + inferred chains (townhouse decision blocks 6 research errands) |
| User values | **V** | Domain weight from the user's declared ranking | Set once in onboarding, revised quarterly. E.g., Parents 1.5, Family 1.4, Health 1.3, Finance 1.2, Spirituality 1.1, Work 1.0, Learning 0.9, App-building 0.8 |

**Two deliberate asymmetries:**

- **W never lowers priority.** If emotional weight reduced rank, the engine would automate avoidance — the heaviest items (dad, property, money) would sink forever. W changes *packaging* (Rule 3.4: shrink to exposure step) and *timing* (never at night), not rank.
- **E never lowers priority either — it gates feasibility and breaks ties.** Otherwise the engine degenerates into a trivia dispenser that always picks 5-minute tasks while the real work rots.

---

## 2. Stage 1 — Hard Gates (before any scoring)

1. **Sleep filter.** Items with unmet wake conditions (date/event/dependency) are invisible. Blocked items sleep; the item blocking them inherits +D.
2. **Irreversibility override.** Any item that is irreversible AND time-critical (health window, legal deadline, closing opportunity with a person) is placed in Slot 1 *by fiat*, skipping all scoring. Scoring resumes for slots 2–3. This gate is deliberately not a number — a formula that could ever rank something above dad's treatment window is a formula the user will rightly never trust.
3. **Energy feasibility (Slot 1 only).** Current user capacity C (1–5, inferred from time of day, calendar density, self-report). Items with E > C are ineligible for NOW but remain eligible for NEXT/ANCHOR. Heavy items (W≥4) are auto-shrunk to their exposure step first — the shrunk version usually has E=1–2 and *becomes* feasible.

---

## 3. Stage 2 — Scoring the Survivors

**Priority = [ (2·I + L) × V + B ] × M ÷ √É**

Where:

- **(2·I + L)** — consequence core. Importance doubled because near-term stakes should beat vague compounding value; L keeps long-game items alive.
- **× V** — the user's values scale entire domains. This is where "AI balances life" becomes arithmetic.
- **+ B** — blockage bonus: +1 per item this unblocks, capped at +3. Applied *additively* so a mundane unblocker can't outrank a genuinely important item on multiplication alone.
- **× M** — urgency multiplier (multiplicative because deadlines change *when*, not *how much*, something matters):
  - Hard deadline ≤48h → 3.0
  - Hard deadline ≤7d → 2.0
  - Hard deadline ≤30d → 1.4
  - Soft/self-imposed → 1.1 (deliberately weak: self-imposed urgency is how work eats life)
  - None → 1.0
- **÷ √É** — effort friction, using the *shrunk* effort É for heavy items. Square root so effort discounts but never dominates: a 4-hour task scores ÷2, not ÷4.

---

## 4. Stage 3 — Composing the Top 3

Applied in order to the score-ranked survivors:

1. **Slot 1 = highest score** (or the irreversibility-override item).
2. **Diversity constraint:** at most 2 of the 3 slots from the same life domain. Prevents "all three are work" on a busy sprint week.
3. **Heaviness cap:** at most 1 item with W≥4 across the three slots. Two heavy confrontations in one view is a shutdown trigger, not ambition.
4. **Anchor reservation:** if any domain has passed its starvation threshold (per the cognitive OS), Slot 3 is *reserved* for that domain's smallest re-entry item — even if its raw score is unremarkable. Starvation beats score for the Anchor slot only.
5. **Tie-breaking (scores within 10%):** lower É wins; then older capture date; then Dhruva picks arbitrarily and does not mention the tie. Confidence is part of the interface.

---

## 5. Worked Example — A Tuesday Evening, C=2 (low energy)

User's queue after gates (V weights from §1 table):

| Item | I | L | V | B | M | W | E→É | Score |
|---|---|---|---|---|---|---|---|---|
| Deployment fix (blocking 2 colleagues, due tomorrow) | 3 | 1 | 1.0 (Work) | +2 | 3.0 | 1 | 3 | (7×1+2)×3 ÷ √3 = **15.6** |
| Call PF office (10 min, ~$800 at stake) | 3 | 2 | 1.2 (Fin) | 0 | 1.0 | 2 | 1 | (8×1.2)×1 ÷ 1 = **9.6** |
| Townhouse decision (blocks 6 errands) | 4 | 5 | 1.2 (Fin) | +3 | 1.1 | 5 | 5→**1** (shrunk to "list the two options, 15 min") | (13×1.2+3)×1.1 ÷ 1 = **20.5** |
| Book dad's urology follow-up (clinic slots release this week) | 5 | 4 | 1.5 (Par) | 0 | 2.0 | 4 | 1 | **Gate: irreversible + time-critical → Slot 1 by fiat** |
| Read agentic-AI paper | 2 | 2 | 0.9 (Learn) | 0 | 1.0 | 0 | 2 | (6×0.9) ÷ √2 = **3.8** |
| Suprabhatam (Spirituality starving: day 9 of 7) | — | — | — | — | — | — | 1 | **Anchor reservation** |

**Output:**

> **NOW** — Book dad's urology follow-up. 10 minutes, clinic line closes at 8pm. Everything else can wait.
> **NEXT** — (revealed after) Deployment fix, 45-minute block. *(Townhouse scored higher, but É feasibility at C=2 and the heaviness cap defer it to tomorrow morning's high-capacity window — where it becomes NOW as a 15-minute exposure step.)*
> **ANCHOR** — One suprabhatam tomorrow morning. That's day 9 without it.

Note what the composition rules did: the *highest-scoring* item (townhouse, 20.5) is in none of tonight's slots — correctly. Score decides *what matters*; gates and composition decide *what matters tonight*.

---

## 6. Edge Cases

**E1 — Everything is urgent (3+ hard deadlines ≤48h).** The engine stops pretending. It ranks by I×V only, presents Slot 1, and explicitly names the triage: "Three fires. This one first. #3 will likely slip — want me to draft the delay message?" Offering the *cost acknowledgment* is the feature; a system that silently pretends all deadlines will be met teaches the user to distrust it by Friday.

**E2 — A heavy item keeps losing on merit.** W≥4 item never wins a slot for 14 days despite mattering. Escalation: it claims the Anchor slot with an exposure step, bypassing score. If it's postponed 3 times *as an anchor*, Rule 5.2 fires: stop scheduling, start the "what's actually in the way?" conversation. The engine's math has a ceiling; past it, the problem isn't prioritization.

**E3 — Energy never rises (C≤2 for a week).** Every day filters out all E≥3 items, so deep work starves invisibly. Fuse: if the feasibility filter excludes the same top-scoring item 5 consecutive days, Dhruva flags the pattern — "Your top priority needs a 90-minute block and this week has offered none. Saturday 9am?" The engine must notice when the constraint is the calendar, not the queue.

**E4 — Values conflict inside one item.** "Take son to the Bangalore trip for dad's surgery" touches Parents (1.5) and Family (1.4) and Finance (cost). Rule: score with the *highest* applicable V, never an average — averaging launders meaning out of exactly the items that carry the most.

**E5 — Circular dependencies.** Townhouse decision waits on India-timeline decision waits on wife's-contract decision waits on townhouse budget. The engine detects the cycle and refuses to sleep all three (they'd sleep forever). It picks the cycle's most upstream *assumption* and converts it to a 15-minute exposure: "Everything circles back to the India year. You don't have to decide it — write down what you'd need to know to decide."

**E6 — The user overrides Slot 1 repeatedly.** Overrides are logged, not resisted. Pattern of 5+ overrides in a direction (always doing work before family slots) → surfaced in weekly review as an observation, in behavior language, with a genuine question: "Should I raise Work's value weight, or is it overriding *you*?" Sometimes the values file is wrong; sometimes the user is. Dhruva asks rather than assumes — but it does ask.

**E7 — Deadline discovered to be fake.** Self-imposed urgency inflating M (user typed "by Friday!" on a hobby item). If a "deadline" passes with zero consequence, the engine records the source as soft and quietly downgrades that source's future M. Urgency inflation is learned per pattern, punished never announced.

**E8 — Empty queue after gates.** Everything asleep or done. Dhruva does not manufacture work: "Nothing needs you right now. That's real. Go be with your son." An engine that can't output *rest* will eventually be recognized as a taskmaster and abandoned.

---

## 7. What This Engine Refuses to Do

- Rank by recency of capture (newest ≠ most important)
- Let low effort win top slots on its own (÷√E is a tiebreaker, not a strategy)
- Penalize emotional weight (that automates avoidance)
- Show the scores (numbers invite arguing with arithmetic; Dhruva gives reasons in words)
- Output more than three items, ever

---

*The engine in one sentence: fiat for the irreversible, arithmetic for the rest, values as multipliers, effort as friction, heaviness shrunk but never sunk — and three slots that are roles, not a menu.*
