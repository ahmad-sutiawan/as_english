# AS English — Workplace English Trainer

Practice workplace English for **IT managers**, **SREs**, and **fullstack engineers**.

Scenarios cover interview → offer → standup → incident → manager updates → demos.  
Each exercise shows multiple-choice options, but you **must retype** the correct answer.  
Audio uses the browser **Web Speech API** (Google English voices in Chrome).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Auth.js (NextAuth v5) credentials auth
- PostgreSQL + Prisma
- Content modules as versioned JSON
- Python `jsonschema` validator for content

## Quick start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL (Homebrew local **or** Docker)
- Python 3.10+ (optional, for content validation)

### 2. Install

```bash
cp .env.example .env
npm install
```

### 3. Database

**Option A — local Homebrew Postgres** (recommended if Docker is off):

```bash
chmod +x scripts/setup-local-db.sh
./scripts/setup-local-db.sh
```

**Option B — Docker Compose:**

```bash
npm run db:up
npx prisma migrate deploy
npm run db:seed
```

For local iteration you can also use `npx prisma migrate dev`.
Demo user:

- Email: `demo@asenglish.local`
- Password: `demo1234`

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Validate content (Python)

```bash
python3 -m venv scripts/python/.venv
source scripts/python/.venv/bin/activate
pip install -r scripts/python/requirements.txt
npm run content:validate
```

## Learning loop

1. Pick a module from the dashboard
2. Read the scenario / prompt (optional Play audio)
3. Read options A–D (not clickable as submit)
4. Type the correct answer in full
5. Exact match (normalized) = mastery; near-miss typos ask you to retry
6. Progress and attempts sync per user in Postgres

## Content layout

```
content/
  manifest.json
  modules/
    incident-oncall.json          # ready (10 items)
    manager-updates.json          # ready (10 items)
    interview-behavioral.json     # ready (10 items)
    *.json                        # stubs for remaining themes
```

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run db:up` | Start Postgres via Docker Compose |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed demo user |
| `npm run content:validate` | Validate JSON modules |

## Env

```
DATABASE_URL=postgresql://as_english:as_english@localhost:5432/as_english?schema=public
AUTH_SECRET=generate-a-long-random-secret
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```
