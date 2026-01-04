
FROM node:20-bullseye-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.3 --activate


FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
COPY prisma ./prisma
COPY tsconfig*.json turbo.json ./

RUN pnpm config set fetch-retries 5 \
 && pnpm config set fetch-retry-factor 2 \
 && pnpm config set fetch-retry-mintimeout 20000 \
 && pnpm config set fetch-retry-maxtimeout 120000


RUN pnpm install --frozen-lockfile


FROM deps AS builder

RUN pnpm exec tsc -b


FROM node:20-bullseye-slim AS tg-bot
WORKDIR /app
ENV NODE_ENV=production


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

CMD ["node", "apps/tg-bot/dist/bot.js"]


FROM node:20-bullseye-slim AS worker
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

CMD ["node", "apps/worker/dist/worker.js"]
