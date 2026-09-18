-- Addendum sections 3/7 and resolved B3: item-side capture provenance.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null unique default true check (singleton = true),
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  created_at timestamptz not null default now(),
  reply_to_message_id uuid references messages(id),
  nudge_id uuid unique references nudges(id),
  review_id uuid unique references reviews(id),
  processing_status text not null check (processing_status in ('pending', 'complete', 'failed')),
  intake_results jsonb not null default '[]'::jsonb
    check (jsonb_typeof(intake_results) = 'array')
);

-- Supports chronological history and stable (created_at, id) cursor pages.
create index messages_conversation_history_idx
  on messages (conversation_id, created_at, id);

-- Nullable for pre-existing/non-capture rows; multiple items may share a source.
alter table items add column source_message_id uuid references messages(id);
create index items_source_message_id_idx on items (source_message_id);
alter table memories add column source_message_id uuid references messages(id);

-- Conversation data is accessed by the server, never directly by clients.
alter table conversations enable row level security;
alter table messages enable row level security;
revoke all on table conversations, messages from public, anon, authenticated;
grant all on table conversations, messages to service_role;
