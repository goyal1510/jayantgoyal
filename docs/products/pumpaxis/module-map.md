# PumpAxis Module Map and Product Roadmap

| Attribute | Value |
| --- | --- |
| Product | **PumpAxis** — confirmed |
| Status | Recommended modular product strategy; only approved pilot capabilities become delivery scope |
| Purpose | Define ownership, dependencies, role/location scope, phased outcomes, and acceptance boundaries across the broader petrol-pump suite |
| Data platform | Dedicated new PumpAxis Supabase project; the existing personal project is prohibited |

This map complements the detailed [Loyalty](loyalty-requirements.md) and [Shift
Close & Reconciliation](shift-close-reconciliation-requirements.md)
requirements and the role-based [client strategy](client-strategy.md). It does
not claim that any PumpAxis module is currently
implemented or that feature parity with another product has been achieved.

## 1. Confirmed product principles

- PumpAxis supports multiple isolated organizations and multiple pump locations,
  even if the first pilot is small.
- An organization can have multiple owners; owners and other users act through
  explicit, revocable, scoped access grants.
- Staff assignment to pumps is many-to-many, time-bound, role-specific,
  auditable, and revocable.
- Customers belong primarily to the organization's shared directory and may
  transact at participating pumps with exact location, shift, operator,
  equipment, and time traceability.
- Organization data must never be visible to another organization.
- The product should eventually cover fast closing, wet stock/dip, variance,
  credit/fleet, overdue reminders, daily owner reporting, expenses/GST/Tally,
  multiple pumps, and role-based access.
- These capabilities belong in bounded modules or shared foundations, not one
  oversized feature or first release.

## 2. Recommended module structure

```text
Core Organization & Access
    │
    ├── Loyalty
    ├── Shift Close & Reconciliation ──> Expenses & Cash Control
    │                │                  └──> Credit & Fleet
    │                └──> Wet Stock & Forecourt
    ├── Reports & Communications <── events/read models from every module
    ├── Tax & Accounting Integrations <── approved operational/finance events
    └── Risk, Audit & Approvals <── cross-cutting policy and immutable evidence
```

### Boundary recommendations

- Keep **Core Organization & Access** and **Risk, Audit & Approvals** as
  cross-cutting platform capabilities rather than customer-facing menu modules.
- Keep **Reports & Communications** as a shared delivery/read-model capability;
  each source module still owns the meaning of its numbers.
- For the first operational pilot, basic credit and expense entries may live in
  the Shift Close workflow. Extract their durable rules into **Credit & Fleet**
  and **Expenses & Cash Control** as soon as statements, ageing, approvals, or
  cross-shift lifecycle become active.
- Keep **Wet Stock & Forecourt** separate because physical tank stock, dip charts,
  deliveries, and loss/gain are not the same facts as cumulative nozzle meter
  readings.
- Keep **Tax & Accounting Integrations** downstream. Operational totals are not
  statutory accounting until the accountant approves mappings and exports.

Module labels other than confirmed **PumpAxis** and **Loyalty** are
recommendations pending final business naming approval.

## 3. Shared hierarchy, roles, and transaction flow

### Organization and physical hierarchy

```text
Organization
├── organization memberships and ownership/access grants
├── customers, primary accounts, vehicles, optional shared schemes/credit
└── Pump A..N
    ├── staff assignments, payment accounts, prices, shifts, reports
    ├── dispensers/machines ──> nozzles ──> products
    └── tanks ──> optional compartments ──> dip chart/readings/deliveries
```

Nozzle meters report cumulative dispensed values. Tank dip reports physical
stock. Neither may be substituted for the other.

### Role plus scope

```text
Effective permission = capability + organization membership + scope + time

Scope: organization | selected pumps | one pump | shift | own records
Role: owner | organization admin | pump manager | shift supervisor |
      operator/salesman | accountant/finance | auditor/viewer | customer/fleet
```

Maker-checker separation applies to handoffs, material adjustments, credit
write-offs, reward redemption, reopened closures, and other configured sensitive
actions. A role label alone never grants all organization data.

### Reconciliation roll-up

```text
Operator settlement
   + explicit shift-level shared amounts
      → Shift reconciliation
         → Pump daily closure
            → Organization summary
```

Every roll-up retains source status. Consolidation cannot turn a preliminary or
disputed lower-level record into an apparently final amount.

### Customer, credit, and Loyalty across pumps

```text
Organization customer/account + authorization
      ├── purchase at participating Pump A
      └── purchase at participating Pump B
              │
              ├── immediate payment allocation ──> reconciliation
              └── credit issued ──> credit ledger ──> later recovery
                         │
                         └── one configured Loyalty earning trigger
                             (issue OR recovery OR excluded; never both)
```

Schemes, credit accounts, and reward redemption may be organization-wide or
limited to selected pumps through effective-dated configuration.

## 4. Module ownership matrix

| Module/capability | Owns | Does not own |
| --- | --- | --- |
| Core Organization & Access | Organizations, memberships, owners, pumps, configuration, identities, staff assignments, roles/scopes, devices/sessions | Scheme, sales, stock, accounting calculations |
| Loyalty | Customer/group purchase attribution, schemes, progress, rewards, redemption, loyalty disputes | Meter sales, receivable ledger, physical stock, statutory accounting |
| Shift Close & Reconciliation | Operator settlements, shift/pump-day closure, meter-derived sales, left/right allocation, handoff attestation, operational variance, EOD source report | Tank stock, long-lived credit ageing, general ledger |
| Wet Stock & Forecourt | Tanks/compartments, dip charts/readings, deliveries, book/physical stock, testing return/own-use stock effects, loss/gain variance | Cash allocation, customer rewards, accounting journal truth |
| Credit & Fleet | Credit account scope/limits/terms, issue, recovery allocation, statements, ageing, reminders, fleet vehicles/drivers, suspension/dispute/write-off | Fuel sale creation, payment-provider truth, Loyalty reward calculation |
| Expenses & Cash Control | Expense lifecycle, categories, approvals, cash movement, deposits, handoffs, provider/account reconciliation | Revenue recognition, tax filing, stock movement |
| Reports & Communications | Versioned read models, PDFs, owner dashboards, scheduled summaries, secure delivery, template/retry status | Meaning or mutation of source transactions |
| Tax & Accounting Integrations | Accountant-approved mappings, GST-ready summaries, deterministic exports/posting status, duplicate prevention | Inventing tax rates/journals or replacing source operational records |
| Risk, Audit & Approvals | Immutable audit, exception queues, rule-versioned alerts, maker-checker decisions, correction/reopen workflow | Automatic accusations or silent modification of source facts |

## 5. Dependency-aware roadmap

| Phase | Recommended scope | Dependency reason |
| --- | --- | --- |
| Foundation | Organization/multi-pump hierarchy, identity, verified contacts, role/capability scopes, staff assignments, pump/machine/nozzle/product/payment configuration, audit | Every other module needs tenant isolation, exact pump context, and attributable actors |
| MVP operational pilot | Operator settlement, guided shift/pump close, readings, testing adjustment, left/right reconciliation, basic credit events, handoff attestation, variance review, EOD PDF, owner notification | Replaces current notebook with the smallest complete accountability loop |
| Next | Wet stock/dip, durable Credit & Fleet ledger, Expenses & Cash, ageing/reminders, richer multi-pump dashboard, controlled Loyalty integration | Uses reliable closures and shared identities; adds cross-day lifecycles |
| Later | GST/Tally integration, POS/dispenser/payment automation, advanced risk, richer analytics, commercial multi-organization administration | Requires stable validated source data and accountant/provider contracts |

This sequence is a recommendation. Loyalty may pilot before or alongside the
operational MVP if shared organization, identity, location, roles, and audit are
built once. Wet stock should follow meter closing unless tank/delivery control is
the business's higher-priority leakage problem. Accounting export should not
precede accountant-approved operational semantics.

## 6. Core Organization & Access deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Multiple owners, pumps, employees, customers, and settings need isolation plus controlled cross-pump operation. |
| Personas and scope | Owner/organization admin at organization or selected pumps; pump manager at pump; supervisor at shift; operator at assigned pump/shift/own records; finance/auditor scoped explicitly; customer within own organization account. |
| Key workflows | Create organization/pump; invite owner/member; grant/revoke scope; assign staff permanently or temporarily; configure pump/equipment/methods; disable device/staff; review access. |
| Inputs/outputs | Identity/contact, organization and pump data, capability grant, effective period, approver, configuration → effective authorization decision and audit event. |
| Conceptual entities | Organization, organization membership, ownership/access grant, pump location, pump configuration, staff assignment, temporary assignment, role/capability, device/session, customer directory. |
| Calculations | Effective access is the intersection of active membership, capability, scoped resource, time, limits, and record relationship. No additive global role shortcut. |
| States/approvals | Invited → Active → Suspended/Expired/Revoked; high-privilege grants use step-up and maker-checker where configured. |
| Notifications/audit | Notify subject and owner for sensitive grant, phone, role, pump assignment, device, and recovery changes; audit every grant evaluation failure and sensitive administration. |
| Failures/edge cases | Owner removal, last owner, cross-pump relief, expired assignment mid-shift, duplicate customer/phone, organization offboarding, one pump offline. Fail closed without losing historical attribution. |
| Dependencies | Dedicated PumpAxis Supabase tenant boundary, authentication, notifications, audit. Every module consumes it. |
| MVP/later | MVP: manual organization/pump and role setup. Later: self-service tenant provisioning, SSO, SCIM, delegated administration, commercial billing. |
| Acceptance criteria | Two test organizations cannot access each other; one user can hold different pump scopes; temporary assignment expires; disabled staff lose access while prior entries retain identity. |
| Success metrics | Unauthorized-access test pass rate, time to provision/revoke, stale grants, access-denial reasons, staff assignment accuracy. |

## 7. Loyalty deep dive

The full BRD/PRD is in [PumpAxis Loyalty](loyalty-requirements.md).

| Concern | Requirement |
| --- | --- |
| Business problem | Purchases and benefits can be misattributed, hidden, or incompletely delivered to customers/fleet owners. |
| Personas and scope | Primary customer/fleet owner, authorized family/driver/employee, guest, attendant, managers, scheme/finance, support, auditor, business admin. Customer access is own account; staff is transaction/location scoped. |
| Key workflows | Phone-first registration; primary account/group/vehicle authorization; qualifying purchase; confirmation/dispute; progress; milestone; reward redemption/delivery. |
| Inputs/outputs | Verified contact, account/member/vehicle, pump/shift/operator, bill/items, scheme version, evidence → transaction confirmation, progress event, reward, notification, audit. |
| Conceptual entities | Shared customer/phone/account/vehicle plus schemes, rules, enrolments, progress, rewards, redemptions, confirmations, disputes. |
| Calculations | Versioned eligible value/quantity, milestones, caps, rounding, reversal; selected pumps control contribution/redemption. |
| States/approvals | Transaction and reward states defined in the Loyalty PRD; high-risk confirmation, manual delivery, correction, and redemption use configured approval. |
| Notifications/audit | Immediate purchaser/primary-member notice, membership/security/reward/dispute events; immutable sensitive action/evidence access history. |
| Failures/edge cases | Shared/reassigned phones, duplicate accounts/bills/images, removed members, returns after reward, notification failure, offline retry. |
| Dependencies | Core Organization & Access; Reports & Communications; Risk/Audit. Consumes confirmed sales/credit trigger without recalculating them. |
| MVP/later | MVP is defined in the Loyalty PRD. Later: advanced similarity/risk, integrations, complex campaigns, commercial tenant administration. |
| Acceptance criteria | No cross-organization visibility; selected-pump rules work; reward/progress is idempotent; credit recovery never duplicates purchase progress. |
| Success metrics | Registration/conversion, repeat purchase, participation/completion, verified benefit delivery, complaints/disputes, transaction time, fleet retention. |

## 8. Shift Close & Reconciliation deep dive

The full BRD/PRD is in [Shift Close &
Reconciliation](shift-close-reconciliation-requirements.md).

| Concern | Requirement |
| --- | --- |
| Business problem | Handwritten readings, allocations, credit, and handoff claims create owner effort, errors, and unverifiable balancing. |
| Personas and scope | Operator own settlement; supervisor assigned shifts/operators; manager/owner authorized pumps and consolidation; finance financial scope; auditor read-only. |
| Key workflows | Guided opening → active shift → responsibility handover → operator submission → roll-up → attestation → variance review → approval → finalization/reopen. |
| Inputs/outputs | Meter readings, price periods, tests, accountable inflows, payments, credit, expenses, handoffs → operator/shift/pump-day totals, variance, attestations, PDF. |
| Conceptual entities | Operator responsibility period/settlement, shift, readings, tests, calculated sale, left/right entries, handoff/attestation, variance, report/version. |
| Calculations | Gross/adjusted litre and rupee differences; litre-at-price/direct-meter variance; left minus right at operator, shift, pump-day, organization. |
| States/approvals | Draft, Submitted, Awaiting Attestation, Variance Requires Review, Approved, Reopened, Finalized; autosave/offline remains explicitly local until sync. |
| Notifications/audit | Handoff, pending review, preliminary/final report; audit every source, handover, correction, attestation, approval, reopen, and export. |
| Failures/edge cases | Opening mismatch, reset/rollover, price change, shared counters, relief operator, late settlement, partial handoff, duplicate/offline closure, midnight shift. |
| Dependencies | Core; basic Credit/Expense inputs; Reports; Risk/Audit; later Wet Stock comparison. |
| MVP/later | MVP replaces notebook with manual structured entry. Later: provider, POS, dispenser, accounting automation. Target close time is configured/measured, not asserted. |
| Acceptance criteria | Roll-up never double counts shared amounts; previous closing is not silently accepted; pending material item cannot appear final; deterministic PDF/version. |
| Success metrics | Digital adoption, close/review time, first-pass completeness, variance, attestation age/rate, correction/reopen rate. |

## 9. Wet Stock & Forecourt deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Nozzle sales do not prove physical tank stock; deliveries, tests, water/density, measurement error, and loss/gain need a separate reconciliation. |
| Personas and scope | Operator captures assigned readings; supervisor verifies pump shift/day; pump manager/owner reviews variance; inventory/finance and auditor receive scoped access. |
| Key workflows | Configure tank/compartment/dip chart → opening dip → deliveries/transfers → sales/test/own-use stock effects → closing dip → book/physical comparison → variance review/approval. |
| Inputs/outputs | Tank capacity/product, strapping table, dip/temperature/density/water where applicable, deliveries, nozzle sales, returned testing, own use, adjustments → book stock, physical stock, loss/gain, alert. |
| Conceptual entities | Tank, compartment, tank-product assignment, dip chart/version, dip reading, delivery/receipt, transfer, stock movement, book balance, physical balance, stock variance, evidence/approval. |
| Calculations | Book close = opening book + receipts/transfers in − sales/transfers out − non-returned own use ± approved adjustments. Physical volume derives only from approved dip chart/measurement rules. Variance = physical close − book close. |
| States/approvals | Draft/Submitted/Verified/Variance Review/Approved/Finalized; chart changes, estimated readings, delivery correction, and material variance require approval. |
| Notifications/audit | Missing dip, low stock, delivery mismatch, water/density issue, material loss/gain; audit chart/version, readings, evidence, estimates, corrections, approvals. |
| Failures/edge cases | Wrong tank/product, partial delivery, dip chart unavailable, tilted tank, water, temperature/density uncertainty, gauge fault, tank offline, testing not returned. Record uncertainty; do not infer physical stock from nozzle meters alone. |
| Dependencies | Core equipment/product; Shift Close sale and test events; Reports; Risk/Audit. Hardware automation is later unless a verified interface exists. |
| MVP/later | Next phase: manual dips, deliveries, book/physical variance. Later: ATG/hardware, calibrated density/temperature automation, forecasting. |
| Acceptance criteria | QA can prove meter volume and tank stock are separate; approved stock equation reproduces test cases; chart version is historical; material variance blocks/flags finalization. |
| Success metrics | Dip completion, delivery discrepancy, absolute/percentage stock variance, unresolved variance age, estimated-reading rate, loss/gain trend. |

## 10. Cash and Sales Variance deep dive

This is primarily a Shift Close and Expenses/Cash capability surfaced by Risk
and Reports, not a separate source-of-truth module.

| Concern | Requirement |
| --- | --- |
| Business problem | A balanced daily total can hide operator, payment-method, pending-settlement, or pump-specific shortages/overages. |
| Personas and scope | Operator sees own variance; supervisor shift/operator; manager pump; owner/finance organization; auditor assigned read-only. |
| Key workflows | Calculate at entry/submit → classify pending versus actual → alert outside tolerance → investigate source/handoff/provider → correct/approve → trend. |
| Inputs/outputs | Accountable sale/inflow, allocations, provider settlement, attestations, configured tolerance → signed/absolute/percentage variance and review case. |
| Conceptual entities | Reconciliation variance, tolerance rule/version, provider settlement, exception case, correction, approval, audit event. |
| Calculations | Variance at operator, shift, pump-day, payment method, and organization; absolute and percentage thresholds; unresolved lower-level amounts stay visible in roll-up. |
| States/approvals | Within Tolerance, Pending Settlement, Requires Review, Explained/Approved, Corrected, Unresolved; approval authority varies by value/scope. |
| Notifications/audit | Notify responsible reviewer on material or ageing threshold; audit source facts, classification, explanation, correction, decision. Never accuse automatically. |
| Failures/edge cases | Provider delay/outage, duplicate settlement, shared payment counter, cross-midnight settlement, zero total percentage, matching fabricated entries. |
| Dependencies | Shift Close, Expenses/Cash, payment integrations later, Reports, Risk/Audit. |
| MVP/later | MVP uses declared allocations and pending status. Later reconciles provider/bank feeds and detects patterns. |
| Acceptance criteria | Same event appears once at each roll-up; pending provider value is not labeled shortage; tolerance/version is visible; alert only creates review. |
| Success metrics | Material variance rate/value, pending settlement age, resolution time, repeat cause, confirmed shortage/overage after review. |

## 11. Credit & Fleet deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Fuel issued on credit, repayments, vehicles, drivers, limits, and overdue balances can be misattributed or counted twice. |
| Personas and scope | Credit customer/fleet owner own account; authorized driver permitted vehicles/pumps; operator active transaction; supervisor/manager limits; finance statements/ageing/write-off; auditor read-only. |
| Key workflows | Create/verify account → authorize pumps/vehicles/drivers → approve limit/terms → issue credit → confirm/dispute → age balance → recover/allocate → remind/suspend/adjust/write off. |
| Inputs/outputs | Organization/pump scope, customer/account, receiver, vehicle, sale/bill, amount, terms/due date, payment allocation → receivable, outstanding, ageing bucket, statement, status. |
| Conceptual entities | Credit account/scope, limit/terms version, fleet vehicle/driver authorization, credit issue, receivable, recovery, allocation, ageing snapshot, reminder, dispute, suspension, adjustment/write-off. |
| Calculations | Outstanding = issued − allocated recovery − approved credit adjustment/write-off/reversal; ageing from approved due basis; limits account for pending/confirmed exposure. |
| States/approvals | Provisional, Active, Suspended, Closed account; receivable Issued/Partially Recovered/Recovered/Disputed/Adjusted/Written Off/Reversed. Limits, exceptions, write-offs use maker-checker. |
| Notifications/audit | Issue, recovery, statement, due/overdue reminder, suspension, dispute, adjustment/write-off; audit authorization, limit use, allocations, corrections, template sends. |
| Failures/edge cases | Unverified phone, cross-pump account scope, overpayment/advance, payment split, one payment across invoices, return, scheme expiry, duplicate reminder, disputed debt. |
| Dependencies | Core customers/pumps; Shift Close sale/recovery allocation; Loyalty configured trigger; Reports/Communications; Risk/Audit. |
| MVP/later | MVP: basic issue/recovery/outstanding and statement. Next: limits, ageing, reminders, fleet scope. Later: external fleet cards/ERP/credit scoring if approved. |
| Acceptance criteria | Organization-wide and pump-specific accounts enforce scope; every issue/recovery traces to pump/operator; allocations sum correctly; recovery is not new revenue/Loyalty progress. |
| Success metrics | Outstanding/overdue value, ageing distribution, recovery rate/time, allocation completeness, limit exceptions, disputed/write-off rate, reminder delivery/payment conversion. |

## 12. Overdue Reminders deep dive

This is a Reports & Communications workflow driven by Credit & Fleet ageing.

| Concern | Requirement |
| --- | --- |
| Business problem | Manual follow-up is inconsistent and may contact the wrong person or repeat messages. |
| Personas and scope | Credit customer/primary member receives; finance configures/monitors; owner sees outcomes; support handles failure/opt-out; operator has no bulk reminder access. |
| Key workflows | Age balance → select eligible reminder → apply consent/quiet hours/language → send idempotently → retry/fallback → record delivery/response/payment → escalate. |
| Inputs/outputs | Accurate receivable/due date, recipient/contact, schedule, template/version, channel, quiet hours, consent → delivery attempt, secure statement link, escalation. |
| Conceptual entities | Reminder policy, reminder event, template/version, notification attempt, delivery status, opt-out/suppression, escalation. |
| Calculations | Age/days overdue and amount come from Credit, not message history; next-send time respects timezone, quiet hours, prior event key, and retry policy. |
| States/approvals | Scheduled, Suppressed, Sending, Delivered, Failed, Responded, Escalated, Cancelled; template/policy changes approved. |
| Notifications/audit | The reminder is the notification; audit selection reason, template, recipient, attempts, suppression, and operator/support action. |
| Failures/edge cases | Wrong/reassigned/shared phone, payment arriving before send, disputed balance, duplicate queue retry, provider failure, partial payment, opt-out/lawful-basis conflict. |
| Dependencies | Credit ageing/allocation, shared phone/consent, Reports/Communications, Core timezone, Risk/Audit. |
| MVP/later | Next phase: configurable manual/scheduled SMS/WhatsApp. Later: multichannel journeys and payment links after legal/provider review. |
| Acceptance criteria | A paid/disputed/suppressed item is not reminded; retries reuse event key; one schedule event does not create duplicate messages; secure link exposes own statement only. |
| Success metrics | Delivery/failure, duplicate-send rate, reminders per recovery, payment conversion, opt-out/complaint, overdue reduction. |

## 13. Expenses & Cash Control deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Expenses, cash held/deposited/handed over, and provider totals can be mixed into handwritten balancing without source, receipt, approval, or recipient verification. |
| Personas and scope | Operator enters permitted expense/cash events; recipient attests; supervisor reviews shift; manager/finance approves categories/limits; owner consolidates; auditor reads. |
| Key workflows | Enter expense → attach receipt → approve/reject/correct → allocate to reconciliation; declare cash held/handoff/deposit → recipient/provider confirm → resolve difference. |
| Inputs/outputs | Pump/shift/operator, category, payer, amount, method, recipient/account, receipt/evidence, policy → approved expense/cash movement, allocation status, variance effect. |
| Conceptual entities | Expense, category/version, expense approval, cash position, cash/value handoff, attestation, deposit, payment account, provider settlement, allocation. |
| Calculations | Expense/cash totals by operator/shift/pump/day/org and method; cash expected versus confirmed held/handoff/deposit; no automatic statutory journal. |
| States/approvals | Expense Draft/Submitted/Approved/Rejected/Corrected/Reversed; cash movement Claimed/Pending/Partially Confirmed/Confirmed/Disputed. Limits use maker-checker. |
| Notifications/audit | Expense approval, handoff attestation/reminder/dispute, settlement mismatch; audit receipt access, changes, approvals, recipient results. |
| Failures/edge cases | Missing receipt, split payment, shared expense, duplicate claim, partial handoff, deposit next day, provider delay, wrong recipient/category, reversal. |
| Dependencies | Core, Shift Close, Reports, Risk/Audit; later Tax/Accounting maps approved events. |
| MVP/later | MVP: basic approved expense allocation and handoff. Next: categories, receipts, deposits/provider reconciliation. Later: bank feeds/accounting integration. |
| Acceptance criteria | Expense cannot affect final reconciliation without required approval; creator cannot self-attest recipient handoff; duplicate expense/payment reference alerts for review. |
| Success metrics | Expense capture/approval time, receipt completeness, cash confirmation rate, disputed handoffs, settlement mismatch, duplicate claims. |

## 14. Reports & Communications deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Owners need timely multi-pump information without exposing sensitive detail or mistaking preliminary totals for final ones. |
| Personas and scope | Owner organization/selected pumps; managers pump; finance selected financial views; auditor read-only; customers own statements; operators own permitted reports only. |
| Key workflows | Consume versioned source read models → generate dashboard/PDF → schedule summary → apply recipient/scope/privacy → send → track/retry → drill into authenticated detail. |
| Inputs/outputs | Module events/status, recipient grant, schedule/timezone, template/version → organization summary, pump comparison, PDF, WhatsApp/SMS/email notification, secure link. |
| Conceptual entities | Report definition, read-model snapshot, report/version, schedule, recipient subscription, template/version, notification attempt, secure share token, export event. |
| Calculations | Aggregations retain source currency/unit/status/version; report does not reinterpret source rules. Organization total equals included pumps with disclosed exclusions/preliminary status. |
| States/approvals | Draft/Generated/Preliminary/Approved/Finalized/Superseded; notification Scheduled/Sent/Delivered/Failed/Suppressed. |
| Notifications/audit | Scheduled owner WhatsApp contains minimal summary and secure authenticated drill-down; audit generation, scope, delivery, access, export, revocation. |
| Failures/edge cases | One pump offline/preliminary, late shift, timezone, missing module, oversized PDF, provider failure, revoked recipient, stale secure link, duplicate scheduled job. |
| Dependencies | All source modules; Core access/timezone; shared notification provider; Risk/Audit. |
| MVP/later | MVP: EOD PDF and owner notification. Next: organization/pump dashboard and scheduled WhatsApp. Later: configurable report builder/exports. |
| Acceptance criteria | Daily message identifies Preliminary versus Final; includes sales/litres, payment, credit, expense, handoff, stock variance only when available; no excessive personal data; retries do not duplicate event. |
| Success metrics | On-time delivery, failure/retry, report open rate, preliminary-to-final latency, stale/superseded access, owner review time. |

Recommended daily owner message includes organization status and per-pump summary
of sales/litres, stock/dip variance when available, payment breakdown, credit
issued/recovered/outstanding, expenses, cash handoffs, unresolved attestations,
and mismatches. Sensitive line detail belongs behind an authenticated link.

## 15. Tax & Accounting Integrations deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Re-keying expenses/sales into accounting creates errors, but exporting unvalidated operational categories as statutory truth creates greater risk. |
| Personas and scope | Accountant/finance configures and approves mappings; owner authorizes; auditor reviews; operators cannot post/export accounting records. |
| Key workflows | Select finalized source version → validate accountant-approved mappings → generate GST-ready summary/Tally export → review → export/post once → record result → reverse/correct through new version. |
| Inputs/outputs | Finalized sales/credit/expense/cash facts, tax/account code mappings, counterparty/product classification → versioned summary/export file/posting result. |
| Conceptual entities | Accounting mapping/version, tax classification, export batch/version, export line, external posting key/status, validation issue, reversal/correction link. |
| Calculations | Only accountant-approved tax base, rounding, grouping, and account mappings. Do not invent tax rates, GST treatment, vouchers, journals, or revenue recognition. |
| States/approvals | Draft/Validated/Approved/Exported/Posted/Partially Failed/Reversed/Superseded; deterministic idempotency prevents duplicate export/post. |
| Notifications/audit | Validation failure, approval, export/post result, duplicate prevention, reversal; audit data version, mapping version, actor, file hash, external reference. |
| Failures/edge cases | Missing GST data, changed mapping, corrected finalized day, partial external failure, duplicate posting, rounding difference, external system unavailable. |
| Dependencies | Stable finalized events from Shift Close, Credit, Expenses; Reports export delivery; Core/Risk/Audit. |
| MVP/later | Not MVP. Next/later only after accountant validates sample outputs; start deterministic export before write integration. |
| Acceptance criteria | Same approved source/mapping produces identical export/hash; retry cannot duplicate batch/post; incomplete mapping blocks authoritative label; correction creates linked successor/reversal. |
| Success metrics | Validation error, rework, duplicate-prevention events, export/post success, reconciliation difference, accountant time saved after validation. |

## 16. Risk, Audit & Approvals deep dive

| Concern | Requirement |
| --- | --- |
| Business problem | Sensitive actions, corrections, unusual patterns, and exceptions need evidence-based review without silent change or automatic accusation. |
| Personas and scope | Manager/finance approval within limits; owner organization scope; auditor immutable read; operator own error/action only; customer own disputes/confirmations. |
| Key workflows | Evaluate deterministic signal → create neutral alert/case → assign → gather source/evidence → decide/correct/approve/escalate → notify → retain outcome. |
| Inputs/outputs | Versioned rules, events, permissions, thresholds, evidence, reviewer decision → alert, approval, correction, audit event, control improvement. |
| Conceptual entities | Audit event, risk rule/version, alert, case, approval policy, approval step, correction, reopen request, evidence/access event, outcome. |
| Calculations | Absolute/percentage tolerances, frequency/age thresholds, duplicate keys, exposure limits; advanced scoring is later and explainable. |
| States/approvals | Alert Open/Triaged/Under Review/Resolved/False Positive/Escalated; request Draft/Pending/Approved/Rejected/Expired/Applied. Maker cannot satisfy prohibited checker step. |
| Notifications/audit | Notify assigned reviewer and affected user when appropriate; immutable actor/time/reason/input/outcome and sensitive-read logging. |
| Failures/edge cases | Reviewer conflict, missing evidence, false positive, alert storm, rule change mid-case, emergency access, expired approval, employee departure. |
| Dependencies | Core authorization; events from every module; Reports for queues/metrics. |
| MVP/later | MVP: deterministic validations, approval limits, immutable audit, manual queues. Later: cross-pump anomaly detection and advanced scoring after fairness/privacy review. |
| Acceptance criteria | Alert cannot directly accuse/cancel; audit cannot be edited by business roles; prohibited self-approval fails; correction preserves original and downstream compensating event. |
| Success metrics | Review age, confirmed/false-positive rate, repeat cause, approval time, unauthorized attempts, audit completeness, correction recurrence. |

## 17. Multiple-pump operating requirements

- Prices, payment accounts, staff, schemes, stock, numbering, hours, tolerances,
  and closure rules may be pump-specific and effective-dated.
- Organization customer IDs remain stable across participating pumps. Every
  transaction permanently retains exact pump, shift, operator, equipment where
  relevant, and server/business time.
- Staff can operate another organization pump only through an active assignment
  or approved temporary grant.
- One pump's connectivity failure must not expose another pump's data or corrupt
  its local operation. Organization consolidation labels missing/preliminary
  pumps rather than silently excluding them.
- Owner views provide organization consolidation, pump comparison, and drill-down
  through pump/day/shift/operator.
- Credit exposure, Loyalty activity, expenses, stock variance, payment
  reconciliation, attestations, and alerts must be available both per-pump and
  consolidated when the source module is implemented.
- Credit account scope, scheme participation, and reward redemption scope are
  explicit configuration, never inferred merely from common ownership.
- Cross-organization data joins are prohibited. Commercial platform operators
  require separately governed support/break-glass access.

## 18. Shared conceptual entities

| Entity | Purpose and scope |
| --- | --- |
| Organization | Hard tenant/data boundary and owner consolidation root |
| Organization membership | Connects a person/user/customer to one organization without implying universal permission |
| Ownership/access grant | Capability plus organization/selected-pump/pump/shift/own-record scope, limits, and effective period |
| Pump location | Operational location and parent for equipment, shifts, accounts, and reports |
| Pump configuration | Effective-dated local prices/rules/numbering/hours/tolerances/method availability |
| Staff assignment | Many-to-many, time-bound staff-to-pump/role relationship |
| Temporary assignment | Expiring relief/cross-pump shift/task authorization |
| Pump participation in scheme | Effective-dated Loyalty contribution/redemption permission |
| Pump payment account | Protected local settlement destination/provider configuration |
| Customer directory | Organization-scoped stable person/account/phone/group/vehicle records shared across participating pumps |
| Product/equipment registry | Shared stable product, machine, nozzle, tank references with module-owned operational facts |
| Notification/evidence/audit | Shared secure infrastructure with purpose- and case-scoped records |

The module ownership matrix decides which capability may mutate each record.
Sharing an identifier is not permission to duplicate tables, calculations, or
authorization logic.

## 19. Product-wide acceptance criteria

- Two organizations with similarly named pumps, users, customers, vehicles,
  bills, and payment methods remain completely isolated in authorization and
  storage tests.
- One organization supports multiple owners, pumps, pump-specific settings, and
  time-bound cross-pump staff assignments.
- An organization owner can drill from a consolidated total to pump, day, shift,
  operator, and source entries without a total being duplicated or a preliminary
  source becoming final.
- An operator sees only assigned/own records; supervisor, manager, finance, and
  auditor scopes behave according to capability grants rather than role labels
  alone.
- Nozzle meter sales and tank physical stock use different records and equations.
- Credit issue, repayment, reconciliation, revenue/reporting, and Loyalty
  progress consume one stable source event and cannot double count under retry,
  correction, or cross-pump aggregation.
- Scheduled reminders/reports are idempotent, privacy-minimized, delivery-tracked,
  and link to authorized detail.
- GST/Tally outputs cannot be labeled authoritative without approved mapping and
  source version, and retry cannot duplicate export/posting.
- Every material correction, write-off, reward delivery, handoff attestation,
  and reopen decision satisfies maker-checker policy and immutable audit.

## 20. Product-wide open decisions

1. Final names for every module except confirmed **PumpAxis** and **Loyalty**;
   whether **Shift Close & Reconciliation** and the other roadmap labels are
   approved.
2. Which shared capabilities are user-visible modules versus internal platform
   services.
3. Exact first-pilot sequence: Loyalty first, operational close first, or shared
   foundation followed by a limited parallel pilot.
4. Organization and pump legal model, multi-owner authority, last-owner recovery,
   and commercial support/break-glass access.
5. Which settings are organization-wide versus pump-specific and who approves
   inheritance/overrides.
6. The authoritative sales, stock, payment-settlement, credit, expense, tax, and
   accounting systems for every integration boundary.
7. Meter/dip semantics, formulas, precisions, rounding, tolerances, and
   materiality by equipment/product/location.
8. Credit scope, limits, terms, ageing, reminder schedule, consent, quiet hours,
   allocation, advances, disputes, write-off, and Loyalty earning trigger.
9. Daily owner report schedule, recipients, language, content, preliminary/final
   policy, secure-link expiry, and delivery fallback.
10. Expense categories/limits/receipts, cash chain, payment-provider truth, and
    approval separation.
11. Accountant-approved GST summary and Tally mapping, export versus direct
    integration, correction/reversal, and external idempotency rules.
12. Dedicated PumpAxis Supabase project organization/name/reference/region,
    environment isolation, owners, retention, backups, RPO/RTO, and incident
    response.
13. Commercial tenant model, pricing, data processing/portability/deletion,
    support, branding, and service levels.
