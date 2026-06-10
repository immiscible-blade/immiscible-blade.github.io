#!/usr/bin/env bash
# publish.sh — drop this into the unzipped site folder, then run:
#   bash publish.sh
# (On Windows: use Git Bash, which ships with Git for Windows.)
set -euo pipefail

read -rp "GitHub username: " GHUSER
REPO="$GHUSER.github.io"

# init + commit (safe to re-run)
git init -b main 2>/dev/null || git init
git add -A
git commit -m "Initial site" 2>/dev/null || echo "(nothing new to commit)"
git branch -M main

if command -v gh >/dev/null 2>&1; then
  # gh CLI: creates the repo and pushes in one step
  gh repo create "$REPO" --public --source=. --remote=origin --push
else
  echo
  echo ">> No gh CLI found. Create an EMPTY public repo named $REPO at:"
  echo ">>   https://github.com/new   (no README, no .gitignore)"
  read -rp ">> Press Enter once it exists... " _
  git remote add origin "https://github.com/$GHUSER/$REPO.git" 2>/dev/null || \
    git remote set-url origin "https://github.com/$GHUSER/$REPO.git"
  git push -u origin main
fi

echo
echo "Done. Live in ~1-2 minutes at: https://$REPO"
echo "Build status: https://github.com/$GHUSER/$REPO/actions"
