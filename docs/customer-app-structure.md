# Customer App Structure (Mandatory)

## Purpose

This document defines the mandatory frontend structure for `apps/customer-app`.

## Target Structure

```txt
src/
  app/
    providers/
  routes/
  modules/
    common/
    auth/
    dashboard/
    services/
    invoices/
    payments/
  components/
    layout/
    feedback/
    motion/
  lib/
```

Each module owns:

```txt
api/
components/
skeletons/
states/
views/
types.ts
```

## Route Rule

`src/routes/*` must remain thin glue only:

- routing
- params
- guards
- loader/preload (when needed)
- binding route to module view

Routes must not include business logic, raw API logic, or mutation implementation.

## View Rule

`src/modules/*/views/*` are composition layer only.

Views consume server-state through module API hooks/options and compose module UI parts.

## Query Rule

TanStack Query definitions must be module-local under `src/modules/*/api`:

- `*.keys.ts`
- `*.queries.ts`
- `*.mutations.ts`

Query keys must be stable, domain-based, and invalidation must be scoped.

## Async State Contract

Important pages must explicitly handle:

- loading
- error
- empty
- success

State naming:

- `<domain>-empty-state.tsx`
- `<domain>-error-state.tsx`

User-facing text in these states must be Persian, concise, and safe.

## Skeleton Policy

- Important pages must have page-level skeletons.
- Skeletons must preserve layout and avoid layout shifts.
- Component-level skeleton is optional and should be added only when needed.
- Do not use generic spinner-first UX for main pages.

## Shared Components Policy

Do not create a shared kit preemptively during migration.

Move a component/pattern to shared (`components/feedback` or `components/layout`) only if:

- it is repeated in at least two modules, and
- behavior and API are nearly identical.

`modules/common` is allowed only for proven cross-module patterns (at least two modules with nearly identical behavior/API).
