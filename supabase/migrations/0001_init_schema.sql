-- Manifesto.ng research/analytics schema.
--
-- Design notes:
--  * Every table is accessed ONLY through server-side code (Vercel serverless
--    functions) using the Supabase service_role key, which bypasses Row Level
--    Security. RLS is enabled on every table below with zero policies attached,
--    so even if the anon/public key ever leaked, no direct client access is
--    possible. Nothing in this schema is reachable from the browser.
--  * "responses" intentionally has no uniqueness constraint on
--    (session_id, question_id): a respondent can revisit a Compass question
--    (Back button) or, in a long Governor run, see a reshuffled President
--    card twice. Every answer is recorded as its own row; take the latest
--    answered_at per (session_id, question_id) for a "final answer" read.
--  * question_version is duplicated onto responses/results (not just looked
--    up via questions.question_version) so historical rows stay correct even
--    after question wording/version is bumped later.

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
  country text,
  is_suspected_bot boolean not null default false,
  is_duplicate_candidate boolean not null default false
);
create index participants_anonymous_id_idx on participants (anonymous_id);
create index participants_first_seen_idx on participants (first_seen_at);

alter table participants enable row level security;

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  experience_type experience_type not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  completion_status completion_status not null default 'in_progress',
  duration_seconds integer,
  experiment_variant text,
  is_suspected_bot boolean not null default false,
  is_duplicate_candidate boolean not null default false
);
create index sessions_participant_idx on sessions (participant_id);
create index sessions_experience_status_idx on sessions (experience_type, completion_status);
create index sessions_started_idx on sessions (started_at);

alter table sessions enable row level security;

-- ---------------------------------------------------------------------------
-- questions / answers (the stable-code catalogue; seeded in 0002)
-- ---------------------------------------------------------------------------
create table questions (
  id uuid primary key default gen_random_uuid(),
  stable_question_code text not null unique,
  experience_type experience_type not null,
  category text not null,
  question_version text not null default 'v1',
  active boolean not null default true,
  prompt text,
  created_at timestamptz not null default now()
);
create index questions_experience_idx on questions (experience_type, active);

alter table questions enable row level security;

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  stable_answer_code text not null unique,
  answer_label text not null,
  scoring_meta jsonb,
  created_at timestamptz not null default now()
);
create index answers_question_idx on answers (question_id);

alter table answers enable row level security;

-- ---------------------------------------------------------------------------
-- responses (one row per decision/answer)
-- ---------------------------------------------------------------------------
create table responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid not null references questions(id),
  answer_id uuid not null references answers(id),
  question_version text not null,
  answered_at timestamptz not null default now(),
  response_time_ms integer,
  answer_changed boolean not null default false,
  experiment_variant text
);
create index responses_session_idx on responses (session_id);
create index responses_participant_idx on responses (participant_id);
create index responses_question_idx on responses (question_id);
create index responses_answered_at_idx on responses (answered_at);

alter table responses enable row level security;

-- ---------------------------------------------------------------------------
-- compass_results
-- ---------------------------------------------------------------------------
create table compass_results (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null unique references sessions(id) on delete cascade,
  archetype text not null,
  archetype_share numeric,
  tied_archetypes text[],
  final_dimension_scores jsonb not null,
  question_version text not null,
  completed_at timestamptz not null default now()
);
create index compass_results_participant_idx on compass_results (participant_id);
create index compass_results_archetype_idx on compass_results (archetype);

alter table compass_results enable row level security;

-- ---------------------------------------------------------------------------
-- president_results
-- ---------------------------------------------------------------------------
create table president_results (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  session_id uuid not null unique references sessions(id) on delete cascade,
  final_score numeric,
  final_outcome text not null,
  outcome_reason text,
  ending_bloc text,
  decisions_count integer,
  years_served numeric,
  contradictions integer,
  governed_dimension_scores jsonb,
  final_value_scores jsonb,
  final_bloc_scores jsonb,
  question_version text not null,
  completed_at timestamptz not null default now()
);
create index president_results_participant_idx on president_results (participant_id);
create index president_results_outcome_idx on president_results (final_outcome);

alter table president_results enable row level security;

-- ---------------------------------------------------------------------------
-- demographics (all optional, one row per participant)
-- ---------------------------------------------------------------------------
create table demographics (
  participant_id uuid primary key references participants(id) on delete cascade,
  age_range text,
  gender text,
  state text,
  geopolitical_zone text,
  residency text,
  education_band text,
  employment_band text,
  created_at timestamptz not null default now()
);

alter table demographics enable row level security;

-- ---------------------------------------------------------------------------
-- event_log (lightweight funnel/product-analytics events kept in our own DB,
-- separate from PostHog, for events we don't want to duplicate response
-- content into a third-party tool for)
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
