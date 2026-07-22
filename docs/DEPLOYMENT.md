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

The app listens on port **3005** by default (or `APP_PORT` from `.env`; Docker maps that host port to container port 3000).

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
    proxy_pass http://127.0.0.1:3005;
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

## Uploads (Supabase Storage)

Card art, booster pack images, and custom book covers are stored in a **public Supabase Storage bucket** when `SUPABASE_SERVICE_ROLE_KEY` is set. The database stores the public object URL; all environments (local dev and production) read the same files.

One-time setup:

```bash
# In .env / .env.local
SUPABASE_URL=https://[ref].supabase.co          # optional if DATABASE_URL uses postgres.[ref]@
SUPABASE_SERVICE_ROLE_KEY=...                   # Supabase → Settings → API
SUPABASE_STORAGE_BUCKET=historycodex-uploads    # optional default

npm run uploads:setup-storage
```

Migrate existing files from `public/uploads/` (sync from production first if your machine is missing files):

```bash
# Optional: pull missing files from production into public/uploads/
UPLOAD_MIRROR_URL=https://your-production-host npm run uploads:sync

npm run uploads:migrate
```

Legacy `/uploads/...` paths in the database redirect to Supabase when storage is configured. New uploads go directly to the bucket.

---

## Moving uploads to the server (legacy)

If you are not using Supabase Storage yet, uploads remain on the local filesystem (`public/uploads/`):

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

PORT=3005 npm run start
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
| Auto-deploy on push to `main` | GitHub Actions → see **Automatic deploys** below |

---

## Automatic deploys (GitHub Actions)

Push to **`main`** can deploy without SSHing in manually.

### 1. One-time server setup

On the VPS (once):

```bash
# Clone if needed — use the same path you will put in DEPLOY_PATH
git clone https://github.com/nathanjdarby/HistoryCodex.git ~/HistoryCodex
cd ~/HistoryCodex
cp .env.example .env   # edit with production secrets

# Let the deploy user pull without a password:
# Option A — SSH deploy key (recommended): generate on server, add public key as a
# read-only Deploy key on GitHub → repo → Settings → Deploy keys
ssh-keygen -t ed25519 -f ~/.ssh/historycodex_deploy -N ""
cat ~/.ssh/historycodex_deploy.pub   # paste into GitHub Deploy keys

# Option B — HTTPS with a fine-grained PAT stored in git credential helper
```

Ensure Docker works for your deploy user (`docker compose` without sudo, or add user to the `docker` group).

Test manually:

```bash
cd ~/HistoryCodex
./scripts/deploy-production.sh
```

### 2. GitHub repository secrets

In **GitHub → Settings → Secrets and variables → Actions**, add:

| Secret | Example |
|--------|---------|
| `DEPLOY_HOST` | Your server IP or hostname |
| `DEPLOY_USER` | SSH user (e.g. `ubuntu`, `deploy`) |
| `DEPLOY_SSH_KEY` | Private key that can SSH as `DEPLOY_USER` (full PEM, including `BEGIN`/`END` lines) |
| `DEPLOY_PATH` | Optional — absolute path to repo on server (default `~/HistoryCodex`) |

The workflow file is `.github/workflows/deploy-production.yml`. It runs on every push to `main`, or manually via **Actions → Deploy production → Run workflow**.

### 3. Day-to-day flow

```bash
git checkout main
git merge your-feature-branch
git push origin main
```

GitHub SSHes to the server and runs `scripts/deploy-production.sh` (`git pull` + `docker compose up -d --build` + migrations on container start).

**Note:** Local dev and production share Supabase — only merge to `main` when you are happy for live to get schema/data-facing changes.

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
