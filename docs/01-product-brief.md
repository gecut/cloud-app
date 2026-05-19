# Gecut Cloud — Product Brief

## 1. Project Overview

Gecut Cloud is an internal GecutWeb operational platform designed to centralize customer-facing infrastructure visibility, financial workflows, online payments, service management, and uptime visibility.

The platform gives customers a unified dashboard for viewing their active services, invoices, payment status, and endpoint availability information.

The MVP is intentionally focused on operational simplicity and financial organization.

This product is currently designed as an internal operational platform rather than a public SaaS product.

---

## 2. Primary Goals

The MVP focuses on:

1. Reducing manual financial follow-up
2. Providing transparent customer-facing service visibility
3. Centralizing operational infrastructure information
4. Organizing internal service management workflows
5. Improving visibility around infrastructure-related costs

---

## 3. Primary Problems

Current workflows rely heavily on fragmented operational tracking and manual communication.

Main problems include:

* Manual invoice/payment follow-up
* Poor customer visibility into operational services
* Lack of centralized infrastructure visibility
* Fragmented operational data
* Lack of structured customer dashboards
* Weak operational organization for internal teams

---

## 4. Primary Users

### Customer

Customers use Gecut Cloud to:

* View services
* View invoices
* Track payment status
* Make online payments
* View endpoint uptime summaries

Customers can only access their own operational data.

---

### Admin

Admins use Gecut Cloud to:

* Manage customers
* Manage service groups
* Manage services
* Manage endpoints
* Manage invoices
* Track payments
* Manage infrastructure visibility
* Organize operational information

The MVP admin panel focuses on operational CRUD workflows rather than advanced analytics or automation.

---

## 5. Core Product Structure

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

## 6. Core Domain Concepts

### Customer

Represents a company or individual using GecutWeb services.

Customers may own:

* multiple services
* invoices
* payments

Customers may optionally organize services into groups.

---

### ServiceGroup

Optional grouping layer for related services.

Examples:

* Main Platform
* Marketing Infrastructure
* Choobinooo Platform
* Internal APIs

ServiceGroup is optional and primarily useful for larger customers.

---

### Service

Service is the primary operational and billing unit.

A service may represent:

* website hosting
* VPS
* deployment infrastructure
* API infrastructure
* operational hosting resources
* CDN
* dedicated infrastructure

Each service:

* belongs to a customer
* may belong to a service group
* may connect to a server
* may contain multiple endpoints
* has operational status
* has pricing information

---

### Endpoint

Endpoint represents a monitorable public-facing endpoint.

Examples:

* [https://choobinooo.ir](https://choobinooo.ir)
* [https://api.choobinooo.ir](https://api.choobinooo.ir)
* [https://cms.choobinooo.ir](https://cms.choobinooo.ir)

Endpoints own uptime visibility.

---

### Server

Server is an internal operational infrastructure entity.

Servers:

* may host multiple services
* are primarily admin-facing
* support shared infrastructure workflows
* support infrastructure cost tracking

Customers do not need to know whether infrastructure is shared.

---

## 7. Financial Workflow

### Invoice Ownership

Invoices belong to customers.

Invoice items may optionally reference services.

Invoice items are snapshot-based.

Historical invoices must remain immutable relative to future service price changes.

---

### Invoice Items

Invoice items may include:

* service-based items
* manual custom items

Examples:

* Website Hosting
* VPS Renewal
* Domain Renewal
* Operational Maintenance

---

### Invoice Status

MVP invoice statuses:

```txt
unpaid
paid
cancelled
```

---

### Invoice Editing

Invoices may be edited until successfully paid.

Paid invoices become locked.

---

### Payments

Payments are online-only during MVP.

Partial payments are NOT supported.

Successful payments:

* mark invoices as paid
* generate payment records
* generate audit logs

Failed payment attempts are also recorded.

---

### Due Dates

Invoices include due dates.

Automatic service suspension is NOT included in the MVP.

---

## 8. Service Visibility

Customers may view:

* services
* invoice summaries
* payment status
* endpoint uptime summaries
* basic operational visibility

Detailed infrastructure visibility is intentionally limited during MVP.

Server visibility may vary per service/customer.

---

## 9. Uptime Visibility

The MVP includes simplified uptime visibility.

The system consumes uptime information from external monitoring systems through APIs.

Examples:

* Uptime Kuma
* Better Stack
* Peekaping

The platform itself is NOT responsible for uptime monitoring complexity.

Endpoint uptime visibility may include:

* provider status
* uptime percentage
* response time
* last checked timestamp

---

## 10. Dashboard Experience

### Customer Dashboard

Customer dashboard includes:

* financial summary
* services
* endpoint summaries
* recent invoices
* payment visibility
* uptime visibility

---

### Admin Dashboard

The MVP admin dashboard focuses on:

* customer CRUD
* service group CRUD
* service CRUD
* endpoint CRUD
* invoice CRUD
* payment visibility
* server visibility

Advanced operational analytics are outside MVP scope.

---

## 11. Audit Logging

Audit logging is required from the beginning.

Sensitive operations requiring audit logs include:

* invoice creation/update/cancellation
* payment changes
* failed payment attempts
* service visibility changes
* endpoint visibility changes
* customer-visible operational changes

---

## 12. Lifecycle Model

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

## 13. Out of Scope (MVP Exclusions)

The following are explicitly outside MVP scope:

* Internal uptime monitoring system
* Automatic service suspension
* Advanced accounting systems
* Wallet/credit systems
* Multi-currency support
* Customer support/request system
* Automated invoice generation
* Infrastructure orchestration
* Multi-tenant SaaS capabilities
* Advanced operational analytics

---

## 14. Future Possibilities

Potential future phases may include:

* customer support/request system
* automatic invoice generation
* automatic service suspension
* expanded infrastructure visibility
* advanced financial reporting
* operational analytics
* notification system
* service lifecycle automation
* infrastructure orchestration integrations
* multi-tenant SaaS capabilities

These features are NOT part of the MVP.

---

## 15. MVP Success Criteria

The MVP is considered successful if it achieves:

* reduced manual financial follow-up
* improved customer payment visibility
* centralized operational visibility
* improved infrastructure transparency
* easier service management
* better internal operational organization

---

## 16. Product Philosophy

The MVP prioritizes:

* operational clarity
* simplicity
* maintainability
* explicit workflows
* fast internal delivery
* low operational complexity

The system intentionally avoids:

* premature SaaS complexity
* speculative architecture
* unnecessary abstraction
* enterprise-level over-engineering
