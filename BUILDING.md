# BUILDING.md — Dhruva V1

**Audience:** one solo developer (you). **Assumption:** the seven design artifacts are frozen; this document translates them into buildable reality and ruthlessly cuts everything V1 doesn't need.
**One-line architecture:** a single Next.js app + Supabase Postgres + Gemini API + Vercel Cron + ntfy.sh push. No microservices, no vector DB, no queue infrastructure, no native app. Deterministic TypeScript decides; Gemini classifies and phrases.

---

## 0. The Ruthless Cuts (read first)

| Cut | Why |
|---|---|
| Separate backend (FastAPI/Functions) | Next.js route handlers do everything V1 needs. One repo, one deploy. |
| Vector DB / embeddings | V1 memory retrieval is structured SQL (type + domain + recency + key lookup). Semantic search is a V2 problem you may never have — one user's memories fit in a prompt. |
| React Native / Flutter | PWA on your phone's home screen. Native is weeks of cost for zero V1 value. |
| Multi-user, auth flows | Single user. One password-protected session (Supabase auth, magic link). No sharing, no roles. |
| Calendar write integration | V1 reads nothing and writes nothing to your calendar. Dhruva proposes times; you own the calendar. (Read-only ICS ingest is a Should-have.) |
| Energy detection | V1 energy = time-of-day heuristic + a manual 1–5 override in the chat ("energy 2"). No wearables, no inference. |
| Real-time anything | Polling and page loads. One user does not need websockets. |
| The full weekly review engine in week 1 | Review ships in week 4, after 3 weeks of real event data exists. Per your own corpus entry 86. |

**The prime architectural law (from the system prompt's builder notes):** *code owns arithmetic, Gemini owns judgment and phrasing.* Scores, budgets, decay timers, postponement counts, starvation clocks, and nudge spacing are all deterministic TypeScript. Gemini is called for exactly three jobs: (1) classify captured text, (2) phrase decisions the code already made, (3) generate the weekly review from a prepared fact sheet.

---

## 1. Missing Specifications

### 1.1 Database Schema (Supabase / Postgres)

```sql
-- DOMAINS: the life areas, with values weights and starvation thresholds
create table domains (
  id text primary key,                  -- 'work','parents','family','health','finance','spirituality','learning','building'
  value_weight numeric not null,        -- e.g. 1.5 (from values ranking; user-editable)
  starvation_days int not null,         -- e.g. 7
  last_touched_at timestamptz,          -- updated when any item in domain completes/progresses
  muted_until timestamptz               -- survival mode support (corpus 97)
);

-- ITEMS: unified table for tasks, decisions, ambient concerns, compost
create table items (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,               -- exactly what the user typed
  canonical_text text,                  -- Gemini's delegable rewrite (Rule 1.2)
  class text not null check (class in ('task','decision','ambient','compost')),
  status text not null default 'captured',
  domain text references domains(id),
  -- engine inputs (0–5 unless noted; set by classifier, editable by code)
  importance int, life_impact int, effort int, emotional_weight int,
  urgency_kind text check (urgency_kind in ('none','soft','hard')) default 'none',
  due_at timestamptz,
  irreversible boolean default false,   -- Gate 1 flag; exempt from all decay (Rule 6.5)
  blocks uuid[] default '{}',           -- items this unblocks (Gate 2)
  blocked_by uuid,                      -- if set and unresolved → item sleeps
  -- lifecycle
  wake_at timestamptz, wake_reason text,
  postpone_count int default 0,
  exposure_step text,                   -- the shrunk version for heavy items (Rule 3.4)
  shelved boolean default false,        -- corpus 70: no decay, no review, no wake
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz, closed_as text check (closed_as in ('done','released','dead','superseded'))
);

-- ITEM_EVENTS: append-only audit trail; the review and all patterns are computed from this
create table item_events (
  id bigint generated always as identity primary key,
  item_id uuid references items(id),
  kind text not null,  -- captured|classified|rewritten|scheduled|focus_started|focus_ended|postponed|completed|released|shelved|woken|slept|hospiced|decayed|resurrected|converted_to_decision
  payload jsonb default '{}',
  created_at timestamptz default now()
);

-- MEMORIES: M1–M6, with versioning via key + superseded_by ("a fact is a timeline")
create table memories (
  id uuid primary key default gen_random_uuid(),
  mtype text not null check (mtype in ('M1','M2','M3','M4','M5','M6')),
  fact_key text,                        -- e.g. 'super_balance','dad_meds' — versioned facts share a key
  content text not null,
  reasoning text,                       -- M2 only: the why
  revisit_condition text,               -- M2 only: human-readable tripwire
  domain text references domains(id),
  confidence text default 'high' check (confidence in ('high','medium','hypothesis')),  -- M3 decay
  sensitive boolean default false,      -- retrieval rule R3
  valid_from timestamptz default now(),
  superseded_by uuid references memories(id),
  archived boolean default false,
  source_item_id uuid references items(id)
);

-- NUDGES: composed messages + outcomes; trust stats derive from here
create table nudges (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id),
  kind text not null check (kind in ('corrective','witness','starvation','wake','alert')),
  body text not null,
  sent_at timestamptz default now(),
  outcome text check (outcome in ('acted','dismissed','dropped','ignored')),
  outcome_at timestamptz
);

-- REVIEWS: one row per weekly review
create table reviews (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  body_md text not null,
  pattern_topic text,                   -- to enforce "no repeat within 3 weeks"
  feedback text check (feedback in ('lighter','heavier'))
);

-- APP_STATE: single-row-ish key/value for runtime state
create table app_state ( key text primary key, value jsonb not null, updated_at timestamptz default now() );
-- keys: focus_block {item_id, ends_at} | energy_override {level, until} | survival_mode {domains[], until}
--       nudge_budget_today {corrective_used, witness_used, last_sent_at} | compliance {directives, followed, window_start}
```

**Deliberate absences:** no `users` table logic beyond Supabase auth's single account; no tags table (domain is the only taxonomy — the manifesto forbids folder gardening); no separate `decisions` table (a decision is an item with `class='decision'` plus, on resolution, an M2 memory row — one source of truth).

### 1.2 Task Lifecycle (state machine)

```
captured ──classify──▶ needs_clarification ──answer──▶ active
    │                                                    │
    └──(clear enough)────────────────────────────────────┤
                                                         ▼
                    ┌── scheduled ◀──── engine assigns slot
                    │       │ postpone (count++)
                    │       │   ├─ count<3 → scheduled (new slot, silent)
                    │       │   └─ count=3 → converted_to_decision (Rule 5.2)
                    │       ▼
                    │   in_focus ──▶ done ✓ (closed_as='done', domain.last_touched_at updated)
                    │
   active ──30d untouched, not irreversible, no wake──▶ hospice
                    hospice ──review: 'keep'──▶ active
                    hospice ──no response──▶ dead (closed_as='dead', hidden, recoverable 90d)
   any state ──user 'drop'──▶ released ✓ (M4 memory written; never shown again)
   any state ──user 'shelf'──▶ shelved (no decay, no wake; only user re-capture revives → resurrected)
   active ──wake_at set──▶ sleeping (invisible) ──wake fires──▶ active (+event 'woken')
```
Hard rules encoded here: `irreversible=true` items can never enter hospice/dead (DB check in the decay job); released/dead items are excluded from every query the UI or prompts can reach (S4 "the dead stay dead" is a WHERE clause, not a hope).

### 1.3 Decision Lifecycle

```
open ──▶ exposure_scheduled (exposure_step text set; scheduled at high-capacity slot only)
     ──▶ exposure_done (event) ──▶ [repeat exposures] ──▶ resolved
resolved: writes M2 memory {content, reasoning, revisit_condition} + closes item (closed_as='done')
        + composts derivative items whose blocked_by pointed here (corpus 36)
sleeping: allowed (corpus 67) but ONLY with wake_at + wake_reason; never hospiced; never decays
reopened: only via R5 flow — /api/chat detects topic match against M2 fact_keys, injects provenance FIRST
```

### 1.4 Event Model

Everything the review, patterns, and trust stats need is derived from `item_events` + `nudges` — never stored as counters that can drift. Examples:
- postponement cluster = `postponed` events grouped by domain, 14-day window
- compliance rate = focus directives issued (app_state log) vs `focus_started` events
- "loop age" for witness lines = `completed.created_at − captured.created_at`
- restart detection = domain gap > threshold followed by `completed` in that domain

### 1.5 API Surface (Next.js route handlers)

```
POST /api/chat            { text }            → the main endpoint. Pipeline: injection-scrub →
                                                intent route (capture | ask_now | action | question | freeform)
                                                → deterministic handling → Gemini Voice phrases reply
                                                → { reply, ui_actions?: [{item_id, verbs:[done|drop|postpone|shelf]}] }
GET  /api/now                                  → runs gates+score in TS, returns NOW directive (+NEXT hidden, ANCHOR)
POST /api/items/:id/action { verb, note? }     → done | postpone | drop | shelf | keep | wake_now | wrong_call
POST /api/focus/start      { item_id, minutes }→ writes app_state.focus_block
POST /api/focus/end        { completed: bool }
GET  /api/review/latest                        → current review + pending hospice list
POST /api/review/:id/feedback { lighter|heavier }
-- cron (Vercel Cron, header x-cron-secret):
POST /api/cron/nightly     → consolidation: memory candidates, decay, hospice moves, M3 confidence decay, wake checks
POST /api/cron/nudge       → runs at the two nudge windows (e.g. 09:00 & 17:30 local); may send 0 or 1 nudge
POST /api/cron/review      → Sunday 07:30 local: builds fact sheet from events → Gemini → reviews row → push
```

### 1.6 Memory Storage & Retrieval Model (no vectors)

Write path (nightly consolidation): Gemini extracts memory candidates from the day's chat transcript against the refusal-list rules → code validates (rejects rows containing self-judgment markers, "should", undated numbers get `valid_from` stamped) → versioning: if `fact_key` matches an existing live row, old row gets `superseded_by` set.
Read path (per /api/chat call), pure SQL, budget ~1.5k tokens:
1. M2 rows whose `fact_key`/content matches the message topic (simple keyword map per domain) — **always first if matched** (R5)
2. M1 live rows for the active item's domain
3. M6 all live rows (small)
4. M3 rows confidence != 'hypothesis' for the current context (time-of-day, domain)
5. `sensitive=true` rows only if message domain matches (R3)
Everything is injected into the Voice prompt as `<memories>` data. Retrieval quality at one user's scale is a keyword problem, not an embedding problem — resist the vector DB until proven otherwise.

---

## 2. End-to-End Architecture

```
┌─ Phone / Desktop (PWA) ─────────────────────────────┐
│ Next.js app: single chat screen + Now card + Review │
│ installable, mobile-first, Tailwind                 │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS (Vercel)
┌──────────────▼──────────────────────────────────────┐
│ Next.js route handlers (TypeScript)                 │
│  • engine.ts  — gates, cascade, score (pure fns)    │
│  • lifecycle.ts — state transitions + events        │
│  • memory.ts — consolidate / retrieve (SQL)         │
│  • gemini.ts — 3 call types (below)                 │
│  • guard.ts  — output filters (below)               │
└───────┬───────────────────────────┬─────────────────┘
        │                           │
┌───────▼────────┐         ┌────────▼─────────┐
│ Supabase       │         │ Gemini API       │
│ Postgres + Auth│         │ gemini-2.5-flash │
└───────▲────────┘         └──────────────────┘
        │
┌───────┴──────────────┐   ┌──────────────────┐
│ Vercel Cron          │──▶│ ntfy.sh topic    │──▶ phone push
│ nightly/nudge/review │   │ (private, random)│
└──────────────────────┘   └──────────────────┘
```

### 2.1 Frontend (3 screens, that's all)
1. **Chat** — the app. Capture, questions, actions. Assistant messages can carry action chips (Done / Postpone / Drop / Shelf) bound to `/api/items/:id/action`. Never renders more than 3 items in any component (guardrail: hard-coded in the list component).
2. **Now card** — top of chat: current directive or focus countdown, one line, one Start button. "What should I do?" typed in chat returns the same thing.
3. **Review** — Sunday's review as rendered markdown + hospice keep/release chips + lighter/heavier buttons.
No settings screen in V1 — values weights and starvation thresholds are edited via chat ("set work weight to 1.1") or straight in Supabase. No list/backlog screen at all: the backlog is the engine's problem (review doc §2).

### 2.2 Gemini Integration — exactly three call shapes

**Call A — Classifier** (on capture). JSON mode with `responseSchema`:
```
input: raw text (+ up to 10 recent item titles for dedupe/ancestry)
output: [{ class, domain, canonical_text, clarifying_question|null,
           importance, life_impact, effort, emotional_weight,
           urgency_kind, due_at|null, irreversible, exposure_step|null }]
```
Zod-validate; on parse failure retry once with the error appended; on second failure store as class='task', status='needs_clarification' — never lose a capture.

**Call B — Voice** (every chat reply, every nudge body, every directive). System prompt = the production prompt, minus sections the app enforces mechanically (budgets, spacing, decay — those never reach the model as responsibilities). Injected per call: `<current_state>`, `<values>`, decided outcome (e.g., "NOW = item X because closing window"), `<memories>`. The model *phrases*; it does not choose. For nudge composition the contract allows the literal output `NO_NUDGE`.

**Call C — Review writer** (Sundays). Input is a *fact sheet built by code from events*: completions with loop ages, releases, restarts, domain attention days, hospice list, candidate pattern (code picks ONE from the pattern queries, or none). Gemini writes the five movements. It cannot invent facts because it only receives the sheet.

### 2.3 guard.ts — the output filter (non-negotiable)
Every Gemini output passes a regex/deny filter before display or push:
- Forbidden phrases: `as you mentioned|according to my (memory|records|notes)|I remember|you've got this|small wins|let's crush` → auto-rewrite call with violation named; second failure → strip sentence.
- Exclamation marks in corrective nudges → stripped.
- Corrective nudge missing exit language (`drop|it's gone|hand it|shelf`) → rejected, recomposed.
- Any output referencing a `released/dead` item id → blocked (S4 enforced twice: SQL + filter).
This 60-line file protects the product's soul more cheaply than any prompt tweak.

### 2.4 Scheduling & notifications
- **Vercel Cron** hits the three cron routes. All times computed in the user's configured IANA timezone (store in app_state; never trust server time).
- **Nudge tick** (2× daily): code checks — budget remaining? ≥3h since last? not in focus? not survival-muted? then evaluates triggers in priority order (wake conditions T1 → closing windows T2 → starvation T4). First qualifying trigger → Voice composes → guard → ntfy push + chat insert → nudges row. Ignored nudges get `outcome='ignored'` after 48h (nightly job) → feeds trust stats → self-throttle at <30% act-rate (halve budget, send the corpus-96 message once).
- **ntfy.sh**: a private random topic string; phone app subscribed. One-line HTTP POST to send. Web Push replaces it in Should-have if you want no third party.

---

## 3. V1 Scope

**MUST (the product is these six things):**
capture → classify → clarify-once pipeline; the cascade engine + NOW directive; postponement ladder incl. 3rd-postpone conversion; drop/release + shelf (with S4 enforcement); nudge tick with budget, anatomy, NO_NUDGE, and self-throttle; nightly consolidation (memory versioning, decay, hospice) + Sunday review from real events.

**SHOULD (add only after 2 clean weeks of MUST):**
focus blocks with capture-and-return; M2 relitigation auto-retrieval in chat; exposure-step generation for heavy items; read-only ICS calendar ingest (for T3 free-slot nudges); Web Push; energy override command.

**NICE (V2 candidates, do not touch):**
weekly review lighter/heavier adaptation; witness/anniversary nudges; pattern library beyond the 3 basic queries; voice input; Telegram mirror of chat.

**EXCLUDED (violates a frozen doc or the ruthless cuts):**
multi-user & sharing; vector memory; native apps; calendar *writing*; streaks/scores/velocity anywhere in UI; any dashboard listing >3 items; emotional-weight announcements at capture; integrations with work tools (Jira/Slack) — Dhruva is a life system, work systems already have masters.

---

## 4. Implementation Sequence (4 weeks, ~10–12 focused hours/week)

**Week 1 — Spine.** Repo (Next.js + TS + Tailwind + Supabase client), schema migration, auth (magic link), Chat screen, `/api/chat` with Call A classification only, items land in DB with events. Deliverable: you brain-dump from your phone and items are correctly classified in the DB. *Definition of done: 20 real captures, ≥16 classified correctly without edits.*

**Week 2 — Judgment.** `engine.ts` (gates + formula, pure functions with unit tests — this is the one place tests are mandatory), `/api/now`, Now card, action verbs (done/postpone/drop/shelf) with full lifecycle + postponement ladder. Call B Voice wired with guard.ts. Deliverable: every morning Dhruva answers "what now" with one phrased directive. *Start obeying it — compliance tracking begins this week, because Week 2 is when assumption #1 (would you obey?) finally meets reality.*

**Week 3 — Time.** Vercel Cron + nightly consolidation (memory candidates, versioning, decay, hospice) + nudge tick + ntfy push + trust stats. Deliverable: Dhruva speaks unprompted, correctly, at most twice a day, and shuts up otherwise. *Watch the NO_NUDGE rate in logs — if it's never NO_NUDGE, guard has failed.*

**Week 4 — Witness.** Review fact-sheet builder (SQL over events), Call C, Review screen, hospice flow, feedback buttons. Freeze features. Start the 30-day live trial (corpus 87's rule: no new features, just mornings). Deliverable: Sunday's review reads true and lands "lighter."

---

## 5. Biggest Risks

**Product:** (1) *You don't obey it* — the load-bearing risk. Mitigated only by measurement: compliance stats from Week 2, and the corpus-96 self-throttle honestly implemented. If compliance is <40% after 30 days, the answer is not more features — revisit the manifesto's authority section before writing more code. (2) *Building becomes Mission #9* — mitigation is structural: the 4-week cap and the Week-4 feature freeze are part of the spec, not suggestions. (3) *Wrong values weights make it annoying* — expose them to chat-editing early.

**AI:** (1) *Classifier drift* (Gemini mislabeling decisions as tasks) — mitigation: the conversation corpus doubles as an eval set; run 20 classifier cases on every prompt change. (2) *Voice violating soul rules* — guard.ts + the grep eval, run in CI. (3) *NO_NUDGE erosion* — models hate silence; assert in tests that ≥30% of synthetic nudge-tick evals produce NO_NUDGE. (4) *Prompt injection via captured text* — scrub inputs, treat all injected context as data (already in prompt), and never give the model tool authority beyond phrasing.

**UX:** (1) *Capture friction* — if capture takes >5 seconds from pocket, the system dies; PWA icon + autofocused input + optimistic UI are Week-1 priorities, not polish. (2) *Notification fatigue or deafness* — both kill it; the budget and act-rate tracking are the immune system. (3) *The debug view temptation* — you will want a backlog screen; the manifesto forbids it; keep the full list in Supabase Studio only, where friction protects you.

**Technical:** (1) *Cron misfires/timezones* — all schedule math in user TZ via a single utility, idempotent cron handlers (safe to run twice). (2) *Gemini JSON instability* — zod + retry + graceful fallback to needs_clarification. (3) *Data loss fear undermining trust* — nightly Supabase backup ON, and the 90-day recoverable dead state, before you rely on it for anything Gate-1.

---

## 6. Final Notes for the Builder

- **The eval harness is 100 lines and priceless:** replay the conversation corpus's user messages through /api/chat in a script; grep outputs for forbidden phrases, missing exit clauses, >3-item lists. Run it before every deploy. Your product's philosophy is now a regression suite.
- **Do not generalize.** Every "but what if another user…" thought is Mission #9 whispering. One user, one timezone, one values file, hardcode joyfully.
- **The spec is done deciding. What's left is Tuesday 8pm and Sunday 6am blocks** — the borders you already agreed to. Ship the spine in Week 1; obey your own directive in Week 2; and let the 30-day trial, not enthusiasm, decide what gets built next.
