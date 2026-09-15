# If Na You

A civic engagement tool and strategy game for Nigerian politics: a 21-question positioning quiz (plus 10 optional Afrobarometer-calibrated civic questions), a candidate directory, and an 8-year "govern Nigeria" decision game. Live at [ifnayou.com](https://ifnayou.com).

`index.html` is a single static file (all CSS and JS inline, no build step, no framework) and is the entire frontend — quiz/game logic, scoring, everything runs client-side. It works with zero backend configured.

Alongside it, `/api` holds two small Vercel serverless functions that add a minimum analytics/research backend: anonymous participant + session tracking, and the **outcome** of each experience (quiz archetype + dimension scores; President game final outcome, decisions, fidelity to stated positions). It does not record every individual answer or decision — see [ROADMAP.md](ROADMAP.md) for the fuller schema this can grow into if that's ever worth the added surface area.

## Local development

Frontend: no build tooling required — open `index.html` directly, or serve it locally:

```bash
npx serve .
```

Backend: install dependencies and run everything (static file + `/api` functions) together with the Vercel CLI:

```bash
npm install
vercel dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project's URL + service role key first — `vercel dev` reads `.env.local` automatically. Never commit `.env.local`. Without it configured, the site still works fully — tracking calls just fail silently.

## Backend setup (one-time)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open **SQL Editor** and run `supabase/migrations/0001_init_schema.sql`.
3. In **Project Settings → API**, copy the **Project URL** and the **service_role** key (not the `anon` key — the service role key is what the serverless functions use, and it must stay server-side, never in frontend code).
4. In your Vercel project's **Settings → Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `COUNTER_ENABLED` (`true`/`false` — the public completion counter is off by default; flip this on later with no code change)
5. Redeploy so the functions pick up the env vars.

PostHog (optional): create a project at [posthog.com](https://posthog.com), copy its **Project API Key** (safe to put in client code — it's a public identifier, not a secret), and paste it into the `POSTHOG_KEY` constant near the top of `index.html`. Funnel events fire there in addition to our own database; no answer/decision content is ever sent to it.

## What's tracked

Every table has Row Level Security enabled with zero policies — only the `service_role` key (server-side only) can read or write anything, so nothing in the database is reachable from a browser even if a key leaked.

- **participants** — one row per anonymous visitor (a UUID in `localStorage`), with first/last seen and first-touch acquisition (referrer, UTM params, device type, country).
- **sessions** — one row per attempt at the quiz or the game, with completion status.
- **compass_results** / **president_results** — the outcome of a completed attempt.
- **event_log** — lightweight funnel events (`landing_viewed`, `compass_started`, `result_shared`, etc.) for product analytics.

See [ROADMAP.md](ROADMAP.md) for what's deliberately not built yet (per-question response tracking, demographics, an admin dashboard, CSV export, bot detection).

## Deployment

Deployed on [Vercel](https://vercel.com), auto-deploying from the `main` branch on GitHub. The static site needs zero build config; the `/api` functions are auto-detected from the `api/` folder.
