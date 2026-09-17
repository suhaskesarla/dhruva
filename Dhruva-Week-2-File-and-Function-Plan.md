# Dhruva — Week 2 file-and-function plan

Planning draft updated with owner decisions W2-A1–A9, 8 September 2026. No implementation or migration is included. Week 1 is a prerequisite specification, not a verified completed repository. Ticket dependencies below still apply even though this plan is being written ahead of implementation.

## 1. Confirmed prioritization authority — before signatures

**BUILDING-Addendum-v1.md decision 1 explicitly chooses `dhruva-prioritization-engine.md`'s normative mechanism.** Implement sleep filtering, the irreversible-and-time-critical NOW override, NOW energy feasibility, survivor scoring and Top 3 composition. Blockage is an additive score bonus. Starvation reserves **ANCHOR**, not automatic precedence for NOW. The cognitive OS/system prompt's competing irreversibility → blockage → starvation → yield cascade is superseded on this point.

The source formula is:

`priority = (((2 × importance + life_impact) × value_weight) + blockage_bonus) × urgency_multiplier / sqrt(effective_effort)`

This document specifies how that logic is to be implemented; it does not implement `engine.ts`, consistent with the requested signatures-only pass. Owner decisions W2-A1–A9 below now settle the listed Week 2 rules and override overlapping earlier wording. B1–B5 remain intact.

Authority elsewhere: resolved B1–B5 in `docs/week-1-decisions.md` and the updated Week 1 plan govern those five points; the addendum overrides BUILDING wherever they overlap; BUILDING governs the remainder. B1–B5 are not reopened.

## 2. Scope and prerequisite handoff

Week 2 delivers the pure engine and mandatory unit tests; owner-authenticated `/api/now`; the native Now card; `done`, `postpone`, `drop`, `shelf` and their synchronous lifecycle writes; Call B phrasing behind the output guard; the authority opt-in required to move beyond provisional suggestions; and the agreed form of directive-compliance observation.

No nudge composition or delivery, notification permissions, cron/wake worker, nightly consolidation, review generation, calendar integration or automatic self-throttling. Existing M2/M4 writes explicitly required by a completed decision/release are synchronous lifecycle bookkeeping, **not memory consolidation**. The existing `memory.ts` consolidation/retrieval skeleton remains untouched. No full focus-block subsystem is assumed; Start is response evidence under W2-A1, not a focus-block event.

| Week 1 output | Week 2 dependency |
| --- | --- |
| W1-01/02: workspace and shared contracts | All source paths/types/tests below. Confirm paths against the actual scaffold before writing. |
| W1-03/04: baseline, messages, item-source FK, setup state and access controls | Engine reads, lifecycle writes, new schema additions. Never edit an already-applied Week 1 migration. |
| W1-05/06: verified owner, transactions, history and source-item query | Every new endpoint and atomic state change. |
| W1-07/19: confirmed values/timezone and `onboarding_state` | Capacity/threshold context and setup/provisional/full distinction. |
| W1-09–11/17: PKCE auth and native API adapter | Now/actions/opt-in use the existing authenticated connection. |
| W1-12–16: valid intake, item statuses, first-pass snapshots | Engine candidates and action targets; never repair classifier history by overwriting it. |
| W1-18/20: durable Chat and native screen | Now card/actions mount inside Chat without replacing capture. |
| W1-21/22: verified Week 1 behavior and item-level first-pass acceptance | Week 2 integration acceptance must retain those guarantees. |

These dependencies are **not claimed Done here**. Planning and fixture-based pure-function work can proceed; integration tickets require the actual merged outputs. Do not dispatch Week 2 code tickets under the existing Week-1-only WORKFLOW.md prohibition on engine work. A separately authorized Week 2 dispatch policy is an operational prerequisite, not a change made in this draft.

## 3. W2-A1–A9 — recorded owner decisions

All nine decisions are recorded in `docs/week-2-decisions.md`. The following rules replace the earlier unanswered questions.

| Decision | Rule | Contract effect |
| --- | --- | --- |
| W2-A1 — Compliance cohort | Log every response in both authority periods. Only full-authority presentations contribute to the actual 50%/30% self-throttle statistics. Followed means Start tapped before supersession and before local end of day; the earlier boundary closes the window. No focus_started prerequisite. | Store issuance mode and response times; separate provisional observations from eligible full-authority statistics. Implement measurement only, not throttling. |
| W2-A2 — Directive identity | Issue at the server return-to-client boundary, not internal computation. Reuse the result until an action or hard override changes it; GET refresh never issues a replacement by itself. Skip dismisses the presentation without changing postpone_count. NEXT reveals only when NOW completes; ANCHOR remains visible throughout. | Persist stable presentation ID, issued_at, superseded_at and dismissed_at. Keep NEXT server-side until reveal; include ANCHOR in the public presentation. |
| W2-A3 — Numeric edge cases | At scoring time only, use effort 1 for zero/NULL; never write that default back. Hard deadlines beyond 30 days use 1.0; passed hard deadlines use 3.0. A tie is within 10% of the top score. Simultaneous irreversible winners use earliest due/wake time, then stable item ID. E1 triage replaces normal Top-3 composition entirely. Starvation beats heaviness when choosing ANCHOR. | Add exact pure-function fixtures; keep top-score reference explicit in tie comparison. No schema normalization/backfill. |
| W2-A4 — Capacity mapping | Use a local-time heuristic with mornings highest and capacity tapering through the day; a set manual 1–5 override always wins. Stored exposure steps have fixed duration 15 minutes and effort 1. A heavy item without an exposure step is infeasible for NOW this week; do not generate one. | Use the concrete table in plan §4. Constants need no exposure duration/effort columns or generator. |
| W2-A5 — Postponement without slots | No scheduled-slot columns this week. Postpone increments postpone_count and clears current NOW assignment; the next engine call reselects. This is identical for scheduled and active items. On closure or shelving clear wake_at and exposure_step. | Remove slot types/parameters and rescheduling writes. Preserve due_at; postponement alone does not clear wake/exposure. |
| W2-A6 — Lifecycle edges | Third TASK postponement changes class to decision, preserves the existing nonterminal status, and emits converted_to_decision. Task Done needs no focus block. Decision Done requires already-populated reasoning and revisit_condition; reject missing/blank values. Decision Postpone increments only, with no ladder. Explicit Drop/Shelf is allowed for irreversible items. | Add nullable items.reasoning and items.revisit_condition for stored provenance; validate before mutation and copy to M2 on resolution. Do not introduce a converted_to_decision status or exposure-completion action. |
| W2-A7 — Input relationships | Use one domain per item this week. Blockage bonus counts entries in the existing blocks array, capped at 3. Wakes are date-only; event/conditional wakes are not supported. Defer E2–E7 history-dependent behavior to Week 3+. | No multi-domain join table, dependency-graph inference, conditional-wake storage or history subsystem is added. Document these limitations in acceptance. |
| W2-A8 — Memory side effects | The one-time release receipt is a chat confirmation, exempt from the ban on resurfacing dead items. Do not auto-compost derivative errands when resolving a decision this week. | Keep synchronous M4/M2 writes and the transaction-bound receipt; no derivative traversal or changes to memory.ts/consolidation. |
| W2-A9 — Chat grammar and fallback | Recognize only the fixed commands “what now”, “done”, “drop it”, “postpone”, and “shelf it”. “what now” uses /api/now; action commands target the last-presented item, without free-text item selection. After bounded guard retries fail, return a fixed factual string, never silence after a committed mutation. | Parse commands deterministically, bind the target once for retry safety, and persist factual fallback receipts. Preserve B4 reply routing; see compatibility flags below. |

### Compatibility and remaining integration flags

These are implementation boundaries, not a reopening of the nine recorded decisions or B1–B5.

- **A9/B4 overlap:** a message explicitly replying to the existing intake question is governed by B4 even if its text is “done”. An unconditional command parser would conflict with Week 1. Preserve the explicit reply route before command parsing; do not silently override either contract. W2-02/18/21 must cover this case.
- **A6 schema prerequisite:** Week 1 has no `items.reasoning` or `items.revisit_condition`; the analogous memory columns do not populate an unresolved item. Add the item columns in the new Week 2 migration. No Week 1 classifier change or provenance-entry UI is authorized here. The production path that populates these fields is still unspecified; reject absent values and flag this limitation in W2-10/17/22 instead of inventing reasons.
- **A2/A3 overlap:** E1 replaces normal Top-3 composition, while A2 requires ANCHOR visible throughout. Whether an existing ANCHOR remains visible as context during E1, or triage has a distinct ANCHOR presentation, is not specified. W2-07/20 must flag this specific triage-display question before implementing that branch; normal-mode visibility is settled.
- **A9 target boundary:** NOW and ANCHOR can both be visible. Which role supplies “last-presented item” in that simultaneous presentation is not specified. W2-12/18/20 must record a targeting rule before enabling unbound chat actions for that case; explicit item-bound chips remain unambiguous. Never infer a target from Voice text.
- B1 notification timing, B2 PKCE, B3 source FK/full raw text, B4 one clarification, and B5 immutable first-pass acceptance stay unchanged. In particular, lifecycle cleanup changes current item fields, never original intake snapshots. Converted tasks may retain `active`/`scheduled`; fresh Week 1 decisions retain `open`. Admit both without rewriting Week 1 rows.

## 4. engine.ts implementation contract

The addendum's formula in §1 remains authoritative. All functions take immutable inputs and explicit `now`; no SQL, Gemini, clock reads, allocation of UUIDs, network, mutation or randomness inside `engine.ts`.

| Stage | Week 2 rule |
| --- | --- |
| Admission | TASK/DECISION only; exclude closed, shelved, needs_clarification and sleeping items. Preserve existing explicit dependency checks, but add no dependency inference. Date-only wakes are supported; unsupported conditions cannot be assumed met. |
| E1 | When the engine spec's E1 trigger fires (three or more hard deadlines within 48h), use its importance × value triage ranking instead of normal Top-3 composition. Passed hard deadlines remain urgent. Do not mix normal reservations into that triage selection. See §3 for the remaining display overlap. |
| Irreversibility | Outside E1, the eligible irreversible-and-time-critical override precedes normal scoring. Multiple winners use earliest relevant due/wake timestamp, then stable item ID. Do not turn irreversible=true alone into a time-critical predicate. |
| Effort and feasibility | Scoring substitutes 1 for zero/NULL effort only in computation, never storage. Heavy items with a stored exposure use fixed effort 1 / 15 minutes; without exposure they cannot be NOW this week. Capacity gates NOW, not all NEXT/ANCHOR eligibility. |
| Blockage / domain | B = min(blocks.length, 3), counting array entries, not distinct/resolved graph targets. Use the single stored domain's value weight. True multi-domain scoring and E2–E7 history behavior are deferred. |
| Score | (((2I + L) × V) + B) × M / sqrt(E′). No competing cascade, blockage multiplier or subtractive emotional penalty. Other absent required inputs remain invalid, not invented defaults. |
| Ties | Compare against the top score: the tie group has score ≥ 0.9 × top score. Apply the spec's effort/age tie rules within that group, then stable ID; do not create nontransitive pairwise 10% comparisons. |
| Normal composition | NOW, hidden NEXT and visible ANCHOR; enforce the spec's diversity/heaviness constraints. Starvation takes precedence over heaviness for competing ANCHOR reservations. NEXT reveals only upon NOW completion. |
| Quiet outcome | Valid empty selection returns rest. Missing input or service failure returns unavailable, never false rest. |

| Deadline | Multiplier |
| --- | --- |
| Hard, already passed or ≤48h remaining | 3.0 |
| Hard, >48h through 7d | 2.0 |
| Hard, >7d through 30d | 1.4 |
| Hard, >30d | 1.0 |
| Soft/self-imposed | 1.1 |
| None | 1.0 |

Hard urgency without a usable date remains invalid input; the owner supplied no fabricated date. Known fixtures: I=3, L=2, V=1.2, B=0, M=1, E′=1 gives 9.6; I=4, L=5, V=1.2, B=3, M=1.1, E′=1 gives 20.46.

Concrete heuristic for `estimateCapacity` (local timezone from Week 1 setup; implementation table instantiating A4's morning/taper rule):

| Local time, start inclusive/end exclusive | Capacity |
| --- | --- |
| 00:00–06:00 | 1 |
| 06:00–12:00 | 5 |
| 12:00–16:00 | 4 |
| 16:00–19:00 | 3 |
| 19:00–21:00 | 2 |
| 21:00–24:00 | 1 |

A set manual 1–5 override wins in every interval. No override expiration policy, calendar integration or scheduled slots are introduced.

Mandatory tests cover exact arithmetic, zero/NULL without mutation, all urgency boundaries, blocks-entry cap, top-relative ties, deterministic irreversible winners, E1 selection, normal ANCHOR precedence, capacity boundaries/override, exposure constants/no-exposure exclusion, sleep/closure filters, hidden NEXT and invalid-versus-empty results.

## 5. Concrete action state changes and writes

Lock and re-read the item, deduplicate the request, then commit the item, events, presentation invalidation and direct provenance atomically. Preserve `id`, `source_message_id`, full original `raw_text` and immutable `messages.intake_results`. Update `updated_at` on item mutations.

| Action | State change | Event / side effect |
| --- | --- | --- |
| Done: nonterminal TASK, including unfocused active/scheduled task | status=done, closed_as=done, closed_at=now; clear wake_at/exposure_step | completed; domain last_touched_at=now; retire current NOW and reveal still-valid NEXT. No focus event required. |
| Postpone: TASK count 0 or 1 | increment count to 1 or 2; retain class/status and NULL closure fields | postponed; clear current NOW assignment; next engine call reselects. No slot or scheduled event. |
| Postpone: TASK count 2 | count=3, class=decision; retain current nonterminal status and NULL closure fields | postponed + converted_to_decision exactly once; clear NOW. No new status, slot or automatic fourth reschedule. |
| Postpone: existing DECISION | increment count; keep class/status/closure fields | postponed; clear NOW; no second conversion/ladder. |
| Done: nonterminal DECISION | Reject if stored reasoning or revisit_condition is NULL/blank. Otherwise status=resolved, closed_as=done, closed_at=now; clear wake_at/exposure_step | Record resolution, copy existing provenance to M2, update domain attention; retire NOW and reveal valid NEXT. No generated reasoning or implicit exposure completion. |
| Drop: nonterminal TASK/DECISION, including irreversible | status=released, closed_as=released, closed_at=now; clear wake_at/exposure_step | released + direct M4; retire selection; one-time release receipt. |
| Shelf: nonterminal TASK/DECISION, including irreversible | status=shelved, shelved=true; closure fields stay NULL; clear wake_at/exposure_step | shelved; retire selection; no completion credit, memory consolidation or automatic wake. |
| Start: response endpoint | No item lifecycle or postpone change | Log response; qualifying in-window Start marks followed. No focus-block creation. |
| Skip: response endpoint | No item lifecycle or postpone change | Log response and dismiss presentation; preserve dismissal across refresh. Not Postpone and not NEXT completion/reveal. |

The task ladder applies identically to active and scheduled items. `due_at` is never repurposed. Postpone does not impose a cooldown, so the engine may reselect the same item on its next call. A new request against an already closed/shelved or otherwise illegal target returns a conflict; identical retries replay the original result.

Third-postponement conversion happens in both authority modes. Provisional Voice must omit corrective challenges; full authority may use the established decision-extraction challenge. Neither reopens the original B4 intake turn. Done does not stand for exposure_done this week. No derivative errands are auto-composted on decision resolution; synchronous M2/M4 writes are not consolidation.

## 6. Compliance and provisional authority

Record every Start/Skip response in provisional and full authority, deduplicating transport retries. Snapshot authority at issuance, never relabel old directives after opt-in. Only the full-authority cohort feeds the actual 50%/30% self-throttle statistics; Week 2 records/reduces evidence but does not implement throttling.

A directive is issued when returned to the client, not when the engine computes it. Internal candidates have no compliance obligation. Repeated GET/card/chat refreshes reuse the same applicable ID, issuance timestamp and body. Only a real action or hard override can replace it. Preserve Skip dismissal across refresh; a midnight rollover alone does not issue a new directive.

Followed = Start received before both supersession and local end of the issuance day. Persist that day's boundary using the configured timezone. Late responses remain evidence but do not mark that directive followed. No focus_started or completion prerequisite; Done alone is not Start. Window closure is derived from timestamps on reads, without cron. Keep responses separate from directive opportunities so retries and multiple responses cannot multiply the denominator; expose pending versus closed-window observations separately. Do not report an unobserved/empty rate as zero.

The owner's decisions specify the response window but do not specify whether still-open, not-yet-followed windows belong in the live rate denominator. Preserve counts separately and flag that aggregation timing in W2-16/22 before a rate is consumed; no self-throttle runs this week.

Setup incomplete returns setup-required without issuance. Provisional suggestions have a short reason, voluntary Start/Skip and no corrective authority. After at least seven elapsed days since setup, offer explicit acceptance; until accepted, stay provisional. `POST /api/onboarding/authority {accept:true}` verifies that existing gate and sets `full_authority_at` once. Later does not mutate state. A provisional presentation remains in its original cohort even if its response arrives after opt-in.

## 7. Schema and API contracts to hand off — no SQL yet

Use a new forward migration `supabase/migrations/202609080004_week2_execution.sql`; never rewrite applied Week 1 migrations. These are planned records, not claims of implemented schema.

| Record | Required columns / constraints |
| --- | --- |
| directive_presentations | id UUID PK; owner_id; now_item_id FK; nullable next_item_id/anchor_item_id FKs; selection_revision; authority_mode; body; created_at; nullable issued_at, superseded_at, dismissed_at; response_deadline_at and issuance_timezone. Persist roles and reuse identity; draft computation leaves issued_at NULL. Enforce one current presentation per owner and serialize replacement. |
| directive_responses | id UUID PK; owner_id; directive_id FK; request_id; response constrained to start/skip; occurred_at. Unique(owner_id,request_id), payload consistency on replay, index(directive_id,occurred_at). Retain late/stale evidence without qualifying it as followed. |
| action_requests | request_id plus owner_id unique; item_id FK; optional directive_id FK; normalized_payload; result/receipt_message_id; created_at/completed_at. Persist target binding so retries cannot act on a newly presented item. |
| items extension | nullable reasoning text, revisit_condition text. No fabricated backfill. Decision Done validates both nonblank under lock, then copies them into existing M2 fields. |
| Existing records | Update lifecycle fields/events and direct M2/M4; reuse onboarding state and source-message relationships unchanged. No messages.item_id. |

Use ownership-consistent FKs/checks and server-only access controls matching Week 1. No slot columns, exposure effort/duration columns, multi-domain table, conditional-wake system or history/consolidation tables this week. Exposure 15/1 is a constant.

`GET /api/now` returns setup_required, unavailable, rest or presentation. Public presentation includes stable ID, NOW, ANCHOR, mode, body and controls; NEXT is omitted until NOW completes. Issue once at the response boundary, not during candidate selection. A failed transport is not proof of visible display; this contract does not require a client visibility acknowledgment.

`POST /api/directives/:id/response` accepts `{request_id,response:'start'|'skip'}`. Start records evidence without focus; Skip dismisses without the postponement ladder. `POST /api/items/:id/action` accepts `{request_id,verb:'done'|'postpone'|'drop'|'shelf',note?,directive_id?}`. No slot/resolution-entry payload: decision provenance must already exist. Return a factual validation failure if it does not. Persist committed receipts, including fixed fallbacks, for replay.

Chat retains its capture envelope. After honoring an explicit B4 clarification reply, deterministic exact matching (trim and case-fold only) maps `what now` to the shared Now service and `done`, `drop it`, `postpone`, `shelf it` to the corresponding action on the last-presented item. No synonyms, model intent classifier or free-text target selection. Bind target at admission and preserve it on retries. Missing/ambiguous targets produce a visible non-mutating error; see §3's simultaneous-role flag. Other text follows Week 1 capture.

After one guarded Call B retry fails, bypass Voice with fixed factual templates: `Done.`, `Postponed.`, `Released.`, `Shelved.`, or `Converted to a decision.` as appropriate to the committed result. For NOW use `Suggested next: {canonical action}.` in provisional mode and `Next: {canonical action}.` in full authority; interpolate only validated selected content. Rest uses `Nothing is available now.`; unavailable uses `Unable to select an item right now.`. These are deterministic application text, not another generation attempt. A release receipt is a one-time transaction confirmation, never a license for later dead-item retrieval.

## 8. Exact file manifest — extended versus new

Paths below are repository-relative. No dependency upgrade or package/config change is assumed; the Week 1 Gemini/Vitest/Postgres setup is reused. If the actual scaffold differs, correct the affected ticket's file list before assigning an agent.

### Existing Week 1 files extended

| File | Week 2 change |
| --- | --- |
| `packages/contracts/src/index.ts` | NOW, actions, responses and authority DTOs; preserve capture/MessageDTO contracts and source-item FK. |
| `apps/api/src/lib/engine.ts` | Implement the existing untouched skeleton: pure gates/scoring/composition only. |
| `apps/api/src/lib/lifecycle.ts` | Add four-verb action planning; preserve intake/B4 behavior. |
| `apps/api/src/lib/gemini.ts` | Add Call B request/composition functions; preserve Call A. |
| `apps/api/src/lib/guard.ts` | Extend to interactive Voice validation/retry outcomes; no nudge branch. |
| `apps/api/src/lib/chat.ts` | Share NOW/action services with chat under the approved intent contract. |
| `apps/api/src/lib/items.ts` | Return currently valid action metadata for source-linked items; never a general backlog. |
| `apps/api/src/lib/onboarding.ts` | Add explicit authority acceptance; preserve setup completion time. |
| `apps/api/src/app/api/chat/route.ts` | Validate Week 2 intent/action shape without regressing capture replay. |
| `apps/mobile/src/api.ts` | Typed calls for NOW, item actions, directive response and authority acceptance. |
| `apps/mobile/src/useChat.ts` | Reconcile action/Voice messages and source-linked chips after mutations. |
| `apps/mobile/app/chat.tsx` | Mount Now card, authority offer and context-bound action chips. |

The five original skeletons existed conceptually before Week 1; `engine.ts` is an extension of that scaffold even though Week 1 did not implement it. `memory.ts` stays untouched.

### New Week 2 files

| File | Purpose |
| --- | --- |
| `docs/week-2-decisions.md` | Record answers to W2-A1–A9 before affected code is eligible. |
| `docs/week-2-acceptance.md` | Evidence against Week 2 ticket Done conditions and retained Week 1 behavior. |
| `supabase/migrations/202609080004_week2_execution.sql` | Add the finally approved execution/observation records; filename reserved, no draft SQL in this response. |
| `apps/api/src/lib/engine-context.ts` | Read persisted inputs and normalize them separately from pure scoring. |
| `apps/api/src/lib/now.ts` | Shared selection/presentation service for card and chat. |
| `apps/api/src/lib/actions.ts` | Transactional action service and replay handling. |
| `apps/api/src/lib/provenance.ts` | Synchronous release/resolution M4/M2 insertion only. |
| `apps/api/src/lib/directives.ts` | Durable presentation/response linkage. |
| `apps/api/src/lib/compliance.ts` | Pure policy-driven aggregation of recorded directive observations. |
| `apps/api/src/lib/voice.ts` | Call B → guard → bounded retry/approved fallback orchestration. |
| `apps/api/src/prompts/voice.md` | Production prompt adapted for predetermined outcomes and authority mode; no scheduled nudge/review instructions. |
| `apps/api/src/app/api/now/route.ts` | Owner-authenticated GET. |
| `apps/api/src/app/api/items/[id]/action/route.ts` | Owner-authenticated four-verb POST. |
| `apps/api/src/app/api/directives/[id]/response/route.ts` | Start/Skip evidence POST under W2-A1/A2. |
| `apps/api/src/app/api/onboarding/authority/route.ts` | Explicit full-authority acceptance POST. |
| `apps/mobile/src/useNow.ts` | Stable Now presentation, authority/response/action coordination. |
| `apps/mobile/src/components/NowCard.tsx` | Single visible suggestion/directive and Start/Skip per current mode. |
| `apps/mobile/src/components/ItemActionChips.tsx` | Four actions for a bound item, no inference from prose. |
| `apps/mobile/src/components/AuthorityOffer.tsx` | Eligible opt-in with a Later option. |
| `apps/api/src/lib/engine.test.ts` | Mandatory engine unit tests. |
| `apps/api/src/lib/lifecycle.test.ts` | State/third-postponement unit tests. |
| `apps/api/src/lib/voice.test.ts` | Voice/guard boundary tests with fake Gemini. |
| `apps/api/src/lib/compliance.test.ts` | Cohort/replay/NULL-statistics tests under the recorded policy. |
| `apps/api/src/lib/week2.integration.test.ts` | Actions/Now/authority atomicity, replay and API integration. |

The source spec `dhruva-prioritization-engine.md` is a read-only prerequisite of the engine tickets; ensure the repository contains that referenced artifact before an agent implements them. All original specs, Week 1 migrations, B1–B5 decisions and auth/scaffold files remain unmodified by this plan.

## 9. Shared contracts and function signatures

Declarations only. `Owner`, `Tx`, `UUID`, `ItemDTO` and API errors reuse Week 1. Required policy arguments contain recorded W2-A decisions; they are not optional defaults an agent fills in.

| Contract in `packages/contracts/src/index.ts` | Shape / meaning |
| --- | --- |
| `AuthorityMode` | `setup|provisional|full`, derived from existing onboarding timestamps. |
| `EngineInput`, `EnginePolicy`, `EngineResult` | Internal normalized candidates/context, required resolved rules, and `selection|rest|invalid_input|policy_required`; never return internal scores in public DTOs. |
| `NowDTO` | `setup_required|unavailable|rest|presentation`; presentation contains stable ID, NOW item/action text, guarded body, authority mode and permitted controls. Hidden NEXT is not serialized until NOW completes; ANCHOR is visible; include dismissal state. |
| `ItemActionRequest`, `ActionResult` | Stable request ID, target verb, optional directive context; no slot or resolution-entry payload; committed item/result/message identity. |
| `DirectiveResponseRequest` | Stable request ID and `start|skip`; Start/Skip evidence under W2-A1/A2. |
| `CompliancePolicy`, `ComplianceResult` | Explicit eligible cohort, issued/followed/window definitions; result includes nullable rate and evidence counts, for server use only. |
| `VoiceInput` | Committed/predetermined outcome, allowed factual context, authority mode and purpose `capture_ack|now|action_receipt|conversion`; no nudge/review purpose. |
| `ChatRequest` | Backward-compatible capture or approved Week 2 ask/action intent; fixed command grammar in §7; preserve B4 reply routing. |

### Pure engine and data adapter

| File | Function signature | One-line responsibility |
| --- | --- | --- |
| `apps/api/src/lib/engine.ts` | `validateEngineInput(input: EngineInput, policy: EnginePolicy): EngineIssue[]` | Reject unsupported/missing mathematical or gate inputs without disguising them as rest. |
| Same | `filterCandidates(input: EngineInput, policy: EnginePolicy): CandidateFilterResult` | Apply class/lifecycle/sleep/dependency admission with an explicit evaluation time. |
| Same | `selectIrreversibleOverride(candidates: readonly Candidate[], context: EngineContext, policy: EnginePolicy): OverrideResult` | Apply irreversible-and-time-critical override and the approved multiple-winner rule. |
| Same | `effectiveEffort(item: Candidate, policy: EnginePolicy): EffortResult` | Return computation-only zero/NULL default 1 or stored-exposure effort 1; never mutate rows. |
| Same | `fitsNow(item: Candidate, capacity: number, policy: EnginePolicy): boolean` | Apply NOW-only energy feasibility to valid effective effort. |
| Same | `urgencyMultiplier(kind: UrgencyKind, dueAt: Date|null, now: Date, policy: EnginePolicy): number` | Compute M under explicit deadline-range rules. |
| Same | `blockageBonus(blocks: readonly string[]): number` | Count existing blocks array entries, capped at three; no deduplication/inference. |
| Same | `scoreCandidate(item: ScorableCandidate, context: ScoreContext): number` | Apply the exact authoritative formula to validated inputs. |
| Same | `compareCandidates(a: ScoredCandidate, b: ScoredCandidate, topScore: number, policy: EnginePolicy): number` | Apply approved 10% ties, effort, age and final stable-ID ordering. |
| Same | `composeTopThree(candidates: readonly ScoredCandidate[], context: CompositionContext, policy: EnginePolicy): TopThreeResult` | Compose roles with feasibility, diversity, heaviness and Anchor constraints. |
| Same | `selectTriage(candidates: readonly Candidate[], context: EngineContext): TriageResult` | Apply E1 trigger and importance × value ranking instead of normal composition. |
| Same | `selectNow(input: EngineInput, policy: EnginePolicy): EngineResult` | Orchestrate pure selection and keep rest distinct from invalid/unresolved inputs. |
| `apps/api/src/lib/engine-context.ts` | `loadEngineSnapshot(owner: Owner, now: Date): Promise<EngineSnapshot>` | Read current item/domain/setup state and approved relationship/history records. |
| Same | `estimateCapacity(localTime: LocalTime, override: EnergyOverride|null, policy: CapacityPolicy): number` | Apply the owner-approved time heuristic outside selection; no inferred calendar data. |
| Same | `toEngineInput(snapshot: EngineSnapshot, policy: EnginePolicy): EngineInput` | Normalize existing fields while explicitly reporting unsupported information. |

### Actions, observations and direct provenance

| File | Function signature | One-line responsibility |
| --- | --- | --- |
| `apps/api/src/lib/lifecycle.ts` | `planAction(item: ItemState, request: ItemActionRequest, context: ActionContext, policy: LifecyclePolicy): TransitionPlan` | Validate and describe an approved four-verb transition without database writes. |
| Same | `planPostponement(item: ItemState, policy: LifecyclePolicy): TransitionPlan` | Increment/clear NOW; third task postponement converts class; existing decisions only increment. |
| `apps/api/src/lib/actions.ts` | `applyItemAction(owner: Owner, itemId: UUID, request: ItemActionRequest): Promise<ActionResult>` | Lock/revalidate/replay or commit exactly one action and its direct side effects. |
| Same | `commitTransition(tx: Tx, plan: TransitionPlan, requestId: UUID): Promise<CommittedAction>` | Write item/events/M2/M4/request-result state atomically. |
| `apps/api/src/lib/provenance.ts` | `recordRelease(tx: Tx, item: ItemState, occurredAt: Date): Promise<UUID>` | Insert the explicit release M4 required by BUILDING, not an extracted candidate. |
| Same | `recordDecisionResolution(tx: Tx, item: ItemState, resolution: DecisionResolution, occurredAt: Date): Promise<UUID>` | Copy validated, already-stored item reasoning/revisit provenance into M2. |
| `apps/api/src/lib/directives.ts` | `getOrCreatePresentation(owner: Owner, selection: EngineSelection, mode: AuthorityMode): Promise<Presentation>` | Apply W2-A2's stable identity/reuse rules independently of HTTP retries. |
| Same | `markPresentationIssued(owner: Owner, presentationId: UUID, returnedAt: Date): Promise<Presentation>` | Set first issuance/timezone/window once at response handoff; never on internal computation. |
| Same | `recordDirectiveResponse(owner: Owner, directiveId: UUID, request: DirectiveResponseRequest): Promise<ResponseReceipt>` | Deduplicate Start/Skip and link evidence to the original presentation. |
| Same | `invalidatePresentations(tx: Tx, affectedItemIds: readonly UUID[], reason: string): Promise<void>` | Retire stale actionable presentations after relevant committed changes. |
| `apps/api/src/lib/compliance.ts` | `summarizeCompliance(observations: readonly DirectiveObservation[], policy: CompliancePolicy, now: Date): ComplianceResult` | Separate provisional/full evidence and pending/closed windows; count eligible Start once per full directive. |

Start never emits `focus_started` or creates a focus block this week. Existing per-item counters are changed transactionally; no nightly consolidation is needed for the action itself.

### Voice, Now, chat and authority

| File | Function signature | One-line responsibility |
| --- | --- | --- |
| `apps/api/src/lib/gemini.ts` | `buildVoiceRequest(input: VoiceInput, violations?: readonly string[]): VoiceRequest` | Frame a preselected outcome for Call B, with immutable scope and authority context. |
| Same | `phraseOutcome(input: VoiceInput, violations?: readonly string[]): Promise<string>` | Make one Call B attempt; do not select or mutate anything. |
| `apps/api/src/lib/guard.ts` | `checkVoiceOutput(text: string, context: VoiceGuardContext): GuardResult` | Check prohibited language, hidden machinery, factual/action references and authority restrictions. |
| Same | `stripRejectedSentences(text: string, violations: readonly GuardViolation[]): string` | Remove rejected sentences during validation only; exhausted retries use fixed factual fallback. |
| `apps/api/src/lib/voice.ts` | `renderVoice(input: VoiceInput): Promise<GuardedVoiceResult>` | Compose, validate, retry once and apply the approved factual fallback if required content is lost. |
| `apps/api/src/lib/voice.ts` | `buildFactualFallback(input: VoiceInput): string` | Format the fixed factual text for a known outcome after guard exhaustion. |
| `apps/api/src/lib/now.ts` | `getNow(owner: Owner, now: Date): Promise<NowDTO>` | Read authority, load pure engine input, reuse/create presentation and return guarded public output. |
| `apps/api/src/lib/chat.ts` | `handleChat(owner: Owner, request: ChatRequest): Promise<ChatReply>` | Preserve capture service while delegating approved ask/action intent to shared Now/actions. |
| Same | `parseChatCommand(text: string): ChatCommand|null` | Match only the five fixed phrases after trim/case folding. |
| Same | `resolveLastPresentedItem(owner: Owner, requestId: UUID): Promise<BoundActionTarget>` | Resolve and durably bind the last-presented target; reject missing/ambiguous targets. |
| Same | `commitCapture(owner: Owner, input: CaptureRequest, result: ClassificationAttempt): Promise<CaptureReply>` | Extend only acknowledgment phrasing to Call B while preserving Week 1 atomicity/B4/B5. |
| `apps/api/src/lib/items.ts` | `listItemsBySourceMessage(owner: Owner, sourceMessageId: UUID): Promise<ItemsBySourceReply>` | Retain B3 lookup and expose only currently legal chip metadata. |
| `apps/api/src/lib/onboarding.ts` | `acceptFullAuthority(owner: Owner, now: Date): Promise<OnboardingView>` | Enforce seven elapsed days and explicit acceptance; never reset setup time or auto-enable. |
| `apps/api/src/prompts/voice.md` | No function; prompt template only. | Remove competing ranking instructions; express approved outcome in current authority mode. |

Call B receives factual input already assembled for the current action/selection; no new memory-retrieval engine is introduced. Do not imply a remembered pattern when no evidence was loaded. Mutations commit independently of presentation availability: a failed Voice call cannot undo a valid Drop or make a completed action run twice. Guarded receipts persist with their request identity; reload/retry recovers the same semantic result. Use §7 fixed factual fallback after guard exhaustion; apply the W2-A8 one-time receipt exception.

### Route handlers

| File | Signature | Responsibility |
| --- | --- | --- |
| `apps/api/src/app/api/now/route.ts` | `GET(request: Request): Promise<Response>` | Verify owner, invoke `getNow`, return no hidden scores/NEXT; disable transport caching of user state. |
| `apps/api/src/app/api/items/[id]/action/route.ts` | `POST(request: Request, context: {params: Promise<{id:string}>}): Promise<Response>` | Validate idempotent four-verb action and delegate to the transaction service. |
| `apps/api/src/app/api/directives/[id]/response/route.ts` | `POST(request: Request, context: {params: Promise<{id:string}>}): Promise<Response>` | Validate approved response evidence and stable request identity. |
| `apps/api/src/app/api/onboarding/authority/route.ts` | `POST(request: Request): Promise<Response>` | Accept only explicit `{accept:true}` and enforce the timestamp gate. |
| `apps/api/src/app/api/chat/route.ts` | `POST(request: Request): Promise<Response>` | Preserve capture compatibility and validate W2-A9's agreed intent envelope. |

Reuse Week 1 owner verification/error handling; do not reimplement authentication. Stale/illegal transitions and conflicting idempotency-key reuse return a conflict, not a fabricated success. A GET may reuse a stored presentation, but refresh alone never creates additional compliance obligations.

### Mobile files

| File | Signature | Responsibility |
| --- | --- | --- |
| `apps/mobile/src/api.ts` | `getNow(): Promise<NowDTO>` | Retrieve the stable guarded presentation. |
| Same | `postItemAction(itemId: UUID, request: ItemActionRequest): Promise<ActionResult>` | Submit a bound verb with unchanged request identity across retries. |
| Same | `postDirectiveResponse(id: UUID, request: DirectiveResponseRequest): Promise<ResponseReceipt>` | Send Start/Skip evidence; Skip never invokes Postpone. |
| Same | `acceptFullAuthority(): Promise<OnboardingView>` | Submit explicit acceptance; Later sends no mutation. |
| Same | `postChat(request: ChatRequest): Promise<ChatReply>` | Extend transport for approved ask/action intents while preserving capture IDs. |
| `apps/mobile/src/useNow.ts` | `useNow(): NowState` | Coordinate presentation refresh, stable response/action IDs, authority and mutation conflicts. |
| Same | `refreshNow(): Promise<void>` | Returned hook action: refresh without recording follow-through or spawning repeated directives. |
| Same | `respond(response: 'start'|'skip'): Promise<void>` | Returned hook action: send the agreed response for the displayed presentation. |
| Same | `act(itemId: UUID, verb: ActionVerb, details?: ActionDetails): Promise<void>` | Returned hook action: submit bound action then refresh affected presentation/item state. |
| `apps/mobile/src/useChat.ts` | `useChat(conversationId: UUID): ChatState` | Extend reconciliation to guarded action receipts without mutating first-pass capture evidence. |
| `apps/mobile/src/components/NowCard.tsx` | `NowCard(props: NowCardProps): React.JSX.Element` | Render one current suggestion/directive or truthful unavailable/rest state. |
| `apps/mobile/src/components/ItemActionChips.tsx` | `ItemActionChips(props: ItemActionChipsProps): React.JSX.Element` | Render server-permitted bound verbs and pending/error state; no inferred IDs. |
| `apps/mobile/src/components/AuthorityOffer.tsx` | `AuthorityOffer(props: AuthorityOfferProps): React.JSX.Element` | Explain eligible opt-in and preserve provisional state on Later. |
| `apps/mobile/app/chat.tsx` | `ChatScreen(): React.JSX.Element` | Mount components, keep capture usable and suppress stale controls. |

No new screen route is required. No focus countdown or focus subsystem is in scope. Display at most the approved role presentation; never show a ranked backlog, numeric priority or compliance score.

### Documentation, schema and tests

The two documentation files and migration have no TypeScript functions. The migration implements §7, including stored decision provenance and no slot columns. Existing tooling/config remains unchanged unless a ticket is amended to name the required file.

Each new test file exports no application functions. `engine.test.ts`, `lifecycle.test.ts`, `voice.test.ts` and `compliance.test.ts` use table-driven cases with explicit policy/time fixtures. `week2.integration.test.ts` may define `seedWeek2Fixture(): Promise<Week2Fixture>` and `cleanupWeek2Fixture(fixture: Week2Fixture): Promise<void>` for isolated database setup/cleanup. No live user data is used in automated fixtures.

## 10. GitHub-issue-ready tickets

All paths below are repository-relative. These are drafts, not posted issues. W2-A1–A9 are recorded decisions. Only the specifically flagged integration details in §3/6 remain questions; agents must not guess them. Week 1 dependencies mean genuinely merged/verified outputs, not just Ready tickets.

### W2-01 — Record the nine Week 2 decisions

**Files:** `docs/week-2-decisions.md`.
**Functions:** none.
**Work:** Record all nine supplied decisions and the contract/ticket impacts below. Preserve B1–B5; flag remaining integration overlaps separately.
**Done:** All nine owner decisions are recorded, existing ticket changes identified, and no Week 1 rule silently overridden.
**Depends on:** recorded owner decisions; read-only BUILDING/addendum/engine spec/current plan.

### W2-02 — Define Week 2 shared contracts

**Files:** `packages/contracts/src/index.ts`.
**Functions:** type/schema declarations from §9; no behavioral implementation.
**Work:** Add §7/9 contracts: stable issuance/dismissal, visible ANCHOR/hidden NEXT, Start/Skip responses, four verbs without slots, stored decision provenance, full-only compliance evidence and fixed chat grammar. Preserve B4 explicit reply routing.
**Done:** Both packages type-check; no slot/focus payload, reverse message FK, provisional cohort blending or free-text target selection is introduced.
**Depends on:** W1-02; W2-01 (recorded policy).

### W2-03 — Add approved execution and observation schema

**Files:** `supabase/migrations/202609080004_week2_execution.sql`.
**Functions:** none; DDL only.
**Work:** Implement §7 tables/constraints/indexes, including issuance mode/window/dismissal and nullable item reasoning/revisit_condition. Remove planned slots/exposure-duration and expanded relationship records. Preserve Week 1 schema/history.
**Done:** Disposable forward migration passes; ownership and request uniqueness hold; decision provenance columns exist without invented backfill; no slot/history/conditional-wake/consolidation subsystem exists.
**Depends on:** W1-03/04; W2-01 (recorded policy).

### W2-04 — Implement input loading and explicit capacity mapping

**Files:** `apps/api/src/lib/engine-context.ts`.
**Functions:** `loadEngineSnapshot`, `estimateCapacity`, `toEngineInput`.
**Work:** Load single-domain/date-wake/blocks inputs and stored decision provenance. Apply §4 local capacity table; manual override wins. Use exposure 15 minutes/effort 1 without generating steps or persisting scoring defaults.
**Done:** Fixtures cover each time boundary/override, preserve NULL/zero raw effort and source IDs, and distinguish unsupported inputs from empty selection.
**Depends on:** W1-05/07/14; W2-02/03; W2-01 (recorded policy).

### W2-05 — Implement the authoritative scoring arithmetic

**Files:** `apps/api/src/lib/engine.ts`; `apps/api/src/lib/engine.test.ts`.
**Functions:** `validateEngineInput`, `effectiveEffort`, `urgencyMultiplier`, `blockageBonus`, `scoreCandidate`.
**Work:** Implement authoritative formula, computation-only zero/NULL effort=1, passed hard M=3, >30d M=1 and blocks-entry cap3. Use stored exposure effort1 without writeback.
**Done:** Mandatory arithmetic/boundary tests pass, including 9.6/20.46, repeated blocks entries and immutable zero/NULL effort rows.
**Depends on:** W1-01/02/21; W2-02; W2-01 (recorded policy).

### W2-06 — Implement sleep, irreversibility and NOW feasibility gates

**Files:** `apps/api/src/lib/engine.ts`; `apps/api/src/lib/engine.test.ts`.
**Functions:** `filterCandidates`, `selectIrreversibleOverride`, `fitsNow`.
**Work:** Implement candidate/date-wake gates, deterministic irreversible ties by earliest due/wake then ID, and NOW feasibility. Heavy items without exposure cannot be NOW; no generated step.
**Done:** Tests prove eligible override precedence outside E1, deterministic simultaneous winners, 15/1 exposure feasibility, no-exposure rejection and retained NEXT/ANCHOR eligibility where allowed.
**Depends on:** W2-05; W2-01 (recorded policy).

### W2-07 — Compose NOW/NEXT/ANCHOR and finish engine tests

**Files:** `apps/api/src/lib/engine.ts`; `apps/api/src/lib/engine.test.ts`.
**Functions:** `compareCandidates`, `composeTopThree`, `selectTriage`, `selectNow`.
**Work:** Implement top-relative 10% ties, normal diversity/heaviness composition, starvation-over-heaviness ANCHOR and E1 replacement selection. Flag §3 triage-display overlap before implementing that unresolved presentation branch.
**Done:** Mandatory tests prove deterministic ties, normal reservations, E1 selection replacing normal composition, no input mutation and distinct invalid/rest results. Triage display dependency is explicitly handed to W2-20, not guessed.
**Depends on:** W2-06; W2-01 (recorded policy).

### W2-08 — Implement explicit full-authority opt-in

**Files:** `apps/api/src/lib/onboarding.ts`; `apps/api/src/app/api/onboarding/authority/route.ts`.
**Functions:** `acceptFullAuthority`, `POST`.
**Work:** enforce completed setup, seven elapsed days and `{accept:true}`; set `full_authority_at` once. Do not use compliance to auto-upgrade.
**Done:** early acceptance rejected, eligible explicit acceptance succeeds, retry preserves timestamp, Later causes no mutation, and unauthorized access fails.
**Depends on:** W1-05/07. No unresolved cohort decision blocks this already-settled behavior.

### W2-09 — Implement the four-verb state matrix and postponement ladder

**Files:** `apps/api/src/lib/lifecycle.ts`; `apps/api/src/lib/lifecycle.test.ts`.
**Functions:** `planAction`, `planPostponement`.
**Work:** Implement §5: counts1/2 increment and clear NOW without slots; count3 task class conversion with retained status/event; decision postpone counter only. Task Done is unfocused; decision Done validates stored provenance. Explicit irreversible Drop/Shelf permitted. Clear wake/exposure on closure/shelf.
**Done:** Tests cover the full matrix, exactly-once conversion, active/scheduled parity, no scheduled-slot writes, missing decision provenance rejection, closure cleanup and replay/illegal-state behavior. B4/B5 data remains intact.
**Depends on:** W1-14/15; W2-02; W2-01 (recorded policy).

### W2-10 — Implement direct release and decision provenance writes

**Files:** `apps/api/src/lib/provenance.ts`.
**Functions:** `recordRelease`, `recordDecisionResolution`.
**Work:** Write direct M4 release and M2 resolution in the caller transaction. M2 copies already-populated item reasoning/revisit_condition; no model inference or derivative auto-compost. Flag missing production provenance-entry path.
**Done:** Linked M2/M4 rows and item transition roll back together; blank provenance is rejected; unrelated derivative items stay unchanged; no invented reasoning.
**Depends on:** W1-03/05; W2-02; W2-01 (recorded policy).

### W2-11 — Implement atomic action execution and replay

**Files:** `apps/api/src/lib/actions.ts`.
**Functions:** `applyItemAction`, `commitTransition`.
**Work:** Lock/revalidate, bind target/request, and atomically commit §5 fields/events/provenance/presentation invalidation. No rescheduling, focus creation or derivative cleanup. Persist outcome independently of Voice.
**Done:** Concurrent retries cannot double increment/convert/release; source snapshots unchanged; closure/shelf clears wake/exposure; failed Voice cannot replay mutation.
**Depends on:** W2-03/09/10/12; W2-01 (recorded policy).

### W2-12 — Persist directive presentation identity

**Files:** `apps/api/src/lib/directives.ts`.
**Functions:** `getOrCreatePresentation`, `markPresentationIssued`, `invalidatePresentations`.
**Work:** Persist stable candidates and mark issued only at client response handoff. Reuse across refresh; preserve mode/time and Skip dismissal. Action/hard override invalidates; NEXT stays hidden until completion and ANCHOR is public. Record §3 last-presented-role ambiguity.
**Done:** Internal computation alone has no issued_at; refresh preserves ID/time/body; responses bind original mode; dismissal survives GET. Same-item reselection after real Postpone is allowed. Unresolved role targeting is not inferred.
**Depends on:** W2-02/03; W2-01 (recorded policy). This ticket does not compute compliance.

### W2-13 — Implement Call B requests and the interactive Voice prompt

**Files:** `apps/api/src/lib/gemini.ts`; `apps/api/src/prompts/voice.md`.
**Functions:** `buildVoiceRequest`, `phraseOutcome`.
**Work:** Phrase predetermined outcomes only. Respect provisional authority, no corrective conversion challenge, fixed exposure facts and one-time release receipts. No target selection, ranking, nudge or provenance invention.
**Done:** Fake-provider inspection proves Call B receives facts/IDs/mode only and preserves Call A/B4; no model-generated decision reasoning or provisional accountability claim.
**Depends on:** W1-12; W2-02. W2-A9 fixes conversational/fallback behavior in §7.

### W2-14 — Wire the Voice guard and bounded failure handling

**Files:** `apps/api/src/lib/guard.ts`; `apps/api/src/lib/voice.ts`; `apps/api/src/lib/voice.test.ts`.
**Functions:** `checkVoiceOutput`, `stripRejectedSentences`, `renderVoice`, `buildFactualFallback`.
**Work:** Guard Call B, retry once, then return §7 fixed factual fallback. Permit only the immediate release receipt exception; persist committed factual receipt for replay.
**Done:** Tests cover banned/invented output, provisional restrictions, release exception, bounded retries and nonempty truthful fallback after every committed verb. No later dead-item resurfacing.
**Depends on:** W2-13; W2-01 (recorded policy).

### W2-15 — Implement shared Now service and endpoint

**Files:** `apps/api/src/lib/now.ts`; `apps/api/src/app/api/now/route.ts`.
**Functions:** `getNow`, `GET`.
**Work:** Join snapshot/selection/authority with stable presentation, issue at response handoff and guarded/fallback output. Reuse on refresh, expose ANCHOR, withhold NEXT until completion; keep failures distinct from rest.
**Done:** Repeated card/chat GET preserves ID/issuance and does not count follow-through; internal calculation does not issue; provisional wording and factual fallback work; no scores or premature NEXT disclosure.
**Depends on:** W2-04/07/08/12/14; W1-05; W2-01 (recorded policy).

### W2-16 — Implement directive response evidence and compliance reduction

**Files:** `apps/api/src/lib/directives.ts`; `apps/api/src/lib/compliance.ts`; `apps/api/src/app/api/directives/[id]/response/route.ts`; `apps/api/src/lib/compliance.test.ts`.
**Functions:** `recordDirectiveResponse`, `summarizeCompliance`, `POST`.
**Work:** Log all Start/Skip responses in both cohorts, deduplicate retries, retain late evidence. Followed is in-window Start; end at earlier local day-end/supersession. Derive separate full/provisional and pending/closed counts; no focus. Flag live denominator timing from §6 before publishing a rate.
**Done:** Tests prove full-only threshold cohort, original issuance mode, exact boundary handling, late-response retention, deduplication and NULL absent stats; Skip never postpones. Any unresolved live-rate timing is explicit; no self-throttle is implemented.
**Depends on:** W2-03/12; W2-01 (recorded policy).

### W2-17 — Expose four-verb API and source-linked action metadata

**Files:** `apps/api/src/app/api/items/[id]/action/route.ts`; `apps/api/src/lib/items.ts`.
**Functions:** `POST`, `listItemsBySourceMessage`.
**Work:** Authenticate four-verb requests without slot or inline decision-provenance payload; expose currently legal source-linked chips. Missing stored reasoning/revisit_condition rejects Decision Done visibly.
**Done:** API returns committed/replayed result or factual validation/conflict; no illegal stale chip can mutate; source-message lookup retained; irreversible explicit release/shelf accepted.
**Depends on:** W1-06; W2-11; W2-01 (recorded policy).

### W2-18 — Extend chat to shared Now/actions and guarded Voice

**Files:** `apps/api/src/lib/chat.ts`; `apps/api/src/app/api/chat/route.ts`.
**Functions:** `handleChat`, `commitCapture`, `parseChatCommand`, `resolveLastPresentedItem`, `POST`.
**Work:** Honor B4 clarification reply before fixed-command parsing. Match only §7 phrases; reuse Now/actions, bind last-presented target once per request and reject ambiguous/missing targets. Preserve capture and factual fallback receipts.
**Done:** Tests/evidence show exact grammar, no free-text target inference, stable retry target, B4 “done” reply compatibility and immutable B5 results. Flag simultaneous NOW/ANCHOR target rule before that branch is enabled.
**Depends on:** W1-13–16; W2-14/15/17; W2-01 (recorded policy).

### W2-19 — Add mobile Now/action/authority transport and state

**Files:** `apps/mobile/src/api.ts`; `apps/mobile/src/useNow.ts`; `apps/mobile/src/useChat.ts`.
**Functions:** `getNow`, `postItemAction`, `postDirectiveResponse`, `acceptFullAuthority`, `postChat`, `useNow`, `refreshNow`, `respond`, `act`, `useChat`.
**Work:** Keep retry identities and bound targets stable. Coordinate Start/Skip evidence, dismissal and action refresh; display committed fallback receipts. Preserve capture outbox and authority opt-in.
**Done:** Refresh generates no starts/extra issuance; Skip leaves postpone_count unchanged; Postpone refreshes after commit; retry target is stable; no focus/notification permissions added.
**Depends on:** W1-17/18; W2-08/15/16/17/18.

### W2-20 — Mount Now card, authority offer and action chips

**Files:** `apps/mobile/src/components/NowCard.tsx`; `apps/mobile/src/components/ItemActionChips.tsx`; `apps/mobile/src/components/AuthorityOffer.tsx`; `apps/mobile/app/chat.tsx`.
**Functions:** `NowCard`, `ItemActionChips`, `AuthorityOffer`, `ChatScreen`.
**Work:** Mount visible ANCHOR and current NOW, hide NEXT until NOW completes. Start/Skip remain voluntary in provisional mode; bind chips to IDs and show factual errors/fallback. Honor §3 triage/last-presented-role flags rather than selecting a policy silently.
**Done:** Normal-mode role visibility, voluntary controls, explicit opt-in and factual failure states verified; no focus/backlog/nudge UI. Flagged triage/target presentation branches cannot be claimed complete until separately clarified.
**Depends on:** W1-20; W2-19; W2-01 (recorded policy).

### W2-21 — Verify Week 2 transactions, APIs and authority boundaries

**Files:** `apps/api/src/lib/week2.integration.test.ts`.
**Functions:** `seedWeek2Fixture`, `cleanupWeek2Fixture`; integration test cases.
**Work:** Test transactions, issuance/refresh/dismissal, full/provisional Start windows, exact command routing, B4 clarification-word collision, third conversion, provenance validation, wake/exposure cleanup and guard fallback/replay.
**Done:** Fixtures prove no duplicate effects or immutable-history changes, no focus/slot writes, no provisional threshold credit, no auto-compost and explicit unresolved branch reporting.
**Depends on:** W2-03/08–18; Week 1 integration fixtures available.

### W2-22 — Record Week 2 delivery evidence and human handoff

**Files:** `docs/week-2-acceptance.md`.
**Functions:** none.
**Work:** Record engine/lifecycle/API/device evidence, all nine decisions, and actual Week 1 dependency commits. Document single-domain/date-wake/E2–E7 limitations and remaining §3/6 integration flags; do not fabricate user observations.
**Done:** Each delivery claim has evidence; B1–B5 hold; unresolved provenance-entry/triage-target/live-rate branches are named rather than counted complete. Human review/merge remains mandatory.
**Depends on:** W1-21/22; W2-05–21 as applicable. Human review/merge remains mandatory; this ticket does not auto-merge.

## 11. Ticket change register and handoff

All 22 original ticket IDs are retained. No ticket's Files list changes; additional helpers belong to files already named. Changes to Functions below mean named signatures/helpers; Work/Done changes include updated semantics of existing functions.

| Tickets | Files | Functions | Work | Done | Main effect |
| --- | --- | --- | --- | --- | --- |
| W2-01 | — | — | changed | changed | Record all nine decisions and flags. |
| W2-02 | — | contracts changed | changed | changed | Issuance, cohort, no slots, provenance, grammar. |
| W2-03 | — | — | changed | changed | Forward schema: identity/window/dismissal and provenance; remove slots. |
| W2-04 | — | — | changed | changed | Capacity constants and bounded inputs. |
| W2-05 | — | blockageBonus signature | changed | changed | Numeric defaults and blocks-entry count. |
| W2-06 | — | — | changed | changed | Override ties and exposure feasibility. |
| W2-07 | — | topScore parameter; selectTriage added | changed | changed | Ties, E1 and ANCHOR precedence. |
| W2-08 | — | — | unchanged | unchanged | Existing explicit authority opt-in remains settled. |
| W2-09 | — | planPostponement removes slot | changed | changed | No-slot ladder and lifecycle edges. |
| W2-10–11 | — | — | changed | changed | Stored provenance, atomic cleanup, no derivative compost. |
| W2-12 | — | markPresentationIssued added | changed | changed | Stable issuance, dismissal, roles. |
| W2-13 | — | — | changed | changed | Authority-correct factual Voice input. |
| W2-14 | — | buildFactualFallback added | changed | changed | Fixed output after bounded retries. |
| W2-15 | — | — | changed | changed | Return-boundary issuance and stable GET. |
| W2-16 | — | non-null CompliancePolicy | changed | changed | Both cohorts logged; full-only eligibility; Start windows. |
| W2-17 | — | — | changed | changed | Stored-provenance validation; no slots. |
| W2-18 | — | parser/target binder added | changed | changed | Exact commands, retry binding, B4 compatibility. |
| W2-19–22 | — | — | changed | changed | Mobile behavior, regression evidence and explicit limitations. |

This updates planning documents only. No application code, SQL migration, real-device test, real-capture evaluation or issue-tracker mutation was performed. Week 1 remains a dependency, not a claimed completed build. The nine decisions are resolved; the narrower integration flags remain visible and must not be silently decided by implementation agents.
