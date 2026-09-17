# Dhruva — Week 2 decisions

8 September 2026. Decided by the owner. **W2-A1–W2-A9 resolved as recorded below.** These decisions override overlapping Week 2 draft/spec wording; they do not override or reopen B1–B5. Elsewhere the addendum retains precedence over BUILDING.md. This is a planning update, not implementation.

## W2-A1 — Compliance cohort

**Decision:** Log every response in both authority periods. Only full-authority presentations contribute to the actual 50%/30% self-throttle statistics. Followed means Start tapped before supersession and before local end of day; the earlier boundary closes the window. No focus_started prerequisite.

**Downstream change:** Store issuance mode and response times; separate provisional observations from eligible full-authority statistics. Implement measurement only, not throttling.

## W2-A2 — Directive identity

**Decision:** Issue at the server return-to-client boundary, not internal computation. Reuse the result until an action or hard override changes it; GET refresh never issues a replacement by itself. Skip dismisses the presentation without changing postpone_count. NEXT reveals only when NOW completes; ANCHOR remains visible throughout.

**Downstream change:** Persist stable presentation ID, issued_at, superseded_at and dismissed_at. Keep NEXT server-side until reveal; include ANCHOR in the public presentation.

## W2-A3 — Numeric edge cases

**Decision:** At scoring time only, use effort 1 for zero/NULL; never write that default back. Hard deadlines beyond 30 days use 1.0; passed hard deadlines use 3.0. A tie is within 10% of the top score. Simultaneous irreversible winners use earliest due/wake time, then stable item ID. E1 triage replaces normal Top-3 composition entirely. Starvation beats heaviness when choosing ANCHOR.

**Downstream change:** Add exact pure-function fixtures; keep top-score reference explicit in tie comparison. No schema normalization/backfill.

## W2-A4 — Capacity mapping

**Decision:** Use a local-time heuristic with mornings highest and capacity tapering through the day; a set manual 1–5 override always wins. Stored exposure steps have fixed duration 15 minutes and effort 1. A heavy item without an exposure step is infeasible for NOW this week; do not generate one.

**Downstream change:** Use the concrete table in plan §4. Constants need no exposure duration/effort columns or generator.

## W2-A5 — Postponement without slots

**Decision:** No scheduled-slot columns this week. Postpone increments postpone_count and clears current NOW assignment; the next engine call reselects. This is identical for scheduled and active items. On closure or shelving clear wake_at and exposure_step.

**Downstream change:** Remove slot types/parameters and rescheduling writes. Preserve due_at; postponement alone does not clear wake/exposure.

## W2-A6 — Lifecycle edges

**Decision:** Third TASK postponement changes class to decision, preserves the existing nonterminal status, and emits converted_to_decision. Task Done needs no focus block. Decision Done requires already-populated reasoning and revisit_condition; reject missing/blank values. Decision Postpone increments only, with no ladder. Explicit Drop/Shelf is allowed for irreversible items.

**Downstream change:** Add nullable items.reasoning and items.revisit_condition for stored provenance; validate before mutation and copy to M2 on resolution. Do not introduce a converted_to_decision status or exposure-completion action.

## W2-A7 — Input relationships

**Decision:** Use one domain per item this week. Blockage bonus counts entries in the existing blocks array, capped at 3. Wakes are date-only; event/conditional wakes are not supported. Defer E2–E7 history-dependent behavior to Week 3+.

**Downstream change:** No multi-domain join table, dependency-graph inference, conditional-wake storage or history subsystem is added. Document these limitations in acceptance.

## W2-A8 — Memory side effects

**Decision:** The one-time release receipt is a chat confirmation, exempt from the ban on resurfacing dead items. Do not auto-compost derivative errands when resolving a decision this week.

**Downstream change:** Keep synchronous M4/M2 writes and the transaction-bound receipt; no derivative traversal or changes to memory.ts/consolidation.

## W2-A9 — Chat grammar and fallback

**Decision:** Recognize only the fixed commands “what now”, “done”, “drop it”, “postpone”, and “shelf it”. “what now” uses /api/now; action commands target the last-presented item, without free-text item selection. After bounded guard retries fail, return a fixed factual string, never silence after a committed mutation.

**Downstream change:** Parse commands deterministically, bind the target once for retry safety, and persist factual fallback receipts. Preserve B4 reply routing; see compatibility flags below.

### Compatibility and remaining integration flags

These are implementation boundaries, not a reopening of the nine recorded decisions or B1–B5.

- **A9/B4 overlap:** a message explicitly replying to the existing intake question is governed by B4 even if its text is “done”. An unconditional command parser would conflict with Week 1. Preserve the explicit reply route before command parsing; do not silently override either contract. W2-02/18/21 must cover this case.
- **A6 schema prerequisite:** Week 1 has no `items.reasoning` or `items.revisit_condition`; the analogous memory columns do not populate an unresolved item. Add the item columns in the new Week 2 migration. No Week 1 classifier change or provenance-entry UI is authorized here. The production path that populates these fields is still unspecified; reject absent values and flag this limitation in W2-10/17/22 instead of inventing reasons.
- **A2/A3 overlap:** E1 replaces normal Top-3 composition, while A2 requires ANCHOR visible throughout. Whether an existing ANCHOR remains visible as context during E1, or triage has a distinct ANCHOR presentation, is not specified. W2-07/20 must flag this specific triage-display question before implementing that branch; normal-mode visibility is settled.
- **A9 target boundary:** NOW and ANCHOR can both be visible. Which role supplies “last-presented item” in that simultaneous presentation is not specified. W2-12/18/20 must record a targeting rule before enabling unbound chat actions for that case; explicit item-bound chips remain unambiguous. Never infer a target from Voice text.
- B1 notification timing, B2 PKCE, B3 source FK/full raw text, B4 one clarification, and B5 immutable first-pass acceptance stay unchanged. In particular, lifecycle cleanup changes current item fields, never original intake snapshots. Converted tasks may retain `active`/`scheduled`; fresh Week 1 decisions retain `open`. Admit both without rewriting Week 1 rows.

The rate denominator timing for still-open windows remains an integration detail to flag before W2-16 reports a live rate; log all evidence now, without implementing self-throttle. The exact capacity intervals are supplied in plan §4 as the concrete implementation of A4's qualitative rule.

## Affected ticket fields

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


No implementation or applied migration was changed. See the updated plan for the exact revised tickets and signatures.
