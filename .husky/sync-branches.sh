#!/bin/sh

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$BRANCH" = "staging" ]; then
  echo "🔄 Syncing staging to testing..."

  # Check if there are uncommitted changes and stash them
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "🔒 Uncommitted changes detected! Stashing them temporarily..."
    git stash push -m "Auto-stash before branch sync"
    STASHED=true
  else
    STASHED=false
  fi

  git fetch origin testing
  git switch testing
  git merge staging --no-edit

  if [ $? -ne 0 ]; then
    echo "❌ Merge conflict detected! Resolve manually before pushing."
    git switch staging
    if [ "$STASHED" = true ]; then
      git stash pop
    fi
    exit 1
  fi

  git push origin testing
  echo "✅ Staging successfully merged into testing."

  git switch staging

  # Restore stashed changes if necessary
  if [ "$STASHED" = true ]; then
    echo "🔄 Restoring stashed changes..."
    git stash pop
  fi
fi
