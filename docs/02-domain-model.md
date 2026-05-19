# Gecut Cloud — Domain Model

## 1. Purpose

This document defines the core domain model for Gecut Cloud.

It is the source of truth for:

- Entities
- Relationships
- Ownership rules
- Lifecycle rules
- Financial invariants
- Uptime ownership
- Visibility policies
- Audit requirements

The MVP domain model is service-centric.

---

## 2. Core Structure

```txt
Customer
  → ServiceGroup?
    → Service
      → Endpoint
````

Internal infrastructure:

```txt
Server
```

Financial structure:

```txt
Invoice → Customer
InvoiceItem → Service?
Invoice → Payment?
Invoice → PaymentAttempt[]
```

Audit structure:

```txt
AuditLog → generic entity reference
```

---

## 3. Core Entities

### 3.1 User

Represents a login identity.

In MVP:

```txt
Customer 1 → 1 User
```

A customer has only one login user in the MVP.

Authentication identifier is phone-first in MVP.

#### Suggested fields

```txt
id
name
phone
email?
role
customerId?
createdAt
updatedAt
```

#### Role values

```txt
admin
customer
```

---

### 3.2 Customer

Represents a company or individual using GecutWeb services.

Customer owns:

- services
- service groups
- invoices
- payments

#### Suggested fields

```txt
id
userId
name
displayName?
phone?
email?
status
createdAt
updatedAt
```

#### Status

```txt
active
suspended
inactive
```

#### Rules

- Each customer has one user/login in MVP.
- Customer data must be tenant-isolated.
- Customers must never access another customer's data.
- Customers should not be hard deleted.

---

### 3.3 ServiceGroup

Optional grouping layer for related services.

Examples:

```txt
Choobinooo Platform
Marketing Infrastructure
Main Website
Internal APIs
```

#### Suggested fields

```txt
id
customerId
name
description?
status
sortOrder?
createdAt
updatedAt
```

#### Status

```txt
active
suspended
archived
```

#### Rules

- ServiceGroup is optional.
- Small customers may have services without groups.
- ServiceGroup exists for organization, not billing.
- Billing remains customer-level with service-based invoice items.

---

### 3.4 ServiceType

Admin-manageable classification for services.

Examples:

```txt
Website Hosting
VPS
Dedicated Server
API Infrastructure
CDN
Deployment Infrastructure
Other
```

#### Suggested fields

```txt
id
name
slug
description?
isActive
sortOrder?
createdAt
updatedAt
```

#### Rules

- ServiceType is a classification layer.
- ServiceType does not directly control billing behavior.
- ServiceType does not directly control lifecycle behavior.
- Business behavior should not be hidden inside ServiceType.

---

### 3.5 Service

Primary operational and billing unit.

A service may represent:

- website hosting
- VPS
- dedicated server service
- CDN
- deployment infrastructure
- API infrastructure
- operational hosting resources

#### Suggested fields

```txt
id
customerId
serviceGroupId?
serviceTypeId
serverId?

name
description?

status

priceToman
startDate
renewalDate

serverVisibilityLevel

createdAt
updatedAt
```

#### Status

```txt
active
suspended
inactive
```

#### Server visibility level

```txt
none
basic
detailed
```

#### Rules

- Service belongs to one customer.
- Service may belong to one ServiceGroup.
- Service must have one ServiceType.
- Service may connect to one Server.
- One Server may host multiple services.
- Service is the main unit used in invoice items.
- Service price is used as the default source for invoice item creation.
- Invoice items must snapshot service data.
- Changing Service price must not affect old invoices.
- When Service becomes inactive/archived-like, related endpoints should become inactive.

---

### 3.6 Endpoint

Monitorable endpoint under a service.

Examples:

```txt
https://choobinooo.ir
https://api.choobinooo.ir
https://cms.choobinooo.ir
```

#### Suggested fields

```txt
id
serviceId

label
url
type

isPublic
isActive

provider?
externalMonitorId?

status?
uptimePercentage30d?
responseTimeMs?
lastCheckedAt?

createdAt
updatedAt
```

#### Endpoint type

```txt
http
tcp
ping
keyword
other
```

#### Rules

- Endpoint belongs to one Service.
- Endpoint owns uptime visibility.
- Endpoints may be public/customer-visible or private/internal.
- Uptime data is imported from external monitoring systems.
- Gecut Cloud does not perform complex monitoring itself.
- Provider-specific behavior should not leak into core business logic where avoidable.

---

### 3.7 Server

Internal infrastructure entity.

A server may host multiple services.

#### Suggested fields

```txt
id

name
provider
status

ipAddress?
domain?
location?

cpu?
ram?
storage?

monthlyCostToman?
internalNotes?

createdAt
updatedAt
```

#### Status

```txt
active
maintenance
suspended
inactive
```

#### Rules

- Server is primarily admin-facing.
- Service may optionally link to Server.
- Customer does not need to know whether a server is shared.
- Customer-facing server information must be controlled per Service.
- Technical fields are optional in MVP.
- Server supports internal cost tracking and infrastructure organization.

---

## 4. Financial Entities

### 4.1 Invoice

Customer-level invoice.

#### Suggested fields

```txt
id
customerId

invoiceNumber
status

subtotalToman
totalToman

issuedAt
dueDate
paidAt?
cancelledAt?

notes?
createdAt
updatedAt
```

#### Status

```txt
unpaid
paid
cancelled
```

#### Rules

- Invoice belongs to Customer.
- Invoice has one or more InvoiceItems.
- Invoice may have one successful Payment.
- Invoice may have multiple PaymentAttempts.
- Invoice is editable only before successful payment.
- Paid invoices are locked.
- Cancelled invoices should remain historically visible.
- Hard deletion should be avoided.
- Invoice number must be customer-facing and readable.

#### Invoice number format

Recommended format:

```txt
GC-1403-0001
```

Exact generation rules can be defined in financial guidelines.

---

### 4.2 InvoiceItem

Snapshot-based invoice item.

InvoiceItem may optionally reference a Service.

#### Suggested fields

```txt
id
invoiceId
serviceId?

title
description?

quantity
unitPriceToman
totalToman

serviceNameSnapshot?
serviceTypeSnapshot?
servicePriceSnapshotToman?
serviceRenewalDateSnapshot?

createdAt
updatedAt
```

#### Rules

- InvoiceItem belongs to one Invoice.
- InvoiceItem may reference one Service.
- Manual invoice items are allowed.
- Snapshot data is required for service-based items.
- Historical invoice items must not depend on live Service data.
- Changing Service data must not alter old InvoiceItems.

---

### 4.3 Payment

Successful payment record.

Payment itself acts as receipt.

#### Suggested fields

```txt
id
invoiceId

amountToman
provider
gatewayRef
paidAt

createdAt
updatedAt
```

#### Rules

- Payment belongs to one Invoice.
- Each Invoice may have at most one successful Payment.
- Partial payments are not supported.
- Payment amount must match Invoice total.
- Successful Payment marks Invoice as paid.
- Successful Payment locks Invoice.
- Successful Payment must create AuditLog.

---

### 4.4 PaymentAttempt

Failed or non-successful payment attempt.

#### Suggested fields

```txt
id
invoiceId

amountToman
provider
gatewayRef?
status
errorCode?
errorMessage?
attemptedAt

createdAt
updatedAt
```

#### Suggested status

```txt
failed
cancelled
expired
unknown
```

#### Rules

- PaymentAttempt belongs to one Invoice.
- Failed attempts must be recorded.
- Failed attempts must create AuditLog.
- PaymentAttempt is not a financial receipt.
- PaymentAttempt must not mark Invoice as paid.

---

## 5. AuditLog

Generic audit record for sensitive operations.

#### Suggested fields

```txt
id

actorType
userId?
actorRole?
actorDisplayNameSnapshot?

action
entityType
entityId

before?
after?
reason?
metadata?

createdAt
```

#### Actor type

```txt
user
system
```

#### Rules

Audit logging is required for:

- invoice creation
- invoice update
- invoice cancellation
- payment success
- payment failure
- service status changes
- endpoint visibility changes
- customer-visible operational changes
- gateway callbacks
- uptime sync jobs when relevant

System events must be supported because gateway callbacks and sync jobs may not have a human actor.

---

## 6. Relationship Summary

```txt
User 1 → 0/1 Customer
Customer 1 → 1 User

Customer 1 → N ServiceGroup
Customer 1 → N Service
Customer 1 → N Invoice

ServiceGroup 1 → N Service

ServiceType 1 → N Service

Server 1 → N Service
Service N → 0/1 Server

Service 1 → N Endpoint

Invoice 1 → N InvoiceItem
InvoiceItem N → 0/1 Service

Invoice 1 → 0/1 Payment
Invoice 1 → N PaymentAttempt

AuditLog → generic entity reference
```

---

## 7. Lifecycle Rules

### Customer

```txt
active → suspended → inactive
```

Rules:

- Suspended customers may be restricted from some actions.
- Inactive customers remain historically visible.
- Hard deletion should be avoided.

---

### ServiceGroup

```txt
active → suspended → archived
```

Rules:

- Archived groups remain visible to admins.
- Services may still preserve historical relation to archived groups.

---

### Service

```txt
active → suspended → inactive
```

Rules:

- Suspended means temporarily blocked or paused.
- Inactive means no longer operational.
- When Service becomes inactive, endpoints should also become inactive.
- Service historical data must remain available for invoices.

---

### Server

```txt
active → maintenance → suspended → inactive
```

Rules:

- Server status is internal/admin-facing.
- Server status does not automatically change Service status unless explicitly implemented.

---

### Invoice

```txt
unpaid → paid
unpaid → cancelled
```

Rules:

- Paid invoices are locked.
- Cancelled invoices remain historically visible.
- Paid invoices should not become unpaid.
- Payment callback for already paid/cancelled invoice should not mutate financial state silently.

---

## 8. Financial Invariants

- Money values are stored as integer Toman.
- Never use floating-point for money.
- Invoice total must equal sum of invoice item totals.
- Payment amount must match invoice total.
- Partial payments are not supported.
- InvoiceItem must snapshot service data.
- Paid Invoice is immutable.
- Payment success must create AuditLog.
- Payment failure must create PaymentAttempt and AuditLog.
- Cancelled Invoice cannot be paid through normal flow.

---

## 9. Uptime Ownership

Uptime belongs to Endpoint.

```txt
Service → Endpoint → Uptime data
```

Rules:

- Service may have multiple endpoints.
- Each endpoint may have its own uptime status.
- Uptime data comes from external monitoring providers.
- Gecut Cloud should store only lightweight summary data for MVP.
- Complex monitoring logic is out of scope.

---

## 10. Visibility Rules

### Customer visibility

Customers may view:

- their own services
- their own endpoints marked public/visible
- their own invoices
- their own payment status
- allowed uptime summaries

Customers must not view:

- other customers' data
- internal server notes
- secrets
- provider credentials
- internal infrastructure topology unless allowed

---

### Server visibility

Controlled per Service:

```txt
serverVisibilityLevel:
  none
  basic
  detailed
```

The exact fields included in `basic` or `detailed` can be defined later.

Default should be conservative.

Recommended default:

```txt
none
```

---

## 11. Mutation Rules

### Service mutation

When updating Service price:

- do not update historical InvoiceItems
- new invoices use new price

When changing Service status to inactive:

- related endpoints should become inactive

---

### Invoice mutation

Before payment:

- invoice may be edited
- invoice items may be changed
- totals must be recalculated

After payment:

- invoice is locked
- edits are not allowed
- changes require explicit future policy

---

### Payment mutation

Payment should normally be append-only.

Do not edit successful payment records unless explicitly approved.

---

### Endpoint mutation

Endpoint status and uptime fields may be updated by external sync.

Endpoint visibility must be controlled carefully because it affects customer-facing data.

---

## 12. Deletion Policy

Avoid hard deletion.

Prefer:

- status changes
- archived states
- inactive states

Financial records should remain traceable.

Hard deletion may only be used for:

- local seed data
- development-only cleanup
- explicitly approved destructive operations

---

## 13. MVP Constraints

The MVP intentionally excludes:

- internal monitoring engine
- automatic service suspension
- automated invoice generation
- wallet/credit balance
- partial payments
- multi-currency
- advanced accounting
- customer support requests
- public SaaS multi-tenancy

---

## 14. Implementation Notes

This document should guide:

- Prisma schema
- DTO definitions
- oRPC procedures
- API authorization
- TanStack Query keys
- dashboard data boundaries
- audit behavior
- financial mutation rules

If implementation requires changing this model, update this document first.
