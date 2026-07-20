#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DATABASE_URL:?Set DATABASE_URL in .env (Supabase pooler URL)}"
export DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}"
export DATABASE_PATH="${DATABASE_PATH:-./data/historycodex.db}"

if [[ ! -f "$DATABASE_PATH" ]]; then
  echo "SQLite file not found at $DATABASE_PATH" >&2
  exit 1
fi

echo "==> Step 1: Apply Postgres schema to Supabase"
node scripts/migrate-production.mjs

echo "==> Step 2: Import SQLite data (truncates Postgres tables first)"
npm run db:migrate-sqlite-to-supabase

echo "==> Step 3: Deploy Docker with Postgres env"
docker compose up -d --build

echo "Cutover complete. Smoke-test login, packs, and admin flows."
