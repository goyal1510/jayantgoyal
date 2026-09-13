# PumpAxis

PumpAxis is a proposed modular operations product for petrol pumps and, later,
adjacent mobility and dealer businesses. No PumpAxis client or production data
system is implemented in this repository yet.

## Product boundary

PumpAxis owns business-scoped petrol-pump operations that need attributable
customer, staff, location, transaction, settlement, approval, and audit records.
The product name **PumpAxis** and module name **Loyalty** are confirmed. Other
module names remain working labels until the business owner confirms them.

PumpAxis must use a new, dedicated Supabase project. It must not connect to or
reuse the existing personal `jayantgoyal` Supabase project, migrations, storage,
credentials, or production data. The new project's name, reference, region,
environment topology, and owners are decisions required before implementation.

## Proposed modules

| Module | Status | Responsibility |
| --- | --- | --- |
| [Loyalty](loyalty-requirements.md) | Confirmed module name | Verified customer purchases, schemes, progress, rewards, disputes, and benefit delivery |
| [Shift Close & Reconciliation](shift-close-reconciliation-requirements.md) | Recommended working module label | Operator settlement, shift/pump-day closure, meter-derived sales, value allocation, recipient attestation, variance review, and EOD source reporting |
| Core Organization & Access | Recommended shared capability | Organizations, owners, pumps, staff assignments, roles/scopes, configuration, and tenant isolation |
| Wet Stock & Forecourt | Recommended future module | Tanks, dips, deliveries, book/physical stock, and loss/gain variance |
| Credit & Fleet | Recommended future module | Credit scope, limits, vehicles/drivers, issue/recovery, statements, ageing, reminders, and write-offs |
| Expenses & Cash Control | Recommended future module | Expenses, cash movements, deposits, handoffs, payment accounts, and settlement variance |
| Reports & Communications | Recommended shared capability | Dashboards, PDFs, owner WhatsApp summaries, alerts, statements, and secure delivery |
| Tax & Accounting Integrations | Recommended later module | Accountant-approved GST-ready summaries and deterministic Tally exports/integration |
| Risk, Audit & Approvals | Recommended shared capability | Immutable history, alerts, exception queues, maker-checker, corrections, and reopen controls |

The [module map and product roadmap](module-map.md) defines the recommended
boundaries for organization/access, wet stock, credit/fleet, expenses/cash,
reports/communications, tax/accounting integrations, and risk/audit. These are
intentional modules or capabilities, not a declaration that they are all MVP
scope.

The [client strategy](client-strategy.md) defines the hybrid delivery model:
mobile for operator/supervisor operations, responsive web for management and
audit, and a no-install customer/fleet portal reached through secure links.

## Organization and pump hierarchy

```text
Organization
├── owners, organization memberships, and scoped access grants
├── shared customer directory and optional organization-wide schemes/credit
└── one or more pump locations
    ├── machines/dispensers ──> nozzles ──> products/prices
    ├── tanks/compartments and dip records (future Wet Stock module)
    ├── shifts ──> operator settlements ──> allocations/handoffs
    └── pump-day closures, payment accounts, expenses, and reports
```

An organization may have multiple owners, and an owner may be authorized for
multiple pumps. Staff-to-pump assignments are many-to-many, time-bound,
role-specific, auditable, and revocable. A customer belongs primarily to the
organization's shared customer directory and may transact at participating
pumps, while every transaction permanently retains its exact pump, shift,
operator, time, and machine/nozzle where applicable.

Every query and storage path must enforce organization isolation. Within one
organization, access is further scoped to selected pumps, one pump, a shift, or
the actor's own records. Pump-local operation must not expose or depend on
another organization's data.

## Shared product capabilities

Both modules should reuse one authoritative model for businesses, locations,
staff users, roles and permissions, customers, stable customer IDs, verified
phone history, primary accounts, group authorization, vehicles, notifications,
consent, evidence metadata/storage, approvals, corrections, and immutable audit
events. A shared entity does not imply that every role may see every field.
Authorization remains purpose-, business-, location-, relationship-, and
record-scoped.

Loyalty owns scheme eligibility, progress, benefits, and redemptions. Shift
Close & Reconciliation owns operational closure, accountable value, allocation,
handoff attestation, credit movements, variance, and EOD report versions. A
shared sale or credit record may inform both modules, but each financial or
loyalty effect must have a single source event and idempotent projection so it
cannot be counted twice.

Loyalty schemes may aggregate progress across all participating organization
pumps or only selected pumps. Credit accounts and reward redemption may likewise
be organization-wide or pump-scoped through explicit configuration. Phone
uniqueness, customer merging, group membership, vehicles, and reward balances
are resolved within the organization boundary, never globally across unrelated
organizations.

## Future-module boundary

The proposed modules do not automatically include full accounting/general
ledger, tax filing, payroll, inventory or physical tank-stock management,
dispenser control, maintenance management, or a complete point-of-sale system.
Those capabilities require separate approved requirements and authoritative
system boundaries. PumpAxis should preserve integration-ready identifiers and
events without presenting future capabilities as implemented.
