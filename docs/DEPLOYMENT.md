# Deploying HistoryCodex to a live server

HistoryCodex runs as a **Next.js Node server** with a **SQLite** database and **local file uploads** (`data/` and `public/uploads/`). This suits a single VPS with persistent storage.

---

## Quick start (Docker — recommended)

### 1. On your server

```bash
git clone <your-repo-url> historycodex
cd historycodex
cp .env.example .env
```

Edit `.env` and set a strong `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 2. Build and start

```bash
docker compose up -d --build
```

The app listens on port **3000** (or `APP_PORT` from `.env`).

On first boot the container runs **database migrations** automatically.

### 3. Seed initial data (first time only)

```bash
docker compose --profile setup run --rm setup
```

This runs migrations, base eras/content seed, and default login accounts:

| Account | Password | Role |
|---------|----------|------|
| `admin@example.com` | `password` | admin |
| `user@example.com` | `password` | user |

**Change these passwords immediately** after first login (or remove seed auth and create real accounts).

### 4. Put HTTPS in front

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

## Moving your local dev data to the server

If you already have content locally:

1. **Stop** the local app.
2. Copy the database and uploads:

```bash
# From your laptop
scp data/historycodex.db user@your-server:/path/to/historycodex/data/
scp -r public/uploads user@your-server:/path/to/historycodex/public/
```

With Docker volumes:

```bash
docker compose down
# Copy files into the volume paths, or use docker cp
docker compose up -d
```

3. On the server, run migrations (safe on existing DB):

```bash
docker compose exec app node scripts/migrate-production.mjs
```

---

## Bare-metal deploy (no Docker)

Requirements: **Node 20+**, build tools for `better-sqlite3` (`python3`, `make`, `g++` on Linux).

```bash
git clone <repo> historycodex && cd historycodex
cp .env.example .env
# Edit AUTH_SECRET and other vars

npm ci
npm run build
node scripts/migrate-production.mjs
npm run db:seed        # first time
npm run db:seed-auth   # first time

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

- `data/historycodex.db` — back this up regularly
- `public/uploads/` — character art, book covers, pack images

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | **Yes (prod)** | JWT signing secret for sessions |
| `DATABASE_PATH` | No | SQLite file path (default `./data/historycodex.db`) |
| `AUTH_COOKIE_SECURE` | No | `true` in production HTTPS (default) |
| `GOOGLE_BOOKS_API_KEY` | No | Admin book search |
| `READING_SESSIONS_REQUIRED` | No | Anti-cheat reading timer flag |
| `APP_PORT` | No | Host port for Docker Compose |

See `.env.example` for the full list.

---

## Operations cheat sheet

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f app` |
| Run migrations | `docker compose exec app node scripts/migrate-production.mjs` |
| Import book cards (CLI) | `docker compose --profile setup run --rm setup npm run db:import-book-cards -- ...` |
| Apply card balance | `docker compose --profile setup run --rm setup npm run db:seed-all-card-balance` |
| Backup database | Copy `data/historycodex.db` (and `-wal`/`-shm` if present) |
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

- **PostgreSQL** — app uses SQLite; fine for a single server, not ideal for horizontal scaling
- **S3/object storage** — uploads are local filesystem
- **Managed hosting (Vercel)** — not compatible with SQLite + local uploads without rework

For your use case (single live server + Hermes imports), Docker on a VPS is the intended path.
