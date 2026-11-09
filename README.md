# If Na You

A civic engagement tool and strategy game for Nigerian politics: a 21-question positioning quiz (plus 10 optional Afrobarometer-calibrated civic questions), a candidate directory, and an 8-year "govern Nigeria" decision game. Live at [ifnayou.com](https://ifnayou.com).

`index.html` is a single static file (all CSS and JS inline, no build step, no framework) and is the entire frontend — quiz/game logic, scoring, everything runs client-side. It works with zero backend configured.

Alongside it, `/api` holds two small Vercel serverless functions that add a minimum analytics/research backend: anonymous participant + session tracking, and the **outcome** of each experience (quiz archetype + dimension scores; President game final outcome, decisions, fidelity to stated positions). Since November 2026 it also records each game decision and each quiz answer as events, still against an anonymous id only — see [ROADMAP.md](ROADMAP.md) for the fuller schema this can grow into if that's ever worth the added surface area.

## Bringing in changes from the Claude artifact

The game is edited in a Claude artifact, and the repo has things the artifact lacks (analytics, share tags, the home and ballot pages). Use `artifact-sync/merge.sh`, not a copy-over. See `artifact-sync/README.md`.

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

Ad pixels: only the Meta Pixel is installed, and it receives PageView plus generic conversion events only (`mpx()` allow-list). Its automatic event collection is switched off (`autoConfig`), because left on it sends the text of every button clicked, which here is the exact quiz answer or game choice. There is no PostHog or Google Ads tag in the page.

6. Run `supabase/migrations/0002_add_content_version.sql` and `0003_session_progress.sql` too (and `0004_play_together.sql` to turn on Play with friends). Without 0003 everything still works; the dashboard just cannot show where unfinished runs stopped.

## What's tracked

Every table has Row Level Security enabled with zero policies — only the `service_role` key (server-side only) can read or write anything, so nothing in the database is reachable from a browser even if a key leaked.

- **participants** — one row per anonymous visitor (a UUID in `localStorage`), with first/last seen and first-touch acquisition (referrer, UTM params, device type, country).
- **sessions** — one row per attempt at the quiz or the game, with completion status.
- **compass_results** / **president_results** — the outcome of a completed attempt.
- **event_log** — product events, each linked to its session. Since November 2026 this includes every game decision and every quiz answer (see below).

### Events

| Area | Event | What it records |
|---|---|---|
| Core | `landing_viewed` | A page load (the plan's `session_started`) |
| Core | `return_visit` | A visit 30+ minutes after the last one on that browser (`days_since`) |
| Core | `experience_selected` | president, compass or ballot; from a click or a link |
| Core | `president_started`, `compass_started` | The plan's `experience_started` |
| Core | `president_completed`, `compass_completed` | The plan's `experience_completed` |
| Core | `experience_restarted` | A second start of the same experience in one visit, after a completed or unfinished one |
| Core | `experience_abandoned` | Best effort, on leaving the page mid-run, with where they stopped. The dashboard also counts any session idle for an hour as abandoned |
| Play President | `game_decision_made` | Decision number, term, year, kind (opening, desk, campaign, impeachment, runoff, third term, amendment), who asked, which button and its words |
| Play President | `game_ending_viewed` | The presidency title the player saw, why it ended, term, third-term state |
| Quiz | `quiz_answer_submitted` | Question id (E1, S3 ...), lens, position, value (-2..2; 0 both; null skip) |
| Quiz | `result_viewed`, `result_shared` | The plan's `quiz_result_viewed` / `quiz_result_shared` (also used for the game's share card) |
| Engagement | `share_clicked`, `share_completed` | Phone share sheet opened, and confirmed sent |
| Engagement | `invite_link_opened` | Arrival on a shared quiz or game result |

| Quiz | `quiz_question_viewed` | Each question as shown: id, lens, position, headline, wording, both options in the order shown, `revisit` |
| Quiz | `quiz_answer_submitted` | Also carries `picked` (the exact option text) and `ms` (time on the question, capped at 10 minutes) |
| Play President | `game_card_viewed` | Each card as shown: who, the exact words, the button texts, `continue_only` for story screens |
| Play President | `game_consequence_viewed` | The headline and text shown after a choice |
| Play President | `game_history_opened` | "This happened in Nigeria" opened on a card |
| Play President | `game_decision_made` | Also carries `says` (the card's words) and `ms` (time on the card) |

Quiz answers and game choices are stored here, in the database, with the wording the player saw. They never go to the ad pixel.

Not built, because nothing on the site produces them yet: `feedback_submitted`, `waitlist_joined`, `partnership_enquiry`, `pilot_requested`. `session_started` is `landing_viewed`.

### Where visitors come from

On the first visit the page sends `participant_seen` with the `utm_source`, `utm_medium` and `utm_campaign` on the link, *which kind* of ad click id was present (`gclid`/`gbraid`/`wbraid` for Google, `fbclid` for Meta; the id itself is never sent or stored) and the referring site's host only. `api/_lib/source.js` turns that into source / medium / campaign on the participant (first touch only, never overwritten). The dashboard groups them into channels: Google ads, Meta ads, Meta click (untagged), Other paid, Referral, Direct, and "Before source tracking" for everyone who arrived before it was switched on (the "earlier players" comparison group).

Tag every ad's final URL, because platforms add click ids but not always the campaign:

- Google Ads: `?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}` (or use the account's "final URL suffix" so it applies to every ad)
- Meta Ads: `?utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}` in the ad's URL parameters

### Play with friends (Cabinet night and group boards)

The page offers two ways to play with others once `supabase/migrations/0004_play_together.sql` has been run; until then the section stays hidden.

- **Same game, compare after**: a six-character group code in the link seeds the game, so everyone gets the same Nigeria. Finished presidencies are posted to `/api/group` and shown on one board.
- **Cabinet night**: one person plays the President; friends join on their phones as ministers (`/api/room`), vote on every decision and carry a secret agenda that is revealed at the end. The President's page runs the game and the scoring; the server is a relay that holds the room, shows ministers the current card, collects votes, and keeps each agenda to its owner until the reveal.

Stored: the nicknames people type, the headline of each finished presidency (groups, kept 30 days), and a room's ministers, agendas and votes (deleted two days after the last activity). None of it is linked to the analytics tables or the anonymous id, and none of it goes to any pixel; the page only records counts (`cabinet_hosted`, `cabinet_started`, `cabinet_join_opened`, `group_game_started`). Anything a browser sends is rebuilt field by field in `api/_lib/together.js` before it is stored or shown to another player. Tests: `node tests/together.test.js`. To try it locally without Supabase: `node tests/devserver.js 5512`.

### The admin dashboard

`/admin.html` has a period menu and a "Players from" menu. Every table below the first channel table follows that menu. All shares of "people who answered X" use only the sessions that answered X; sessions that merely saw it, skipped it or left are shown beside, never inside. Rows under 30 answers are dimmed and carry no signals. Tests: `node tests/report.test.js` and `node tests/api.test.js` (no database needed).

See [ROADMAP.md](ROADMAP.md) for what's deliberately not built yet (demographics, CSV export, bot detection).

## Deployment

Deployed on [Vercel](https://vercel.com), auto-deploying from the `main` branch on GitHub. The static site needs zero build config; the `/api` functions are auto-detected from the `api/` folder.
