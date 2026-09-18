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
