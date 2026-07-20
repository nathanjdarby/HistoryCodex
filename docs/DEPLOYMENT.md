# Deploying HistoryCodex to a live server

HistoryCodex runs as a **Next.js Node server** with a **Supabase Postgres** database (shared by local dev and production) and **local file uploads** (`public/uploads/`). This suits a single VPS with persistent storage for uploads and a managed Postgres host for data.

---

## Quick start (Docker — recommended)

### 1. On your server

```bash
git clone <your-repo-url> historycodex
cd historycodex
cp .env.example .env
```

Edit `.env` and set:

- **`AUTH_SECRET`** — generate with `openssl rand -base64 32`
- **`DATABASE_URL`** — Supabase **pooler** URL (transaction mode, port 6543)
- **`DATABASE_URL_DIRECT`** — Supabase **direct** URL (port 5432, for migrations only)

See `.env.example` for the exact variable names and format.

### 2. Build and start

```bash
docker compose up -d --build
```

The app listens on port **3000** (or `APP_PORT` from `.env`).

On first boot the container runs **database migrations** automatically against Supabase via `DATABASE_URL_DIRECT`.

### 3. Put HTTPS in front

Use **Caddy** or **nginx** as a reverse proxy with TLS. Example nginx server block:

```nginx
server {
  listen 443 ssl http2;
  server_name codex.yourdomain.com;

  ssl_certificate     /etc/letsencrypt/live/codex.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/codex.yourdomain.com/privkey.pem;

  client_max_body_size 100M;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Keep `AUTH_COOKIE_SECURE=true` when users access the site over HTTPS.

---

## Shared Supabase database (local + production)

Local development and production use the **same** Supabase project. Cards, users, and packs you create locally appear on live immediately.

**Implications:**

- Broken local code can mutate **live production data**
- **`npm run db:seed`** and **`npm run db:seed-auth`** are **disabled by default** — they would duplicate eras or create default accounts. To run them intentionally, set `ALLOW_DESTRUCTIVE_SEED=historycodex`.
- **`npm run db:migrate`** applies schema changes to the shared database — coordinate before running on a branch with breaking migrations.
- Idempotent backfills (`db:backfill-*`, `db:seed-all-card-balance`, etc.) are generally safe.

---

## SQLite → Supabase cutover (one-time)

If you are migrating from the old SQLite deployment:

### 1. Add Supabase URLs to `.env`

Both local and server `.env` files need `DATABASE_URL` and `DATABASE_URL_DIRECT`.

### 2. Apply Postgres schema to empty Supabase

```bash
npm ci
npm run db:migrate
# or: node scripts/migrate-production.mjs
```

### 3. Import existing SQLite data

Copy your production SQLite file locally (or use the server copy), then:

```bash
DATABASE_PATH=./data/historycodex.db npm run db:migrate-sqlite-to-supabase
```

This preserves numeric IDs (card IDs, pack URLs, user IDs) and resets Postgres serial sequences.

**Warning:** The import script **truncates all Postgres tables** before inserting. Run only against a fresh schema or when you intend to replace all data.

### 4. Deploy with Postgres env vars

```bash
docker compose up -d --build
```

### 5. Smoke test

Verify: login, browse packs, open a pack, admin card create, catalog browse, reading milestones.

Keep the SQLite backup until stable.

---

## Moving uploads to the server

Uploads remain on the local filesystem (`public/uploads/`):

```bash
scp -r public/uploads user@your-server:/path/to/historycodex/public/
```

The Docker Compose file bind-mounts `./public/uploads` into the container.

If the app loop-restarts with `SQLITE_READONLY_DIRECTORY`, fix ownership on bind-mounted folders (or `git pull` and rebuild for the auto-fix entrypoint):

```bash
docker compose down
chown -R 1001:1001 ~/HistoryCodex/data ~/HistoryCodex/public/uploads
docker compose up -d
```

---

## Bare-metal deploy (no Docker)

Requirements: **Node 20+**

```bash
git clone <repo> historycodex && cd historycodex
cp .env.example .env
# Edit AUTH_SECRET, DATABASE_URL, DATABASE_URL_DIRECT

npm ci
npm run build
node scripts/migrate-production.mjs
# Do NOT run db:seed / db:seed-auth on shared Supabase unless migrating from scratch

PORT=3000 npm run start
```

Use **PM2** or **systemd** to keep the process running:

```bash
npm install -g pm2
pm2 start npm --name historycodex -- start
pm2 save
pm2 startup
```

Persistent paths on the server:

- Supabase Postgres — managed by Supabase (back up via Supabase dashboard or `pg_dump`)
- `public/uploads/` — character art, book covers, pack images

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | **Yes (prod)** | JWT signing secret for sessions |
| `DATABASE_URL` | **Yes** | Supabase pooler URL (app runtime) |
| `DATABASE_URL_DIRECT` | **Yes (migrations)** | Supabase direct URL (port 5432) |
| `DATABASE_PATH` | Import only | Path to SQLite file for one-time `db:migrate-sqlite-to-supabase` |
| `AUTH_COOKIE_SECURE` | No | `true` in production HTTPS (default) |
| `GOOGLE_BOOKS_API_KEY` | No | Admin book search |
| `READING_SESSIONS_REQUIRED` | No | Anti-cheat reading timer flag |
| `APP_PORT` | No | Host port for Docker Compose |
| `ALLOW_DESTRUCTIVE_SEED` | No | Set to `historycodex` to allow `db:seed` / `db:seed-auth` |

See `.env.example` for the full list.

---

## Operations cheat sheet

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f app` |
| Run migrations | `docker compose exec app node scripts/migrate-production.mjs` |
| Import SQLite → Supabase | `DATABASE_PATH=./data/historycodex.db npm run db:migrate-sqlite-to-supabase` |
| Import book cards (CLI) | `docker compose --profile setup run --rm setup npm run db:import-book-cards -- ...` |
| Apply card balance | `docker compose --profile setup run --rm setup npm run db:seed-all-card-balance` |
| Backup database | Supabase dashboard / `pg_dump` via `DATABASE_URL_DIRECT` |
| Update app | `git pull && docker compose up -d --build` |

---

## Hermes agent / automation

Once live, point automation at:

- **Base URL:** `https://codex.yourdomain.com`
- **Import UI:** `/admin/books/import` (admin login required)
- **API:** `/api/admin/catalog-books/import` and `/api/admin/catalog-books/import/stage`

For unattended agents you will still want **API key auth** on import routes (planned — see prior ingestion plan).

---

## What is *not* included yet

- **Supabase Auth** — app uses custom cookie sessions + `users` table
- **Supabase Storage** — uploads are local filesystem
- **Row Level Security** — app connects server-side with full DB access; RLS optional later
- **Separate dev/prod databases** — intentionally one shared Supabase project

For your use case (single live server + Hermes imports + shared dev/prod data), Docker on a VPS with Supabase Postgres is the intended path.
