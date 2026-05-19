# Customer App HeroUI Migration

## Purpose

This document captures the migration of `apps/customer-app` from shadcn/ui usage to HeroUI v3.

Scope of this migration is limited to `customer-app` and related documentation. `apps/admin` remains on shared shadcn/ui primitives.

## Why next-themes stays

`next-themes` is intentionally retained in `customer-app` for theme state management (light/dark/system).

HeroUI v3 works with class-based theme switching (`class` + `data-theme` compatibility), and `next-themes` provides stable runtime theme control and persistence.

## Dependency Changes

### Removed from `apps/customer-app`

- `@gecut-cloud/ui`
- `sonner`

### Added to `apps/customer-app`

- `@heroui/react`
- `@heroui/styles`
- `tailwind-variants`

### Kept in `apps/customer-app`

- `next-themes`

## Configuration Changes

- Deleted `apps/customer-app/components.json` (shadcn-specific)
- Removed `@gecut-cloud/ui/*` path alias from `apps/customer-app/tsconfig.json`
- Replaced `apps/customer-app/src/index.css` imports with:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

## Source Changes

- Root route now uses HeroUI toast provider (`Toast.Provider`) instead of shadcn wrapper
- Theme provider remains a thin wrapper over `next-themes`
- Theme mode toggle was rewritten using HeroUI components (`Button`) and `onPress`
- Query error notifications were moved to HeroUI `toast`

## Behavioral Expectations

- Route structure and business behavior remain unchanged
- Theme switching remains available (`light`, `dark`, `system`)
- Notification behavior remains available via HeroUI toast

## Validation Checklist

- `rg "@gecut-cloud/ui|shadcn" apps/customer-app` returns no matches
- `rg "next-themes" apps/customer-app` returns expected matches in theming files
- `pnpm --filter customer-app check-types` passes
- `pnpm check-types` passes

## Out of Scope

- Migrating `apps/admin` to HeroUI
- Removing `packages/ui`
- Backend/API/DB changes
