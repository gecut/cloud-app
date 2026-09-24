# syntax=docker/dockerfile:1

# --- Builder Stage ---
FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy monorepo configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/customer-app ./apps/customer-app

# Build arguments for Vite client environment
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Install dependencies and build static assets
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @gecut-cloud/db db:generate
RUN pnpm --filter customer-app build

# --- Production Runner Stage (gecut/nginx/spa) ---
FROM ghcr.io/gecut/nginx/spa:1.0.0 AS runner

# Copy compiled static assets into /data/ with nginx user ownership
COPY --from=builder --chown=nginx:nginx /app/apps/customer-app/dist /data/

EXPOSE 80
