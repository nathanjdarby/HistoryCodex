#!/usr/bin/env bash
# Run on the production server after git pull (see docs/DEPLOYMENT.md).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> HistoryCodex deploy ($(pwd))"
echo "==> Fetching origin/${BRANCH}..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> Rebuilding and restarting containers..."
docker compose up -d --build

echo "==> Running status check..."
docker compose ps

echo "==> Deploy complete."
