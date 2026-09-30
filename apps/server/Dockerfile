# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
RUN apk add --no-cache libc6-compat openssl

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gecut_cloud"

# 1. Copy package definitions first for Docker layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/payment/package.json ./packages/payment/
COPY packages/ui/package.json ./packages/ui/
COPY apps/server/package.json ./apps/server/

# Install dependencies without lifecycle scripts (prisma generate runs after code copy)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# 2. Copy source code
COPY packages ./packages
COPY apps/server ./apps/server

# 3. Generate Prisma client & compile server
RUN pnpm --filter @gecut-cloud/db db:generate
RUN pnpm --filter server build

# --- Production Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy pruned workspace dependencies and built server
COPY --from=builder /app /app

WORKDIR /app/apps/server

# Ensure persistent data directory exists
RUN mkdir -p /app/apps/server/data

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @gecut-cloud/db db:migrate:deploy || true && node dist/src/main.js"]
