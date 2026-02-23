#!/bin/bash
# BlockButler Auto-Backup Script
# Commits any uncommitted changes to the local git repo every time it runs.
# Intended to be called by cron every 30 minutes.
#
# Usage:  ./scripts/auto-backup.sh
# Cron:   */30 * * * * cd /Users/andrewantal/BlockButler && bash scripts/auto-backup.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# Ensure git identity is configured (local to this repo)
git config user.email "andrew.antal79@gmail.com" 2>/dev/null || true
git config user.name "Andrew Antal" 2>/dev/null || true

# Stage all changes
git add -A

# Only commit if there are staged changes
if ! git diff --cached --quiet; then
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Auto-backup $TIMESTAMP"
  echo "[auto-backup] Committed changes at $TIMESTAMP"
else
  echo "[auto-backup] No changes to commit"
fi
