#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads/characters /app/public/uploads/books /app/public/uploads/packs

node /app/scripts/migrate-production.mjs

exec node /app/server.js
