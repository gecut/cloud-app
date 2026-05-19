# Gecut Cloud

Gecut Cloud is an internal GecutWeb operational platform for customer-facing infrastructure visibility, financial tracking, invoice management, online payments, service lifecycle visibility, endpoint uptime visibility, and internal operational organization.

The MVP is intentionally focused on operational clarity and financial organization. It is not designed as a public SaaS platform at this stage.

## Product Goals

Gecut Cloud should help the team:

- Reduce manual financial follow-up.
- Give customers clear visibility into their services, invoices, payments, and endpoint uptime summaries.
- Centralize internal infrastructure and service ownership data.
- Keep operational workflows maintainable and easy to inspect.
- Ship a simple, scalable MVP without premature SaaS complexity.

## MVP Scope

In scope:

- Customer and admin portals.
- Customer-owned services and optional service groups.
- Internal server records.
- Endpoint visibility and lightweight uptime metadata.
- Invoice creation, payment tracking, and payment attempts.
- Audit logging for financially and operationally important changes.
- Role-based access for admins and customers.

Out of scope unless explicitly approved:

- Public SaaS plans or self-serve tenant onboarding.
- Wallets, credits, partial payments, tax engines, and multi-currency accounting.
- Advanced accounting or ERP workflows.
- A native uptime monitoring engine.
- Extra user roles beyond `admin` and `customer`.
- Broad architecture rewrites or major dependency additions.

## Current Technical Stack

This repository was originally generated from Better-T-Stack and remains a TypeScript monorepo. The current implementation uses:

- Package manager: `pnpm`
- Runtime: `Bun`
- Monorepo orchestration: `Turborepo`
- Frontend apps: `React`, `Vite`, `TanStack Router`, `TanStack Query`
- API server: `Hono`
- API layer: `oRPC`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Validation: `Zod`
- Admin UI: shared shadcn-style primitives from `packages/ui`
- Customer UI: `HeroUI v3` and `next-themes`

Note: The product guidelines list Next.js as part of the preferred long-term stack, but the current checked-in frontend apps are Vite-based. Treat any migration to Next.js as an architectural decision that requires explicit approval.

## Repository Layout

```txt
gecut-cloud/
  apps/
    admin/          Internal admin dashboard
    customer-app/   Customer-facing portal
    server/         Hono/oRPC API server
  packages/
    api/            oRPC routers, API composition, request orchestration
    config/         Shared TypeScript/tooling configuration
    contracts/      Shared schemas, DTOs, and cross-app contracts
    core/           Reusable domain and business logic
    db/             Prisma schema, generated client, database exports, seed data
    env/            Server and web environment validation
    ui/             Shared admin UI primitives and styles
```

### Package Boundaries

Business and domain rules belong in `packages/core`.

Shared request/response contracts, DTOs, schemas, pagination types, and stable error shapes belong in `packages/contracts`.

Backend apps and packages should handle orchestration, authorization, validation, API composition, and request lifecycle concerns. Reusable business logic should not live directly inside route handlers.

Frontend apps should contain presentation logic, UI composition, client state, and view-specific behavior. They should not duplicate backend business rules or tenant isolation logic.

## Applications

| App | Purpose | Development command |
| --- | --- | --- |
| `apps/server` | Hono server exposing oRPC and OpenAPI reference routes | `pnpm dev:server` |
| `apps/admin` | Internal operational dashboard | `pnpm dev:admin` |
| `apps/customer-app` | Customer-facing service, invoice, payment, and uptime portal | `pnpm dev:customer-app` |

Expected local URLs when running all apps:

| Surface | URL |
| --- | --- |
| API server | `http://localhost:3000` |
| Admin app | `http://localhost:3001` |
| Customer app | `http://localhost:3002` |

The server currently exposes:

- `/` for a basic health response.
- `/rpc` for oRPC requests.
- `/api-reference` for the OpenAPI reference plugin.

## Domain Model

The MVP is service-centric.

```txt
Customer
  -> ServiceGroup?
    -> Service
      -> Endpoint

Server
```

### Customer

A customer represents a company or individual using GecutWeb services. Customers own services, invoices, and payments. A customer may optionally organize services into service groups.

### ServiceGroup

A service group is an optional customer-owned grouping layer for related services, such as a main platform, marketing infrastructure, HR system, or product-specific group. Small customers do not need service groups.

### Service

A service is the primary operational and billing unit. It can represent website hosting, VPS service, dedicated server service, deployment infrastructure, CDN, API infrastructure, or similar operational resources.

A service:

- Belongs to one customer.
- May belong to one service group.
- May connect to one internal server.
- May contain multiple endpoints.
- Has lifecycle status and pricing information.
- Can be referenced by invoice items.

### Endpoint

An endpoint represents a monitorable public-facing target such as a website, API, CMS, TCP service, ping target, keyword check, or other external monitor. Uptime visibility belongs to endpoints.

The platform consumes uptime data from external providers such as Uptime Kuma, Better Stack, or Peekaping. Gecut Cloud should keep uptime data lightweight and avoid becoming a monitoring engine in the MVP.

### Server

A server is an internal infrastructure entity. One server may host many services, and one service may optionally connect to one server.

Customers should not automatically see shared infrastructure details. Server visibility is controlled at the service level.

## Roles and Access Control

Approved roles:

- `admin`
- `customer`

Customer rules:

- Customers may view only their own services.
- Customers may view only their own invoices, payments, and endpoint uptime summaries.
- Customers must never access another customer's data.

Admin rules:

- Admins may manage customers, service groups, services, endpoints, servers, invoices, payments, and operational visibility.

Implementation rules:

- Every API, query, and customer-facing page must explicitly enforce tenant isolation.
- Do not rely on frontend filtering as a security boundary.
- Stable backend errors should include a developer-safe code and message, plus a safe Persian user-facing message when needed.

## Financial Rules

Money is stored as integer Toman values. Do not use floating point values for money.

```ts
amountToman: number;
```

MVP invoice statuses:

- `unpaid`
- `paid`
- `cancelled`

Invoice rules:

- Invoices belong to customers.
- Invoice items may optionally reference services.
- Invoice items are snapshot-based.
- Changing a service price must not affect historical invoices.
- Paid invoices are locked after successful payment.
- Partial payments are not supported in the MVP.

Payment rules:

- Successful payments are stored in `Payment`.
- Failed, cancelled, expired, or unknown attempts are stored in `PaymentAttempt`.
- Each invoice may have one successful payment.
- Each invoice may have multiple payment attempts.
- Payment records act as payment receipts.

## Audit Logging

Audit logging is required from the beginning.

Audit logs are required for:

- Invoice creation, update, payment, and cancellation.
- Payment changes.
- Failed payment attempts.
- Service status changes.
- Endpoint visibility changes.
- Customer-visible operational changes.

Minimum audit data:

- Actor type and user when available.
- Actor role.
- Action name.
- Entity type and entity id.
- Timestamp.
- Before/after values when practical.

## Lifecycle and Deletion Policy

Current lifecycle states:

| Entity | States |
| --- | --- |
| Customer | `active`, `suspended`, `inactive` |
| ServiceGroup | `active`, `suspended`, `archived` |
| Service | `active`, `suspended`, `inactive` |
| Server | `active`, `maintenance`, `suspended`, `inactive` |

Avoid hard deletion. Prefer archive/status-based lifecycle management so financial and operational records remain historically traceable.

## Frontend Conventions

The UI direction is modern, clean, operationally clear, dashboard-oriented, and RTL-first.

User-facing UI text, empty states, success messages, customer-facing errors, and customer notifications should be written in Persian. Source code, technical documentation, comments, commits, API names, database models, logs, folder names, and file names should be written in English.

Important UI states must handle:

- Loading.
- Error.
- Empty.
- Success.

### Customer App Structure

`apps/customer-app` follows a module-based and route-adjacent structure:

```txt
apps/customer-app/src/
  routes/             Thin route glue
  modules/
    auth/
    dashboard/
    invoices/
    payments/
    services/
```

Route files should stay thin and handle only routing, params, guards, loader/preload behavior when needed, and connection to module views.

Module UI belongs in `src/modules/*/views`, with supporting `api`, `components`, `skeletons`, `states`, and `types.ts` files as needed.

TanStack Query definitions should live in `src/modules/*/api` and be split into:

- `*.keys.ts`
- `*.queries.ts`
- `*.mutations.ts`

Avoid giant client components, deeply nested component trees, duplicated fetching, uncontrolled polling, and global invalidation when targeted cache updates are enough.

## Backend Conventions

The backend uses Hono and oRPC.

Backend code should prioritize:

- Explicit authorization.
- Tenant isolation.
- Structured validation.
- Stable errors.
- Request orchestration.
- Efficient Prisma queries.
- Avoiding N+1 query patterns.
- Avoiding overfetching.

Do not place reusable domain decisions directly in API route handlers. Move reusable business logic to `packages/core` and shared contracts to `packages/contracts`.

## Database and Prisma

The Prisma schema lives in:

```txt
packages/db/prisma/schema/schema.prisma
```

The generated Prisma client is configured for Bun and ESM output under:

```txt
packages/db/prisma/generated/
```

Important database rules:

- Use PostgreSQL.
- Important models should include `createdAt` and `updatedAt` unless there is a clear reason not to.
- Avoid destructive migrations without explicit approval.
- Avoid dropping financial or operational history.
- Keep queries selective and pagination-aware.

## Environment Variables

Server environment validation lives in `packages/env/src/server.ts`.

Required or supported server variables:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `NODE_ENV`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_SECONDS`

Web environment validation lives in `packages/env/src/web.ts`.

Required web variables:

- `VITE_SERVER_URL`

Never commit real secrets. Keep examples safe and clearly marked when adding environment templates.

## Local Development

Install dependencies:

```bash
pnpm install
```

Generate Prisma client:

```bash
pnpm db:generate
```

Apply the schema during local MVP development:

```bash
pnpm db:push
```

Run all apps:

```bash
pnpm dev
```

Run a single app:

```bash
pnpm dev:server
pnpm dev:admin
pnpm dev:customer-app
```

## Available Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps through Turborepo |
| `pnpm build` | Build all apps/packages that define a build task |
| `pnpm check-types` | Run TypeScript checks across the monorepo |
| `pnpm dev:server` | Start the API server |
| `pnpm dev:admin` | Start the admin app |
| `pnpm dev:customer-app` | Start the customer app |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:push` | Push Prisma schema changes to the database |
| `pnpm db:migrate` | Create/run local Prisma migrations |
| `pnpm db:seed` | Seed local data |
| `pnpm db:studio` | Open Prisma Studio |

## Quality Gates

Before finishing implementation work, run:

```bash
pnpm lint && pnpm check-types
```

Current note: `check-types` is configured at the root. If `lint` scripts are not yet configured in the packages being touched, add or document the lint setup before treating lint as a passing gate.

Tests are optional during the MVP unless the task is requested, financial behavior is involved, or the behavior is sensitive enough to require automated coverage.

## Performance and Security Expectations

Performance considerations are always active:

- Keep rendering efficient.
- Avoid unnecessary hydration cost.
- Keep client bundles lean.
- Use selective queries and pagination.
- Avoid uncontrolled polling.
- Use virtualization only when dataset size justifies it.
- Avoid overfetching and N+1 database access.

Security exists from the beginning:

- Validate input.
- Enforce authorization on the backend.
- Protect payment and auth endpoints more strictly.
- Use safe error responses.
- Do not log passwords, tokens, payment credentials, or secrets.
- Keep CORS origins explicit through `CORS_ORIGINS`.

## Documentation Policy

Use `README.md` for project orientation, local setup, architectural boundaries, and operational rules that every contributor should know.

Use ADRs for decisions that would be expensive to reverse, such as:

- Authentication strategy.
- API architecture changes.
- Database ownership or schema strategy.
- Major dependency additions.
- State management or cache strategy changes.
- Deployment or infrastructure strategy.

Recommended ADR location:

```txt
docs/decisions/
```

Architecture decisions require explicit approval before implementation.

## Contribution Rules

- Keep changes small and reviewable.
- Do not auto-commit, rewrite history, or create branches without approval.
- Do not introduce major dependencies without approval.
- Do not introduce additional roles without approval.
- Do not perform destructive migrations without approval.
- Do not move business logic into UI components.
- Do not leak customer data across tenant boundaries.
- Preserve MVP simplicity and operational clarity.

