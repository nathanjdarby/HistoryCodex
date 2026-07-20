#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo 'Set DATABASE_URL (and optionally DATABASE_URL_DIRECT) to smoke-test against Supabase.' >&2
  exit 1
fi

image="historycodex-production-smoke"
container="historycodex-production-smoke-$RANDOM"

cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build -t "$image" .
docker run -d \
  --name "$container" \
  -e AUTH_SECRET='production-smoke-test-secret-not-for-use' \
  -e AUTH_COOKIE_SECURE=false \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DATABASE_URL_DIRECT="${DATABASE_URL_DIRECT:-$DATABASE_URL}" \
  "$image" >/dev/null

for _ in $(seq 1 30); do
  if ! docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx true; then
    docker logs "$container"
    echo 'Production container exited before the application became ready.' >&2
    exit 1
  fi

  if docker logs "$container" 2>&1 | grep -q 'Ready in'; then
    echo 'Production container migrated against Postgres and started successfully.'
    exit 0
  fi
  sleep 1
done

docker logs "$container"
echo 'Production container did not become ready within 30 seconds.' >&2
exit 1
