# HistoryCodex

Read history books, collect cards, and battle through the ages.

## Local development

```bash
npm install
cp .env.example .env.local   # optional for local overrides
npm run db:migrate           # or: node scripts/migrate-production.mjs
npm run db:seed
npm run db:seed-auth
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default dev accounts (after `db:seed-auth`): `admin@example.com` / `user@example.com`, password `password`.

## Production deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Docker, HTTPS, migrating local data, and server operations.

Quick Docker start:

```bash
cp .env.example .env   # set AUTH_SECRET
docker compose up -d --build
docker compose --profile setup run --rm setup   # first-time seed only
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run db:migrate` | Apply schema migrations (drizzle-kit) |
| `node scripts/migrate-production.mjs` | Apply migrations (production / Docker) |
| `npm run db:seed` | Seed eras and sample content |
| `npm run db:import-book-cards` | CLI catalog book card import |

## Stack

- Next.js 16 (App Router)
- SQLite + Drizzle ORM
- TanStack Query, Tailwind CSS 4
