# Gecut Cloud — UI Guidelines

## 1. Purpose

This document defines the UI/UX principles, dashboard behavior, component rules, layout standards, and frontend interaction patterns for Gecut Cloud.

It is the source of truth for:

- dashboard structure
- RTL behavior
- table standards
- form behavior
- loading/error states
- empty states
- navigation philosophy
- visibility rules
- responsive behavior
- component consistency
- operational UX standards

This document must guide:

- frontend implementation
- shadcn/ui usage
- dashboard design
- component composition
- interaction design
- customer/admin experience

---

## 2. UI Philosophy

The MVP UI should feel:

```txt id="7a4qz6"
modern
clean
operational
minimal
dashboard-oriented
````

The UI prioritizes:

- clarity
- readability
- operational efficiency
- predictable interaction
- low cognitive load

Avoid:

- decorative complexity
- visual noise
- animation-heavy interfaces
- overly playful UX
- marketing-style dashboard design

The product is operational software, not a landing page.

---

## 3. Layout Philosophy

Preferred layout structure:

```txt id="x2u8fr"
sidebar
topbar
content area
```

---

### Dashboard Priorities

Dashboards should prioritize:

1. operational clarity
2. financial visibility
3. actionable information
4. readable summaries

Avoid giant dashboard widgets.

---

## 4. RTL Rules

RTL is ALWAYS the default.

All layouts, spacing, alignment, and navigation should be designed RTL-first.

---

### RTL Requirements

Required:

- proper RTL flex direction
- correct table alignment
- correct form alignment
- proper breadcrumb direction
- RTL-aware spacing
- Persian-friendly typography

Avoid LTR-first implementations patched afterward.

---

## 5. Language Rules

### Developer Language

Use English for:

- code
- component names
- variable names
- route names
- DTO names

---

### User-Facing Language

Use Persian for:

- labels
- buttons
- messages
- notifications
- errors
- empty states
- customer-facing content

---

### Persian Tone

Persian UI language should feel:

```txt id="q3gq0i"
respectful
clear
modern
concise
```

Avoid:

- robotic translation
- overly formal legal tone
- childish language

---

## 6. Design System Strategy

Primary UI system:

```txt id="ujyiz9"
shadcn/ui
```

Custom components should extend shadcn/ui patterns rather than replace them entirely.

---

### Customer App Exception

`apps/customer-app` uses HeroUI v3 as its primary component system with `next-themes` for theme switching.

Project UI stack is hybrid:

- `apps/admin` → shadcn/ui via `packages/ui`
- `apps/customer-app` → HeroUI v3

For important customer-app pages, async state contract is mandatory:

- loading
- error
- empty
- success

State file naming in modules:

- `<domain>-empty-state.tsx`
- `<domain>-error-state.tsx`

Skeleton policy:

- every important page must have a page-level skeleton
- skeletons must preserve layout and avoid layout shift
- avoid generic spinner-first experience for main pages

---

## 7. Component Philosophy

Components should remain:

- reusable
- explicit
- composable
- operationally clear

Avoid:

- giant polymorphic components
- hidden side effects
- deeply coupled components

---

## 8. Component Ownership

### Shared Components

Location:

```txt id="n6d6e8"
packages/ui
```

Recommended for:

- buttons
- cards
- dialogs
- table wrappers
- empty states
- skeletons
- badges
- layout primitives

---

### App-Specific Components

Location:

```txt id="tjkx6n"
apps/admin/components
apps/customer-app/components
```

Used for:

- page-specific composition
- dashboard-specific widgets
- feature-specific UI

---

## 9. Navigation Philosophy

Navigation should remain:

- shallow
- predictable
- operational

Avoid deeply nested navigation trees.

---

### Recommended Navigation Structure

Admin:

```txt id="7r7g4e"
Dashboard
Customers
Service Groups
Services
Endpoints
Servers
Invoices
Payments
Audit Logs
```

Customer:

```txt id="0c1xsc"
Dashboard
Services
Invoices
Payments
```

---

## 10. Dashboard Rules

Dashboards should display:

- summaries
- recent activity
- actionable items
- financial visibility
- operational visibility

Avoid dashboard overload.

---

### Dashboard Composition

Preferred structure:

```txt id="bqcfpc"
summary cards
recent activity
table/list sections
```

Avoid giant chart-heavy dashboards during MVP.

---

## 11. Table Guidelines

Tables are core operational UI.

Use:

```txt id="bqcf7h"
TanStack Table
```

for scalable operational tables.

---

### Table Requirements

Operational tables should support:

- sorting
- pagination
- filtering
- loading state
- empty state
- responsive overflow handling

---

### Table Design Philosophy

Tables should remain:

- compact
- readable
- operationally efficient

Avoid:

- oversized row heights
- excessive decoration
- unnecessary nested rows

---

## 12. Table Columns

Columns should prioritize:

1. important operational identifiers
2. statuses
3. timestamps
4. actions

Avoid overcrowded tables.

---

## 13. Form Philosophy

Forms should remain:

- clear
- short
- structured
- predictable

Avoid giant multi-step forms during MVP unless necessary.

---

### Form Layout Rules

Preferred layout:

```txt id="d1kqf7"
single-column
```

for customer-facing forms.

Use multi-column only for operational/admin efficiency.

---

## 14. Form Validation UX

Validation should be:

- immediate when practical
- understandable
- localized in Persian

Avoid technical validation wording.

---

### Good Validation Example

```txt id="18u2ux"
شماره تماس معتبر نیست
```

Avoid:

```txt id="d4xaj2"
Validation failed for phone field
```

---

## 15. Button Rules

Buttons should clearly communicate intent.

Primary actions:

```txt id="a2fjgr"
save
create
pay
confirm
```

Danger actions:

```txt id="p5mg8m"
cancel
delete
archive
```

Avoid vague labels like:

```txt id="15w8jt"
submit
process
continue
```

unless context is extremely obvious.

---

## 16. Status Display Rules

Statuses should always be visually distinguishable.

Recommended:

- badges
- semantic colors
- icons when useful

---

### Important Status Types

Examples:

```txt id="j7y0z7"
active
inactive
suspended
paid
unpaid
cancelled
maintenance
```

Status visibility is operationally critical.

---

## 17. Loading State Rules

Every important async UI must handle:

```txt id="5ltc7x"
loading
error
empty
success
```

explicitly.

---

### Loading Philosophy

Prefer:

- skeletons
- lightweight placeholders
- optimistic structure stability

Avoid:

- giant spinners
- layout shifts
- blocking screens

---

## 18. Empty State Rules

Empty states should:

- explain current state
- guide next action
- remain visually lightweight

---

### Good Empty State Example

```txt id="t2wnvl"
هنوز سرویسی ثبت نشده است
```

Avoid generic empty states like:

```txt id="mr3tpf"
No data
```

---

## 19. Error State Rules

Errors should remain:

- concise
- safe
- understandable

Avoid exposing:

- technical stack details
- database errors
- internal identifiers

---

### User Error Tone

Preferred tone:

```txt id="jzh8n9"
مشکلی در پردازش درخواست رخ داد
```

Avoid panic-style messaging.

---

## 20. Confirmation Dialog Rules

Dangerous actions require confirmation dialogs.

Examples:

- invoice cancellation
- archive operations
- payment-sensitive actions

---

### Confirmation Philosophy

Dialogs should clearly explain:

- action
- consequence
- reversibility

Avoid ambiguous confirmations.

---

## 21. Accessibility Rules

Accessibility is required from MVP start.

Required:

- semantic HTML
- keyboard navigation
- accessible dialogs
- focus management
- readable contrast
- form labeling

Avoid accessibility as a later concern.

---

## 22. Responsive Rules

Primary target:

```txt id="1xg00n"
desktop-first operational dashboard
```

But mobile usability must remain acceptable.

---

### Responsive Priorities

Desktop:

- operational efficiency
- table usability
- density

Mobile:

- readability
- navigation clarity
- safe interactions

---

## 23. Mobile Table Behavior

For smaller screens:

Preferred:

- horizontal scroll
- compact cards
- simplified columns

Avoid:

- broken layouts
- unreadable compressed tables

---

## 24. Financial UI Rules

Financial data should remain:

- visually clear
- immutable-aware
- operationally trustworthy

---

### Invoice UI

Invoice pages should clearly display:

- status
- invoice number
- totals
- due date
- payment state
- item snapshots

Paid invoices should visually communicate immutability.

---

### Payment UI

Payment visibility should prioritize:

- payment status
- paidAt
- gateway reference
- amount

Avoid unnecessary financial clutter.

---

## 25. Uptime UI Rules

Uptime is summary visibility, not observability tooling.

Avoid complex monitoring dashboards during MVP.

---

### Endpoint Status Display

Recommended visibility:

- endpoint URL
- operational status
- uptime percentage
- response time summary

Avoid infrastructure-heavy monitoring UI.

---

## 26. Server Visibility Rules

Server visibility depends on:

```txt id="oq0q0k"
serverVisibilityLevel
```

Frontend must respect API visibility filtering.

Frontend should never assume access to sensitive infrastructure fields.

---

## 27. Audit UI Rules

Audit UI is primarily admin-facing.

Audit tables should prioritize:

- actor
- action
- entity
- timestamp

Avoid exposing sensitive raw metadata directly.

---

## 28. Notification Philosophy

Notifications should remain:

- concise
- actionable
- low-noise

Avoid excessive toast spam.

---

### Success Message Example

```txt id="yvb5nd"
فاکتور با موفقیت ایجاد شد
```

---

## 29. Destructive Action Rules

Destructive actions should remain visually distinct.

Use:

- semantic danger colors
- explicit confirmation
- clear wording

Avoid accidental destructive operations.

---

## 30. Search & Filtering UX

Operational search should prioritize:

- speed
- clarity
- low friction

Recommended filters:

```txt id="mtjlwm"
status
customer
service
date range
type
```

Avoid overly dynamic filter builders during MVP.

---

## 31. Visual Density Philosophy

Preferred density:

```txt id="1mkq3n"
medium-density operational UI
```

Avoid:

- extremely dense enterprise UI
- oversized spacing-heavy layouts

The interface should feel modern but efficient.

---

## 32. Animation Philosophy

Animations should remain:

- subtle
- lightweight
- purposeful

Avoid:

- heavy motion
- decorative transitions
- animation-driven UX

Operational software should prioritize responsiveness over spectacle.

---

## 33. Theme Rules

Preferred default:

```txt id="4wdj4g"
dark-neutral operational aesthetic
```

with strong readability and contrast.

Avoid:

- over-saturated palettes
- excessive gradients
- playful color systems

---

## 34. Iconography Rules

Icons should support clarity, not decoration.

Use icons for:

- statuses
- navigation
- operational actions

Avoid icon overload.

---

## 35. Data Visibility Rules

Frontend must assume:

```txt id="rr8jkl"
API is source of truth
```

Do not rely solely on frontend hiding for security.

Sensitive fields should already be filtered server-side.

---

## 36. Future Expansion Philosophy

The UI architecture should scale through:

- reusable patterns
- stable components
- composable layouts
- DTO-driven rendering

NOT through:

- giant abstraction systems
- page-builder complexity
- over-configurable UI engines

---

## 37. Source of Truth Rules

This document must guide:

- dashboard implementation
- frontend structure
- component composition
- operational UX behavior
- table implementation
- form behavior
- status visualization

If implementation requires violating these rules:

1. Update this document first.
2. Then update implementation.
