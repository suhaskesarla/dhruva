-- Addendum section 8: setup completion and explicit authority opt-in timestamps.
create table onboarding_state (
  id boolean primary key default true check (id = true),
  completed_at timestamptz,
  full_authority_at timestamptz
);

-- NULL disables starvation for a domain.
alter table domains alter column starvation_days drop not null;

-- Baseline/setup data is server-only; future-system tables remain inert.
alter table domains enable row level security;
alter table items enable row level security;
alter table item_events enable row level security;
alter table memories enable row level security;
alter table nudges enable row level security;
alter table reviews enable row level security;
alter table app_state enable row level security;
alter table onboarding_state enable row level security;

revoke all on table domains, items, item_events, memories, nudges, reviews,
  app_state, onboarding_state from public, anon, authenticated;
grant all on table domains, items, item_events, memories, nudges, reviews,
  app_state, onboarding_state to service_role;

revoke all on sequence item_events_id_seq from public, anon, authenticated;
grant all on sequence item_events_id_seq to service_role;
