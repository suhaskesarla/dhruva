# Dhruva — Week 1 decisions

Date: 8 September 2026. Decided by: Suhas (owner).

Status: **B1–B5 resolved.** These five decisions override overlapping wording in the Week 1 plan and BUILDING Addendum v1. The addendum and BUILDING.md retain their existing precedence elsewhere. No other finding is reopened in this record.

## B1 — Notification permission belongs to Week 3

**Decision:** Defer notification-permission prompting entirely to Week 3, alongside push delivery.

**Week 1 effect:** W1-19 confirms timezone/domain values, accepts optional initial facts, explains provisional mode and completes setup. It contains no notification permission prompt, permission-request/check API, or push registration. Setup proceeds to Chat without a notification decision.

**Downstream flag:** remove permission behavior from the `SetupScreen` contract and W1-19's work/done-condition; no schema change. The Week 3 handoff must include permission prompting when push delivery is implemented. This record does not design that later work.

## B2 — PKCE code exchange only

**Decision:** Use PKCE code exchange for the Supabase magic-link callback, not implicit token return.

**Contract:** initialize the Auth client with `flowType:'pkce'`; request the magic link with `shouldCreateUser:false` and `emailRedirectTo:'dhruva://auth/callback'`. Persist the SDK's verifier through the email round trip/restart. The installed app handles the returned code through `exchangeCodeForSession(code)`, then stores the resulting session in the configured secure native storage. Do not implement an implicit-token or `setSession` fallback. Missing verifier, invalid/expired/reused code returns to sign-in/resend.

**Downstream flag:** W1-09–11 configure/implement this settled flow, including its Supabase email-template/redirect setup. `getAuthClient`, `completeMagicLink` and the secure-storage contract must agree. No database migration change.

## B3 — Items reference their original source message

**Decision:** Invert the relationship: `items.source_message_id` is the FK to `messages.id`. Remove `messages.item_id` and `item_id` from `MessageDTO`. The UI queries items by `source_message_id`. Every derived item's `raw_text` remains the **full original message**.

**Contract:** use owner-authenticated `GET /api/items?source_message_id=<original-user-message-id>`; return item metadata without adding a backlog UI or direct mobile database access. Several items can reference the same original message. Clarification never changes the original FK or raw text; canonical text remains item-specific.

**Downstream migration flag:** revise the supplied draft migration to omit `messages.item_id`, add `items.source_message_id uuid REFERENCES messages(id)` and a nonunique lookup index. The FK is nullable for pre-existing/non-capture rows, but every Week 1 capture-created item must populate it. The existing `memories.source_message_id` remains separate and unchanged. If an earlier version was already applied elsewhere, use a forward migration/backfill rather than rewriting applied history; the draft has not been executed here.

**Affected work:** W1-02/03/06 and W1-13–18/20. Add `ItemDTO`, the source-query API/function and mobile adapter; remove all reverse-FK assumptions from history and clarification targeting.

## B4 — One clarification round per original capture turn

**Decision:** Ask at most one clarifying question per capture turn regardless of how many items are ambiguous, following the system prompt's existing single-question rule. Allow the clarification answer to overwrite item fields once within that same logical intake turn. If still vague, store/retain `needs_clarification` and stop.

**Contract consequences:**

- Call A's initial result array permits at most one non-null clarification question, selecting the single most valuable question. Other ambiguous items stay `needs_clarification`; do not ask one question per item.
- The answer is stored as a new message with `reply_to_message_id` referencing the assistant question, but continues the original capture turn rather than creating a duplicate item.
- Because messages no longer carry `item_id`, use an existing `item_events` record of kind `clarification_requested`: its item FK identifies the target, and payload `{original_message_id, question_message_id}` identifies the turn/question. The server validates source ownership.
- Apply the one permitted overwrite of classifier-managed fields while preserving item identity, source-message FK, full original raw text and original first-pass output. Store answer output on its own message. Record `clarification_applied` with `{original_message_id, question_message_id, answer_message_id}` under an original-message lock in the same transaction as the update.
- A still-vague answer ends the round with `needs_clarification` and no further question. Identical retries replay; a different answer to the consumed question cannot overwrite again. Answer-mode classifier validation permits zero new questions.

**Downstream flag:** W1-14 maps initial outputs to source-linked items; W1-15 implements the single round; W1-16 enforces its atomic, once-only application. Update `ClarificationContext`, `IntakeWritePlan`, `ClassifierInput.phase`, `parseClassification` and `buildReceipt`. Existing event kinds/payloads support this; no separate clarification table is required. These are specified contracts, not implemented runtime code.

## B5 — Item-level, first-pass acceptance

**Decision:** The gate unit is one classified item, not one submitted message. Correct means destiny matches expected judgment and, for tasks, the rewrite needs no manual edit. Report first-pass results only, before any clarification round.

**Contract:** evaluate 20 classified item-level outputs from real captures; at least 16 must pass. A multi-item message contributes multiple units. A MEMORY candidate remains a logical classified output even though it does not create an `items` row. Use `(original_message_id, result_index)` as the evaluation identity, with a DB item ID where applicable.

Keep the original message's `intake_results` immutable once initial classification completes. Existing `classified` events map created items to `{source_message_id, result_index}`. Later clarification output belongs to the answer message and cannot replace the original assessment. Record expected/actual destiny and task-rewrite-edit-needed against that initial snapshot. Other metadata accuracy and persistence checks are separate from this metric.

**Downstream flag:** W1-14/16 preserve the snapshot before any allowed item overwrite. W1-21 checks its immutability. W1-22 reports exactly 20 item-level first-pass results and the passing count; no message-count denominator, clarification-round samples or retroactively corrected results. Update the planned `docs/week-1-acceptance.md` template accordingly; no real capture evaluation has been run in this documentation pass.

## Handoff status

The Week 1 plan and supplied draft conversation migration have been updated to reflect these decisions. The plan now contains the affected contract/function signatures and revised tickets, particularly W1-14–16, W1-19 and W1-22. Runtime contracts, routes, screens and ticket implementations still need to be built in the actual repository; no repository was supplied or changed here.
