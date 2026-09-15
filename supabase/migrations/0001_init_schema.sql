-- If Na You — minimum research/analytics schema.
--
-- Scope: anonymous participants, sessions, and the OUTCOME of each experience
-- (Compass archetype + dimension scores; President final outcome + the
-- run's key numbers). This intentionally does not record every individual
-- quiz answer or game decision — see ROADMAP.md for the fuller schema this
-- can grow into later if per-question research becomes worth the added
-- surface area.
--
-- Every table is accessed ONLY through server-side code (Vercel serverless
-- functions) using the Supabase service_role key, which bypasses Row Level
-- Security. RLS is enabled on every table below with zero policies attached,
-- so even if the anon/public key ever leaked, no direct client access is
-- possible. Nothing in this schema is reachable from the browser.

create extension if not exists pgcrypto;

create type experience_type as enum ('compass', 'president');
create type completion_status as enum ('in_progress', 'completed', 'abandoned');

-- ---------------------------------------------------------------------------
-- participants
-- ---------------------------------------------------------------------------
create table participants (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  acquisition_source text,
  acquisition_medium text,
  acquisition_campaign text,
  referrer text,
  device_type text,
  country text
);
create index participants_anonymous_id_idx on participants (anonymous_id);
create index participants_first_seen_idx on participants (first_seen_at);

alter table participants enable row level security;

-- ---------------------------------------------------------------------------
-- sessions (one per attempt at either experience)
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  experience_type experience_type not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_status completion_status not null default 'in_progress'
);
create index sessions_participant_idx on sessions (participant_id);
create index sessions_experience_status_idx on sessions (experience_type, completion_status);
create index sessions_started_idx on sessions (started_at);

alter table sessions enable row level security;

-- ---------------------------------------------------------------------------
-- compass_results — the outcome of a completed 21-question placement
-- ---------------------------------------------------------------------------
create table compass_results (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null unique references sessions(id) on delete cascade,
  archetype text not null,
  archetype_share numeric,
  tied_archetypes text[],
  final_dimension_scores jsonb not null,
  completed_at timestamptz not null default now()
);
create index compass_results_participant_idx on compass_results (participant_id);
create index compass_results_archetype_idx on compass_results (archetype);

alter table compass_results enable row level security;

-- ---------------------------------------------------------------------------
-- president_results — the outcome of a completed/ended presidency
-- ---------------------------------------------------------------------------
create table president_results (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null unique references sessions(id) on delete cascade,
  final_outcome text not null,       -- e.g. lost_election, captured_by_street, served_full_term
  outcome_reason text,               -- the raw `why` passed to endGame(): lost | legacy | null
  ending_bloc text,                  -- which bloc ended the run, if any
  decisions_count integer,
  years_served numeric,
  contradictions integer,
  fidelity_tested integer,           -- decisions that tested a committed position
  fidelity_kept integer,             -- of those, how many held
  governed_dimension_scores jsonb,
  final_value_scores jsonb,
  final_bloc_scores jsonb,
  completed_at timestamptz not null default now()
);
create index president_results_participant_idx on president_results (participant_id);
create index president_results_outcome_idx on president_results (final_outcome);

alter table president_results enable row level security;

-- ---------------------------------------------------------------------------
-- event_log — lightweight funnel/product-analytics events
-- ---------------------------------------------------------------------------
create table event_log (
  id bigint generated always as identity primary key,
  participant_id uuid references participants(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  event_name text not null,
  properties jsonb,
  occurred_at timestamptz not null default now()
);
create index event_log_name_idx on event_log (event_name, occurred_at);
create index event_log_participant_idx on event_log (participant_id);

alter table event_log enable row level security;
