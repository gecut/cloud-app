# Gecut Cloud — Architecture Guidelines

## 1. Purpose

This document defines the architectural boundaries, package ownership rules, layering strategy, and system design principles for Gecut Cloud.

It is the source of truth for:

- monorepo structure
- package ownership
- domain boundaries
- backend architecture
- frontend architecture
- database ownership
- DTO boundaries
- service layering
- session strategy
- dependency rules
- architectural constraints

This document must guide:

- repository organization
- implementation structure
- feature placement
- refactor decisions
- package responsibilities
- scaling strategy

---

## 2. Architecture Philosophy

The MVP architecture prioritizes:

- simplicity
- maintainability
- explicit boundaries
- operational clarity
- low cognitive overhead
- scalable foundations
- predictable data flow

The architecture intentionally avoids:

- premature microservices
- event-driven overengineering
- speculative abstractions
- unnecessary infrastructure complexity
- distributed systems complexity

The MVP should feel:

```txt id="bzkv7d"
modular
explicit
service-oriented
monolithic
```

---

## 3. Monorepo Structure

Primary structure:

```txt id="3wjlwm"
apps/
packages/
```

---

## 4. Applications

### apps/admin & apps/customer-app

Frontend applications.

Responsibilities:

- UI rendering
- dashboard experience
- user interaction
- client state
- TanStack Query integration
- route composition
- view orchestration

UI stack policy:

- `apps/admin`: uses shared shadcn/ui package (`packages/ui`)
- `apps/customer-app`: uses HeroUI v3 with `next-themes`

Must NOT contain:

- canonical business logic
- database access
- financial invariants
- reusable domain rules

`apps/customer-app` structure is mandatory as module-based + route-adjacent:

- `src/routes/*`: thin glue only (routing, params, guards, loader/preload, view binding)
- `src/modules/*/views/*`: composition layer only
- `src/modules/*/api/*`: TanStack Query ownership (`*.keys.ts`, `*.queries.ts`, `*.mutations.ts`)
- Route files must not contain business logic, raw API logic, or mutation implementation.

---

### apps/server

Backend API application.

Responsibilities:

- oRPC procedures
- request lifecycle
- auth/session handling
- orchestration
- API boundaries
- transport concerns

Must NOT become the owner of business rules.

---

## 5. Core Package Strategy

Business logic ownership belongs to:

```txt id="btfwuw"
packages/core
```

This is a foundational architectural rule.

---

## 6. packages/core

Canonical owner of domain logic.

Responsibilities:

- financial invariants
- lifecycle rules
- domain rules
- business validation
- mutation logic
- service/domain orchestration
- reusable domain services

Examples:

```txt id="jzqfqo"
invoice rules
payment validation
service lifecycle logic
endpoint visibility rules
```

---

### packages/core Must NOT Contain

- HTTP framework logic
- route definitions
- UI components
- Prisma schema ownership
- frontend state management

---

## 7. Database Ownership

Database ownership belongs to:

```txt id="9w1x8i"
packages/database
```

---

## 8. packages/database

Responsibilities:

- Prisma schema
- migrations
- Prisma client
- database utilities
- database connection lifecycle
- low-level persistence utilities

---

### packages/database Must NOT Contain

- business logic
- invoice invariants
- payment lifecycle rules
- UI DTO shaping
- frontend concerns

Database layer is infrastructure, not domain logic.

---

## 9. DTO Boundary Rules

Frontend contracts must be:

```txt id="kk0szr"
DTO-only
```

Frontend must NEVER consume raw Prisma shapes directly.

---

### Why DTO Boundary Exists

DTO boundary protects:

- frontend stability
- authorization boundaries
- future schema evolution
- tenant isolation
- backend refactors

---

### DTO Ownership

Recommended location:

```txt id="pkc6wa"
packages/contracts
```

Responsibilities:

- shared API contracts
- DTO definitions
- shared schemas
- API-safe response models

---

## 10. Layering Model

Recommended architecture:

```txt id="pzzh7r"
Route Layer
↓
Application/Service Layer
↓
Domain Logic Layer
↓
Repository Layer
↓
Database Layer
```

---

## 11. Layer Responsibilities

### Route Layer

Responsibilities:

- request entry
- auth/session extraction
- input validation
- orchestration
- response shaping

Must remain thin.

---

### Application/Service Layer

Responsibilities:

- use-case orchestration
- transaction coordination
- workflow execution

Examples:

```txt id="52z42e"
create invoice
process payment callback
cancel invoice
```

---

### Domain Layer

Responsibilities:

- canonical business rules
- lifecycle invariants
- financial constraints
- validation rules

Domain layer must remain framework-independent.

---

### Repository Layer

Responsibilities:

- persistence
- query optimization
- relation loading
- database abstraction

Repository layer must NOT own business logic.

---

### Database Layer

Responsibilities:

- Prisma
- migrations
- database lifecycle

---

## 12. Session & Authentication Strategy

MVP authentication strategy:

```txt id="w70r0t"
cookie-based session
```

---

### Why Cookie Sessions

Benefits:

- SSR-friendly
- operational simplicity
- revoke-friendly
- secure internal architecture
- better integration with Next.js

Avoid premature JWT complexity during MVP.

---

## 13. Authorization Boundaries

Authorization must remain explicit.

Every protected operation must validate:

- authentication
- role
- tenant ownership
- lifecycle constraints

Never trust frontend visibility.

---

## 14. Tenant Isolation

Tenant isolation is mandatory.

Customer-facing data access must always derive ownership from:

```txt id="gftr67"
session.customerId
```

Never trust customerId from request input.

---

## 15. Frontend Architecture

Frontend should remain:

- component-oriented
- DTO-driven
- query-oriented
- operationally clear

Avoid:

- giant client components
- excessive global state
- hidden side effects
- deeply nested component trees

---

## 16. State Management Strategy

Primary async state solution:

```txt id="lk7u9k"
TanStack Query
```

---

### Global State Philosophy

Avoid unnecessary global state.

Use local component state whenever practical.

Global state should remain minimal.

---

## 17. Data Fetching Rules

Frontend data fetching should:

- consume DTOs
- use stable query keys
- invalidate narrowly
- avoid overfetching

---

### Query Key Philosophy

Recommended:

```ts id="x6q3b0"
["services"][("services", id)]["invoices"][("invoices", id)]["dashboard"];
```

Avoid unstable dynamic keys.

---

## 18. Backend Architecture

Backend should remain:

- procedure-oriented
- domain-centric
- thin
- predictable

Avoid giant procedural files.

---

### Recommended Domain Structure

```txt id="bn66g0"
auth
customers
service-groups
services
endpoints
servers
invoices
payments
dashboard
audit
```

---

## 19. API Procedure Philosophy

Procedures should remain:

- explicit
- focused
- deterministic
- domain-scoped

Avoid:

- giant multipurpose procedures
- hidden mutations
- implicit side effects

---

## 20. Validation Strategy

Validation layers:

```txt id="t30gcn"
input validation
domain validation
financial validation
authorization validation
```

Validation should happen before persistence.

---

## 21. Financial Mutation Architecture

Financial operations must remain:

- atomic
- transactional
- append-safe
- auditable

Use database transactions for:

- invoice creation
- payment success
- callback processing
- invoice cancellation

---

## 22. Uptime Architecture

Gecut Cloud is NOT a monitoring engine.

The architecture treats uptime as:

```txt id="1k29yh"
external visibility data
```

---

### Uptime Responsibilities

System responsibilities:

- store summary data
- expose endpoint visibility
- display operational status

System is NOT responsible for:

- monitor execution
- complex monitoring logic
- infrastructure probing

---

## 23. Server Architecture

Servers are internal operational entities.

Servers support:

- infrastructure organization
- operational visibility
- cost tracking
- shared infrastructure modeling

Customer-facing server visibility must remain controlled through:

```txt id="0wyk0y"
serverVisibilityLevel
```

---

## 24. Realtime Strategy

The MVP intentionally avoids realtime-first architecture.

Allowed:

- polling
- lightweight refresh
- manual refresh

Avoid:

- websocket-first systems
- event-stream complexity
- live synchronization infrastructure

---

## 25. Caching Strategy

Caching should remain:

- explicit
- predictable
- narrow

Avoid:

- global cache invalidation
- hidden cache coupling
- over-aggressive caching

---

### Recommended Cache Ownership

Frontend:

```txt id="n3u2ja"
TanStack Query cache
```

Backend:

- minimal runtime caching
- deterministic responses

---

## 26. Logging Strategy

Logging should remain:

- structured
- operationally useful
- English-only

Never log:

- secrets
- tokens
- credentials
- sensitive payment information

---

## 27. Audit Architecture

Audit logging is append-only.

Audit should remain:

- generic
- entity-based
- system-aware

Supported actor types:

```txt id="fwk4x5"
user
system
```

---

## 28. Error Handling Strategy

Errors should remain:

- structured
- explicit
- safe

Recommended structure:

```ts id="ifkbs7"
{
  code
  message
  safeUserMessage?
}
```

Avoid leaking:

- stack traces
- SQL details
- infrastructure internals

---

## 29. Dependency Philosophy

Dependencies require explicit approval.

Before introducing dependencies:

- explain purpose
- explain alternatives
- explain runtime impact
- explain maintenance implications

Avoid dependency bloat.

---

## 30. Abstraction Philosophy

Avoid premature abstractions.

Preferred:

```txt id="tpyv1h"
explicit code
simple flows
clear ownership
```

Only abstract after repeated proven patterns.

---

## 31. Scalability Philosophy

The MVP should scale through:

- modular boundaries
- clean ownership
- stable DTOs
- explicit domain rules

NOT through:

- distributed systems
- microservices
- complex infrastructure

---

## 32. Testing Philosophy

The MVP prioritizes correctness over test quantity.

High-priority test targets:

- financial invariants
- payment callbacks
- invoice locking
- tenant isolation
- authorization boundaries

UI snapshot-heavy testing is not required initially.

---

## 33. Refactor Philosophy

Allowed:

- local simplification
- domain extraction
- duplication reduction
- query optimization

Not allowed without approval:

- major architectural rewrites
- replacing foundational libraries
- restructuring repository ownership

---

## 34. Performance Philosophy

Performance considerations are ALWAYS active.

Optimize for:

- lightweight queries
- small DTOs
- stable rendering
- low hydration cost
- efficient tables
- predictable dashboard loading

Avoid:

- giant nested payloads
- uncontrolled rerenders
- N+1 queries
- oversized client components

---

## 35. MVP Constraints

The architecture intentionally excludes:

- microservices
- event buses
- distributed queues
- CQRS/event sourcing
- complex realtime systems
- advanced orchestration engines
- plugin architectures

These may be introduced later if operational scale truly requires them.

---

## 36. Future Evolution Strategy

Future scaling should evolve through:

1. stronger package boundaries
2. background job systems
3. internal automation
4. selective service extraction
5. infrastructure modularization

Do not optimize for these prematurely.

---

## 37. Source of Truth Rules

This document must guide:

- repository structure
- package ownership
- backend organization
- frontend organization
- DTO boundaries
- domain ownership
- architectural decisions

If implementation requires violating these rules:

1. Update this document first.
2. Then update implementation.
