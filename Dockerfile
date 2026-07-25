# HistoryCodex production image (Next.js standalone + Supabase Postgres)

FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor/card-renderer ./vendor/card-renderer
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /app/db/migrations ./db/migrations
COPY --from=builder /app/scripts/migrate-production.mjs ./scripts/migrate-production.mjs
COPY --from=builder /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x /app/scripts/docker-entrypoint.sh \
  && mkdir -p /app/public/uploads/characters /app/public/uploads/books /app/public/uploads/packs \
  && chown -R nextjs:nodejs /app/public/uploads

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
