# Manifesto.ng

A civic engagement tool and strategy game for Nigerian politics: a 21-question positioning quiz (plus 10 optional Afrobarometer-calibrated civic questions), a candidate directory, and an 8-year "govern Nigeria" decision game.

**This is a static site. It runs entirely in the browser — no backend, no database, no account needed to launch it.** `index.html` is a single file (all CSS and JS inline, no build step, no framework), and it's the whole product.

## Local development

No build tooling required — open `index.html` directly, or serve it locally:

```bash
npx serve .
```

## Deployment

Deployed on [Vercel](https://vercel.com) as a static site — zero config needed, no build step.

## What else is in this repo

There's a dormant backend (Supabase schema + a couple of Vercel serverless functions under `/api`) from an earlier pass at adding persistent analytics, an admin dashboard, etc. It's inactive — the site doesn't depend on it, nothing breaks without it configured — and it's not part of the MVP. See [ROADMAP.md](ROADMAP.md) if you want the full picture of what it is and how to switch it on later.
