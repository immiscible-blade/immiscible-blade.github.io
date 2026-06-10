#!/usr/bin/env bash
# update.sh — validate, commit, and push site changes.
# Run from the repo folder:
#   bash update.sh                  (prompts for a message)
#   bash update.sh "add ACL paper"  (uses your message)
set -euo pipefail

# sanity: right folder, inside a repo
if [ ! -f assets/js/data.js ]; then
  echo "Run this from the site folder (where assets/js/data.js lives)."; exit 1
fi
git rev-parse --git-dir >/dev/null 2>&1 || { echo "Not a git repo yet — run publish.sh first."; exit 1; }

# anything to do?
if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to commit — working tree clean."; exit 0
fi

# catch a broken data.js BEFORE it ships — a missing comma would
# silently blank every rendered list on the live site
if command -v node >/dev/null 2>&1; then
  node --check assets/js/data.js || { echo; echo "Fix assets/js/data.js first — nothing was committed."; exit 1; }
  node --check assets/js/main.js || { echo; echo "Fix assets/js/main.js first — nothing was committed."; exit 1; }
else
  echo "(node not found — skipping JS syntax check)"
fi

echo "Changes:"
git status --short
echo

git add -A

# nudge if content changed but the footer date didn't
if git diff --cached --name-only | grep -qx "assets/js/data.js"; then
  if ! git diff --cached -- assets/js/data.js | grep -q "LAST_UPDATED"; then
    echo "tip: bump LAST_UPDATED in assets/js/data.js so the footer stays honest."
    echo
  fi
fi

# commit message: argument > prompt > auto-default from changed files
DEFAULT="update: $(git diff --cached --name-only | sed 's|.*/||' | paste -sd, - | sed 's/,/, /g' | cut -c1-60)"
if [ $# -ge 1 ]; then
  MSG="$*"
else
  read -rp "Commit message [$DEFAULT]: " MSG
  MSG="${MSG:-$DEFAULT}"
fi

git commit -m "$MSG"

if ! git push origin main; then
  echo
  echo "Push rejected — likely edits from another machine. Run:"
  echo "  git pull --rebase origin main"
  echo "then re-run this script."
  exit 1
fi

REPO=$(basename "$(git remote get-url origin)" .git)
echo
echo "Pushed. Live in ~1-2 minutes at: https://$REPO"
