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

## What the repo has that the artifact does not (as of artifact `1792854145-cae8`)

Do not copy the artifact over `index.html`; these would be lost.

| Repo-only | Why |
|---|---|
| Page title, description, canonical, link-preview and social tags in `<head>` | Share cards and search |
| Meta Pixel, the `mpx()` allow-list, and the script that hides `c=`, `g=` and `at=` from the URL | Advertising, and keeping results and a voter's place out of what the pixel sees |
| `/api/track` calls and `CONTENT_VERSION` | Anonymous analytics; bump the version when outcomes could change |
| The `play()` no-card guard | A fast second press on a Continue screen threw with the controls locked |
| Home ballot card as a live canvas map (`#wayMap`, baked ward points), pulsing button, phone cards sized to content | Home screen |
| Ballot page: map as the centrepiece, State / Local government / Party menus (`blStateSel`, `blLgSel`, `blPartySel`), phone map height from padding, load and retry states (`blRetry`), `at=` kept out of the address bar (`BL.at`) | Ballot page |
| `ballot.json`, `art/ballot_map.webp`, `art/end_bad.webp`, `art/end_good.webp` in the repo | The artifact publishes them as files; the repo has to hold copies |

If a new repo-only feature is added, add a distinctive string from it to `LOCAL_MARKERS.txt` and a row here.

## Getting repo-only work back into the artifact

Not done automatically, because publishing to the artifact overwrites it. If the home screen or ballot page
should be edited in the artifact as well, the repo's version of those sections has to be copied back by hand
(without the pixel and tracking), and `BASE.html` updated to match.
