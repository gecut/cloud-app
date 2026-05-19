# gecut-cloud

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses PostgreSQL with Prisma.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
pnpm run db:push
```

Then, run the development server:

```bash
pnpm run dev
```

Open admin at [http://localhost:3001](http://localhost:3001) and customer app at [http://localhost:3002](http://localhost:3002).
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Stack (Hybrid)

- `apps/admin`: uses shared shadcn/ui primitives from `packages/ui`
- `apps/customer-app`: uses **HeroUI v3** and `next-themes`

## UI Customization

### Admin UI (shadcn/shared)

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases/style config in `packages/ui/components.json` and `apps/admin/components.json`

To add shared shadcn primitives:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

### Customer App UI (HeroUI)

- Components: `@heroui/react`
- Styles: `@heroui/styles`
- Theme switching: `next-themes` (`apps/customer-app/src/components/theme-provider.tsx`)

## Project Structure

```
gecut-cloud/
├── apps/
│   ├── admin/         # Admin frontend application (React + TanStack Router)
│   ├── customer-app/  # Customer frontend application (React + TanStack Router)
│   └── server/        # Backend API (Hono, ORPC)
├── packages/
│   ├── ui/            # Shared shadcn/ui components for admin
│   ├── api/           # API layer / business logic
│   └── db/            # Database schema & queries
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:admin`: Start only the admin application
- `pnpm run dev:customer-app`: Start only the customer application
- `pnpm run dev:server`: Start only the server
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run db:push`: Push schema changes to database
- `pnpm run db:generate`: Generate database client/types
- `pnpm run db:migrate`: Run database migrations
- `pnpm run db:studio`: Open database studio UI
