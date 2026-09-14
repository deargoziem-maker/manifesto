# Manifesto.ng

A civic engagement tool and strategy game for Nigerian politics: a 21-question positioning quiz (plus 10 optional Afrobarometer-calibrated civic questions), a candidate directory, and an 8-year "govern Nigeria" decision game.

The frontend (`index.html`) is a single static file — all CSS and JS inline, no build step, no framework. All quiz/game scoring logic runs entirely client-side and is untouched by the backend work below. Alongside it, `/api` holds a small set of Vercel serverless functions that give the product a real backend: anonymous participant/session tracking, per-question response capture, final results, and a public completion counter, all stored in Supabase Postgres.

## Architecture

- **Frontend**: `index.html`, deployed as a static site on Vercel. Unchanged in design/logic — the only additions are a client-side tracking module (anonymous id, `fetch('/api/track', ...)` calls) wired into the existing quiz/game event handlers, and stable `code` fields added to the question/card data arrays.
- **Backend**: Vercel serverless functions under `/api`, using the Supabase **service_role** key (server-side only, never shipped to the browser). Every table has Row Level Security enabled with zero policies, so the anon/public key isn't used at all — nothing in the database is reachable directly from a browser.
- **Database**: Supabase Postgres. Schema lives in `supabase/migrations/*.sql` (see below), not created ad hoc through the dashboard.
- **Analytics**: PostHog (optional, client-side, off by default — see `POSTHOG_KEY` in `index.html`) for funnel/product events. Political-response content (answers, decisions, results) is never sent to PostHog — it goes only to our own Supabase tables via `/api/track`.

## Stable question/answer codes

Every compass statement, civic statement, and President-game card carries a permanent `code` (e.g. `ECON_001`, `PRES_014`), added purely additively — scoring fields are untouched. A shared `QVERSION` constant (currently `"v1"`) is recorded on every response/result row, so wording can change later without corrupting historical analysis. See `scripts/gen_seed.py`, which extracts these codes + current wording straight from `index.html` to generate the seed migration — rerun it (and bump `QVERSION`) if question wording changes meaningfully.

## Local development

Frontend: no build tooling required — open `index.html` directly, or serve it locally:

```bash
npx serve .
```

Backend: install the Vercel CLI and the one npm dependency (`@supabase/supabase-js`), then run everything (static file + `/api` functions) together:

```bash
npm install
npm install -g vercel   # if you don't already have it
vercel dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project's URL + service role key first (see below) — `vercel dev` reads `.env.local` automatically. Never commit `.env.local`.

## Backend setup (one-time)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run the contents of `supabase/migrations/0001_init_schema.sql`, then `supabase/migrations/0002_seed_questions.sql`, in that order.
3. In **Project Settings → API**, copy the **Project URL** and the **service_role** key (not the `anon` key — the service role key is what the serverless functions use, and it must stay server-side).
4. In your Vercel project's **Settings → Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `COUNTER_ENABLED` (`true`/`false` — the public completion counter is off by default; flip this on later with no code change)
5. Redeploy (or trigger a new deployment) so the functions pick up the env vars.

PostHog (optional): create a project at [posthog.com](https://posthog.com), copy its **Project API Key** (this one is safe to put in client code — it's a public identifier, not a secret), and paste it into the `POSTHOG_KEY` constant near the top of `index.html`.

## Deployment

Deployed on [Vercel](https://vercel.com). The static site needs zero build config; the `/api` functions are auto-detected from the `api/` folder. `npm install` runs during the Vercel build to fetch `@supabase/supabase-js` for the functions — `index.html` itself still ships with no build step.
