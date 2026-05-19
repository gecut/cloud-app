# AGENTS.md — Gecut Cloud

## 1. Project Identity

Gecut Cloud is an internal GecutWeb operational platform for:

- Customer-facing infrastructure visibility
- Financial tracking
- Invoice management
- Online payments
- Service lifecycle visibility
- Endpoint uptime visibility
- Internal operational organization

The MVP is intentionally focused on operational clarity and financial organization.

This project is NOT currently intended to be a public SaaS platform.

Primary goals:

- Reduce manual financial follow-up
- Provide transparent customer-facing service visibility
- Centralize operational infrastructure data
- Create maintainable internal workflows
- Keep MVP implementation simple and scalable

Avoid premature SaaS complexity.

---

## 2. Core Technical Stack

Main stack:

- Next.js
- Hono
- Bun
- oRPC
- PostgreSQL
- Prisma
- pnpm
- Turborepo
- TanStack Query
- shadcn/ui

The Better-T-Stack generated structure must remain the architectural baseline unless explicitly approved otherwise.

---

## 3. Repository Structure Rules

Expected structure:

```txt
apps/
packages/
```

Business logic belongs inside:

```txt
packages/core
```

Shared contracts and DTOs belong inside:

```txt
packages/contracts
```

Frontend apps should contain only:

- presentation logic
- UI composition
- client state
- view-specific behavior

Backend apps should contain:

- orchestration
- authorization
- request handling
- API composition

Avoid placing reusable business logic directly inside route handlers or UI components.

---

## 4. Codex Authority Rules

Codex must NOT make architectural decisions independently.

For every architectural decision, Codex MUST ask the user in Persian and include:

- Context
- Why the decision matters
- Practical examples
- Available options
- Pros and cons
- Recommended option
- Explicit approval request

Architecture decisions include:

- package boundaries
- state management changes
- cache strategy changes
- API architecture changes
- auth strategy changes
- database ownership changes
- infrastructure changes
- major dependency additions
- deployment strategy changes
- queue/event system introduction
- major refactors

Never silently introduce architecture patterns.

---

## 5. Mandatory Workflow Before Any Task

Before modifying code, Codex MUST:

1. Read all relevant instructions and repository guidelines.
2. Identify all relevant installed Skills.
3. Load all relevant Skills.
4. Always include performance-related Skills during initial analysis.
5. Read relevant files and existing implementations.
6. Research relevant technical topics when necessary.
7. Produce an implementation plan.
8. Wait for approval when the task includes:

   - architecture changes
   - destructive changes
   - dependency additions
   - infrastructure changes
   - broad refactors

Do not jump directly to coding unless the task is fully local and trivial.

---

## 6. Installed Skills Usage Policy

### Architecture & Planning

#### planning-and-task-breakdown

Use for:

- implementation planning
- execution sequencing
- task decomposition
- scope control

#### context-engineering

Use for:

- preserving context boundaries
- avoiding unnecessary modifications
- preventing scope explosion

#### documentation-and-adrs

Use for:

- architecture decision records
- technical documentation
- important implementation notes

#### deprecation-and-migration

Use for:

- migration planning
- schema evolution
- safe replacement strategies

---

### Backend & API

#### hono

Use for:

- Hono route structure
- middleware design
- backend performance
- request lifecycle management

#### api-and-interface-design

Use for:

- DTO design
- API boundaries
- request/response consistency
- pagination/filtering strategy
- mutation safety

---

### Database & Prisma

#### prisma-cli

#### prisma-client-api

#### prisma-database-setup

Use for:

- schema modeling
- migrations
- relational design
- Prisma client usage
- query optimization

Never perform destructive migrations without explicit approval.

---

### Frontend & UI

#### frontend-ui-engineering

Use for:

- frontend architecture
- component composition
- scalable UI structure

#### shadcn

Use for:

- shadcn/ui best practices
- accessible component composition
- UI consistency

#### web-design-guidelines

Use for:

- layout consistency
- spacing
- dashboard usability
- typography

#### accessibility

Use for:

- semantic HTML
- keyboard navigation
- ARIA correctness
- accessible forms/tables/dialogs

Accessibility should not be ignored during MVP development.

---

### React & Vercel Patterns

#### vercel-react-best-practices

Use for:

- rendering optimization
- component boundaries
- async rendering patterns

#### vercel-composition-patterns

Use for:

- scalable composition architecture
- reusable layout patterns

#### vercel-react-view-transitions

Use ONLY when:

- transitions clearly improve UX
- performance impact remains acceptable

Avoid unnecessary animation complexity.

---

### TanStack Ecosystem

#### tanstack-query

Use for:

- server-state management
- caching
- invalidation
- optimistic updates

#### tanstack-table

Use for:

- invoices
- payments
- admin tables
- operational data grids

#### tanstack-virtual

Use for:

- large datasets
- performance-sensitive tables/lists

Avoid premature virtualization.

#### tanstack-router

Do NOT introduce TanStack Router unless explicitly approved.

Next.js routing remains the default.

---

### Performance & Quality

#### performance

#### performance-optimization

#### core-web-vitals

#### web-quality-audit

#### best-practices

#### code-review-and-quality

#### code-simplification

These Skills are ALWAYS relevant.

Codex must continuously optimize for:

- rendering efficiency
- query efficiency
- bundle size
- hydration cost
- API efficiency
- maintainability
- simplicity

Avoid:

- unnecessary abstractions
- over-engineering
- giant client components
- duplicated business logic
- overfetching
- N+1 queries

---

## 7. Language Rules

Use English for:

- source code
- comments
- commits
- API names
- database models
- logs
- technical documentation
- folder names
- file names

Use Persian for:

- user-facing UI text
- customer-facing errors
- empty states
- success messages
- customer notifications

Persian UI tone should be:

- respectful
- modern
- concise
- understandable

Avoid robotic translations.

---

## 8. Core Domain Model

The MVP domain model is service-centric.

Primary structure:

```txt
Customer
  → ServiceGroup?
    → Service
      → Endpoint
```

Internal infrastructure model:

```txt
Server
```

The system is intentionally designed around services rather than projects.

---

## 9. Domain Definitions

### Customer

Represents a company or individual using GecutWeb services.

Customers own:

- services
- invoices
- payments

Customers may optionally organize services into groups.

---

### ServiceGroup

Optional grouping layer for organizing related services.

Examples:

- Main Platform
- Marketing Infrastructure
- HR System
- Choobinooo Platform

ServiceGroup is NOT required for small customers.

---

### Service

Service is the primary operational and billing unit.

A service may represent:

- website hosting
- VPS
- dedicated server service
- deployment infrastructure
- CDN
- API infrastructure
- operational hosting resources

Each service:

- belongs to a customer
- may belong to a service group
- may connect to a server
- may contain multiple endpoints
- has operational status
- has pricing information
- participates in invoices

---

### Endpoint

Endpoint represents a monitorable public-facing endpoint.

Examples:

- [https://choobinooo.ir](https://choobinooo.ir)
- [https://api.choobinooo.ir](https://api.choobinooo.ir)
- [https://cms.choobinooo.ir](https://cms.choobinooo.ir)

Uptime visibility belongs to endpoints.

---

### Server

Server is an internal infrastructure entity.

Servers are primarily operational/admin-facing.

A single server may host multiple services.

Customers do not need to know whether infrastructure is shared.

---

## 10. Product Roles

Current approved roles:

- admin
- customer

Do not introduce additional roles unless approved.

---

## 11. Access Control Rules

Customers may:

- view their own services
- view invoices
- view payment status
- make payments
- view endpoint uptime summaries

Customers must NEVER access another customer's data.

Every API/query/page must explicitly enforce tenant isolation.

Admins may manage:

- customers
- service groups
- services
- endpoints
- servers
- invoices
- payments
- operational visibility

---

## 12. Financial Rules

Invoices belong to customers.

Invoice items may optionally reference services.

Invoice items are snapshot-based.

Changing a service price must NOT affect historical invoices.

Store money as integer Toman values.

Example:

```ts
amountToman: number;
```

Never use floating-point values for money.

MVP invoice statuses:

```txt
unpaid
paid
cancelled
```

Partial payments are NOT supported.

Invoices become locked after successful payment.

Do not introduce:

- wallet systems
- advanced accounting
- multi-currency
- credit systems
- tax engines
  without approval.

---

## 13. Payment Model

Successful payments are stored in:

```txt
Payment
```

Failed payment attempts are stored in:

```txt
PaymentAttempt
```

Each invoice:

- may have one successful payment
- may have multiple failed payment attempts

Payment information should include:

- amountToman
- paidAt
- gatewayRef
- provider

Payment records themselves act as payment receipts.

---

## 14. Audit Log Rules

Audit logging is REQUIRED from the beginning.

Required for:

- invoice creation/update/cancellation
- payment changes
- failed payment attempts
- service status changes
- endpoint visibility changes
- customer-visible operational changes

Minimum audit data:

- actor
- role
- action
- entity type
- entity id
- timestamp

Include before/after values when practical.

---

## 15. Lifecycle Rules

### Customer Status

```txt
active
suspended
inactive
```

---

### ServiceGroup Status

```txt
active
suspended
archived
```

---

### Service Status

```txt
active
suspended
inactive
```

---

### Server Status

```txt
active
maintenance
suspended
inactive
```

---

### Deletion Policy

Avoid hard deletion.

Use archive-based lifecycle management.

Financial and operational records should remain historically traceable.

---

## 16. Server Rules

Service → Server relationship:

```txt
Service N → 0/1 Server
Server 1 → N Service
```

Server fields may include:

- name
- provider
- status
- ipAddress?
- domain?
- location?
- cpu?
- ram?
- storage?
- monthlyCostToman?
- internalNotes?

Most infrastructure fields are optional.

Server visibility for customers must be controlled at the service level.

Different services/customers may expose different levels of infrastructure information.

---

## 17. Endpoint & Uptime Rules

Each service may contain one or more endpoints.

Endpoints are the owner of uptime visibility.

The system consumes uptime information from external providers.

Examples:

- Uptime Kuma
- Better Stack
- Peekaping

The platform itself is NOT responsible for uptime monitoring complexity.

Uptime data should remain lightweight.

Endpoint uptime data may include:

- provider-specific status
- uptimePercentage30d
- responseTimeMs
- lastCheckedAt

The exact uptime states may depend on provider behavior.

---

## 18. Frontend Rules

UI stack:

- shadcn/ui
- custom components

Design direction:

- modern
- clean
- operationally clear
- SaaS-like
- dashboard-oriented

RTL is ALWAYS the default.

Every important UI must handle:

- loading
- error
- empty
- success

Accessibility must remain preserved.

Avoid:

- giant client components
- deeply nested component trees
- unnecessary abstraction

### Customer App Structure Rule (Mandatory)

`apps/customer-app` must follow module-based + route-adjacent structure:

- `src/routes/*` must stay thin glue only:
  - routing
  - params
  - guards
  - loader/preload (if needed)
  - connect to module view
- Route files must NOT include business logic, raw API calls, or mutation implementation.
- Page UI composition belongs to `src/modules/*/views`.
- Each module owns `api`, `components`, `skeletons`, `states`, `views`, and `types.ts`.
- TanStack Query definitions must live in `src/modules/*/api` split as:
  - `*.keys.ts`
  - `*.queries.ts`
  - `*.mutations.ts`
- Important pages must explicitly handle:
  - loading
  - error
  - empty
  - success

---

## 19. Data Fetching Rules

Primary async strategy:

- TanStack Query

Use:

- cache-aware fetching
- invalidation
- optimistic updates when safe

Avoid:

- duplicated fetching
- uncontrolled polling
- global unnecessary invalidation

---

## 20. Backend Error Handling

Use structured backend errors.

Errors should include:

- stable error code
- English developer message
- safe Persian user message when needed

Never leak internal implementation details.

---

## 21. Prisma & Database Rules

Codex MAY:

- modify schema
- create migrations

Codex MUST ask approval before:

- destructive migration
- dropping columns/tables
- breaking relational changes

Every important model should normally include:

```ts
createdAt;
updatedAt;
```

Optimize queries reasonably.

Avoid:

- N+1 patterns
- overfetching
- loading unnecessary historical records

---

## 22. Seed Data Rules

Codex may create structured seed data.

Seed examples:

- admin user
- customers
- service groups
- services
- endpoints
- invoices
- payments
- uptime samples

Never commit real secrets.

---

## 23. Environment Variables

Codex MAY introduce new env variables when necessary.

Codex MUST:

- explain purpose
- update env examples when relevant
- avoid committing secrets

---

## 24. Logging Rules

Console logging is acceptable during MVP.

Logs must remain:

- developer-facing
- English-only

Never log:

- passwords
- tokens
- payment credentials
- secrets

---

## 25. Security Rules

Security exists from the beginning.

Apply stronger protections to:

- payment endpoints
- auth endpoints
- admin mutations
- customer data endpoints

Basic protections expected:

- validation
- rate limiting
- safe error responses

Do not introduce insecure shortcuts.

---

## 26. Dependency Rules

Codex MUST ask approval before adding dependencies.

Dependency proposals must include:

- purpose
- alternatives
- runtime impact
- maintenance implications

Avoid dependency bloat.

---

## 27. Refactor Rules

Allowed:

- scoped cleanup
- duplication reduction
- moving reusable logic into packages/core
- local simplification

Not allowed without approval:

- broad rewrites
- architecture changes
- replacing major libraries
- repository restructuring

---

## 28. Code Deletion Rules

Code deletion allowed only when:

- clearly dead code
- inside explicit task scope

Codex must explain:

- what was removed
- why it was safe

Ask approval before deleting major sections/files.

---

## 29. Quality Gates

Before finishing tasks, run:

```bash
pnpm lint && pnpm check-types
```

Tests are optional during MVP unless:

- requested
- financial logic becomes high-risk
- behavior is sensitive

---

## 30. Performance Rules

Performance considerations are ALWAYS active.

Codex must optimize:

- rendering
- query efficiency
- hydration cost
- component boundaries
- bundle size
- table rendering

Use:

- pagination
- selective queries
- virtualization only when needed
- efficient caching

Avoid:

- uncontrolled rerenders
- giant client trees
- loading unnecessary historical data

Core Web Vitals should remain healthy.

---

## 31. Communication Rules

When asking important questions, write in Persian.

Questions must include:

- context
- options
- pros/cons
- recommendation
- approval request

Never ask vague questions.

Never ask for information already available.

---

## 32. Completion Response Format

After each task, respond with:

1. Summary
2. Changed files
3. Validation performed
4. Risks/limitations
5. Suggested next steps

Keep responses concise but complete.

---

## 33. Git Rules

Do not:

- auto-commit
- rewrite history
- create branches without approval

Prefer:

- small diffs
- reviewable changes

---

## 34. MVP Principle

Primary goal:

Fast, maintainable, operationally clear MVP delivery.

Prefer:

- explicit logic
- simplicity
- maintainability
- operational clarity
- low complexity

Avoid:

- speculative architecture
- enterprise complexity
- premature abstractions
- unnecessary frameworks
- over-engineering
