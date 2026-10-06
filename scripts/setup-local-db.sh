#!/usr/bin/env bash
# Bootstrap local Homebrew Postgres for AS English (no Docker required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PSQL="${PSQL:-psql}"
ADMIN_URL="${ADMIN_URL:-postgresql://cucurut@localhost:5432/postgres}"

echo "Creating role/database as_english (if missing)..."
"$PSQL" "$ADMIN_URL" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'as_english') THEN
    CREATE ROLE as_english LOGIN PASSWORD 'as_english';
  END IF;
END
$$;
SQL

if ! "$PSQL" "$ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='as_english'" | grep -q 1; then
  createdb -O as_english as_english
fi

"$PSQL" "$ADMIN_URL" -c "ALTER DATABASE as_english OWNER TO as_english;" >/dev/null
"$PSQL" "postgresql://cucurut@localhost:5432/as_english" -c "GRANT ALL ON SCHEMA public TO as_english; ALTER SCHEMA public OWNER TO as_english;" >/dev/null

echo "Applying migrations..."
npx prisma migrate deploy

echo "Seeding demo user..."
npm run db:seed

echo "Done. Demo: demo@asenglish.local / demo1234"
