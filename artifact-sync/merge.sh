#!/usr/bin/env bash
# Merge a newer artifact version into index.html without losing what exists only in the repo.
#
#   artifact-sync/merge.sh <new-artifact.html> <new-version-id>
#
# It is a three-way merge: index.html (ours) + BASE.html (the artifact version last merged) +
# the new artifact (theirs). Then it checks that every repo-only feature in LOCAL_MARKERS.txt is
# still there, that no new image or data file is missing, and that the inline scripts parse.
# Only when all of that passes does it write index.html and move BASE.html forward.
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="${1:?usage: artifact-sync/merge.sh <new-artifact.html> <new-version-id>}"
VER="${2:?usage: artifact-sync/merge.sh <new-artifact.html> <new-version-id>}"
BASE=artifact-sync/BASE.html
OUT=$(mktemp)
fail=0

echo "merging artifact $VER onto base $(cat artifact-sync/BASE_VERSION)"
if ! git merge-file -p index.html "$BASE" "$NEW" > "$OUT"; then
  cp "$OUT" artifact-sync/CONFLICTED.html
  echo "CONFLICTS: the artifact changed code the repo also changed. Resolve the markers in"
  echo "artifact-sync/CONFLICTED.html, then copy it over index.html by hand."
  grep -n '^<<<<<<<\|^=======\|^>>>>>>>' "$OUT" | head -20
  exit 1
fi

echo "-- repo-only features still present?"
while IFS= read -r m; do
  [ -z "$m" ] && continue
  if grep -qF -- "$m" "$OUT"; then :; else echo "   LOST: $m"; fail=1; fi
done < artifact-sync/LOCAL_MARKERS.txt

echo "-- images and data the page refers to, missing from the repo?"
grep -o '\(art\|faces\|hero\|portraits\)/[A-Za-z0-9_./-]*\.\(webp\|avif\|png\|jpg\)\|fetch("[A-Za-z0-9_./-]*\.json")' "$OUT" | sed 's/^fetch("//; s/")$//' | sort -u | while read -r f; do
  [ -f "$f" ] || echo "   MISSING: $f   (fetch it from the artifact's published files)"
done | tee /dev/stderr | grep -q . && fail=1 || true

echo "-- inline scripts parse?"
python3 - "$OUT" <<'PY' || fail=1
import re,subprocess,sys,tempfile,os
s=open(sys.argv[1]).read(); bad=0
for i,sc in enumerate(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>',s,flags=re.S)):
    p=os.path.join(tempfile.gettempdir(),'ify_sc%d.js'%i); open(p,'w').write(sc)
    r=subprocess.run(['node','--check',p],capture_output=True,text=True)
    if r.returncode: print('   script',i,'does not parse:',r.stderr[:200]); bad=1
sys.exit(bad)
PY

if [ "$fail" -ne 0 ]; then
  cp "$OUT" artifact-sync/REJECTED.html
  echo "NOT APPLIED. The merged result is in artifact-sync/REJECTED.html for inspection."
  exit 1
fi

cp "$OUT" index.html; cmp -s "$NEW" "$BASE" || cp "$NEW" "$BASE"; echo "$VER" > artifact-sync/BASE_VERSION
echo "applied. Now: bump CONTENT_VERSION if the deck, scoring or quiz changed, play a full game, commit."
