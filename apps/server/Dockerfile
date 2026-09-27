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

# Copy monorepo configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/server ./apps/server

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @gecut-cloud/db db:generate
RUN pnpm --filter server build

# --- Production Runner Stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy workspace dependencies and built server
COPY --from=builder /app /app

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @gecut-cloud/db db:push --accept-data-loss || true && node dist/src/main.js"]
