
FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate


FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY tsconfig*.json turbo.json ./

RUN pnpm install --frozen-lockfile


FROM deps AS builder

RUN pnpm -w build

FROM node:20-bookworm-slim AS tg-bot
WORKDIR /app
ENV NODE_ENV=production


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps


CMD ["node", "apps/tg-bot/dist/bot.js"]


FROM node:20-bookworm-slim AS worker
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps


CMD ["node", "apps/worker/dist/worker.js"]
