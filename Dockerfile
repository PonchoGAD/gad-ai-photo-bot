# ---------- base ----------
FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY tsconfig*.json turbo.json ./

RUN pnpm install --frozen-lockfile

# ---------- builder ----------
FROM deps AS builder
RUN pnpm --filter @gad/tg-bot build
RUN pnpm --filter @gad/worker build

# ---------- runtime: tg-bot ----------
FROM node:20-bookworm-slim AS tg-bot
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=builder /app/apps/tg-bot/dist ./apps/tg-bot/dist

CMD ["node", "apps/tg-bot/dist/bot.js"]

# ---------- runtime: worker ----------
FROM node:20-bookworm-slim AS worker
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

CMD ["node", "apps/worker/dist/worker.js"]
