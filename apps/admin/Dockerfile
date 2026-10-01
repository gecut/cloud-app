# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# 1. Copy package definitions first for Docker layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/payment/package.json ./packages/payment/
COPY packages/ui/package.json ./packages/ui/
COPY apps/admin/package.json ./apps/admin/

# Install dependencies without lifecycle scripts (prisma generate runs after code copy)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# 2. Copy source code
COPY packages ./packages
COPY apps/admin ./apps/admin

# Build arguments for Vite client environment
ARG VITE_SERVER_URL=https://api.app.gecut.ir
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# 3. Generate Prisma client & build static assets
RUN pnpm --filter @gecut-cloud/db db:generate
RUN pnpm --filter admin build

# --- Production Runner Stage (gecut/nginx/spa) ---
FROM ghcr.io/gecut/nginx/spa:1.0.0 AS runner

# Copy compiled static assets into /data/ with nginx user ownership
COPY --from=builder --chown=nginx:nginx /app/apps/admin/dist /data/

EXPOSE 80
