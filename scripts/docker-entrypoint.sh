#!/usr/bin/env sh
set -eu

echo "[entrypoint] Applying migrations..."
i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[entrypoint] migrate deploy failed after 60s" >&2
    exit 1
  fi
  echo "[entrypoint] Database not ready, retrying ($i)..."
  sleep 1
done

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "[entrypoint] Seeding demo user (idempotent)..."
  npx tsx prisma/seed.ts || echo "[entrypoint] Seed skipped/failed (non-fatal)"
fi

echo "[entrypoint] Starting app..."
exec "$@"
