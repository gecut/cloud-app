# Gecut Cloud — API Guidelines

## 1. Purpose

This document defines the API architecture, procedure boundaries, DTO conventions, authorization rules, and mutation standards for Gecut Cloud.

It is the source of truth for:

- oRPC structure
- API organization
- authorization boundaries
- tenant isolation
- query design
- mutation behavior
- DTO conventions
- pagination standards
- error standards
- cache boundaries

This document must guide:

- oRPC implementation
- backend route structure
- frontend data-fetching architecture
- TanStack Query integration
- admin/customer separation
- API security boundaries

---

## 2. API Philosophy

The MVP API architecture prioritizes:

- explicit boundaries
- tenant safety
- maintainability
- predictable behavior
- minimal overfetching
- stable DTO contracts
- operational clarity

Avoid:

- hidden magic
- implicit behavior
- giant procedures
- inconsistent DTOs
- deeply nested responses
- over-abstraction

API simplicity is preferred over cleverness.

---

## 3. API Stack

Core stack:

```txt id="gk7tzr"
Hono
oRPC
TanStack Query
```

The API layer should remain procedure-oriented and domain-centric.

---

## 4. API Domain Structure

Recommended structure:

```txt id="s18fx3"
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

Each domain should own:

- procedures
- DTOs
- validation schemas
- mutation rules

Avoid mixing unrelated domain logic.

---

## 5. Admin vs Customer Boundaries

The API must clearly separate:

```txt id="pmc4kx"
admin procedures
customer procedures
```

Avoid mixed permission procedures whenever possible.

---

### Recommended Structure

```txt id="73q1m9"
/admin/*
/customer/*
```

Examples:

```txt id="xv58sq"
/admin/services/create
/customer/services/list
```

---

## 6. Authorization Philosophy

Authorization must be explicit.

Never assume:

- frontend visibility
- hidden buttons
- UI restrictions

Every procedure must validate:

- authentication
- role
- tenant ownership
- mutation permissions

---

## 7. Tenant Isolation Rules

Customer-facing procedures must ALWAYS enforce tenant isolation.

Required boundary:

```txt id="vkzyqe"
customerId
```

must always be derived from authenticated session context.

Never trust client-provided tenant identifiers.

---

### Forbidden Pattern

```ts id="u1gwh3"
where: {
  customerId: input.customerId;
}
```

for customer-facing procedures.

---

### Required Pattern

```ts id="vgt9mg"
where: {
  customerId: session.customerId;
}
```

---

## 8. Procedure Design Rules

Procedures should remain:

- focused
- explicit
- domain-oriented
- predictable

Avoid giant procedures handling multiple unrelated operations.

---

### Recommended Naming

Queries:

```txt id="ym9w5w"
list
getById
getSummary
getDashboard
```

Mutations:

```txt id="9y0z6f"
create
update
cancel
archive
pay
retry
```

Avoid vague names:

```txt id="3jlwmj"
handle
process
execute
manage
```

---

## 9. Query Design Rules

Queries should return:

- only required fields
- stable DTOs
- predictable structure

Avoid overfetching.

---

### DTO Philosophy

Frontend must consume DTOs rather than raw database models.

Avoid exposing Prisma models directly.

---

### DTO Stability

DTO contracts should remain stable whenever possible.

Breaking DTO changes require:

- explicit update
- frontend coordination
- review of affected query keys

---

## 9.1 Frontend Query Key Strategy (Customer App)

For `apps/customer-app`:

- query keys must be domain-based and stable
- query invalidation must be scoped and limited
- avoid global invalidation patterns unless absolutely required
- query key definitions and query/mutation options must be colocated in module API files:
  - `*.keys.ts`
  - `*.queries.ts`
  - `*.mutations.ts`

---

## 10. List vs Detail Queries

List procedures should return lightweight summaries.

Examples:

```txt id="7qbjs5"
invoice list
service list
endpoint list
```

should NOT include:

- giant nested objects
- historical records
- unnecessary relations

---

### Detail Queries

Detailed relations belong in:

```txt id="m17t4i"
getById
detail
summary
```

style procedures.

---

## 11. Pagination Standards

Large datasets must support pagination.

Recommended format:

```ts id="8sbhgh"
{
  items: [],
  total: number,
  page: number,
  pageSize: number
}
```

---

### Recommended Pagination Style

Offset pagination is acceptable for MVP.

Cursor pagination may be introduced later for high-scale datasets.

---

## 12. Filtering Standards

Filtering should remain explicit and predictable.

Recommended filters:

```txt id="mdd0z6"
status
search
type
date range
customer
service
```

Avoid deeply dynamic query builders during MVP.

---

## 13. Sorting Standards

Recommended sorting:

```txt id="l54n8r"
createdAt desc
updatedAt desc
name asc
```

Always define deterministic sorting for paginated endpoints.

---

## 14. Validation Rules

Every mutation must validate:

- input shape
- required fields
- enum values
- ownership
- financial invariants
- lifecycle rules

Validation should happen before database mutation.

---

## 15. Mutation Philosophy

Mutations should remain:

- deterministic
- explicit
- side-effect-aware

Avoid hidden cascading behavior unless clearly documented.

---

## 16. Mutation Transaction Rules

Use database transactions for:

- invoice creation
- payment success flow
- payment callback processing
- invoice cancellation
- audit-critical mutations

Financial mutations should remain atomic.

---

## 17. Invoice Mutation Rules

Allowed before payment:

- update items
- update notes
- update due date

Forbidden after payment:

- update totals
- update snapshots
- update invoice items

Paid invoices are immutable.

---

## 18. Payment Procedure Rules

Payment procedures must enforce:

- invoice ownership
- invoice status validation
- idempotency
- duplicate callback protection

---

### Successful Payment Rules

Successful payment must:

- create Payment
- lock Invoice
- create AuditLog

---

### Failed Payment Rules

Failed payment must:

- create PaymentAttempt
- create AuditLog

---

## 19. Callback Handling Rules

Gateway callbacks must be:

- idempotent
- append-safe
- deterministic

---

### Duplicate Callback Behavior

Duplicate successful callbacks:

- must NOT create second Payment
- must be ignored safely
- should create AuditLog

---

### Cancelled Invoice Callback

If callback arrives for cancelled invoice:

- invoice state must remain unchanged
- Payment must NOT be created
- event should be audited

---

## 20. Error Handling Standards

All API errors should use structured format.

Recommended structure:

```ts id="5ct2rp"
{
  code: string
  message: string
  safeUserMessage?: string
}
```

---

### Error Philosophy

Developer messages:

- English
- technical
- structured

User-facing messages:

- Persian
- concise
- safe
- non-technical

Never leak:

- stack traces
- SQL details
- internal provider details
- infrastructure secrets

---

## 21. Query Key Boundaries

TanStack Query keys should follow domain boundaries.

Recommended examples:

```ts id="uycnc6"
["services"][("services", serviceId)]["invoices"][("invoices", invoiceId)][
  "dashboard"
];
```

Avoid unstable or over-dynamic keys.

---

## 22. Cache Invalidation Rules

Mutations must invalidate only relevant queries.

Examples:

```txt id="k6hfzm"
invoice update
→ invalidate invoice detail
→ invalidate invoice list
→ invalidate dashboard summary
```

Avoid global invalidation.

---

## 23. Realtime & Polling Rules

The MVP should avoid unnecessary realtime complexity.

Polling is acceptable for:

- payment status
- uptime refresh
- dashboard summaries

Avoid:

- websocket-first architecture
- unnecessary live subscriptions

---

## 24. Endpoint Uptime Rules

Endpoint uptime data is external-provider-driven.

The API should treat uptime data as:

```txt id="vc9ww2"
summary visibility data
```

rather than a monitoring engine.

Avoid provider-specific complexity leaking into frontend contracts.

---

## 25. Server Visibility Rules

Server visibility must respect:

```txt id="v7ptiw"
serverVisibilityLevel
```

The API must filter sensitive fields accordingly.

Recommended default:

```txt id="ax0o4v"
none
```

---

## 26. Audit API Rules

Audit records are admin-facing by default.

Customer-facing audit exposure should remain minimal.

Audit endpoints should support:

- filtering
- date ranges
- entity lookup
- actor lookup

Avoid exposing raw sensitive metadata.

---

## 27. DTO Composition Rules

Avoid deeply nested DTOs.

Preferred:

```txt id="od1m3u"
flat
composable
predictable
```

Examples:

GOOD:

```ts id="x6qk3t"
{
  id;
  name;
  status;
}
```

AVOID:

```ts id="lxbh7q"
{
  customer: {
    services: {
      invoices: {
        payments: ...
      }
    }
  }
}
```

---

## 28. Backend Organization Rules

Recommended structure:

```txt id="tz08m0"
routes/
services/
repositories/
schemas/
dto/
```

---

### Responsibility Boundaries

#### Routes

Responsible for:

- request entry
- auth boundary
- orchestration

---

#### Services

Responsible for:

- business logic
- domain rules
- lifecycle behavior

---

#### Repositories

Responsible for:

- database interaction
- query optimization
- persistence

---

#### DTO

Responsible for:

- frontend-safe contracts
- response shaping
- boundary stability

---

## 29. Database Query Rules

Avoid:

- N+1 queries
- loading giant relations
- unnecessary historical loading
- excessive nested includes

Prefer:

- selective fields
- explicit includes
- paginated loading
- lightweight summaries

---

## 30. Security Rules

API security applies from MVP start.

Required protections:

- authentication
- authorization
- validation
- rate limiting
- safe error responses

Extra care required for:

- payment endpoints
- admin mutations
- invoice operations
- gateway callbacks

---

## 31. Logging Rules

Backend logs should remain:

- English-only
- structured
- operationally useful

Never log:

- secrets
- tokens
- passwords
- payment credentials

---

## 32. API Versioning

MVP may remain unversioned internally.

Avoid premature API versioning complexity.

If breaking contracts become common later:

```txt id="0j5ubt"
/v1
/v2
```

may be introduced.

---

## 33. Performance Rules

The API layer should optimize for:

- predictable query cost
- low overfetching
- stable response times
- lightweight dashboard queries

Avoid:

- giant dashboard aggregations
- excessive relation loading
- uncontrolled polling

---

## 34. Future Expansion Notes

Future phases may introduce:

- realtime subscriptions
- advanced filters
- recurring invoices
- notifications
- webhook integrations
- external accounting integrations
- automation workflows

These are intentionally excluded from MVP.

---

## 35. Source of Truth Rules

This document must guide:

- oRPC procedure design
- DTO architecture
- frontend query design
- TanStack Query structure
- backend mutation flow
- authorization implementation

If implementation requires violating these rules:

1. Update this document first.
2. Then update implementation.
