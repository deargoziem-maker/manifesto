# Keeping the repo and the Claude artifact in step

Two places now change `index.html`: the Claude artifact (where the game is edited) and this repo (where
the site is shipped). The repo has things the artifact does not, so the artifact cannot simply be copied
over it. This folder is what keeps the two from drifting apart unnoticed.

## Bringing in a new artifact version

1. Read the artifact (Claude's Artifact tool, action `read`) and note its version id and the saved file.
2. Run `artifact-sync/merge.sh <that-file> <version-id>`.
3. The script does a three-way merge (repo + `BASE.html` + new artifact), then refuses to apply it if:
   - the artifact and the repo changed the same lines (conflict), or
   - a feature listed in `LOCAL_MARKERS.txt` has gone missing, or
   - the page now refers to an image or data file the repo does not have (fetch it from the artifact's
     published files), or
   - an inline script no longer parses.
4. If it applies: bump `CONTENT_VERSION` when the deck, scoring or quiz changed, play a full game, commit.

`BASE.html` is the artifact version last merged (`BASE_VERSION`). It moves forward only when a merge is
applied, so the next merge always starts from the right place. `artifact-sync/` is in `.vercelignore`,
so none of this is served on the live site.

## Where the repo and the artifact stand (artifact `1794313513-76d8`, 2026-11-10)

On 2026-11-08 the artifact was updated to match the live site, so the game, the home screen, the ballot page and
every layout fix now exist in both places. What the artifact deliberately does **not** have is the analytics and
the public-site wrapper. Do not copy the artifact over `index.html`; these would be lost.

| Repo only | Why it stays out of the artifact |
|---|---|
| Page title, description, canonical, link-preview and social tags in `<head>` | Share cards and search belong to the public site |
| Meta Pixel, the `mpx()` allow-list, and the script that hides `c=`, `g=` and `at=` from the URL | The pixel would fire from inside the artifact viewer and pollute the ad data; the artifact page has no such URL to hide |
| `/api/track` calls, `CONTENT_VERSION`, `beginCompass()` and the other `evt()` / `track()` hooks | Anonymous analytics only make sense on the live site |
| Source capture (`window.__IFY_SRC`, sent with `participant_seen`) and the pixel's `autoConfig` off switch | Ad-source tracking; keeps button text (quiz answers) out of Meta |
| `api/room.js`, `api/group.js`, `api/_lib/together.js`, migration `0004`, and the "Play with friends" hide-until-ready guard above `boot` | The artifact has the Play with friends screens but no backend. The guard keeps the section hidden until `/api/room?ping=1` says the tables exist. The page and these endpoints share a contract (`api/room.js` header); change both together |
| The product-analytics block above `boot` (wraps `evt`, `enter`, `play`, `endGame`, `kqCommit`, `kqRender`, `readInvite`; watches `#gSays` and `#gFlagBox`) | Same. If the artifact renames one of those functions, update the block or that event stops |

Everything else is in both. These are guarded by `LOCAL_MARKERS.txt` so an artifact-side edit cannot silently drop them:
the `play()` no-card guard; the "Play with friends" hide-until-`/api/room` guard; the live home ballot map (`#wayMap`); the ballot page with its State / Local government /
Party menus (`blStateSel`, `blLgSel`, `blPartySel`), load and retry states (`blRetry`), phone map height from padding and
`at=` kept out of the address bar (`BL.at`); in-game notices that sit below the bars (`#view-play .shift`, phones and
laptops); and the "This happened in Nigeria" note offered on its own question (`offerHist` / `hideHist`, `#gHistBtn`).

Images and data (`ballot.json`, `art/*`) are published files of the artifact and copies in the repo; keep both in step.

If a new repo-only feature is added, add a distinctive string from it to `LOCAL_MARKERS.txt` and a row above.

## Getting repo-only work back into the artifact

Not done automatically, because publishing to the artifact overwrites it. If the home screen or ballot page
should be edited in the artifact as well, the repo's version of those sections has to be copied back by hand
(without the pixel and tracking), and `BASE.html` updated to match.
