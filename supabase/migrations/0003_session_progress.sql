-- How far each session got, so unfinished runs can be told apart by where they
-- stopped: the number of the last game decision made, or the last quiz answer
-- given (1-21, or up to 28 with the optional deeper questions). Written by /api/track on every
-- game_decision_made / quiz_answer_submitted event. Nullable: older sessions and
-- sessions that never reached a first choice have no value.

alter table sessions add column if not exists progress integer;
alter table sessions add column if not exists last_activity_at timestamptz;

create index if not exists sessions_progress_idx on sessions (experience_type, completion_status, progress);
create index if not exists event_log_session_idx on event_log (session_id);
