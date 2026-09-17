# Dhruva — Week 1 file-and-function plan

8 September 2026; revised to record the owner’s B1–B5 decisions. `docs/week-1-decisions.md` governs these five points; BUILDING-Addendum-v1.md overrides BUILDING.md elsewhere on overlapping decisions; BUILDING.md governs the remainder. This is a proposed implementation breakdown, not implemented application code. The separately supplied SQL migration is the sole implementation artifact requested in this pass.

## 1. Week 1 boundary

Deliver an Expo app that authenticates the pre-created owner, accepts real captures, persists the conversation, calls Gemini **Call A only**, and stores classified items/events or MEMORY candidates. The acceptance target is **20 classified items from real captures, at least 16 correct on first pass**. Correct means the destiny matches expected judgment and, for TASK outputs, the rewrite needs no manual edit. Count before any clarification round, not by submitted message.

The existing five skeleton files are treated as given, but no repository was supplied for inspection. Paths below are the exact proposed target layout under the addendum's `apps/mobile` and `apps/api`; confirm their mapping to the actual scaffold in ticket W1-01. Do not overwrite existing bodies or relocate working code blindly.

| Skeleton | Week 1 change |
| --- | --- |
| `apps/api/src/lib/gemini.ts` | Implement only Call A, validation, one validation retry and the specified fallback. |
| `apps/api/src/lib/lifecycle.ts` | Intake writes only: capture, classification and clarification-related updates/events. No scheduling or action verbs. |
| `apps/api/src/lib/guard.ts` | Validate the optional classifier-generated clarification before display; no nudge/Voice machinery. |
| `apps/api/src/lib/engine.ts` | Untouched; not imported by Week 1 routes. |
| `apps/api/src/lib/memory.ts` | Untouched; MEMORY outputs stay in `messages.intake_results`. No retrieval or consolidation. |

No `/api/now`, focus controls, task-action chips, scoring, nudges, Expo Push registration, cron handlers, review UI, or Call B/C. Baseline SQL may create the original inert `nudges`/`reviews` tables because the requested messages migration references them; that is schema scaffolding, not implementation of those systems.

## 2. B1–B5 resolved — owner decisions

All five decisions are recorded in `docs/week-1-decisions.md` and incorporated below. They are no longer blockers.

| ID | Recorded decision | Downstream change |
| --- | --- | --- |
| B1 | Notification-permission prompting is entirely deferred to Week 3 alongside push delivery. | W1-19 has no permission prompt or permission APIs; keep only timezone, values, optional facts and provisional-mode explanation. |
| B2 | Use Supabase PKCE code exchange only. | Configure `flowType:'pkce'`, persist the verifier through the email round trip, and call `exchangeCodeForSession(code)` at `dhruva://auth/callback`. W1-10/11 implement this settled choice. |
| B3 | Each item carries `source_message_id` referencing the original message; `raw_text` is the full original message. | Remove `messages.item_id` and `MessageDTO.item_id`; add indexed `items.source_message_id`; fetch items through an authenticated source-message query. Clarification retains original provenance. |
| B4 | At most one clarifying question per original capture turn, even for multiple ambiguous items; allow one answer-driven overwrite of item fields. If still vague, retain `needs_clarification` and stop. | W1-14–16 preserve item identity/provenance and enforce one clarification round transactionally. Original first-pass output remains immutable for B5. |
| B5 | Gate unit is one classified item. Correct = expected destiny; TASK also requires an unedited usable rewrite. First-pass results only. | W1-22 evaluates 20 item-level outputs, not 20 messages, and does not replace initial results with corrected item fields. |

No other finding is reopened or resolved in this revision.

## 3. Exact file manifest

Only these authored/configured files are needed for this plan; generated build outputs are excluded. `onboarding` files are the minimal addendum prerequisite, with no notification permission behavior, not the later authority engine.

| Area | Exact files |
| --- | --- |
| Workspace | `package.json`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`; `tsconfig.base.json`; `.gitignore`; `README.md` |
| Week 1 contracts/records | `docs/week-1-decisions.md`; `docs/week-1-acceptance.md` |
| Shared types | `packages/contracts/package.json`; `packages/contracts/tsconfig.json`; `packages/contracts/src/index.ts` |
| Database | `supabase/config.toml`; `supabase/migrations/202609080001_base.sql`; `supabase/migrations/202609080002_conversations_messages.sql`; `supabase/migrations/202609080003_week1_setup_access.sql` |
| API config | `apps/api/package.json`; `apps/api/tsconfig.json`; `apps/api/next-env.d.ts`; `apps/api/next.config.ts`; `apps/api/.env.example` |
| API routes | `apps/api/src/app/api/chat/route.ts`; `apps/api/src/app/api/items/route.ts`; `apps/api/src/app/api/conversations/current/route.ts`; `apps/api/src/app/api/conversations/[id]/messages/route.ts`; `apps/api/src/app/api/onboarding/route.ts`; `apps/api/src/app/api/onboarding/complete/route.ts` |
| API support | `apps/api/src/lib/env.ts`; `apps/api/src/lib/auth.ts`; `apps/api/src/lib/db.ts`; `apps/api/src/lib/conversations.ts`; `apps/api/src/lib/items.ts`; `apps/api/src/lib/chat.ts`; `apps/api/src/lib/onboarding.ts`; `apps/api/src/lib/gemini.ts`; `apps/api/src/lib/lifecycle.ts`; `apps/api/src/lib/guard.ts` |
| Mobile config | `apps/mobile/package.json`; `apps/mobile/tsconfig.json`; `apps/mobile/app.json`; `apps/mobile/eas.json`; `apps/mobile/.env.example` |
| Mobile screens | `apps/mobile/app/_layout.tsx`; `apps/mobile/app/index.tsx`; `apps/mobile/app/sign-in.tsx`; `apps/mobile/app/auth/callback.tsx`; `apps/mobile/app/setup.tsx`; `apps/mobile/app/chat.tsx` |
| Mobile support | `apps/mobile/src/auth.tsx`; `apps/mobile/src/storage.ts`; `apps/mobile/src/api.ts`; `apps/mobile/src/useChat.ts` |
| Targeted verification | `apps/api/vitest.config.ts`; `apps/api/src/lib/gemini.test.ts`; `apps/api/src/lib/chat.integration.test.ts` |

Configuration files contain no application functions: workspace scripts/dependency pins, TypeScript settings, static Next config, Expo scheme/identifiers, EAS development profiles and environment examples. `next-env.d.ts` is generated by Next. Use a mutually compatible Expo/React Native dependency set and commit the lockfile; do not independently pin arbitrary latest React versions.

Vercel project root is `apps/api`; EAS builds `apps/mobile`. The API is Node runtime, using a server-only `pg` connection pool against Supabase's configured Postgres endpoint so short transactions are real database transactions. Pool/connection configuration must fit the selected Supabase deployment; no mobile database credentials. [Supabase connection guidance](https://supabase.com/docs/guides/database/connecting-to-postgres)

`202609080001_base.sql` transcribes BUILDING §1.1 without behavioral additions. `202609080002_conversations_messages.sql` is the supplied executable migration. `202609080003_week1_setup_access.sql` adds only the addendum's `onboarding_state`, makes `domains.starvation_days` nullable, and enables RLS/revokes direct `PUBLIC`, `anon`, and `authenticated` table/sequence access for application tables created by the baseline/setup migrations. The API connection must retain server access. No client-access policies, push tables, seed biography, cron functions or consolidation functions.

## 4. Shared contracts

The shared file exports types and Zod schemas, not a database client or secrets. All signatures below are declarations only. `UUID` and `ISODateTime` are validated strings; `Tx` is a transaction-bound database client; `Owner` is the authenticated server identity. API DTOs do not expose classifier scores/candidates to the Chat UI.

| Type / schema in `packages/contracts/src/index.ts` | Required contract |
| --- | --- |
| `DomainId` | `work|parents|family|health|finance|spirituality|learning|building`. |
| `IntakeResult` / `intakeResultsSchema` | Discriminated array: four item destinies with BUILDING Call A fields; `memory` with the addendum's candidate object. Validate 0–5 classifier inputs without inventing scoring behavior. |
| `CaptureRequest` / `captureRequestSchema` | `{conversation_id, message_id, text, reply_to_message_id?}`; UUIDs validated, text nonempty, raw text retained. |
| `MessageDTO` | `{id, conversation_id, role, body, created_at, reply_to_message_id, processing_status}`. Exclude `intake_results` from public history. |
| `ItemDTO` / `ItemsBySourceReply` | `{id, source_message_id, canonical_text, status}` / `{items:ItemDTO[]}`; fetch by original message ID, never from `MessageDTO.item_id`. Internal metadata supports clarification targeting without displaying classification labels or a backlog. |
| `CaptureReply` | `{user_message_id, assistant_message_id, reply, ui_actions:[]}`; success means stored classification and reply, not merely model completion. |
| `ConversationDTO`, `MessagePage` | `{id,created_at}` and `{messages:MessageDTO[], next_cursor:string|null}`. |
| `OnboardingInput` / `onboardingInputSchema` | Exact addendum completion payload: timezone, all eight domain settings, optional initial facts. Validate IANA TZ, positive finite weights, positive integer thresholds or NULL. |
| `OnboardingView` | `{state:'setup'|'provisional'|'full', completed_at, full_authority_at, eligible_for_full_authority, timezone, domains}`. No authority transition route this week. |
| `LocalCapture` | Capture request plus owner identity and local delivery state; preserves UUID/text/reply reference across restarts. |
| `ApiError` | `{code,message,retryable}`; no provider stack traces or credentials. |

B3/B4 contract consequences:

- `items.source_message_id` always references the original user capture. All derived items keep that message’s full text as `raw_text`; item-specific wording belongs in `canonical_text`. Multiple items may share one source. The UI calls `GET /api/items?source_message_id=<original-user-message-id>`; direct Supabase reads remain forbidden.
- Original `messages.intake_results` is the immutable first-pass snapshot. Each item’s existing `classified` event records `{source_message_id, result_index}` to map it to that array without changing the classifier payload. A MEMORY candidate is identified by the same message/index pair without creating an item row.
- Call A may return at most one non-null `clarifying_question` across the whole initial result array, selecting the single most valuable question as the system prompt requires. Other ambiguous items remain `needs_clarification`; they do not generate extra questions. In answer mode no new question is allowed.
- `ClarificationContext` contains `{original_message_id, question_message_id, target_item_id, applied}`. Record the selected target in an existing `item_events` row of kind `clarification_requested`, with `{original_message_id, question_message_id}` in its payload; the event’s `item_id` points to the target. This replaces the removed message-to-item FK.
- `IntakeWritePlan` distinguishes initial writes from a single clarification update. The answer is its own persisted message referencing the assistant question, but belongs to the original logical capture turn. Update eligible classifier-managed item fields once, preserving `id`, `source_message_id`, `raw_text` and the original first-pass snapshot. Save answer output on the answer message, not over the original array. If still vague, set/retain `needs_clarification` and acknowledge without another question.
- The completion transaction locks the original capture, checks for a `clarification_applied` event keyed by the original/question pair, and writes that event with `{original_message_id, question_message_id, answer_message_id}` alongside the update. Identical retries replay the stored result; another answer to the consumed question cannot perform a second overwrite. These are existing event payloads, not additional tables or a new item FK on messages.

## 5. File-by-file function signatures

### API infrastructure and routes

| File (relative to `apps/api/src/`) | Signature | Responsibility |
| --- | --- | --- |
| `lib/env.ts` | `readServerEnv(): ServerEnv` | Validate `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `OWNER_USER_ID`, `GEMINI_API_KEY`, and `GEMINI_MODEL` server configuration. |
| `lib/auth.ts` | `requireOwner(request: Request): Promise<Owner>` | Verify bearer token using Supabase Auth and reject any verified user other than `OWNER_USER_ID`. |
| `lib/db.ts` | `getPool(): Pool` | Return the server-only PostgreSQL pool. |
| `lib/db.ts` | `withTransaction<T>(work: (tx: Tx) => Promise<T>): Promise<T>` | Run short transactional work with commit/rollback and release the connection. |
| `lib/conversations.ts` | `getOrCreateConversation(owner: Owner): Promise<ConversationDTO>` | Atomically return the singleton, including concurrent first opens. |
| `lib/conversations.ts` | `listMessages(owner: Owner, conversationId: UUID, before: string|null, limit: number): Promise<MessagePage>` | Return an authenticated page, ordered chronologically, with a stable timestamp/UUID cursor. |
| `lib/items.ts` | `listItemsBySourceMessage(owner: Owner, sourceMessageId: UUID): Promise<ItemsBySourceReply>` | Verify the original user message and return its derived items through `items.source_message_id`. |
| `lib/conversations.ts` | `beginCapture(owner: Owner, input: CaptureRequest): Promise<BeginCaptureResult>` | Persist pending input before Gemini; return a completed replay or reject conflicting ID reuse. |
| `lib/conversations.ts` | `loadCaptureContext(owner: Owner, input: CaptureRequest): Promise<CaptureContext>` | Load timezone, up to ten recent eligible item titles, and the referenced clarification context. |
| `lib/conversations.ts` | `markCaptureFailed(owner: Owner, messageId: UUID): Promise<void>` | Mark a retriable infrastructure failure without erasing the input or overwriting a concurrently completed turn. |
| `lib/chat.ts` | `capture(owner: Owner, input: CaptureRequest): Promise<CaptureReply>` | Orchestrate durable admission, Call A, guarded receipt and transactional finalization. |
| `lib/chat.ts` | `commitCapture(owner: Owner, input: CaptureRequest, result: ClassificationAttempt): Promise<CaptureReply>` | Lock the processing message and, for an answer, the original capture; reuse completion or enforce one clarification update before writing results/events/reply atomically. |
| `lib/chat.ts` | `buildReceipt(context: CaptureContext, result: ClassificationAttempt): ReceiptPlan` | Produce a fixed acknowledgment; allow one initial question per capture turn and no question after its answer; never call Voice. |
| `app/api/items/route.ts` | `GET(request: Request): Promise<Response>` | Authenticate, require a valid `source_message_id` query parameter and return items for that source only. |
| `app/api/chat/route.ts` | `POST(request: Request): Promise<Response>` | Authenticate, validate capture payload, run `capture`, and map errors/status codes. |
| `app/api/conversations/current/route.ts` | `GET(request: Request): Promise<Response>` | Authenticate and return/create the singleton. |
| `app/api/conversations/[id]/messages/route.ts` | `GET(request: Request, context: {params: Promise<{id:string}>}): Promise<Response>` | Authenticate, validate cursor/limit and return history. |

No `engine.ts` or `memory.ts` function is needed to serve these routes. Existing `GET /api/now` is not implemented or mocked into production.

### Classifier and intake-only skeleton changes

| File (relative to `apps/api/src/`) | Signature | Responsibility |
| --- | --- | --- |
| `lib/gemini.ts` | `classifyCapture(input: ClassifierInput): Promise<ClassificationAttempt>` | Perform Call A, retry once on schema/display-validation failure, then return the documented fallback. |
| `lib/gemini.ts` | `buildClassifierRequest(input: ClassifierInput, validationError?: string): ClassifierRequest` | Frame raw text/recent titles as data and request the five-destiny structured result. |
| `lib/gemini.ts` | `parseClassification(raw: unknown, phase: 'initial'|'clarification'): IntakeResult[]` | Zod-validate output and enforce at most one initial question / zero answer-round questions; distinguish validation from transport failure. |
| `lib/gemini.ts` | `makeClassificationFallback(rawText: string): ClassificationAttempt` | Describe one task needing clarification after two invalid outputs, without inventing a next action. |
| `lib/guard.ts` | `validateClarification(text: string): string[]` | Return display-rule violations so Call A can use its single bounded retry; no Voice rewrite call. |
| `lib/lifecycle.ts` | `planIntake(context: CaptureContext, result: ClassificationAttempt): IntakeWritePlan` | Map initial results to source-linked items or the one permitted answer-driven update; retain provenance and first-pass evidence. |
| `lib/lifecycle.ts` | `applyIntake(tx: Tx, originalMessageId: UUID, processingMessageId: UUID, plan: IntakeWritePlan): Promise<IntakeWriteResult>` | Create source-linked items or update the existing target once; store results on the processing message while preserving the original first-pass snapshot. |

`ClassifierInput` contains `phase:'initial'|'clarification'`, the current submitted text, original capture text/identity and targeted item context when clarifying, up to ten eligible recent titles, and server-known capture time/timezone. Initial and answer-round output limits follow the phase; the answer cannot create another clarification round. Call A's optional `exposure_step` field may be stored if returned; do not add an exposure-generation call, scheduler or scoring function. No medical, financial or family specifics are invented to satisfy the delegation test.

For unambiguous fresh intake: clear task → `active`; vague task → `needs_clarification`; clear decision → `open` per BUILDING §1.3; ambient/compost → `captured`, outside task action behavior. Each created item receives `captured` and `classified` events, plus `rewritten` when a canonical rewrite is actually made. MEMORY produces no item/event obligation. On initial capture, the second-invalid-output fallback creates a task in `needs_clarification`, with `classified` event payload recording fallback rather than claiming successful model judgment. On an answer-round validation fallback, retain the existing target as `needs_clarification`, consume that round and create no duplicate fallback task. After the one permitted clarification update, a still-vague target stays `needs_clarification`; other unresolved items stay there too, and the turn asks no further question.

### Minimal first-run dependency

| File (relative to `apps/api/src/`) | Signature | Responsibility |
| --- | --- | --- |
| `lib/onboarding.ts` | `getOnboarding(owner: Owner, now: Date): Promise<OnboardingView>` | Read setup/provisional state and addendum defaults; never auto-upgrade authority. |
| `lib/onboarding.ts` | `completeOnboarding(owner: Owner, input: OnboardingInput): Promise<OnboardingView>` | In one transaction write confirmed domains, timezone, optional declared M1 facts, and completion once. |
| `app/api/onboarding/route.ts` | `GET(request: Request): Promise<Response>` | Return authenticated setup state. |
| `app/api/onboarding/complete/route.ts` | `POST(request: Request): Promise<Response>` | Validate and persist the minimal first-run setup. |

Writing explicitly supplied initial facts is the addendum's setup requirement, not nightly memory consolidation. `/api/onboarding/authority` is absent this week: no directives are being issued, and no seven-day transition is needed to demonstrate capture.

### Expo authentication, storage and transport

| File (relative to `apps/mobile/`) | Signature | Responsibility |
| --- | --- | --- |
| `src/storage.ts` | `authStorage.getItem(key: string): Promise<string|null>` | Read SDK session material from OS-backed secure storage. |
| `src/storage.ts` | `authStorage.setItem(key: string, value: string): Promise<void>` | Persist session material with support for full SDK payload size. |
| `src/storage.ts` | `authStorage.removeItem(key: string): Promise<void>` | Remove a stored auth value. |
| `src/storage.ts` | `readOutbox(ownerId: UUID): Promise<LocalCapture[]>` | Load durable pending captures for this owner. |
| `src/storage.ts` | `putOutboxCapture(capture: LocalCapture): Promise<void>` | Persist a capture before displaying it as submitted. |
| `src/storage.ts` | `removeOutboxCapture(ownerId: UUID, messageId: UUID): Promise<void>` | Remove only after confirmed server completion. |
| `src/storage.ts` | `savePendingDestination(path: '/chat'|'/setup'): Promise<void>` | Remember an allowed destination across the email-app round trip. |
| `src/storage.ts` | `takePendingDestination(): Promise<'/chat'|'/setup'|null>` | Consume the saved internal destination after authentication. |
| `src/auth.tsx` | `getAuthClient(): SupabaseClient` | Create an Auth-only client with persistent native storage and automatic URL detection disabled and `flowType:'pkce'`. |
| `src/auth.tsx` | `requestMagicLink(email: string): Promise<void>` | Call `signInWithOtp` with `shouldCreateUser:false` and `emailRedirectTo:'dhruva://auth/callback'`. |
| `src/auth.tsx` | `completeMagicLink(url: string): Promise<Session>` | Validate the PKCE callback code/error, then call `exchangeCodeForSession(code)` using the persisted verifier; never accept implicit token-return callbacks. |
| `src/auth.tsx` | `AuthProvider(props: {children: ReactNode}): React.JSX.Element` | Restore session, subscribe to auth changes and manage foreground token refresh. |
| `src/auth.tsx` | `useAuth(): AuthContextValue` | Expose loading/session/sign-in error state to screens. |
| `src/api.ts` | `requestApi<T>(path: string, options?: ApiRequestOptions): Promise<T>` | Attach the current access token, map errors, refresh/retry auth once and preserve capture IDs. |
| `src/api.ts` | `getCurrentConversation(): Promise<ConversationDTO>` | Call the singleton endpoint. |
| `src/api.ts` | `getMessages(id: UUID, before?: string): Promise<MessagePage>` | Load a chronological history page. |
| `src/api.ts` | `getItemsBySourceMessage(sourceMessageId: UUID): Promise<ItemsBySourceReply>` | Fetch derived item metadata through the authenticated source-message endpoint. |
| `src/api.ts` | `postCapture(input: CaptureRequest): Promise<CaptureReply>` | Submit/retry the same persisted capture identity. |
| `src/api.ts` | `getOnboarding(): Promise<OnboardingView>` | Load first-run state. |
| `src/api.ts` | `completeOnboarding(input: OnboardingInput): Promise<OnboardingView>` | Submit the declared setup choices. |

Use `expo-secure-store` for the auth adapter with an SDK-payload round-trip check; avoid assuming every session fits one storage entry. Pending capture bodies/destinations use persistent native app storage (for example AsyncStorage); do not log them or place them in auth URLs. This choice provides restart durability, not a new long-term retention policy.

### Expo screens and Chat state

| File (relative to `apps/mobile/`) | Signature | Responsibility |
| --- | --- | --- |
| `app/_layout.tsx` | `RootLayout(): React.JSX.Element` | Mount AuthProvider and route stack; keep auth callback accessible before session restoration completes. |
| `app/index.tsx` | `IndexScreen(): React.JSX.Element` | Route restored sessions to setup/chat and unauthenticated launches to sign-in. |
| `app/sign-in.tsx` | `SignInScreen(): React.JSX.Element` | Email entry, send-link feedback, resend/error state; no password or signup UI. |
| `app/auth/callback.tsx` | `AuthCallbackScreen(): React.JSX.Element` | Exchange the PKCE code once, then resume setup/chat; failures return to sign-in. |
| `app/setup.tsx` | `SetupScreen(): React.JSX.Element` | Confirm timezone/domain defaults, accept optional life facts and explain provisional mode; no notification-permission prompt or permission calls. |
| `app/chat.tsx` | `ChatScreen(): React.JSX.Element` | Native message history, capture input, send/retry indicators and clarification reply targeting. |
| `src/useChat.ts` | `useChat(conversationId: UUID): ChatState` | Coordinate history, optimistic local messages, the durable outbox and foreground refresh. |
| `src/useChat.ts` | `submitCapture(text: string, replyTo?: UUID): Promise<void>` | Returned hook action: allocate one ID, persist locally, then send. |
| `src/useChat.ts` | `retryCapture(messageId: UUID): Promise<void>` | Returned hook action: resend the original envelope without duplicating user text. |
| `src/useChat.ts` | `refresh(): Promise<void>` | Returned hook action: reconcile server messages/local pending captures by ID. |
| `src/useChat.ts` | `loadOlder(): Promise<void>` | Returned hook action: page backward without losing draft text or duplicating messages. |

The UI is a capture conversation, not a task backlog. Render fixed acknowledgments and at most one clarification, no classification labels, priority numbers, Now card or Done/Drop/Postpone/Shelf chips. Message history is not a list of unfinished tasks.

### Verification-only functions

| File | Signature / declaration | Responsibility |
| --- | --- | --- |
| `apps/api/vitest.config.ts` | Static default config; no runtime functions. | Configure the two targeted suites. |
| `apps/api/src/lib/gemini.test.ts` | Test cases via `describe`/`it`; no exported application functions. | Five destinies, malformed response retry/fallback, unsafe clarification, transport failure. |
| `apps/api/src/lib/chat.integration.test.ts` | `seedCaptureFixture(): Promise<CaptureFixture>`; `cleanupCaptureFixture(f: CaptureFixture): Promise<void>` | Build/clean isolated local fixtures for transaction, idempotency, access and MEMORY-candidate tests. |
| `docs/week-1-acceptance.md` | No functions. | Human sign-off record for real captures and device auth/capture checks. |

## 6. Concrete request and storage flow

1. Authenticated client loads the singleton conversation and recent messages. Setup without permission prompting supplies the domain rows required by item foreign keys and the timezone needed for relative dates.
2. On Send, allocate the client message UUID once and save the full capture envelope locally. Show pending state. Send `/api/chat` with the bearer token.
3. The API verifies the owner and payload, verifies conversation/reply ownership and persists a `user` message as `pending` before any Gemini request. Same ID/different envelope → 409; an identical completed request returns its stored reply.
4. Load up to ten recent eligible item titles. Released/dead/shelved items are not supplied as classifier context. Call A only; all captured text is framed as untrusted data, not interpolated instructions. The initial array permits only one clarifying question across all items; answer mode permits none. A single schema/display-validation retry is allowed; validation retries are not extra user clarification rounds.
5. Two invalid structured outputs yield the specified initial-capture fallback; in answer mode they leave the existing target `needs_clarification` and stop without a new task/question. A network/provider outage is a retryable service failure, not evidence that the text is a task: preserve input and report it as unclassified/retriable.
6. In a short transaction, lock the user message (`SELECT ... FOR UPDATE`), recheck completion, write intake results/items/events, store the assistant receipt and mark the input complete. No database transaction stays open during Gemini inference. Concurrent requests may duplicate model work, but the final lock/recheck prevents duplicate committed turns/items.
7. MEMORY outputs are saved in `intake_results`; no item or live `memories` row is created from ordinary capture this week. Declared setup facts are the separate explicit exception.
8. Return stored IDs, receipt and `ui_actions:[]`. Clear the outbox entry only after success. On a lost response, replay the same ID; on app restart/foreground, reconcile and retry pending captures. A failed turn cannot erase the user message.
9. Clarifying answers reference the stored assistant question. Resolve its target from `clarification_requested` events, verify the target’s `source_message_id` is the original user capture, and apply the one permitted update under the original-message lock. Preserve original `raw_text` and first-pass output. A still-vague answer ends with `needs_clarification`, not another question. An answer using a different message ID after that question was consumed returns 409 without another update.

API status contract: 200 stored completion/replay; 400 invalid request; 401 missing/expired/invalid auth; 403 verified non-owner; 404 unknown conversation/reference; 409 conflicting ID reuse or setup-required conflict; 503 retryable provider/database failure. Do not surface raw SQL/provider errors.

## 7. Concrete native magic-link flow

1. **Provisioning:** create the one owner in Supabase Auth and set its UUID as backend `OWNER_USER_ID`. Configure email delivery. Add exactly `dhruva://auth/callback` to allowed redirects and `scheme: 'dhruva'` in `apps/mobile/app.json`; use an EAS development/native build whose installed scheme matches.
2. **Launch:** `_layout.tsx` mounts the auth provider; `/` holds a loading state until stored session restoration finishes. No session → `/sign-in`. A valid session → `/setup` if incomplete, otherwise `/chat`.
3. **Request:** configure the auth client with `flowType:'pkce'` and persistent secure storage before requesting a link. `/sign-in` calls `requestMagicLink(email)` using the public Supabase URL/key, `shouldCreateUser:false`, and `emailRedirectTo:'dhruva://auth/callback'`. The screen changes to “check your email” with resend. A publishable key is not a database service key.
4. **Leave and return:** save `/setup` or `/chat` as an allowed pending destination, not an arbitrary external URL. The user opens the email; Supabase verifies the email link and redirects to the installed app. Expo routes the callback on both cold start and warm return. Deduplicate callback handling so repeated navigation does not consume the same link twice.
5. **PKCE callback:** the verified email link redirects to `dhruva://auth/callback?code=...`. `completeMagicLink` calls `exchangeCodeForSession(code)` using the locally retained verifier. Configure the Supabase email template/redirects for this PKCE flow. No implicit token-return path or `setSession` fallback is implemented. A missing verifier, expired code or reused code returns to sign-in/resend. No tokens/verifiers/whole callback URL enter chat storage, logs or Git. [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
6. **Storage:** Supabase's configured native auth adapter persists the session, including refresh material, in OS-backed secure storage; auth context holds the current session in memory. The PKCE verifier must persist through the email-app round trip and app restart on the requesting device. The API stores no mobile refresh token.
7. **Completion:** `AuthCallbackScreen` awaits verified session establishment, reads onboarding state via the authenticated API, and resumes the allowed destination subject to setup gating. Expired/reused/malformed callbacks show a short error on `/sign-in`; they never create a fake authenticated state.
8. **API requests:** send the access token in `Authorization: Bearer ...`; server verifies it and checks the owner UUID. Refresh once on token expiry, retry a capture with the same message ID, and return to sign-in if refresh fails. Retain the unsent capture for the same owner.
9. **Lifecycle:** foregrounding refreshes session state and conversation data. Refresh/session callbacks must not produce duplicate message sends. No browser-cookie assumption or web-only sign-in page is required. Expo's protected-route/loading guidance applies. [Expo authentication](https://docs.expo.dev/router/advanced/authentication/)

## 8. Migration handoff

Copy the supplied `202609080002_conversations_messages.sql` into `supabase/migrations/` after the exact original baseline. It creates the singleton conversation and messages tables, required fields/checks/foreign keys, chronological-history indexes, indexed `items.source_message_id`, the memory source-message FK, and server-only access for the two new tables. `messages.item_id` is removed from the revised draft; `items.raw_text` remains full original message text.

It intentionally references existing `items`, `nudges`, `reviews` and `memories`; do not apply it before `202609080001_base.sql`. It does not silently replace existing tables, invent deletion cascades, or create notifications/consolidation jobs. Parent/child conversation validation remains in the API. The messages JSON check enforces an array, while Zod enforces the structured array contents.

**Downstream migration flag:** this revision replaces the previously supplied, unexecuted draft. If that earlier SQL has already been applied in another environment, use a new forward migration to backfill item provenance from known capture history, add/index the item-side FK and remove the old column; do not edit applied migration history or pretend a many-item backfill can be recovered from the old single FK alone. No migration was executed here.

Migration validation required in a disposable Supabase database: fresh baseline → this migration → setup/access migration; confirm duplicate singleton rejection, invalid role/status/JSON rejection, valid nullable FKs, multiple items sharing one source, absence of `messages.item_id`, ordered pagination, denied client-role access and successful server writes. I have not run this SQL against your database; no database connection or repository was provided.

## 9. GitHub-issue-ready tickets

Each ticket includes its own boundary and acceptance conditions. Dependencies refer to contracts or prerequisite tickets; they do not imply that all work must be done serially. These are issue drafts, not issues posted to GitHub.

### W1-01 — Establish the Expo/API workspace and map existing skeletons

**Files:** root workspace/config files from §3; both app config sets; `README.md`; `docs/week-1-decisions.md`.
**Functions:** none; preserve existing skeleton exports.
**Work:** configure one workspace, Expo Router native entry, Next API project, EAS development build profile and API base URL; pin compatible dependencies; record existing skeleton paths. Define separate public mobile environment and server secrets. No engine/nudge feature work.
**Done:** both app packages type-check/build their scaffold; native scheme is `dhruva`; Vercel root is `apps/api`; server-only secrets do not appear in Expo env/examples/bundle; lockfile committed. Record any actual repository path mismatch.
**Depends on:** none.

### W1-02 — Publish the shared Week 1 contracts

**Files:** `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/src/index.ts`; `docs/week-1-decisions.md`; `apps/api/package.json`; `apps/mobile/package.json`; `pnpm-lock.yaml`; `apps/api/src/contracts.smoke.test.ts`; `apps/mobile/src/contracts.smoke.ts`.
**Functions/modules:** export the types/Zod schemas in §4; API contract-validation and dependency-boundary smoke tests in `apps/api/src/contracts.smoke.test.ts`; typed mobile smoke fixtures in `apps/mobile/src/contracts.smoke.ts`.
**Work:** define capture/history/onboarding DTOs and all five classifier destinies. Keep private classifier metadata out of public message history. Implement the resolved B3/B4 source-item query, immutable first-pass snapshot and single-round clarification contracts; remove `MessageDTO.item_id`. Both apps declare `"@dhruva/contracts": "workspace:*"`. Configure `packages/contracts/package.json` with the proposed package name `@dhruva/contracts`, ESM, source exports from `./src/index.ts` and Zod `3.25.76` as its sole runtime dependency. The API smoke test imports public contracts by package name, tests valid input, and rejects invalid UUIDs, nonarray results and illegal destinies. The mobile smoke module imports representative public DTO and runtime schema exports by package name and exports typed smoke fixtures without becoming an Expo route. Use the existing TypeScript compiler in the API smoke test to check the contracts dependency boundary: contracts may statically import only `zod`; reject external re-exports, other module references, dynamic imports and `require` calls; runtime dependencies must contain only Zod; resolved Zod must have no runtime dependencies. Record packaging and boundary decisions in `docs/week-1-decisions.md`. No root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, app tsconfig or application entrypoint changes are authorized.
**Done:** both apps import the package; valid input passes and invalid UUIDs, nonarray results and illegal destinies fail validation; no API/private database code is imported into the mobile bundle. Both TypeScript app checks include their dedicated smoke modules and resolve `@dhruva/contracts` to `packages/contracts/src/index.ts`. The API smoke test enforces the contracts dependency boundary above; the mobile smoke fixtures type-check without becoming an Expo route; packaging and boundary decisions are recorded in `docs/week-1-decisions.md`.
**Validation commands:**

```sh
pnpm install --lockfile-only
pnpm install --frozen-lockfile
pnpm --filter api exec tsc --project ../../packages/contracts/tsconfig.json --noEmit --incremental false
pnpm --filter api exec tsc --noEmit --incremental false
pnpm --filter mobile exec tsc --noEmit --incremental false
pnpm --filter api exec node --test src/contracts.smoke.test.ts
pnpm --filter api lint
git diff --check
```

**Depends on:** W1-01.

### W1-03 — Apply the baseline and conversation migration

**Files:** `supabase/config.toml`; `202609080001_base.sql`; supplied `202609080002_conversations_messages.sql` under `supabase/migrations/`.
**Functions:** none; DDL only.
**Work:** transcribe original §1.1 and append the revised supplied migration with indexed `items.source_message_id` and no `messages.item_id`. Keep future-system tables inert.
**Done:** a fresh disposable Supabase reset succeeds; singleton/check/FK restrictions and history indexes exist; anon/authenticated cannot access messages; the server can insert a user message and a reply-linked assistant response plus multiple items referencing the same original message.
**Depends on:** W1-01. Does not need live Gemini or mobile auth.

### W1-04 — Add first-run schema and baseline access restrictions

**Files:** `supabase/migrations/202609080003_week1_setup_access.sql`.
**Functions:** none; DDL only.
**Work:** add exact addendum onboarding-state columns, nullable starvation thresholds, and server-only access for all baseline/setup application tables and identity sequences. Do not seed user facts or push devices.
**Done:** singleton state accepts setup/provisional timestamps; NULL thresholds are legal; a client key cannot read/write items, events, memories or setup state; server access survives.
**Depends on:** W1-03.

### W1-05 — Implement server configuration, verified owner access and transactions

**Files:** API `src/lib/env.ts`, `auth.ts`, `db.ts`; `apps/api/.env.example`.
**Functions:** `readServerEnv`, `requireOwner`, `getPool`, `withTransaction`.
**Work:** fail on missing secrets, verify tokens through Supabase, match `OWNER_USER_ID`, and supply a transaction-capable server connection. Never trust a decoded JWT alone.
**Done:** no token/invalid token → 401; another valid user → 403; owner allowed; a forced error rolls back transaction writes and releases the connection.
**Depends on:** W1-01, W1-03.

### W1-06 — Implement singleton conversation, history and source-item lookup

**Files:** API `src/lib/conversations.ts`, `src/lib/items.ts`; `app/api/conversations/current/route.ts`; `app/api/conversations/[id]/messages/route.ts`; `app/api/items/route.ts`.
**Functions:** `getOrCreateConversation`, `listMessages`, `listItemsBySourceMessage`, the three `GET` handlers.
**Work:** handle concurrent singleton creation; use `(created_at,id)` cursor pagination; return chronological pages and omit intake internals. Require `source_message_id` for item lookup; do not add an all-items/backlog route.
**Done:** simultaneous first opens yield one conversation; pagination neither skips nor duplicates equal-timestamp rows; unauthorized calls fail; no classifier scores/candidates leak; one source lookup returns its derived items, and messages have no item FK.
**Depends on:** W1-02, W1-03, W1-05.

### W1-07 — Implement minimal onboarding persistence

**Files:** API `src/lib/onboarding.ts`; `app/api/onboarding/route.ts`; `app/api/onboarding/complete/route.ts`.
**Functions:** `getOnboarding`, `completeOnboarding`, respective `GET`/`POST`.
**Work:** expose addendum defaults; validate timezone/eight domain settings; atomically store confirmed rows, optional declared M1 facts and completion timestamp once. No consolidation or full-authority mutation.
**Done:** empty facts accepted; no sample biography written; a retry does not reset time or duplicate facts; a failed write leaves no partial setup; all routes require owner auth.
**Depends on:** W1-02, W1-04, W1-05.

### W1-08 — Implement native durable storage adapters

**Files:** mobile `src/storage.ts`.
**Functions:** `authStorage.getItem/setItem/removeItem`, `readOutbox`, `putOutboxCapture`, `removeOutboxCapture`, `savePendingDestination`, `takePendingDestination`.
**Work:** separate secure SDK session storage from owner-scoped pending capture storage; preserve capture IDs/body/reply targets on restart. Permit only `/chat` or `/setup` destinations.
**Done:** full-size session round-trip succeeds; simulated app restart preserves one pending capture; another identity cannot submit it; removal happens only through an explicit acknowledged completion path.
**Depends on:** W1-01, W1-02.

### W1-09 — Implement email-link request and session provider

**Files:** mobile `src/auth.tsx`, `app/_layout.tsx`, `app/sign-in.tsx`.
**Functions:** `getAuthClient`, `requestMagicLink`, `AuthProvider`, `useAuth`, `RootLayout`, `SignInScreen`.
**Work:** native session restoration/loading, email-only request/resend, owner pre-provisioning documentation and foreground refresh. `shouldCreateUser:false` and fixed callback are mandatory.
**Done:** requesting a link does not create accounts; sign-in/loading/resend states render; no password UI; secure session persists across restart. Callback establishment awaits W1-10/11.
**Depends on:** W1-08; PKCE configuration follows the recorded B2 decision and W1-10 checks.

### W1-10 — Configure the recorded PKCE callback contract (B2 resolved)

**Files:** `docs/week-1-decisions.md`; configuration notes in `README.md`.
**Functions:** configure the prerequisites for `getAuthClient` and `completeMagicLink`.
**Work:** apply `flowType:'pkce'`, matching Supabase email template/redirect configuration, and secure verifier persistence. The callback stays `dhruva://auth/callback`; the exchange method is `exchangeCodeForSession(code)`. No mode-selection decision remains.
**Done:** code-based callback, verifier persistence across restart, and expired/missing-verifier handling are configured and documented; no implicit callback or `setSession` fallback remains.
**Depends on:** W1-08 and access to the actual Supabase auth configuration. B2 is resolved.

### W1-11 — Complete native auth callback and routing

**Files:** mobile `src/auth.tsx`, `app/auth/callback.tsx`, `app/index.tsx`; `app.json` if scheme configuration needs completion.
**Functions:** `completeMagicLink`, `AuthCallbackScreen`, `IndexScreen`.
**Work:** exchange the PKCE code once on warm/cold launch; session first, then authenticated setup routing. Reject malformed callbacks without logging credentials.
**Done:** owner can enter the app from a real email on-device; expired/reused links offer resend; session survives restart; setup is not bypassed and arbitrary external destinations cannot be resumed.
**Depends on:** W1-07, W1-09, W1-10.

### W1-12 — Implement Call A and clarification validation

**Files:** API `src/lib/gemini.ts`, `guard.ts`, `gemini.test.ts`.
**Functions:** `classifyCapture`, `buildClassifierRequest`, `parseClassification`, `makeClassificationFallback`, `validateClarification`.
**Work:** use structured five-destiny JSON with captured input as data, max ten context titles, one validation retry, and task/needs-clarification fallback. Call B/C must never run.
**Done:** valid task/decision/ambient/compost/MEMORY results parse; two invalid outputs produce the documented fallback; provider outage stays retriable; unsafe displayed clarification cannot bypass validation; no emotional-weight/classification announcement appears in a receipt.
**Depends on:** W1-02, W1-05. Can use fake provider responses before live captures.

### W1-13 — Implement durable capture admission and replay

**Files:** API `src/lib/conversations.ts`, relevant `chat.integration.test.ts` cases.
**Functions:** `beginCapture`, `loadCaptureContext`, `markCaptureFailed`.
**Work:** save pending input before classification; validate reply target/conversation; detect conflicting envelope reuse; load eligible titles/timezone without memory retrieval.
**Done:** retried ID does not duplicate user text; changed payload with same ID returns 409; failed processing leaves input recoverable; completed state cannot be overwritten by a late failure.
**Depends on:** W1-02, W1-05, W1-06, W1-07.

### W1-14 — Implement source-linked split-capture intake writes (B3 resolved)

**Files:** `docs/week-1-decisions.md`; API `src/lib/lifecycle.ts`; private contract definitions in the shared type file where required.
**Functions:** `planIntake`, `applyIntake`.
**Work:** every derived item sets `source_message_id` to the original user message and `raw_text` to its full body. Persist per-result items/events and MEMORY candidates; `classified` event payloads identify the immutable source array index. Do not use a message-to-item FK. Implement intake states only.
**Done:** a multi-thought message produces multiple items queryable by the same source ID; every raw text equals the full original body; MEMORY makes no item; first-pass results remain stored before clarification; fallback stays needs-clarification; finalization retries do not duplicate items/events.
**Depends on:** W1-02, W1-03, W1-06. B3 is resolved.

### W1-15 — Implement one clarification round per capture turn (B4 resolved)

**Files:** `docs/week-1-decisions.md`; API `src/lib/lifecycle.ts`, `conversations.ts`, `chat.ts`; shared `ClarificationContext` contract.
**Functions:** clarification branches of `loadCaptureContext`, `planIntake`, `buildReceipt`.
**Work:** select at most one question across the initial output array. Record its target with `clarification_requested` in existing item events; the answer references the question and may overwrite the target’s fields once within the original turn. Preserve item identity/source/raw text and first-pass snapshot. Save answer output separately. If still vague, retain `needs_clarification` and stop.
**Done:** six ambiguous items still yield at most one question; answer handling performs at most one allowed update; a still-vague answer and unselected ambiguous items remain `needs_clarification`; no second question or duplicate replacement item; `clarification_applied` records consumption for replay enforcement.
**Depends on:** W1-12, W1-13, W1-14. B4 is resolved.

### W1-16 — Implement capture orchestration and atomic completion

**Files:** API `src/lib/chat.ts`; `app/api/chat/route.ts`; transaction cases in `chat.integration.test.ts`.
**Functions:** `capture`, `commitCapture`, `buildReceipt`, `POST`.
**Work:** join authenticated admission, Call A and fixed receipt with a short locked completion transaction. On a clarification answer, lock the original capture as well, enforce one `clarification_applied` event/update, and preserve its first-pass snapshot. Keep external inference outside DB locks. Return stored IDs and no action chips.
**Done:** successful response implies persisted results/events/reply; concurrent identical submissions commit one logical result; lost-response retries replay it; malformed output fallback persists; MEMORY candidate-only turn succeeds; infrastructure errors remain retriable; two competing answers cannot overwrite twice, an identical answer retry replays, and a different answer to the consumed question returns 409.
**Depends on:** W1-12, W1-13, W1-14; complete clarification acceptance depends on W1-15.

### W1-17 — Implement the native API adapter

**Files:** mobile `src/api.ts`.
**Functions:** `requestApi`, `getCurrentConversation`, `getMessages`, `getItemsBySourceMessage`, `postCapture`, `getOnboarding`, `completeOnboarding`.
**Work:** use configured HTTPS origin, bearer auth, typed errors, one auth refresh attempt and unchanged capture identities. Fetch derived items by `source_message_id`; never expect `MessageDTO.item_id`.
**Done:** network/401/403/409/503 outcomes are distinguishable; a retry preserves payload/ID; mobile imports no privileged Supabase DB client or Gemini key.
**Depends on:** W1-02, W1-09; can be built against fixtures before endpoints are live.

### W1-18 — Implement restart-safe Chat state

**Files:** mobile `src/useChat.ts`.
**Functions:** `useChat`, returned `submitCapture`, `retryCapture`, `refresh`, `loadOlder`.
**Work:** persist outbox before send; reconcile by ID; retry on explicit retry/foreground; preserve drafts and clarification targets. Avoid concurrent resends from multiple foreground listeners.
**Done:** killing the app during an unacknowledged send does not lose/duplicate the capture; a completed replay clears the pending entry; paging/refresh preserves pending text; no background cron/nudge logic is introduced.
**Depends on:** W1-08, W1-17; uses mocked API until W1-16.

### W1-19 — Complete first-run setup without notification permissions (B1 resolved)

**Files:** mobile `app/setup.tsx`; `docs/week-1-decisions.md`.
**Functions:** `SetupScreen`.
**Work:** confirm timezone and eight domain defaults, permit empty initial facts, explain provisional authority and submit setup once. Notification-permission prompting is deferred entirely to Week 3 alongside push delivery. Include no notification permission UI, request/check calls, or registration behavior in W1-19.
**Done:** fresh owner confirms prerequisites and reaches Chat without any OS notification prompt or permission call; no fabricated M1 facts, full-authority switch, scoring or nudge code appears.
**Depends on:** W1-07, W1-11, W1-17. B1 is resolved.

### W1-20 — Build the native Chat screen

**Files:** mobile `app/chat.tsx`.
**Functions:** `ChatScreen`.
**Work:** message history, keyboard-friendly multiline input, send, local pending/retry state and reply targeting for a clarification. Receipts remain short and classification metadata invisible. Obtain derived item metadata by querying its original `source_message_id`, not a message item FK; do not render a backlog.
**Done:** owner can enter a dump, see its durable receipt, answer a targeted clarification, load history and retry failure; no Now card, task backlog, action chips or scoring UI.
**Depends on:** W1-18; end-to-end use also depends on W1-16 and W1-19.

### W1-21 — Verify Week 1 boundaries and failure paths

**Files:** API `vitest.config.ts`, `gemini.test.ts`, `chat.integration.test.ts`; `docs/week-1-acceptance.md`.
**Functions:** suite cases; `seedCaptureFixture`, `cleanupCaptureFixture`.
**Work:** exercise unauthorized access, malformed classifier fallback, pending-message durability, atomic replay, source-linked multi-item capture, candidate-only memory capture and single-round clarification. Verify immutable first-pass outputs and rejection of a second overwrite. Perform PKCE warm/cold auth and restart-send checks; confirm setup never calls notification permissions.
**Done:** checks pass in isolated fixtures; no engine/scoring/nudge/consolidation imports execute; actual database reset and device verification are recorded separately from model classification accuracy.
**Depends on:** W1-03 through W1-20 as relevant. Do not create redundant tests for static screens/config.

### W1-22 — Run the 20-classified-item first-pass acceptance gate (B5 resolved)

**Files:** `docs/week-1-acceptance.md`; `docs/week-1-decisions.md` for B5 rubric.
**Functions:** none; human evaluation of persisted output.
**Work:** evaluate 20 classified items from real captures. Record original message ID plus result index (and item ID where one exists), expected/actual first-pass destiny, and for TASK outputs whether the first-pass rewrite needs manual editing. Read original immutable `intake_results`, not post-clarification item fields. A multi-item message contributes multiple units; a MEMORY candidate is a logical classified item without a DB item row. Keep raw personal text in the app/database, not the repository.
**Done:** report exactly 20 item-level first-pass results and at least 16 correct: destiny must match expected judgment and a TASK rewrite must need no manual edit. Do not count submitted messages, clarification answers, corrected results or unrelated metadata accuracy toward this metric. Record persistence checks separately. If below target, report the actual first-pass count; do not improve it retroactively with clarification.
**Depends on:** W1-21 and user supplying real captures. B5 is resolved; synthetic tests cannot satisfy this gate.

## 10. Week 1 completion checklist

- Expo/API scaffold builds with separate deploy boundaries; no secrets in mobile.
- Baseline plus conversation/setup migrations run cleanly on disposable Supabase; direct client data access is denied.
- Owner PKCE magic link works on cold and warm return with persisted verifier; retries/expired links are handled.
- Required first-run inputs are confirmed without notification-permission prompting; that entire permission step belongs to Week 3.
- Chat survives restart/network retry; duplicate IDs cannot create duplicate committed turns.
- Only Call A runs; classified item destinies create items/events, MEMORY creates candidates only.
- All items retain original source-message provenance/full raw text; at most one clarification question/update round is consumed per capture turn, with unresolved answers left needs-clarification.
- The 20-classified-item gate reports at least 16 correct first-pass destinies, with no manual rewrite edit needed for tasks; clarification results never replace first-pass evidence.
- No scoring, NOW directives, nudge/cron/push delivery, review generation, or memory consolidation is implemented this week.
