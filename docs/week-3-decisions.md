# Dhruva — Week 3 decisions (W3-A1–A15)

18 September 2026. This file governs the fifteen W3-A questions raised in `Dhruva-Week-3-File-and-Function-Plan.md`. It sits alongside `docs/week-1-decisions.md` (B1–B5) and `docs/week-2-decisions.md` (W2-A1–A9), which are **not reopened**. `BUILDING-Addendum-v1.md` continues to override `BUILDING.md` on its eight decisions; `BUILDING.md` governs the remainder.

Each decision below is final for Week 3. Where a decision defers something, the deferral is explicit and must be recorded as such in code and tests — never implemented partially or silently passed.

---

## W3-A1 — No fourth Gemini call

**Decision.** Nightly consolidation makes **no Gemini request**. Call A already emits `destiny='memory'` candidates into `messages.intake_results`; consolidation validates, versions and admits those, plus M3/M4 rows supported by **deterministic event evidence** (for example a restart derived from a domain gap followed by a `completed` event).

Consolidation must **not** claim arbitrary new M3 behavioural inference. A pattern is admissible only if it is either a submitted Call-A candidate or computable from `item_events` by explicit code.

**Why.** Keeps BUILDING's "exactly three Gemini jobs" true, makes the nightly job deterministic and cheap, and keeps the nightly failure profile free of model-availability risk.

**Downstream.** `gemini.ts` gains no fourth export. W3-09's admission path reads `intake_results` only. W3-13's pipeline makes no network call.

---

## W3-A2 — 30-minute UTC dispatch with local-window identity

**Decision.** Cron routes are invoked **every 30 minutes UTC**. Each handler no-ops unless the current local time matches its configured window. Hourly dispatch is rejected: it cannot reach a 17:30 local window.

Windows (user's configured IANA timezone): nightly **02:00**, nudge **09:00** and **17:30**.

Each executed window carries a unique local identity of the form `2026-09-18/17:30`, used for deduplication (see W3-A14).

**Why.** UTC-scheduled dispatch with a local-window guard handles DST without seasonal schedule maintenance, and 30-minute granularity makes half-hour windows reachable.

**Downstream.** `vercel.json` schedules all three routes at 30-minute intervals. `schedule.ts` owns window resolution and window identity. W3-05's tests cover both DST transitions and the 17:30 reachability case specifically.

---

## W3-A3 — Budget consumed atomically at insert

**Decision.** The `nudges` row, the proactive `messages` row and budget consumption commit **atomically**. A later push failure does **not** refund budget — the message is in chat, so the unprompted contact exists.

Composition or insertion failure consumes nothing.

Normal 3-hour spacing is measured from **any inserted unprompted contact**, nudge or alert. Gate-1 alerts may bypass the pre-send spacing gate.

Budget day resets at **local midnight** in the configured timezone.

**Why.** Budget tracks contacts made, not notifications delivered. An inserted message the user will see on next open is a contact whether or not push succeeded.

**Downstream.** W3-18 commits all three writes in one transaction. `app_state.nudge_budget_today` keys on the local budget day. Tests prove a duplicate invocation in the same window consumes budget exactly once, and that push failure neither rolls back nor refunds.

---

## W3-A4 — Starvation episodes keyed on meaningful attention

**Decision.** A starvation episode is identified by `domain_id + episode_started_at`, where `episode_started_at` is derived from the **last meaningful domain-attention event**, not from an unrestricted timestamp.

Meaningful attention is the same enumerated set defined in W3-A10 (`last_user_touched_at`): Start, Done, Postpone, Keep, or an explicit user edit on an item in that domain. Automated events (`woken`, `slept`, `classified`, `decayed`, `hospiced`) never end an episode.

Both `domain_id` and `episode_started_at` are stored on the `nudges` row so episode identity is durable and auditable.

**Why.** T4 fires once per starvation event, not once per day of starvation. Deriving the episode from an unrestricted timestamp would let automated maintenance silently end an episode and re-arm the nudge.

**Downstream.** W3-06 adds the two columns. W3-14's tests prove T4 fires once per episode across many ticks, and that an automated event does not re-arm it.

---

## W3-A5 — Trigger fingerprint, no time-based repeat allowance

**Decision.** Repetition is prevented by a **trigger fingerprint**: `item_or_domain_id + trigger_kind + trigger_state`. The same item and trigger may speak again **only when material trigger state changes**.

Material change means:
- **T2** — crossing into a *tighter* urgency tier (per the Week 2 multiplier table), not any `due_at` edit.
- **T4** — a new starvation episode per W3-A4.
- **T1** — a distinct wake firing.

There is **no** time-based repeat allowance. The 14-day window originally proposed is rejected: after 14 days, unchanged information is still a repeat, and N2 forbids repetition without new information regardless of elapsed time.

Body similarity checking is not implemented; fingerprint identity is the mechanism.

**Why.** N2 is about information, not intervals. A time window would license exactly the nagging the framework exists to prevent.

**Downstream.** W3-16's guard implements fingerprint deduplication. The fingerprint is stored on the `nudges` row (W3-06). Tests prove an unchanged trigger stays silent indefinitely, and that a tightened deadline tier legitimately re-arms.

**Known consequence, accepted.** A domain that is never touched receives exactly one starvation nudge per episode, and if attention never arrives the episode never ends — so it speaks once and then stays silent. This is the literal meaning of "once per starvation event." A long-starved domain therefore surfaces only in the weekly review's Movement 2 (Week 4). Silence is load-bearing here by design.

---

## W3-A6 — Heaviness filter reuses Week 2 capacity, and wins over trigger priority

**Decision.** The nudge tick reuses the Week 2 `estimateCapacity` table. Items with `emotional_weight >= 4` qualify only at capacity **4 or above** — so the 09:00 window (capacity 5) can carry them and 17:30 (capacity 3) cannot.

If a heavy item is the only qualifying trigger and the window is closed, the outcome is **`NO_NUDGE`**. The tick does **not** fall through to a lower-priority trigger. The heaviness filter wins over trigger priority.

A heavy item with no stored `exposure_step` also yields `NO_NUDGE`, consistent with W2's rule that it cannot be NOW.

**Why.** Rule 5.5 exists to prevent a heavy item landing at a low-capacity moment. Falling through to a lesser trigger would convert a protective rule into a reason to say something else, which spends the same trust budget for less.

**Downstream.** W3-15's preconditions apply the filter before trigger evaluation completes. Tests prove the 17:30 window yields `NO_NUDGE` rather than substituting a different item.

---

## W3-A7 — N5 is inapplicable this week

**Decision.** N5 (no same-day follow-up after a missed slot) is **not implemented** in Week 3, and this is recorded as a deliberate absence rather than an omission. W2-A5 deferred scheduled slots entirely, so no "missed slot" state exists to cool down from.

Skip is **not** reinterpreted as a miss. W2-A2 deliberately separated Skip from Postpone; it acquires no second meaning here.

**Why.** N5 cannot be implemented honestly without the slot subsystem. Approximating it from Skip or `postponed` would create a cooldown the user never triggered.

**Downstream.** W3-15 contains no N5 check. `docs/week-3-acceptance.md` records the absence explicitly. Revisit when scheduled slots land.

---

## W3-A8 — Outcomes attributed only to user-originated responses

**Decision.** `nudges.outcome` is set only by a **user-originated action attributable to that nudge** — not by any `item_events` row that happens to land within 48 hours.

| Outcome | Set by | Act-rate contribution |
| --- | --- | --- |
| `acted` | Done on the nudged item | Positive |
| `dropped` | Drop on the nudged item | **Positive** — the honorable exit is the product working |
| `dismissed` | Shelf on the nudged item, or an explicit dismiss | Positive |
| — | Postpone on the nudged item | Tracked **separately**; neither positive nor `ignored` |
| `ignored` | No attributable response after 48 hours | Negative |

**Why.** Nudge framework §7 treats "drop it" as a success. Recording it as a non-action would throttle the system for behaving exactly as designed. Postpone is genuine engagement but not resolution, so it distorts the rate in either bucket and is kept apart.

**Downstream.** W3-22's `summarizeNudgeActRate` implements this table. Tests prove drop is not recorded as a failure, postpone lands in neither bucket, and transport retries cannot inflate the denominator. Absent evidence reports `null`, never zero.

---

## W3-A9 — Structured confirmation and contradiction, plus `as_of`

**Decision.** Add to `memories`: `last_confirmed_at timestamptz?`, `confirmations int DEFAULT 0`, `contradictions int DEFAULT 0`, and `as_of date?`.

Confirmation and contradiction matching uses **structured memory identity**, not literal content comparison or unrestricted opposite-meaning inference: match on `mtype + fact_key (or pattern_key) + normalized domain/context`. Week 3 limits M3 confirmation and contradiction to evidence the code can determine reliably.

`valid_from` records when the fact was **learned**. `as_of` records when it was **true**, and is NULL when unknown.

**Why.** Decay requires evidence the original schema never declared. Structured identity is implementable deterministically; semantic opposition is not, and a wrong contradiction silently demotes a good pattern.

**Downstream.** W3-06 adds the four columns. W3-10 implements decay against them, or records an explicit no-op if the evidence proves insufficient in practice — never a silent pass. Retrieval (R4) hedges on any figure whose `as_of` is NULL or older than 90 days.

---

## W3-A10 — `last_user_touched_at`, not any event

**Decision.** Dormancy is measured from a new `items.last_user_touched_at`, updated **only** by these enumerated user actions: **Start, Done, Postpone, Keep, or an explicit user edit** of the item.

Automated events — `classified`, `woken`, `slept`, `decayed`, `hospiced`, `scheduled` — **never** reset dormancy.

Also add `items.hospice_at timestamptz?` and `items.hospice_shown_in_review_id uuid?` so Week 4 can honor "shown once, then quiet death" without retrofitting Week 3.

**Why.** Resetting dormancy on any `item_events` row would keep abandoned items alive forever — automated maintenance events alone would prevent hospice from ever firing, defeating the subsystem for precisely the items it exists to catch.

**Downstream.** W3-06 adds all three columns. W3-11 reads `last_user_touched_at`, not `updated_at` or event recency. Tests prove an item touched only by automated events reaches hospice on schedule, and that `irreversible=true` remains provably exempt in both SQL and code.

---

## W3-A11 — Provisional mode: Now continues, proactive tick is Gate-1 only

**Decision.** During provisional authority:

- **User-requested Now suggestions continue normally**, with Start/Skip, exactly as Week 2 built them. Provisional mode restricts proactive contact, not the Now experience.
- **The proactive tick may emit only Gate-1 alerts.** Other triggers are **shadow-evaluated** for logs and eligibility evidence, but must not compose a body or insert a message.
- After full-authority opt-in, all triggers compose and deliver normally.

**Gate-1 alerts** are a separate composition path. They bypass budget, spacing and the heaviness filter. They **remain allowed during survival mode** — survival mode is alert-**only**, not alert-muted — and they remain allowed during a focus block, which is the one documented interruption exception (N1/Rule 3.3).

**Why.** The addendum's trust ramp restricts unprompted contact specifically. Suppressing user-requested suggestions too would make the app inert for its first week for no reason the addendum asked for. Shadow evaluation means Week 3's trigger logic is observable and testable during the provisional period without violating it.

**Downstream.** W3-15 branches on authority mode. W3-17 gains an alert composition path distinct from nudge composition. Tests prove: no non-alert message is inserted while provisional; shadow evaluation records eligibility without composing; a Gate-1 alert survives survival mode, focus state, spent budget and spacing.

---

## W3-A12 — Memory-type-aware deterministic validation, with stamped undated numbers

**Decision.** Refusal-list validation is **deterministic code with veto**, running before admission. Model-based validation is not used (consistent with W3-A1's no-fourth-call rule).

Validation is **memory-type-aware**. Blanket rejection of `always`/`never` or of first-person phrasing is rejected as a rule, because valid facts and M6 preferences legitimately use both — "never nudge heavy items at night" is a correct M6 row, not a character judgment.

Rejection targets, scoped by type:
- Character judgments and self-condemnation (first-person trait claims, not first-person statements generally)
- Failure ledgers — counts of missed days, abandoned items, broken streaks
- Verbatim emotional venting
- "Should" framings, which are TASK/DECISION/COMPOST, never memory
- Others' relayed confidences, keeping only the decision-relevant implication

**Undated numeric facts are admitted with `valid_from` stamped and `as_of` left NULL** — not rejected, not held for clarification, and not assigned today as their historical date. This follows BUILDING §1.6's stamping rule; honesty is carried by the separate `as_of` field from W3-A9 and by R4's hedging on NULL or stale `as_of`.

**Why.** Deterministic veto keeps the nightly job idempotent (required by W3-A14). Type-awareness prevents the validator rejecting the exact preference rows M6 exists to hold. Stamping with a NULL `as_of` preserves real information while making its uncertainty explicit, where rejection would discard it and a clarification round would add friction the memory framework never asked for.

**Downstream.** W3-07 implements type-scoped validation. Tests must include: "never nudge heavy items at night" admitted as M6; "I'm useless with follow-ups" rejected; a bare balance admitted with NULL `as_of`; a missed-day count rejected.

---

## W3-A13 — One contextual permission prompt, no automatic re-prompt

**Decision.** Push permission is requested **once**, in context after setup completes (B1 deferred it to here). On denial, Dhruva **never** re-requests the OS permission automatically; a user-initiated settings path may be added later.

With no registered device, the tick **still composes and inserts** messages and **consumes budget** — the contact exists and waits in chat, per addendum decision 5's stated denial behavior.

**Why.** Repeated OS prompts are the fastest way to lose a permission permanently. Budget tracks contacts, not deliveries, consistent with W3-A3.

**Downstream.** W3-20 implements a single contextual request with denial as a valid terminal state. Tests prove no permission call occurs before setup completes, and that an unregistered device does not suppress message insertion.

---

## W3-A14 — Restart from step one, backed by database-enforced idempotency

**Decision.** A failed job **restarts from step one** on retry. This is safe only because idempotency is enforced at the database level, not by a run record alone.

Run identities:
- Nightly: `job + local_date`
- Nudge: `job + local_date + window` (per W3-A2's window identity)

In addition, **every mutation needs its own replay guard**: uniqueness constraints or transition guards on memory admission, `fact_key` versioning, decay writes, hospice transitions, wake firing and `ignored` stamping. A `consolidation_runs` row provides observability; it does not make individual writes idempotent.

**Why.** Restart is simpler than resume and correct under deterministic validation (W3-A12). But a run row alone would let a partially-completed night double-write on retry.

**Downstream.** W3-06 adds `consolidation_runs` plus the per-mutation constraints. W3-13 and W3-18 use the run identities. W3-24 proves two consecutive runs produce identical end state, and that a mid-pipeline failure followed by a restart leaves `memories` valid with no duplicates.

---

## W3-A15 — Crisis and survival detection explicitly deferred

**Decision.** No crisis or distress detection is implemented in Week 3. No regex, no language heuristic, no model check. `app_state.survival_mode` remains **manually or test-fixture controlled**: the tick reads it if set, but nothing in Week 3 sets it.

Survival mode, when set, is **alert-only, not alert-muted** — Gate-1 alerts pass through it (see W3-A11). Non-alert triggers for muted domains are suppressed.

**Why.** Detecting distress from language is a design problem requiring care, not a filter. A false positive silences the system during a normal hard week; a false negative sends a starvation nudge into a crisis. Neither is acceptable from a heuristic, and the correct activation mechanism should be designed after the review exists to observe real weeks.

**Downstream.** W3-15 reads survival state but no code writes it. `docs/week-3-acceptance.md` records the deferral. Tests use fixtures to set the state directly and prove alerts survive it.

---

## Summary of schema additions required

Consolidated for `supabase/migrations/202609080005_week3_scheduling.sql` (W3-06). Never edit an applied migration; forward-migrate only.

| Table | Addition | From |
| --- | --- | --- |
| `items` | `last_user_touched_at timestamptz?` | A10 |
| `items` | `hospice_at timestamptz?` | A10 |
| `items` | `hospice_shown_in_review_id uuid?` | A10 |
| `memories` | `last_confirmed_at timestamptz?` | A9 |
| `memories` | `confirmations int DEFAULT 0` | A9 |
| `memories` | `contradictions int DEFAULT 0` | A9 |
| `memories` | `as_of date?` | A9, A12 |
| `nudges` | `domain_id text?` | A4 |
| `nudges` | `episode_started_at timestamptz?` | A4 |
| `nudges` | `trigger_fingerprint text?` | A5 |
| `push_devices` | new table | Addendum decision 5 |
| `consolidation_runs` | new table, keyed per A14 | A14 |
| Constraints | per-mutation replay guards; `irreversible` hospice exemption | A14, A10 |

## Tickets affected

| Ticket | Change |
| --- | --- |
| W3-05 | 30-minute dispatch; window identity; 17:30 reachability test |
| W3-06 | Full schema addition list above |
| W3-07 | Type-aware validation; undated numbers admitted with NULL `as_of` |
| W3-09 | Deterministic event evidence permitted; no arbitrary M3 inference |
| W3-10 | Structured-identity confirmation matching |
| W3-11 | Reads `last_user_touched_at`; writes `hospice_at` |
| W3-14 | Episode identity from meaningful attention only |
| W3-15 | Authority branch; shadow evaluation; alert-only survival |
| W3-16 | Fingerprint deduplication, no time window |
| W3-17 | Separate Gate-1 alert composition path |
| W3-18 | Atomic nudge + message + budget commit |
| W3-22 | Drop counts positively; postpone tracked separately |
| W3-24 | Restart-with-idempotency proofs |

Unchanged as originally written: **A6, A7, A13, A15**.
