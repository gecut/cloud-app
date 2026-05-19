# Gecut Cloud — Financial Rules

## 1. Purpose

This document defines the financial rules, invariants, lifecycle behavior, and payment constraints for Gecut Cloud.

It is the source of truth for:

- invoice lifecycle
- payment flow
- invoice mutation rules
- payment callback behavior
- financial invariants
- audit requirements
- administrative financial operations

This document must guide:

- Prisma schema
- payment implementation
- gateway integration
- admin dashboard behavior
- invoice UI behavior
- API mutation rules
- audit logging

---

## 2. Financial Philosophy

The MVP financial system prioritizes:

- simplicity
- determinism
- traceability
- immutable historical records
- operational clarity

The MVP intentionally avoids:

- advanced accounting
- wallet systems
- partial payments
- multi-currency
- balance systems
- automated financial workflows
- accounting reconciliation engines

Financial consistency is more important than flexibility.

---

## 3. Currency Rules

### Base Currency

The MVP financial system uses:

```txt
Toman
````

for all stored monetary values.

---

### Storage Format

All monetary values must be stored as:

```txt
integer
```

Examples:

```ts
amountToman: number
priceToman: number
totalToman: number
```

Never use floating-point numbers for money.

---

## 4. Invoice Lifecycle

### Invoice States

```txt
unpaid
paid
cancelled
```

---

### Allowed Transitions

```txt
unpaid → paid
unpaid → cancelled
```

---

### Forbidden Transitions

Forbidden examples:

```txt
paid → unpaid
paid → cancelled
cancelled → unpaid
cancelled → paid
```

Invoices are append-only financial records after finalization.

---

### Lifecycle Behavior

#### unpaid

Invoice is editable.

Allowed actions:

- edit invoice items
- edit notes
- update totals
- cancel invoice
- attempt payment

---

#### paid

Invoice becomes immutable.

Allowed actions:

- view
- audit
- export

Forbidden actions:

- edit invoice items
- edit totals
- edit invoice number
- delete invoice

---

#### cancelled

Invoice remains historically visible but financially inactive.

Allowed actions:

- view
- audit

Forbidden actions:

- payment success mutation
- invoice editing
- invoice reactivation

---

## 5. Invoice Ownership

Invoices belong to Customers.

```txt
Invoice → Customer
```

Invoice items may optionally reference Services.

```txt
InvoiceItem → Service?
```

Invoices are customer-level financial documents.

---

## 6. Invoice Number Rules

### Invoice Number Format

Recommended format:

```txt
GC-1403-0001
```

Structure may evolve later but should remain:

- readable
- customer-facing
- sequential
- unique

---

### Invoice Number Invariants

Invoice numbers must be:

- unique
- immutable
- stable
- customer-visible

Invoice numbers must NEVER change after creation.

---

## 7. Invoice Creation Rules

### Invoice Creation

Invoices are created manually by admins during MVP.

Automatic invoice generation is out of scope.

---

### Invoice Item Sources

Invoice items may be created from:

- services
- manual custom items

Examples:

```txt
Website Hosting
VPS Renewal
Domain Renewal
Maintenance Fee
```

---

### Snapshot Rules

Invoice items must snapshot service data during creation.

Historical invoices must remain independent from future service changes.

Snapshot examples:

```txt
serviceNameSnapshot
serviceTypeSnapshot
servicePriceSnapshotToman
serviceRenewalDateSnapshot
```

---

### Stored Totals

Invoice totals must be persisted.

Recommended fields:

```txt
subtotalToman
totalToman
```

Totals must NOT be computed dynamically from historical data at runtime.

---

### Invoice Total Invariant

Invoice total must always equal:

```txt
sum(invoiceItem.totalToman)
```

The system must recalculate totals after invoice item mutation.

---

## 8. Invoice Editing Rules

### Editable State

Invoices are editable ONLY while:

```txt
status = unpaid
```

---

### Editable Fields

Allowed before payment:

- invoice items
- notes
- due date

Invoice number remains immutable even before payment.

---

### Locked State

Paid invoices become fully immutable.

Immutable fields include:

- invoice items
- totals
- snapshots
- invoice number
- financial metadata

---

## 9. Invoice Cancellation Rules

### Cancellation Conditions

Only unpaid invoices may be cancelled.

Paid invoices must never be cancelled through normal flow.

---

### Cancellation Behavior

Cancelled invoices:

- remain visible
- remain auditable
- remain historically traceable

Cancelled invoices are financially inactive.

---

### Payment Callback After Cancellation

If payment callback arrives for cancelled invoice:

- invoice state must NOT change
- payment must NOT be created
- audit/security event should be recorded

This protects financial consistency and idempotency.

---

## 10. Payment Model

### Payment Philosophy

The MVP supports:

```txt
online payments only
```

Partial payments are NOT supported.

---

### Payment Ownership

```txt
Payment → Invoice
```

Each Invoice may have:

```txt
0 or 1 successful Payment
```

---

### Payment Success Rules

Successful payment must:

- create Payment record
- mark Invoice as paid
- set paidAt
- lock Invoice
- create AuditLog

---

### Payment Amount Invariant

Payment amount must equal:

```txt
Invoice.totalToman
```

Partial payment is forbidden.

Overpayment is forbidden.

---

### Payment Receipt

Payment itself acts as receipt.

Separate Receipt entity is not required in MVP.

---

## 11. PaymentAttempt Rules

Failed or non-successful payment attempts must be stored separately.

```txt
PaymentAttempt
```

---

### Purpose

PaymentAttempt exists for:

- failed payments
- expired payments
- cancelled payments
- suspicious callbacks
- operational visibility

PaymentAttempt is NOT a financial receipt.

---

### Suggested Statuses

```txt
failed
cancelled
expired
unknown
```

---

### PaymentAttempt Behavior

PaymentAttempt must:

- remain historically visible
- create AuditLog
- never mark Invoice as paid

---

## 12. Gateway Callback Rules

### Callback Philosophy

Gateway callbacks must be:

- idempotent
- append-safe
- deterministic

Never trust gateway callback ordering.

---

### Duplicate Callback Handling

If gateway sends duplicate successful callback:

- duplicate callback must be ignored
- duplicate Payment must NOT be created
- duplicate callback should create AuditLog

---

### Paid Invoice Callback

If successful callback arrives for already paid invoice:

- invoice state must remain unchanged
- no second payment should be created
- callback should be audited

---

### Cancelled Invoice Callback

If successful callback arrives for cancelled invoice:

- invoice state must remain unchanged
- payment must NOT be created
- callback should be audited

---

### Gateway Idempotency Boundary

Recommended idempotency boundary:

```txt
invoiceId + gatewayRef
```

The exact implementation may vary by provider.

---

## 13. Audit Requirements

Audit logging is mandatory for:

- invoice creation
- invoice editing
- invoice cancellation
- payment success
- payment failure
- suspicious callbacks
- duplicate callbacks
- payment-related system events

---

### Audit Philosophy

Financial mutations must always remain historically traceable.

Audit logs are append-only operational records.

---

## 14. Admin Financial Rules

### Admin Permissions

Admins may:

- create invoices
- edit unpaid invoices
- cancel unpaid invoices
- view payment attempts
- view payment history

---

### Forbidden Admin Operations

Admins must NOT:

- modify paid invoice totals
- modify paid invoice items
- reactivate cancelled invoices
- create duplicate successful payments
- mutate immutable financial history

---

## 15. Deletion Rules

Hard deletion should be avoided for financial entities.

Avoid deleting:

- invoices
- invoice items
- payments
- payment attempts

Prefer:

- cancellation
- inactive/archive states
- historical visibility

Financial history must remain traceable.

---

## 16. Financial Security Rules

Financial endpoints must enforce:

- authentication
- authorization
- rate limiting
- safe error responses

Never expose:

- raw gateway secrets
- internal payment metadata
- sensitive provider credentials

---

## 17. Error Handling Rules

Financial APIs should use structured errors.

Recommended structure:

```txt
code
message
safeUserMessage
```

Never leak sensitive implementation details.

---

## 18. Operational Constraints

The MVP intentionally excludes:

- automated invoice generation
- wallet systems
- customer balance
- refunds
- partial payments
- multi-currency
- accounting integration
- tax systems
- advanced reconciliation systems

---

## 19. Future Expansion Notes

Future phases may introduce:

- recurring invoices
- automatic renewals
- service suspension automation
- refunds
- advanced financial reporting
- customer balances
- notification systems

These features are intentionally excluded from MVP.

---

## 20. Source of Truth Rules

This document must guide:

- Prisma schema
- oRPC mutations
- admin invoice behavior
- payment integration
- financial DTOs
- audit implementation

If implementation requires violating these rules:

1. Update this document first.
2. Then update implementation.
