# Gecut Cloud — Prisma Guidelines

## 1. Purpose

This document defines the Prisma conventions, schema rules, migration policies, relational standards, and persistence constraints for Gecut Cloud.

It is the source of truth for:

- Prisma schema conventions
- relation design
- enum strategy
- timestamp strategy
- money field rules
- migration safety
- indexing philosophy
- query practices
- historical integrity rules
- lifecycle persistence strategy

This document must guide:

- Prisma schema implementation
- migrations
- repository implementation
- persistence behavior
- query optimization
- relational consistency

---

## 2. Prisma Philosophy

The Prisma layer should prioritize:

- explicit schema design
- predictable relations
- migration safety
- historical integrity
- operational clarity
- low schema ambiguity

Avoid:

- magic relations
- hidden persistence behavior
- weak naming conventions
- nullable chaos
- destructive migrations
- premature schema abstraction

Schema clarity is more important than cleverness.

---

## 3. Package Ownership

Prisma ownership belongs to:

```txt id="gchd5o"
packages/database
```

Responsibilities:

- schema.prisma
- migrations
- Prisma client
- db utilities
- persistence setup

Business logic must NOT live here.

---

## 4. Schema Ownership Rules

### Database Layer Owns

- persistence
- relations
- indexes
- constraints
- migration lifecycle

---

### Database Layer Must NOT Own

- invoice lifecycle rules
- payment business logic
- authorization
- tenant validation
- DTO shaping
- operational orchestration

Those belong to:

```txt id="9dzlcz"
packages/core
```

---

## 5. Naming Conventions

### Model Names

Use:

```txt id="g6q1cb"
PascalCase
```

Examples:

```prisma id="dug1t0"
model Customer
model Service
model Invoice
```

---

### Field Names

Use:

```txt id="j4fhzl"
camelCase
```

Examples:

```prisma id="k7x9jv"
createdAt
updatedAt
priceToman
```

---

### Enum Names

Use:

```txt id="4wtkhl"
PascalCase
```

Examples:

```prisma id="y9j9i8"
enum InvoiceStatus
enum ServiceStatus
```

---

### Enum Values

Use:

```txt id="o6mjlwm"
SCREAMING_SNAKE_CASE
```

Examples:

```prisma id="tjlwm6"
PAID
UNPAID
CANCELLED
```

---

## 6. ID Strategy

Primary IDs should use:

```txt id="t8yjlwm"
cuid()
```

Recommended:

```prisma id="eqyjlwm"
id String @id @default(cuid())
```

Avoid integer autoincrement IDs for public-facing entities.

---

## 7. Timestamp Rules

Every important model should include:

```prisma id="xjlwm9"
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

---

### Optional Lifecycle Timestamps

Use when needed:

```prisma id="jlwmm0"
paidAt
cancelledAt
lastCheckedAt
attemptedAt
```

Use explicit timestamps rather than overloaded status-only logic.

---

## 8. Money Field Rules

All monetary values must use:

```txt id="jlwm0n"
integer Toman values
```

Examples:

```prisma id="jlwm1o"
priceToman Int
totalToman Int
amountToman Int
```

---

### Forbidden

Never use:

```txt id="jlwm2p"
Float
Decimal
```

for MVP money storage.

---

## 9. Relation Philosophy

Relations should remain:

- explicit
- readable
- predictable

Avoid ambiguous relation naming.

---

### Recommended Relation Naming

Example:

```prisma id="jlwm3q"
customer Customer @relation(fields: [customerId], references: [id])
customerId String
```

Avoid unnamed relation ambiguity.

---

## 10. Nullable Field Philosophy

Nullable fields should exist ONLY when truly optional.

Avoid:

```txt id="jlwm4r"
nullable-by-default schemas
```

Every nullable field should have clear business meaning.

---

## 11. Lifecycle Persistence Strategy

Avoid hard deletion.

Prefer:

- status fields
- archived states
- inactive states

Historical financial data must remain traceable.

---

### Forbidden for Financial Records

Avoid deleting:

- invoices
- invoice items
- payments
- payment attempts
- audit logs

---

## 12. Enum Strategy

Use enums for:

- statuses
- lifecycle states
- visibility levels
- actor types
- endpoint types

Avoid free-form status strings.

---

### Expected Enums

Examples:

```txt id="jlwm5s"
CustomerStatus
ServiceStatus
InvoiceStatus
ServerStatus
EndpointType
ActorType
ServerVisibilityLevel
```

---

## 13. AuditLog Persistence Rules

Audit logs are append-only.

Audit records should NEVER be updated after creation unless absolutely necessary.

---

### Audit Storage Philosophy

Audit should prioritize:

- traceability
- safety
- append-only visibility

Audit logs are operational history, not mutable business records.

---

## 14. Invoice Persistence Rules

Invoice numbers must be:

- unique
- immutable
- indexed

Recommended:

```prisma id="jlwm6t"
invoiceNumber String @unique
```

---

### Invoice Totals

Store totals explicitly:

```prisma id="jlwm7u"
subtotalToman Int
totalToman Int
```

Do NOT compute historical totals dynamically.

---

### Invoice Locking

Paid invoices become immutable at business layer.

Prisma layer should support this behavior through stable persistence design.

---

## 15. InvoiceItem Snapshot Rules

InvoiceItem must snapshot service data.

Recommended fields:

```prisma id="jlwm8v"
serviceNameSnapshot String?
serviceTypeSnapshot String?
servicePriceSnapshotToman Int?
serviceRenewalDateSnapshot DateTime?
```

Historical invoice items must remain independent from future Service changes.

---

## 16. Payment Persistence Rules

Each Invoice may have:

```txt id="jlwm9w"
0 or 1 successful Payment
```

Enforce through unique constraint.

Recommended:

```prisma id="jlwmaw"
invoiceId String @unique
```

inside Payment model.

---

## 17. PaymentAttempt Rules

PaymentAttempt is append-only operational history.

Never mutate historical failed attempts unnecessarily.

---

### Recommended Relationship

```txt id="jlwmbx"
Invoice 1 → N PaymentAttempt
```

---

## 18. Endpoint Persistence Rules

Endpoints belong to Services.

Recommended:

```txt id="jlwmcy"
Service 1 → N Endpoint
```

---

### Endpoint Uptime Data

Uptime data should remain lightweight.

Recommended fields:

```prisma id="jlwmdz"
status String?
uptimePercentage30d Float?
responseTimeMs Int?
lastCheckedAt DateTime?
```

The system stores summary visibility, not full observability history.

---

## 19. Server Persistence Rules

Servers are internal operational entities.

Many fields are intentionally optional.

Recommended optional fields:

```txt id="jlwmf0"
ipAddress
domain
cpu
ram
storage
monthlyCostToman
```

The schema should support partial operational data.

---

## 20. Indexing Philosophy

Indexes should prioritize:

- tenant isolation
- invoice lookup
- operational filtering
- dashboard queries

Avoid premature over-indexing.

---

### Recommended Index Examples

```prisma id="jlwmg1"
@@index([customerId])
@@index([status])
@@index([createdAt])
```

---

### Financial Indexes

Recommended:

```prisma id="જlmh2"
@@index([invoiceNumber])
@@index([paidAt])
```

---

## 21. Composite Index Philosophy

Use composite indexes only for proven operational query patterns.

Examples:

```prisma id="jlwmi3"
@@index([customerId, status])
@@index([serviceId, isActive])
```

Avoid speculative indexing.

---

## 22. Query Philosophy

Database queries should prioritize:

- predictable cost
- minimal relation loading
- selective fields
- explicit includes

Avoid:

- giant nested queries
- loading unused relations
- excessive historical loading

---

## 23. N+1 Prevention Rules

Repositories should avoid:

```txt id="jlwmj4"
N+1 query patterns
```

Prefer:

- explicit include
- batched loading
- lightweight summaries

---

## 24. Repository Philosophy

Repositories own:

- persistence
- query optimization
- relation loading

Repositories do NOT own:

- lifecycle rules
- financial invariants
- auth validation

---

## 25. Migration Philosophy

Migration safety is critical.

Prefer:

- additive migrations
- safe defaults
- explicit backfills
- staged schema evolution

Avoid destructive migrations during active development when possible.

---

## 26. Forbidden Migration Patterns

Avoid:

- dropping populated columns
- destructive renames without migration path
- adding required columns without defaults/backfill
- silent enum removal

---

## 27. Safe Migration Strategy

Preferred flow:

```txt id="jlwmk5"
1. Add nullable field
2. Backfill data
3. Make field required later
```

Especially important for financial entities.

---

## 28. Soft Delete Strategy

The MVP primarily uses:

```txt id="jlwml6"
status-driven lifecycle
```

instead of generic soft-delete middleware.

Avoid hidden global soft-delete logic.

---

## 29. Cascade Rules

Be extremely careful with cascades.

Recommended:

```txt id="jlwmm7"
Restrict
NoAction
```

for financial entities.

Avoid accidental historical deletion.

---

## 30. Transaction Rules

Use Prisma transactions for:

- invoice creation
- payment success flow
- payment callback processing
- invoice cancellation
- audit-critical operations

Financial operations should remain atomic.

---

## 31. Seed Strategy

Seed data should support:

- admin user
- demo customers
- service groups
- services
- endpoints
- invoices
- payments

Never seed real secrets or production credentials.

---

## 32. Environment Strategy

Prisma/database env ownership belongs to:

```txt id="jlwmn8"
packages/database
```

Recommended examples:

```txt id="jlwmo9"
DATABASE_URL
DIRECT_URL
```

---

## 33. Prisma Client Strategy

Expose a shared Prisma client from:

```txt id="jlwmp0"
packages/database
```

Avoid multiple disconnected Prisma client instances.

---

## 34. Historical Integrity Philosophy

Historical financial records must remain:

- immutable
- auditable
- traceable

Schema evolution must preserve historical consistency.

---

## 35. MVP Constraints

The MVP intentionally excludes:

- event sourcing
- temporal databases
- advanced accounting ledgers
- multi-region replication
- complex partitioning
- CQRS persistence patterns

Avoid premature persistence complexity.

---

## 36. Future Evolution Notes

Future phases may introduce:

- audit partitioning
- recurring invoice models
- payment provider abstractions
- archival strategies
- historical uptime storage
- financial reporting optimizations

These should evolve incrementally, not prematurely.

---

## 37. Source of Truth Rules

This document must guide:

- Prisma schema
- migrations
- repository implementation
- persistence behavior
- indexing strategy
- relational consistency

If implementation requires violating these rules:

1. Update this document first.
2. Then update implementation.
