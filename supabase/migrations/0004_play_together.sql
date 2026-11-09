-- "Play with friends": group boards and Cabinet night rooms.
--
-- What is stored, and for how long:
--   * group_results  — the nickname a player typed, and the headline of their finished
--                      presidency (title, days in office, term, how often they kept their word),
--                      under a six-character group code. Kept 30 days.
--   * rooms, room_players, room_votes — a Cabinet night: the host's nickname, each minister's
--                      nickname, each minister's secret agenda (until the reveal at the end) and
--                      their vote on each decision. Deleted two days after the last activity.
-- Nothing here is linked to participants / anonymous_id, to the analytics tables, or to any
-- advertising pixel. Nicknames are whatever people choose to type; they are not verified.
--
-- Like every other table, these are reached only from server code with the service-role key.
-- RLS is on with no policies, so nothing is readable from the browser.

create table if not exists rooms (
  code text primary key check (code ~ '^[A-Z]{4}$'),
  host_key text not null,
  host_nick text not null,
  phase text not null default 'lobby' check (phase in ('lobby', 'play', 'end')),
  state jsonb not null default '{"phase":"lobby"}'::jsonb,
  ver bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rooms_updated_idx on rooms (updated_at);

create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  nick text not null,
  token text not null unique,
  secret jsonb,
  joined_at timestamptz not null default now()
);
create index if not exists room_players_room_idx on room_players (room_code, joined_at);

create table if not exists room_votes (
  room_code text not null references rooms(code) on delete cascade,
  player_id uuid not null references room_players(id) on delete cascade,
  turn integer not null,
  choice text not null check (choice in ('l', 'r', 'c')),
  voted_at timestamptz not null default now(),
  primary key (room_code, player_id, turn)
);

create table if not exists group_results (
  group_code text not null check (group_code ~ '^[A-Z0-9]{5,8}$'),
  nick text not null,
  result jsonb not null,
  term integer not null default 1,
  days integer not null default 0,
  posted_at timestamptz not null default now(),
  primary key (group_code, nick)
);
create index if not exists group_results_posted_idx on group_results (posted_at);

alter table rooms enable row level security;
alter table room_players enable row level security;
alter table room_votes enable row level security;
alter table group_results enable row level security;
