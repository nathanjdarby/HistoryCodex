#!/bin/sh
set -e

mkdir -p /app/public/uploads/characters /app/public/uploads/books /app/public/uploads/packs

# Host bind mounts (scp/rsync as root) arrive owned by root — SQLite needs write access.
chown -R nextjs:nodejs /app/data /app/public/uploads

exec gosu nextjs:nodejs sh -c "node /app/scripts/migrate-production.mjs && exec node /app/server.js"
