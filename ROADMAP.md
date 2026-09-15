# Roadmap: from minimum backend to a research-grade product

The site works fully on its own — quiz, candidate directory, and the
President game all run client-side, no backend required for any of it to
work. On top of that, a minimum analytics/research backend is now built
(Supabase + two Vercel serverless functions). This document tracks what's
shipped and what's deliberately deferred.

## What's live

- `supabase/migrations/0001_init_schema.sql` — schema for `participants`,
  `sessions`, `compass_results`, `president_results`, `event_log`. RLS
  enabled with zero policies on every table — only the `service_role` key
  (server-side only) can read or write anything.
- `api/track.js` — one endpoint (`participant_seen`, `session_start`,
  `session_complete`, `compass_result`, `president_result`, `event`),
  dispatched by `type`.
- `api/counter.js` — public completed-experiences counter, off by default
  via `COUNTER_ENABLED`.
- A client-side tracking module in `index.html` (anonymous participant id in
  `localStorage`, per-experience session ids) wired into `start()`,
  `beginCompass()`/`startBtn`/`again`, `finish()`, `beginRun()`, `endGame()`,
  and the share buttons. Every call is fire-and-forget and fails silently if
  no backend is configured.
- An optional PostHog loader, inert until a project key is pasted into
  `POSTHOG_KEY`.

**Deliberately not tracked**: individual quiz answers or President-game
decisions — only the final outcome of each attempt. See "Per-question
response tracking" below for what adding that would take.

**To activate**: create the Supabase project, run the migration, set
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` in Vercel's env vars. See
README.md → "Backend setup". No code changes needed.

## Remaining work

### Per-question response tracking
The full original spec called for recording every individual quiz answer and
President decision, with stable codes (`ECON_001`, `PRES_014`, etc.) so
question wording can change later without corrupting historical analysis.
This was built once already but the artifact's Q/CIVIC/DECK content has
since changed shape across several ships, so it needs re-deriving against
whatever the current content is when this is picked up — not a big job, just
not worth doing speculatively while the content is still actively changing.
Would add `questions`, `answers`, and `responses` tables plus a
`response`-type handler in `api/track.js`.

### Optional demographics step
A short, skippable step after someone sees their result — age range, gender,
state, Nigeria/diaspora. Explicit "this is optional" framing; never blocks
seeing the result.

### Privacy disclosure
A short, plain-language note (not a legal wall): responses are analysed in
aggregate, individual political responses aren't publicly identifiable,
demographics are optional, we don't sell individual-level data. Plus a
placeholder `/privacy` page for the fuller policy.

### Public completion counter UI
`api/counter.js` already computes this server-side; needs a small UI element
on the landing page ("12,483 Nigerians have taken this") and
`COUNTER_ENABLED=true` once the number is worth showing.

### Admin dashboard
A protected internal page: participant/session counts, completion and share
rates, archetype and President-outcome distributions, filterable by
demographics once that exists. Needs its own `/api/admin/*` endpoints behind
a bearer token (`ADMIN_TOKEN`), separate from the public tracking endpoint.

### CSV export
Admin-only export of participants, sessions, and results.

### Basic anti-bot / duplicate detection
Rate limiting and repeated-pattern detection, flagging suspicious
participants/sessions rather than deleting anything.

### PostHog (optional)
Paste a project key into `POSTHOG_KEY` in `index.html` for funnel/product
analytics without touching the database. Political-response content never
goes to PostHog by design.
