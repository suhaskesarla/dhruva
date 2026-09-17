# BUILDING.md Addendum v1

8 September 2026 • Eight scoped decisions • Approximately five minutes

This addendum overrides BUILDING.md only on these eight decisions. Other review findings remain open. Schema declarations below specify migration requirements, not executable migration code; `?` means nullable, other fields are required. Existing UUID/timestamp default conventions apply.

## 1. Prioritization semantics — review #1

**Decision:** `dhruva-prioritization-engine.md`'s normative mechanism governs: sleep filtering; irreversible-and-time-critical NOW override; NOW energy feasibility; survivor scoring; then NEXT/ANCHOR composition, diversity, heaviness and tie rules. Blockage is an additive bonus; starvation reserves ANCHOR, not automatic NOW precedence. The cognitive OS/prompt's competing cascade is superseded on this point. Internal numerical and edge-case gaps remain outside this decision.

**Schema/API:** No new fields for this semantic choice. `GET /api/now` calls server-side `engine.ts`; the same result feeds chat. Voice receives the chosen outcome and cannot rerank it. NEXT remains hidden until NOW completes.

**Why:** The engine defines the most concrete mechanism for combining values, feasibility and protected attention without allowing the model to choose a competing algorithm.

## 2. Expo deployment architecture — review #2

**Decision:** One repository, two deployable applications: `apps/mobile` (React Native + Expo Router, native builds through EAS) and `apps/api` (Next.js route handlers on Vercel). V1 targets Android/iOS; desktop/PWA is excluded. Supabase remains the database/auth service; Gemini and cron execute server-side.

**Schema/API:** No architecture-specific table. Preserve `/api/*` paths behind a configured HTTPS API base URL. The mobile client accesses application data through that API; only authentication talks directly to Supabase. Gemini keys, database service credentials and cron secrets remain server-only. Use native components, refresh on foreground, and independent mobile/backend releases.

**Why:** A native application cannot inherit a PWA's combined browser/server deployment boundary.

## 3. MEMORY intake destiny — review #7

**Decision:** MEMORY is a fifth classifier destiny, routed directly to memory candidacy without creating an `items` row.

**Schema/API:** Call A returns an array discriminated by `destiny: task|decision|ambient|compost|memory`; the first four retain their existing item fields. MEMORY supplies `candidate: {mtype, fact_key?, content, domain?, sensitive, reasoning?, revisit_condition?}`. Persist results in `messages.intake_results jsonb DEFAULT '[]'` from decision 7. Nightly validation/versioning admits candidates to `memories`; add `memories.source_message_id uuid? REFERENCES messages(id)`. Keep `items.class` unchanged. `/api/chat` acknowledges memory captures without task chips.

**Why:** Context without an obligation must have a real intake destination without entering task prioritization or decay.

## 4. Magic-link-only authentication — review #16

**Decision:** Supabase email magic links are the sole sign-in method for the pre-created owner account. Register `dhruva://auth/callback` in Expo and Supabase's redirect allowlist. Handle callback links on both cold launch and an already-running app, establish/persist the Supabase session, and return to the pending destination; invalid/expired links return to sign-in with resend.

**Schema/API:** No custom credentials table. Client invokes `signInWithOtp` with `shouldCreateUser:false` and the callback URL, then establishes the session from the verified auth callback using Supabase's native flow. Every non-cron API requires `Authorization: Bearer <access_token>`, validates it, and checks `sub` against server-configured `OWNER_USER_ID`. Application tables have no direct client grants. No password or registration endpoints.

**Why:** Magic links require an explicit native return/session flow, and single-user access still requires authorization. [Supabase native flow](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)

## 5. Expo Push replaces ntfy — review #17

**Decision:** All remote notifications use Expo Push with `expo-notifications` and configured Android/iOS credentials; remove ntfy and the Web Push alternative. Permission denial leaves messages available in chat. Foreground delivery refreshes chat without a duplicate banner; tapping a notification opens its destination after authentication.

**Schema/API:** Add `push_devices(id uuid PK, expo_push_token text UNIQUE, platform text CHECK android|ios, enabled boolean DEFAULT true, updated_at timestamptz)`. Add owner-only `PUT /api/push/devices/:id {expo_push_token, platform, enabled}` and `DELETE /api/push/devices/:id`. The server sends stored-message notifications with `data:{message_id, review_id?}`; obtain/register refreshed tokens, inspect Expo tickets/receipts, and disable `DeviceNotRegistered` tokens. Use development/native builds for validation.

**Why:** Expo Push delivers into Dhruva itself and gives its native client an explicit registration and navigation contract. [Expo delivery documentation](https://docs.expo.dev/push-notifications/sending-notifications/)

## 6. Vercel cron transport — review #19

**Decision:** Vercel invokes cron through GET authenticated by its bearer secret.

**Schema/API:** Replace the three POST contracts with `GET /api/cron/nightly`, `GET /api/cron/nudge`, and `GET /api/cron/review`. Each requires exact `Authorization: Bearer <CRON_SECRET>`; missing configuration or invalid credentials fail closed. Remove `x-cron-secret`. No schema change. Existing idempotency requirements remain; UTC/local-time scheduling is not redesigned here.

**Why:** This matches Vercel's actual invocation and authentication contract. [Vercel cron documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

## 7. Persisted conversation — review #24

**Decision:** V1 has one durable conversation containing user messages, replies and proactive messages.

**Schema/API:** Add `conversations(id uuid PK, singleton boolean UNIQUE DEFAULT true CHECK singleton=true, created_at timestamptz)` and `messages(id uuid PK, conversation_id uuid REFERENCES conversations, role text CHECK user|assistant, body text, created_at timestamptz, reply_to_message_id uuid? REFERENCES messages, item_id uuid? REFERENCES items, nudge_id uuid? UNIQUE REFERENCES nudges, review_id uuid? UNIQUE REFERENCES reviews, processing_status text CHECK pending|complete|failed, intake_results jsonb DEFAULT '[]')`.

`POST /api/chat {conversation_id, message_id, text, reply_to_message_id?}` persists the user message before model work and returns stored message IDs plus the existing reply/actions. Client-generated IDs make retries idempotent: identical retries resume/return the same turn; conflicting reuse returns 409. Persist replies before success. `GET /api/conversations/current` creates/returns the singleton; `GET /api/conversations/:id/messages?before=<cursor>&limit=50` retrieves chronological pages. Clarification answers reference the question; proactive jobs insert messages before push. Client retains unacknowledged captures across restarts and retries with the same ID. Nightly consolidation reads this transcript.

**Why:** Chat history, clarification, consolidation and push destinations require durable identities and recoverable capture acknowledgments.

## 8. First run and provisional authority — review #9/#10

**Decision:** After sign-in: confirm detected IANA timezone; confirm/edit domain weights and thresholds; optionally supply initial life facts; explain provisional mode and request optional push permission; then offer the first capture. Empty facts/items are valid, and sample biography is never seeded.

Defaults, shown for confirmation: Parents 1.5/7d, Family 1.4/3d, Health 1.3/7d, Finance 1.2/14d, Spirituality 1.1/7d, Work 1.0/off, Learning 0.9/14d, Building 0.8/off. Unknown attention starts at setup completion for starvation calculations without claiming actual activity.

For at least seven elapsed days after setup, offer one suggestion with a short reason and explicit Start/Skip; suppress corrective nudges/challenges, retain Gate-1 alerts, and make no compliance-based authority claims. After seven days, offer explicit full-authority opt-in. Declining keeps provisional mode indefinitely; elapsed time alone never upgrades authority. Missing trust statistics are `null`, not zero.

**Schema/API:** Add singleton `onboarding_state(id boolean PK DEFAULT true CHECK id=true, completed_at timestamptz?, full_authority_at timestamptz?)`. Make `domains.starvation_days` nullable; NULL disables starvation. `POST /api/onboarding/complete {timezone, domains:[{id,value_weight,starvation_days}], initial_facts:[{fact_key,content,domain?,sensitive}]}` atomically stores confirmed values, writes supplied facts as M1, sets existing `app_state.timezone`, and stamps completion once; retries return existing state. `GET /api/onboarding` returns `setup|provisional|full` plus opt-in eligibility. `POST /api/onboarding/authority {accept:true}` stamps full authority only after seven days. Engine/Voice/scheduler read this state; before setup completes, no directives or proactive contact.

**Why:** Initial context and authority must be explicitly established before the app behaves as though it already knows the user's life and has earned their trust.
