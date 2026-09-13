# PumpAxis Shift Close & Reconciliation — Business and Product Requirements

| Document attribute | Value |
| --- | --- |
| Product | **PumpAxis** — confirmed product name |
| Module | **Shift Close & Reconciliation** — recommended working name; final module name is a decision required |
| Document type | Combined Business Requirements Document (BRD) and Product Requirements Document (PRD) |
| Status | Draft for business and accountant validation; not an implementation specification |
| Intended readers | Petrol-pump owners, managers, attendants, accountants, designers, developers, QA teams, auditors, investors, and prospective business customers |
| Evidence basis | User's process description, supported by a handwritten example reviewed on 2026-09-06; uncertain handwriting is not treated as a rule |
| Data platform | The dedicated new PumpAxis Supabase project; never the existing personal `jayantgoyal` project |

See the [PumpAxis product boundary](README.md) and [Loyalty
requirements](loyalty-requirements.md). This module must reuse PumpAxis business,
location, customer, verified-phone, staff, role, notification, evidence,
approval, correction, and audit capabilities rather than creating parallel
identities or histories.

This document uses four labels:

- **Confirmed:** supplied or approved by the business owner.
- **Recommendation:** proposed behavior that requires business acceptance.
- **Assumption:** temporary interpretation used only to make the draft coherent.
- **Decision Required / Open Question:** implementation and accounting must not
  silently choose an answer.

Example numbers are illustrative only. They do not represent a real business
day, target, tolerance, price, or accounting policy.

## 1. Executive summary

PumpAxis Shift Close & Reconciliation will replace the owner's manual daily
notebook calculation with a mobile-first, auditable workflow. It records
cumulative dispenser/nozzle meter readings, testing adjustments, calculated
fuel sales, amounts for which an attendant is accountable, and an exact
allocation of that value across cash, digital payments, handoffs, newly issued
credit, approved expenses, and other configured destinations.

The module is not merely a form that reproduces a handwritten page. It separates
source facts, calculations, declarations, independent recipient attestations,
corrections, and approvals. If an attendant says that ₹50,000 was handed to an
owner, that entry remains a claim until the named recipient confirms, partially
confirms, or disputes the amount. Pending attestations and material variances
remain visible and prevent a report from appearing final.

The current outlet has two dispensing machines. Each has one petrol/MS nozzle
and one diesel/HSD nozzle, giving four nozzles. The design must support more
businesses, locations, machines, nozzles, shifts, products, payment methods,
and recipients without schema or workflow assumptions tied to the current four
nozzles.

The output is a structured reconciliation record plus a shareable PDF that
preserves the business meaning of the current left/right sheet. Structured
records remain authoritative. The PDF is a versioned rendering suitable for
WhatsApp sharing, not a substitute database or editable ledger.

## 2. Problem statement

The present manual process depends on handwritten cumulative readings,
calculations, payment totals, credit notes, and statements of who received cash.
This creates avoidable risks:

- opening and closing readings or calculations can be missing, transposed, or
  difficult to verify;
- the terms “stock” and “meter reading” may be mixed even though they represent
  different operational facts;
- a standard test quantity may be deducted without a distinct accountable
  adjustment record;
- direct rupee-meter differences and litre-at-price calculations may differ,
  with no agreed authoritative amount or tolerance;
- old credit recovery can be confused with new sales, and newly issued credit
  can be confused with cash collected;
- an attendant can state that value was handed to someone without independent
  confirmation from that recipient;
- payment methods and recipients may be compressed into handwritten initials;
- corrections can obscure original values;
- unresolved variance may be carried forward without clear ownership; and
- the owner spends time recreating calculations instead of reviewing exceptions.

The business needs a fast operational close that answers two questions with
traceable evidence: **How much value is the attendant accountable for?** and
**Where was all of that value allocated or disposed?**

## 3. Objectives and success outcomes

| Objective | Outcome | Primary measurement |
| --- | --- | --- |
| Replace manual calculation | System derives repeatable readings, adjustments, sales, and totals | Percentage of shifts closed digitally |
| Make value accountable | Every amount has a typed source and responsible actor | Unclassified value per shift |
| Verify handoffs | Recipient independently attests declared receipt | Confirmed/partially confirmed handoff rate |
| Separate credit events | New credit, old-credit recovery, and adjustments remain distinct | Credit reconciliation error rate |
| Surface variance | Left/right difference is explicit, thresholded, and reviewed | Variance rate and value; time to resolution |
| Preserve evidence | Original entries, corrections, approvals, and report versions are reconstructable | Audit completeness |
| Reduce owner effort | Owner reviews exceptions rather than rewriting the notebook | Median owner review time |
| Protect forecourt speed | Attendant entry is simple on a phone | Median and P95 entry/close time |
| Produce a trusted EOD record | PDF and structured report clearly disclose pending/unverified items | Finalization rate; report correction rate |

**Decision Required:** baselines, numeric targets, materiality thresholds, and
the pilot success standard are not yet confirmed.

## 4. Confirmed facts, assumptions, and terminology

### Confirmed facts

- The current petrol pump has two machines and four nozzles: one petrol/MS and
  one diesel/HSD nozzle per machine.
- Opening and closing cumulative readings are recorded in litres and rupees for
  each nozzle/product, with differences in litres and rupees.
- Daily testing commonly uses 5 litres, and that fuel is normally returned to
  the tank.
- The test quantity and its rupee equivalent at the applicable price are
  deducted from the gross meter difference to determine chargeable sales.
- The family prefers rupee-based daily sales rather than litre-only sales.
- The left side represents value for which the attendant is accountable.
- The right side explains where that value went or how it was allocated.
- Old credit/udhaar recovered today is not a new fuel sale and must not create
  new Loyalty progress.
- An attendant declares a handoff; the recipient independently attests it.
- The creator of a handoff cannot attest on behalf of the recipient.
- A finalized report is immutable; authorized reopening creates a new version.
- An organization can have multiple owners and one or more petrol-pump
  locations. Owners and managers see only the pumps for which they are
  authorized.
- Staff-to-pump assignment is many-to-many, time-bound, role-specific,
  auditable, revocable, and may be temporary.
- Reconciliation rolls up from an individual operator settlement to a shift,
  then a pump-day closure, then an organization summary.
- One operator may use multiple machines/nozzles; multiple operators may work in
  one shift; responsibility may transfer during a shift.
- Shared counter or digital-payment amounts need an explicit operator-allocation
  rule or must remain at shift level. They must never be silently duplicated
  across operator settlements.
- Customers belong primarily to an organization-scoped shared directory, while
  each transaction permanently retains pump, shift, operator, time, and
  machine/nozzle where applicable.

### Assumptions

- Each physical nozzle has cumulative litre and rupee counters available for
  manual entry. Whether every machine exposes a reliable rupee counter is an
  open question.
- A closure normally relates to one shift, and one or more approved shift
  closures may be consolidated into a business-date report.
- Products have configurable units, but fuel volume initially uses litres.
- Values are stored in paise and displayed in rupees.
- The selected shift/business date can differ from the timestamp when the shift
  crosses midnight.
- The business has an authorized owner, manager, or finance reviewer who can
  resolve material exceptions.

### Terminology requiring confirmation

The user has called the beginning and ending figures “opening stock” and
“closing stock.” The example appears to show cumulative machine/nozzle meter
readings, not physical fuel held in a tank. This document therefore uses:

- **opening meter reading:** cumulative nozzle counter at the start;
- **closing meter reading:** cumulative nozzle counter at the end;
- **meter difference:** closing counter less opening counter after any approved
  rollover/replacement handling; and
- **tank stock:** a separate physical inventory concept that is outside this
  module unless later approved.

**Decision Required:** the business and equipment operator must confirm the
meaning, source, reset/rollover behavior, and reliability of both litre and
rupee readings before implementation.

## 5. Scope and non-scope

### MVP scope

- configurable business, location, machine, nozzle, product, and payment-method
  setup;
- shift or daily-closure creation, assignment, autosaved draft, submission,
  review, approval, reopening, and finalization;
- opening/closing cumulative litre and rupee meter entry;
- deterministic difference, adjustment, sales, and variance calculations;
- distinct testing/own-use adjustments with audit evidence;
- accountable-value entries and allocation/disposition entries;
- configurable digital, card, cash, handoff, credit, expense, and other
  allocation types;
- new credit issuance, prior-credit recovery, partial recovery, outstanding
  balance, dispute, adjustment, and approved write-off;
- recipient handoff claims and Confirmed, Partially Confirmed, or Disputed
  attestations;
- owner/manager queues for missing data, pending attestations, mismatches,
  corrections, and unresolved credit;
- notifications and customer statements where applicable;
- immutable audit events, correction approvals, and report versions; and
- a WhatsApp-shareable EOD PDF marked accurately as preliminary or final.

### Explicit non-scope

- physical tank stock, dip charts, deliveries, evaporation, or inventory
  reconciliation;
- general ledger, double-entry accounting, tax filing, GST return preparation,
  payroll, supplier accounts, or statutory financial statements;
- dispenser control, automatic meter ingestion, or a full POS/billing system;
- bank settlement truth, payment-gateway settlement integration, or automatic
  cash counting;
- equipment maintenance, calibration scheduling, or fault repair;
- automatic OCR of handwritten sheets or receipts;
- biometric identity verification; and
- multi-business commercialization administration beyond preserving clean
  business boundaries.

### Future-module boundary

Accounting, inventory/tank stock, payroll, maintenance, and full POS are
separate future capabilities. This module may export or consume approved
references but must not silently become their system of record. The future
PumpAxis Accounts definition must decide which operational events become
accounting entries and which accounting system remains authoritative.

## 6. Personas

| Persona | Goals and responsibilities | Frustrations to prevent | Key journey |
| --- | --- | --- | --- |
| Attendant/salesman | Record readings, tests, credit, payment allocations, and handoff declarations for assigned work | Dense forms, repeated entry, seeing confidential histories, being blamed for unresolved recipient actions | Open shift → enter operations → declare allocations → submit → answer exceptions |
| Shift supervisor | Check completeness, authorize bounded exceptions, and keep close moving | Hidden missing readings, unclear ownership, broad access to finance data | Monitor → validate → resolve allowed issue → escalate |
| Owner/manager/recipient | Independently record or attest value received and approve a trustworthy close | Recreating arithmetic, false “handed over” claims, preliminary reports shown as final | Review dashboard → attest → inspect variance → approve/finalize |
| Accountant or finance manager | Confirm calculation/accounting treatment, credit balances, adjustments, and report consistency | Mixed sales/collections, ambiguous rupee authority, overwritten corrections | Review rules → reconcile exceptions → approve financial adjustments |
| Auditor/viewer | Reconstruct a shift, handoff, credit movement, correction, and final report | Mutable history, unclear report versions, excessive operational permissions | Select scope → trace sources → inspect attestations → export |
| Credit customer/primary account member | Receive credit notification, confirm/dispute purchase, pay outstanding, and view statement | Wrong balance, double-counted Loyalty, unrelated account exposure | Credit issued → notify → confirm → repay → receive allocation/statement |
| PumpAxis business administrator | Configure locations, equipment, products, methods, roles, and lifecycle access | Hard-coded pumps/providers, former staff access, ungoverned configuration | Configure → assign → monitor access → disable/review |

## 7. Roles and permission matrix

Legend: **C** create, **E** edit while allowed, **S** submit, **A**
approve/attest, **R** read, **O** own/assigned scope only, **B** business scope,
and **—** no access. Combined values inherit both action and scope.

| Capability | Attendant | Supervisor | Owner/manager/recipient | Accountant/finance | Auditor | Credit customer | Business admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View assigned shift | R-O | R location | R-B | R-B financial | R assigned | — | R-B |
| Enter readings/tests | C/E/S-O | C/E/S location | Exceptional C | — | R | — | Configure policy only |
| Declare allocations | C/E/S-O | C/E/S location | Own declarations | R | R | — | Configure types only |
| Create handoff claim | C/S-O | C/S location | C/S own | — | R | — | — |
| Attest handoff | — for own claim | Only if named recipient and not creator | A when named recipient | A when named recipient | — | — | Only if named recipient and not creator |
| Issue credit | C within limits | C/A within limits | A exceptions | A financial exceptions | R | Receive/confirm only | Configure limits |
| Record recovery | C with receipt allocation | C/A within limits | C/A if received | A correction/write-off | R | Confirm/view own | Configure policy |
| View customer history | Minimum active context | Case/location scope | Case/business scope | Financial account scope | Assigned read-only | Own account only | No implicit history |
| Correct submitted data | Request/propose | Propose/limited A | A within authority | A financial rules | — | Dispute own | Configure approval limits |
| Approve variance | — | A below assigned limit | A-B | A financial | — | — | Assign authority |
| Finalize/reopen report | — | Recommend | A-B | A if policy requires | R | — | Emergency A if explicitly assigned |
| Configure machines/products/methods | — | — | R | R price/account rules | R | — | C/E/A-B |
| View audit/evidence | Own submission events only | Operational/case scope | B as assigned | Financial scope | R assigned | Own notices/statements | Security/admin scope |

Mandatory separation rules:

- The handoff creator cannot attest that same handoff as recipient.
- A user cannot approve their own material correction or write-off.
- Attendants cannot finalize, erase, or silently reopen a closure.
- Former staff access is revoked while historical attribution remains.
- Ordinary staff see only the active/assigned operational context, not full
  customer, credit, recipient, evidence, or management history.

### Permission capability plus scope

Roles do not imply global access. Each grant includes one of these scopes:

| Scope | Example |
| --- | --- |
| Organization | Owner can view consolidated results for authorized organization |
| Selected pumps | Area manager or accountant can view named locations only |
| One pump | Pump manager supervises one location |
| Shift | Supervisor manages one assigned shift |
| Own records | Operator sees personal settlement, tasks, claims, errors, and permitted recent submissions |

An operator may see assigned pump, shift, machine/nozzle responsibility periods,
tasks, personal accountable amounts, own allocation entries, handoffs requiring
their action, validation errors, and allowed recent history. They do not
automatically see other operators' complete settlements, owner-wide or other
pump financials, confidential customer history, management risk flags,
manager-only adjustments, or sensitive reports.

## 8. Operating model and workflows

### 8.1 Configuration

1. An administrator creates the location, machines, nozzles, fuel products,
   effective prices, payment methods, staff assignments, recipients, limits,
   and tolerance policies.
2. Each nozzle belongs to one machine and carries one active product assignment
   for a defined effective period.
3. Configuration changes are effective-dated and audited so old reports remain
   reproducible.
4. A machine/nozzle can be suspended without deleting historical readings.

### 8.2 Open a shift

1. An assigned user creates or opens the unique shift/closure for the location
   and business date.
2. The system pre-fills the last accepted closing reading as the proposed next
   opening reading.
3. The attendant physically verifies and accepts or replaces each proposed
   opening reading.
4. A mismatch requires a reason and, depending on threshold, supervisor review.
5. The system records assignments for attendants and machines without assuming
   one attendant per machine.

### 8.3 Record operational activity

1. The app autosaves permitted draft entries with clear sync status.
2. Testing/own-use fuel is recorded against product and nozzle when it occurs,
   including whether it was returned to the tank.
3. Credit issuance, recovery, cash/value handoff, and other allocations are
   entered as distinct events rather than free-text arithmetic.
4. Evidence is optional unless a configured rule requires it.
5. Entries record performer and server time independently from business date.

### 8.4 Assign and hand over operator responsibility

1. Each operator settlement records effective start/end time and the machine,
   nozzle, task, or collection responsibility assigned during that interval.
2. A relief or replacement operator receives a time-bound temporary assignment.
3. A responsibility transfer records outgoing/incoming operators, affected
   equipment/tasks, effective time, readings or declared values when applicable,
   and both acknowledgements under configured policy.
4. Shared counters or collections are allocated through an explicit documented
   method; if a defensible allocation is unavailable, the value remains at shift
   level and is never copied into multiple operator totals.
5. Corrections preserve the original assignment/handover and require the normal
   post-submission approval path.

### 8.5 Close and calculate sales

```text
Opening readings + closing readings + price periods + adjustments
        → gross differences → adjusted differences
        → direct rupee result + litre-at-price result → variance
```

1. The attendant enters closing litre and rupee readings for every active
   assigned nozzle.
2. The system validates sequence, range, missing values, rollover/reset flags,
   and duplicate closures.
3. The system calculates every formula in Section 11 and shows source values.
4. The user cannot overwrite a calculated value; an authorized adjustment is a
   separate, reasoned record.

### 8.6 Build operator and higher-level reconciliations

```text
LEFT — amount accountable                    RIGHT — amount allocated/disposed
Adjusted fuel sales                          Digital/card/cash destinations
+ recovered prior credit                     + cash/value handoffs
+ approved other inflows/adjustments          + newly issued credit
                                               + approved expenses/other allocations
                          Difference = Left total - Right total
```

The screen prominently displays left total, right total, difference, tolerance,
and verification status. Each amount opens to its source records.

Each operator first completes their own smaller left/right settlement. The
system then rolls up without double counting:

```text
Operator settlements + explicitly shift-level shared amounts/adjustments
    → shift reconciliation
    → all shifts for one pump business date
    → pump daily closure
    → all authorized pumps
    → organization summary
```

The owner dashboard drills down organization → pump → day → shift → operator.
Higher levels retain lower-level status and cannot hide a pending attestation,
unresolved material variance, or missing settlement.

### 8.7 Handoff attestation

1. The sender selects the recipient and declares amount, method, time, note,
   and optional evidence.
2. PumpAxis creates a Pending handoff claim and notifies the recipient.
3. The recipient independently selects Confirmed, Partially Confirmed, or
   Disputed and records actual amount received, time, note, and optional evidence.
4. A partial confirmation creates an explicit confirmed amount and disputed or
   pending remainder; it does not silently rewrite the sender's claim.
5. Multiple handoffs and multiple recipients are allowed.
6. Unconfirmed or disputed material amounts keep the closure Awaiting
   Attestation or Variance Requires Review.

### 8.8 Credit issuance and recovery

1. The attendant selects an existing PumpAxis customer/account or performs
   lightweight phone-first creation with name and phone.
2. Phone verification follows shared PumpAxis rules. If immediate verification
   is impossible, the credit stays in a configured provisional/pending state
   with limits and follow-up; it must not appear fully verified.
3. Credit issuance records customer/account, actual receiver, vehicle where
   relevant, product, quantity, amount, bill/reference, issuer, server time,
   business date, due date/terms if used, and optional evidence.
4. Recovery references one or more outstanding credit items and records each
   payment allocation. Partial recovery leaves an explainable balance.
5. A recovery can be split across cash, digital, card, or other configured
   methods.
6. Adjustments and write-offs require reasons and approval; disputes do not
   delete the original obligation.

### 8.9 Submit, review, and finalize

1. Submission freezes the attendant's entered snapshot and runs completeness,
   calculation, duplicate, attestation, and variance checks.
2. Pending attestations produce a **Preliminary — Pending Verification** report.
3. A difference outside tolerance produces **Variance Requires Review**.
4. Authorized reviewers accept, reject, correct through versioned events, or
   return the closure for information.
5. Finalization requires the configured approvals, resolved material variance,
   and required attestations.
6. Reopening a finalized report requires authority and reason and produces a
   new report version linked to the prior finalized version.

### 8.10 Weak or unavailable internet

1. Permitted entries are saved as encrypted local drafts with device-generated
   idempotency keys.
2. Offline UI must never imply server submission, recipient attestation,
   settlement receipt, or finalization.
3. On reconnect, the server validates uniqueness, authorization, effective
   price/configuration, sequence, and conflicts.
4. Conflicts remain reviewable; the client does not resolve them by last-write
   wins.

## 9. State models

### Shift/closure and EOD report state

```text
Draft → Submitted → Awaiting Attestation ─┐
                  └→ Variance Requires Review ─→ Approved → Finalized
Submitted ─────────────────────────────────────→ Approved
Finalized → Reopened → Submitted/Review → Approved → Finalized (new version)
```

| State | Meaning | Exit requirements |
| --- | --- | --- |
| Draft | Operational entry remains editable by permitted actors | Required submission fields and server validation |
| Submitted | Attendant snapshot is frozen for review | Attestation/variance checks determine next state |
| Awaiting Attestation | Required handoff or recipient confirmation remains pending | Required attestations complete or authorized exception |
| Balanced | Left/right difference is within approved tolerance and no material blocker remains | Required approval; this may be a derived status rather than separate workflow state |
| Variance Requires Review | Difference, missing fact, or disputed allocation exceeds policy | Reasoned correction, exception approval, or rejection |
| Approved | Required reviewers accept the closure version | Finalization checks and report generation |
| Reopened | A finalized version was reopened by authority with reason | New corrected version must pass submission/review again |
| Finalized | Immutable authoritative closure/report version | Only authorized reopening creates a successor version |

**Decision Required:** whether Balanced is persisted as a state or shown as a
calculated condition alongside Submitted/Approved.

### Reconciliation hierarchy

| Level | Source | Owner/reviewer | Roll-up rule |
| --- | --- | --- | --- |
| Operator settlement | Personally attributable readings/sales, inflows, and allocations | Operator submits; supervisor reviews | Shared values included only through explicit allocation |
| Shift reconciliation | Operator settlements plus shift-level counters, shared payments, and supervisor adjustments | Shift supervisor/manager | Preserves every operator status and shift-level exception |
| Pump daily closure | All shifts assigned to one pump business date | Pump manager/owner/finance | Cannot present Finalized while required shift remains unresolved unless an approved exception is disclosed |
| Organization summary | Authorized pump-day closures | Owner/organization finance | Consolidated read model; does not alter source closures |

### Handoff state

```text
Draft → Pending Recipient → Confirmed
                         ├→ Partially Confirmed → Pending/Disputed remainder
                         ├→ Disputed → Under Review → Resolved
                         └→ Cancelled/Corrected through approval
```

Sender declarations and recipient attestations remain separate immutable facts.

### Credit state

| State | Meaning |
| --- | --- |
| Provisional | Customer/contact or authority is not fully verified within allowed policy |
| Issued | Approved receivable created from a sale |
| Partially Recovered | Some amount allocated to the receivable |
| Recovered | Outstanding amount is zero through valid recovery/adjustment |
| Disputed | Customer or business challenges the obligation or allocation |
| Adjusted | Approved correction changed the balance with traceable reason |
| Written Off | Authorized approval removed recoverable balance without recording it as payment |
| Cancelled/Reversed | Source sale was validly cancelled or reversed under policy |

## 10. Functional requirements

| ID | Requirement |
| --- | --- |
| FR-CFG-01 | Administrators must configure any number of locations, machines, nozzles, products, price periods, payment methods, and recipients without code changes. |
| FR-CFG-02 | Machine, nozzle, product assignment, and price changes must be effective-dated and historically reproducible. |
| FR-ORG-01 | The system must support multiple isolated organizations, multiple owners per organization, and multiple pump locations per organization. |
| FR-ORG-02 | Organization membership, ownership/access grants, and pump assignments must be time-bound, role/capability-scoped, auditable, and revocable. |
| FR-ORG-03 | Customers must be organization-scoped and usable at participating pumps while every transaction retains exact pump/shift/operator/equipment context. |
| FR-OPS-01 | Every operator must have an individual settlement with effective work period, assignments, personally accountable sources, allocations, variance, declarations, evidence, and attestations. |
| FR-OPS-02 | Responsibility transfers and temporary/relief assignments must preserve effective periods and actor acknowledgements. |
| FR-OPS-03 | Shared counters/collections must have an explicit allocation rule or remain shift-level; roll-up must never double-count them. |
| FR-ROLL-01 | The system must reconcile and drill down operator → shift → pump-day → organization while preserving lower-level exceptions. |
| FR-SHF-01 | The system must create a unique closure for business, location, shift/business date, and configured sequence. |
| FR-SHF-02 | Multiple attendants may be assigned to one machine and one attendant may operate multiple machines. |
| FR-MTR-01 | Users must record opening and closing cumulative litre and rupee readings per nozzle with actor and server time. |
| FR-MTR-02 | The system must propose the last accepted closing reading as the next opening and require explanation for mismatch. |
| FR-MTR-03 | Reset, rollover, replacement, and fault handling must preserve raw readings and an approved normalization event. |
| FR-TST-01 | Testing/own-use must be a distinct adjustment with product, nozzle, quantity, price basis, amount, reason, performer, server time, return-to-tank status, and optional evidence. |
| FR-CAL-01 | The system must calculate gross and adjusted litre/rupee differences, litre-at-price sale, direct rupee-meter sale, and variance without allowing silent overwrite. |
| FR-CAL-02 | Calculation rules, units, precisions, rounding, tolerance, and chosen authoritative value must be versioned. |
| FR-PRC-01 | MVP must support a default single effective daily price and preserve a model for multiple effective price periods within a shift. |
| FR-REC-01 | The system must calculate left/accountable total, right/allocation total, signed difference, absolute difference, and tolerance result. |
| FR-REC-02 | Every left/right entry must have a configured type, source or reason, actor, time, and amount. |
| FR-PAY-01 | Payment/allocation methods must be configurable and not hard-coded to Paytm or PhonePe. |
| FR-HOF-01 | A handoff must name sender, recipient, claimed amount, status, times, and optional note/evidence. |
| FR-HOF-02 | The handoff creator must not attest for the recipient. |
| FR-HOF-03 | Recipient response must support Confirmed, Partially Confirmed, and Disputed with actual received amount. |
| FR-HOF-04 | The system must support multiple handoffs, recipients, delayed response, partial amounts, rejection, correction, and escalation. |
| FR-CRD-01 | Credit issuance and recovery must be separate event types and must not be counted as each other. |
| FR-CRD-02 | Lightweight credit-customer creation must reuse shared phone-first identity and clearly label unverified/provisional status. |
| FR-CRD-03 | The system must support issued, recovered, partial recovery, outstanding, adjusted, disputed, cancelled/reversed, and approved written-off credit. |
| FR-CRD-04 | Recovery allocations must support one payment across multiple receivables and one receivable across multiple payment methods. |
| FR-LOY-01 | A configurable rule must decide when a credit purchase contributes to Loyalty, and recovery must never double-count the originating purchase. |
| FR-ATT-01 | Required evidence/attachments must reuse protected PumpAxis evidence storage and case-scoped access logging. |
| FR-COR-01 | Post-submission correction must require a reason, preserve original values, identify proposer/approver, and recalculate dependent totals. |
| FR-RPT-01 | The system must generate a versioned EOD PDF with the content and verification labels in Section 17. |
| FR-RPT-02 | A report with pending required attestation or unresolved material variance must not display Finalized. |
| FR-RPT-03 | Finalized report versions must be immutable; reopening requires authorization and reason. |
| FR-NOT-01 | The system must notify named recipients of handoff claims and relevant credit customers of issuance, recovery, adjustment, dispute, and statement events. |
| FR-AUD-01 | Sensitive reads and all configuration, submission, attestation, correction, approval, reopening, and finalization actions must produce immutable audit events. |
| FR-OFF-01 | Offline drafts and synchronization must be idempotent and must not imply server acceptance. |
| FR-SEC-01 | Server/database authorization must enforce business, location, shift, role, relationship, and action-specific limits. |

## 11. Calculations and accounting model

### 11.1 Per-nozzle source values

For nozzle `n` and an uncomplicated interval with no reset or rollover:

```text
gross_litres[n] = closing_litre_reading[n] - opening_litre_reading[n]
gross_rupees[n] = closing_rupee_reading[n] - opening_rupee_reading[n]

returned_test_litres[n] = sum(test quantities explicitly marked returned)
test_amount[n] = sum(test quantity × applicable effective price)

adjusted_litres[n] = gross_litres[n] - returned_test_litres[n]
direct_adjusted_rupees[n] = gross_rupees[n] - test_amount[n]
```

Fuel that was tested but not returned must remain an explicit disposal/own-use
event. It must not automatically use the same chargeable-sales deduction as
returned test fuel. The business/accountant must confirm its treatment.

### 11.2 Litre-at-price calculation

With one effective price for the interval:

```text
calculated_sale_rupees[n] = adjusted_litres[n] × unit_price[n]
```

With price periods later:

```text
calculated_sale_rupees[n] =
  sum(adjusted_litres attributed to price period p × unit_price[p])
```

A mid-shift price change cannot be calculated accurately from only one opening
and one closing litre reading unless an intermediate reading, reliable
transaction detail, or approved allocation method identifies litres before and
after the price change. MVP may default to one daily price, but configuration
must not overwrite history and the UI must flag a shift spanning multiple price
periods when required intermediate data is absent.

### 11.3 Rupee-versus-litre variance

```text
meter_price_variance[n] =
  direct_adjusted_rupees[n] - calculated_sale_rupees[n]

absolute_meter_price_variance[n] = abs(meter_price_variance[n])
```

Both source calculations must remain visible. **Decision Required:** select the
authoritative sale amount, allowed absolute/percentage tolerance, escalation,
and whether the choice can vary by equipment/product/location.

### 11.4 Recommended left/right model

The following model is a recommendation for accountant review:

```text
total_accountable =
  authoritative_adjusted_fuel_sales
  + prior_credit_recoveries_received_this_closure
  + other_approved_accountable_inflows
  +/- approved_accountable_adjustments

total_allocated =
  cash_still_held
  + digital/card/other payment allocations
  + cash/value handoffs
  + new_credit_issued_from_current_sales
  + approved expenses or own-use dispositions
  + other approved allocations

reconciliation_difference = total_accountable - total_allocated
is_within_tolerance = abs(reconciliation_difference) <= approved_tolerance
```

Why this model is coherent:

- adjusted fuel sales include current fuel value regardless of whether the
  customer paid now or received new credit;
- new credit is therefore an allocation of current accountable sale value on
  the right, not additional sale value;
- recovery of old credit is a new accountable inflow today but not a new fuel
  sale; and
- the cash/digital/handoff destination of that recovery also appears on the
  right so value still balances.

**Decision Required:** the business accountant must confirm this treatment,
including expenses, own use, shortages/overages, taxes, discounts, customer
advances, bad-debt write-offs, and whether any category is reported outside the
operational reconciliation.

### 11.5 Illustrative example only

Assume one nozzle has:

| Input | Illustrative value |
| --- | ---: |
| Opening litre meter | 100,000.000 L |
| Closing litre meter | 100,480.000 L |
| Gross litre difference | 480.000 L |
| Returned test fuel | 5.000 L |
| Applicable price | ₹100.00/L |
| Adjusted litre difference | 475.000 L |
| Calculated litre-at-price sale | ₹47,500.00 |
| Gross rupee-meter difference | ₹48,020.00 |
| Test amount | ₹500.00 |
| Direct adjusted rupee-meter result | ₹47,520.00 |
| Meter/price variance | +₹20.00 |

If the illustrative policy chooses ₹47,500.00 as authoritative, old credit of
₹5,000.00 is recovered, and there are no other inflows:

```text
Left/accountable = ₹47,500.00 + ₹5,000.00 = ₹52,500.00

Right/allocated =
  ₹20,000.00 digital
  + ₹10,000.00 cash held
  + ₹12,500.00 independently confirmed handoff
  + ₹10,000.00 new credit issued
  = ₹52,500.00

Difference = ₹0.00
```

This example does not approve ₹20 tolerance, the authoritative calculation, or
any accounting classification.

### 11.6 Precision and rounding

- **Recommendation:** store money as integer paise and never binary floating
  point.
- **Recommendation:** store litres as fixed-decimal values with equipment-based
  precision of at least three decimal places until confirmed.
- Preserve raw readings at their captured precision.
- Apply configured rounding at defined output boundaries, not repeatedly across
  intermediate values.
- Sum unrounded line calculations where policy requires it, then round the
  approved final boundary consistently.
- PDF display precision must not change stored values or hide a material
  difference.

**Decision Required:** litre precision, currency rounding mode, per-line versus
per-total rounding, tolerance basis, and treatment of fractions of a paise.

## 12. Business and validation rules

### Meter readings

- Closing must normally be greater than or equal to opening.
- Previous accepted close is proposed as the next open, but physical verification
  is mandatory.
- Negative or implausible differences block submission unless a reset,
  replacement, rollover, or correction workflow explains them.
- Readings always retain nozzle, product assignment, device/source, performer,
  server time, business date, and raw value.
- Meter reset/rollover normalization requires equipment-specific facts and
  approval; no generic maximum counter is assumed.

### Testing/own-use

- Five litres is a common default, not a hard-coded rule.
- Every adjustment records actual quantity and applicable effective price.
- Returned-to-tank and not-returned outcomes are distinct.
- Multiple tests in one shift are supported.
- Evidence requirements are risk/configuration based.

### Reconciliation

- Every amount has a typed source and may not exist only as an unlabeled total.
- Payment providers are business-configurable.
- Zero variance does not prove correctness if source entries or attestations are
  missing.
- A within-tolerance variance may still require explanation depending on policy.
- Pending digital settlement and confirmed provider receipt must be distinguishable.
- Unresolved material variance prevents finalization.

### Credit

- Credit issuance, recovery, adjustment, write-off, cancellation, and reversal
  are separate immutable events.
- Recovery must reference the credit account and allocation basis; it is never
  new sale value or new Loyalty progress.
- A recovery exceeding selected outstanding items is rejected or routed to an
  approved advance/unallocated-receipt workflow; it is not silently over-applied.
- A write-off requires separate authority and is not recorded as payment.
- Customer-facing balance and statements must explain original amount,
  recoveries, adjustments, disputes, and outstanding value.

### Corrections and approvals

- Draft fields may be edited by permitted actors until submission.
- Submitted facts are corrected through an append-only request and approval,
  preserving before/after values and recalculating all dependencies.
- Materiality and two-person approval rules are configurable.
- A finalized report can only be changed by authorized reopening and a new
  report version.

## 13. Cross-module integration with Loyalty

### Shared capabilities

The modules reuse:

- business and petrol-pump location;
- staff identity, role, permission, device/session, and location assignment;
- customer, stable internal customer ID, verified phone history, primary
  account, group member, and vehicle;
- notification delivery and secure links;
- consent, evidence/attachment storage, corrections/approvals, disputes, and
  audit events; and
- a common product/business timezone and money/unit configuration.

### Ownership and event flow

| Fact or rule | Authoritative owner | Consumer behavior |
| --- | --- | --- |
| Customer/contact/account authorization | Shared PumpAxis capability | Both modules reference the same stable IDs and access decisions |
| Fuel sale operational calculation | Shift Close & Reconciliation | Loyalty may consume an eligible confirmed purchase event, never recalculate meter sales |
| Loyalty scheme eligibility/progress/reward | Loyalty | Reconciliation displays reference/status only when needed; it does not award benefits |
| Credit receivable and recovery | Shift Close & Reconciliation | Loyalty applies the configured earning trigger and ignores recovery as new purchase |
| Evidence metadata and access control | Shared PumpAxis capability | Purpose/case links identify which module may use it |
| Correction/reversal | Source module plus shared approval/audit | Idempotent downstream compensating event; never destructive overwrite |

### Credit-to-Loyalty decision

Supported configurable choices are:

1. earn when the credit sale is Confirmed;
2. earn only as qualifying payment is recovered; or
3. do not earn on credit sales.

The selected scheme rule must carry a stable source-event key so issue,
recovery, correction, and retries cannot double-count. **Decision Required:**
which choice applies per scheme and whether partial recovery earns pro rata.

## 14. Conceptual data model

This is not SQL. Physical schemas, indexes, constraints, RLS policies, storage,
and migrations require a later technical design in the dedicated PumpAxis
Supabase project.

| Entity | Shared with Loyalty? | Purpose and essential fields | Relationships and lifecycle authority |
| --- | --- | --- | --- |
| Organization (`Business`) | Yes | Tenant/organization ID, legal/display name, status, timezone, locale, settings | Parent of pumps, people, customers, schemes; strictly isolated from other organizations |
| Organization membership | Yes/core | Organization, person/user, member type, effective period, status | Identifies owner/admin/staff/customer association; does not itself grant unrestricted access |
| Ownership/access grant | Yes/core | Organization membership, capability/role, scope type and IDs, limits, effective/expiry time, grantor/status | Gives organization, selected-pump, pump, shift, or own-record scope; authorized admin manages and audit records every change |
| Pump location | Yes | Location ID, organization ID, name, timezone, address/status | Parent of equipment and closures; admin manages; assigned staff see minimum |
| Staff assignment | Yes/core | Staff, pump(s), role/capabilities, effective start/end, shift restriction, status | Many-to-many organization/pump assignment; revocable; historical transactions retain actor |
| Temporary assignment | Yes/core | Staff, temporary pump/shift/task scope, start/end, approver, reason/status | Relief/cross-pump authority; expires automatically and remains auditable |
| Pump configuration | Yes/core | Pump, business-day rules, allowed products/methods, tolerances, numbering, closure policy/version | Supplies location-specific behavior without leaking to another pump |
| Pump participation in scheme | Yes/Loyalty-owned | Scheme, pump, effective period, contribution/redeem flags, status | Loyalty owns; permits organization-wide or selected-pump participation |
| Pump payment account | No/possible shared cash module | Pump, method/provider, protected account ref, effective period, settlement behavior/status | Allocation target and provider reconciliation source; finance/admin manages |
| Dispenser/machine | No | ID, location, label/code, manufacturer/model if known, status, effective dates | Has nozzles; admin configures; never deleted from history |
| Nozzle | No | ID, machine, label/code, counter capabilities/precision, status, effective dates | Has product assignments/readings; admin configures |
| Fuel product | Potential shared reference | ID, business/product code, name (such as MS/HSD), unit, status | Used by nozzle assignment, price, sale, credit, and Loyalty eligibility |
| Product price and effective period | Potential shared reference | Product/location, price in paise per unit, effective from/to, source, approver | Used by calculations; authorized admin/finance creates; immutable after use except correction version |
| Shift or daily closure | No | ID, business/location, business date, start/end, shift label, status, version, assigned staff, submission/finalization times | Parent of readings, entries, variance, reports; attendant submits; authorized reviewer finalizes |
| Operator settlement | No | ID, organization/pump/shift/operator, effective work period, assignment/handover refs, left/right totals, variance, status, declaration/time | Child of shift; aggregates only attributable entries; operator submits, supervisor reviews |
| Operator responsibility period | No | Operator, machine/nozzle/task, start/end, assignment type, outgoing/incoming acknowledgement, rule | Allocates responsibility over time; supports relief and handover without one-to-one operator/machine assumption |
| Opening and closing meter readings | No | ID, closure/nozzle, kind, litres, rupees, raw precision, actor, server time, source, exception | Pair produces differences; submitted correction requires approval |
| Testing/own-use adjustment | No | ID, closure/nozzle/product, type, quantity, price basis, amount, returned flag, reason, performer/time, evidence ref | Adjusts calculated sale under policy; supervisor/manager approves exception |
| Calculated nozzle sale | No | ID, closure/nozzle, gross/adjusted litres and rupees, litre-price result, direct-meter result, variance, rule/version, authoritative amount/status | Derived and reproducible; system creates; finance approves rule, not manual overwrite |
| Accountable/left-side entry | No | ID, closure, type, source ref, amount, currency, actor/time, adjustment/approval refs | Contributes to left total; source may be sale, recovery, or approved inflow |
| Allocation/right-side entry | No | ID, closure, type, payment method/recipient/credit/expense ref, amount, status, actor/time | Contributes to right total; may require settlement or attestation |
| Payment method | No | ID, business, type, display name, provider/account reference token, status, settlement behavior | Business-configurable; admin manages; sensitive account values protected |
| Credit account | Uses shared customer/account | ID, business, PumpAxis customer/primary-account ref, status, terms/limit, outstanding balance/version | Has credit events; customer views own; finance approves terms/write-offs |
| Credit transaction | Integrates with Loyalty | ID, credit account, type, source sale/bill, actual receiver, vehicle, product/quantity/amount, issuer, business/server time, due terms, status, evidence | Issuance/recovery/adjustment/write-off events; downstream Loyalty key prevents duplicate progress |
| Credit recovery allocation | No | ID, recovery event, receivable/credit transaction, payment allocation, applied amount, status | Many-to-many allocation between receipts and receivables; finance resolves over/under allocation |
| Cash/value handoff | No | ID, closure, sender, recipient, claimed amount, method, claim time, status, note/evidence | Has one or more immutable attestation events; sender cannot attest as recipient |
| Attestation | Shared pattern | ID, subject/handoff, attestor, response, actual amount, server time, note/evidence, supersession/correction ref | Recipient creates; manager resolves dispute; never overwrites declaration |
| Reconciliation variance | No | ID, closure, left/right totals, signed/absolute difference, tolerance rule/version, status, explanation, reviewer | System calculates; authorized manager/accountant resolves or approves within policy |
| Evidence/attachment | Yes | Protected object ref, purpose, subject ref, actor, server time, hash, MIME/size, retention/access class | Reuses shared private evidence service; case-scoped access is audited |
| EOD report and report version | No | Report ID, closure(s), version, status/verification label, generated time/by, data snapshot/hash, PDF object ref, prior version | System renders; reviewer finalizes; reopened report produces successor version |
| Approval/correction | Yes | Subject, before/after or proposed change, reason, proposer, approver, status, effective time | Shared immutable approval pattern; self-approval restricted by policy |
| Notification | Yes | Recipient/contact, event/template/version, channel, status, provider result, secure-link ref | Shared delivery service; module supplies purpose-limited payload |
| Audit event | Yes | Actor/role, action, target, server time, result, reason, correlation, protected change summary | System-only append; scoped owner/auditor read; no business user alteration |

Recommended supporting entities include nozzle-product assignment, staff-shift
assignment, reconciliation rule/version, settlement/provider status event,
dispute/case, and report-share event. These are conceptual refinements, not
permission to create SQL now.

## 15. Notifications and customer statements

| Event | Recipient | Minimum content |
| --- | --- | --- |
| Handoff claimed | Named recipient | Sender, claimed amount, location, closure/shift, time, secure attest action |
| Handoff partially confirmed/disputed | Sender and authorized manager | Claimed and actual amount, status, case link, no unrelated financial history |
| Handoff reminder/escalation | Recipient and then assigned manager | Pending amount, age, action link, escalation status |
| Credit issued | Credit customer/primary account and manager as configured | Location, bill, product/quantity/amount, receiver/vehicle, terms, outstanding, confirm/dispute link |
| Credit recovered | Customer/primary account | Amount received, method-safe description, allocations, remaining balance, reference |
| Credit adjusted/written off/disputed | Customer and authorized finance/manager | Before/after balance, reason category, effective time, case/reference |
| Closure submitted/preliminary | Owner/manager/reviewer | Location, shift/date, totals, variance, pending attestations, status |
| Closure finalized/reopened | Authorized recipients | Version, status, totals, approvers, reason for reopening where applicable, PDF link |

Secure-link, phone privacy, delivery tracking, retry, consent, and template rules
reuse Loyalty's shared PumpAxis notification requirements. PDF links must be
authorized and expiring rather than permanent public object URLs.

## 16. Audit, security, and evidence controls

- Audit configuration changes, opening/closing readings, tests, offline sync,
  submissions, payment entries, handoffs, attestations, customer/credit changes,
  corrections, approvals, variance dispositions, report generation/sharing,
  reopening, finalization, exports, and sensitive reads.
- Record actor, effective role, assigned scope, subject, server time, correlation
  ID, outcome, reason, device/session context, and protected change summary.
- The new PumpAxis Supabase project must enforce business/location/role scope at
  server and database layers. No personal-project reference, key, storage bucket,
  schema, migration, or data is reused.
- Customer phone and evidence handling follows the shared progressive identity,
  masking, consent, retention, and access-log rules.
- Photograph capture is optional for a lightweight credit customer unless a
  configured risk rule requires it. No attendant receives unrestricted access
  to prior photographs.
- Evidence supports a claim; it does not replace meter, bill, payment-provider,
  recipient, or accounting verification.
- Finalized data snapshots and PDFs should carry an integrity hash and version;
  the report viewer must disclose later supersession.
- Lost/replaced devices and departed staff require session/device revocation,
  open-draft/case reassignment, and preservation of historical attribution.

**Decision Required:** retention by record type, legal basis, step-up rules,
device management, export access, and report-signature requirements.

## 17. EOD PDF specification

### Required content

1. PumpAxis/product label, business, location, business date, shift(s), report
   ID/version, generation time, and verification status.
2. Machine/nozzle table with product, opening/closing litre and rupee readings,
   gross differences, testing/own-use adjustment, adjusted differences,
   applicable price/periods, litre-at-price value, direct rupee-meter value,
   variance, and authoritative value indicator.
3. Product-level gross and adjusted sales totals.
4. Left/accountable entries grouped by adjusted sale, old-credit recovery, other
   inflow, and adjustment.
5. Right/allocation entries grouped by configurable digital/card methods, cash
   held, cash/value handoffs, new credit, approved expenses, and other types.
6. Left total, right total, signed difference, absolute difference, tolerance,
   and variance status.
7. Handoff claims with sender, recipient, claimed amount, actual attested amount,
   state, and attestation time; no sensitive evidence content embedded by default.
8. Credit issued, recovered, partially recovered, disputed, adjusted, and
   outstanding summary with appropriate customer masking.
9. Missing readings, pending digital settlements, pending/disputed attestations,
   unresolved credit/cases, and material correction notes.
10. Preparer(s), submitter, reviewers, approvers, server timestamps, and report
    lifecycle status.
11. A footer stating that structured PumpAxis records are authoritative and
    identifying superseded versions where applicable.
12. Operator-settlement summaries with effective work periods, assigned
    equipment/tasks, left/right totals, variance, and verification status, plus
    drill-down references where the delivery channel permits.

The owner dashboard must offer organization consolidation and pump-by-pump
comparison, with drill-down to pump day, shift, and operator. It must also show
per-pump and consolidated credit exposure, Loyalty activity, expenses, stock
variance when the future Wet Stock module exists, payment reconciliation,
pending attestations, and alerts without implying unavailable modules are live.

### Status presentation

- **Preliminary — Draft:** incomplete and not submitted.
- **Preliminary — Pending Verification:** submitted with pending required
  attestation, settlement, reading, or review.
- **Variance Requires Review:** difference is outside tolerance or otherwise
  materially unresolved.
- **Approved:** reviewers approved this version but finalization may still be in
  progress.
- **Finalized:** immutable version satisfying policy.
- **Superseded:** a later authorized finalized version exists.

The visual design should preserve the easy comparison of left and right totals
without imitating handwriting. Use readable tables, large totals, explicit
variance, status color plus text/icon (never color alone), page numbers, and
continuation headers. Optimize file size for WhatsApp while maintaining legible
numeric detail. **Decision Required:** page size, languages, branding, signature
fields, QR verification link, masking level, and maximum file size.

## 18. Edge cases and exception handling

| Scenario | Required behavior |
| --- | --- |
| Previous close differs from next open | Show proposed and entered values; require reason and threshold-based approval; never rewrite prior close |
| Meter rollover | Preserve raw values, apply equipment-specific approved rollover rule, and label normalized difference |
| Meter replacement/reset | Close old meter lifecycle, capture replacement reference/readings/evidence, and begin new effective meter; manager approval required |
| Faulty or unreadable meter | Mark missing/fault, capture reason/evidence, prevent normal finalization until approved estimation/correction policy is applied |
| Negative/impossible difference | Block normal submission and route to reset, data correction, or manager review |
| Mid-shift price change | Require intermediate reading or reliable transaction allocation; otherwise flag calculation ambiguity and prevent false precision |
| Testing differs from 5 L | Record actual quantity; configured threshold may require reason/approval |
| Test fuel not returned | Record separate own-use/disposal outcome; do not apply returned-test deduction automatically |
| Missing reading or offline entry | Keep draft/preliminary, expose sync state, and apply server validation on reconnect |
| Duplicate shift/closure | Use unique business/location/date/sequence and idempotency; open existing record or require authorized exception |
| Multiple attendants on one machine | Attribute each operational event to actor; shift retains all assignments |
| One attendant across machines | Allow assigned scope; summarize responsibility by person and machine without duplication |
| Responsibility changes mid-shift | Effective-dated handover; capture boundary reading/value when available; unresolved shared amount stays shift-level |
| Shared digital counter across operators | Apply approved allocation method or retain at shift level; never duplicate full total into every operator settlement |
| Operator begins/ends at different time | Use personal responsibility period, not full shift duration, for attribution |
| Relief operator | Create expiring temporary assignment and handover; no inherited permanent pump access |
| Cross-pump staff work | Require explicit effective assignment at destination pump and preserve originating organization/pump scope |
| Provider total differs from declaration | Preserve both values/statuses, calculate provider variance, and route material difference to review |
| Digital settlement arrives later | Mark pending settlement separately; update via attributable event and regenerate report version if policy requires |
| Partial cash handoff | Recipient records actual amount; remainder stays pending/disputed and visible in reconciliation |
| Recipient disputes amount | Freeze claim/attestation facts, open case, notify reviewer, and prevent material finalization |
| New credit customer cannot verify phone | Create provisional limited record if policy permits; notify later, cap exposure, and block sensitive self-service until verified |
| Credit repayment split across methods | Create one recovery with multiple payment allocations and explicit receivable applications |
| Returned/cancelled sale | Create reversal/correction event, recalculate accountable total, credit, and Loyalty projection without deleting original |
| Reopened finalized day | Require authority/reason, retain prior report as superseded, recompute dependencies, and issue versioned PDF |
| Shift crosses midnight | Keep start/end timestamps and explicit business date; apply price periods/timezone; do not split silently |
| Multiple shifts in daily report | Preserve each approved shift subtotal and attestation status; daily consolidation cannot hide an unresolved shift |
| Payment entered twice | Idempotency and duplicate-reference review prevent double allocation |
| Cash is transferred through several people | Model separate linked handoffs; every recipient attests their own receipt |
| Recipient has no PumpAxis staff account | Decision-required controlled external-recipient verification; sender cannot self-confirm |
| Credit recovery has no matching balance | Reject or place in unallocated/advance review; never count as sale |
| Closure appears balanced but data is missing | Keep preliminary/review status; arithmetic equality alone is insufficient |

## 19. Non-functional and UX requirements

| Area | Requirement or recommended target |
| --- | --- |
| Mobile-first entry | Large numeric fields, numeric keyboard, clear units/currency, minimal scrolling, accessible targets, product/nozzle grouping, and visible save state |
| Defaults | Pre-fill last accepted readings, common test quantity, assignments, and active price only when source/effective period is clear; users must confirm critical values |
| Validation | Validate locally for immediate feedback and again authoritatively on the server |
| Draft resilience | Autosave drafts and recover after interruption; never merge conflicting edits silently |
| Performance | Recommended target: normal field save acknowledgement under 2 seconds online and closure calculation under 3 seconds at P95, excluding external providers |
| Availability | Recommended core monthly target 99.9%; contractual SLA remains a decision required |
| Accuracy | Deterministic decimal arithmetic, versioned rules, reproducible totals, idempotent event processing, and test vectors for every formula boundary |
| Accessibility | Target WCAG 2.2 AA for web surfaces; high contrast, clear error association, non-color status cues, and language-friendly layouts |
| Localization | Support configurable language, Indian number/date formatting, product aliases such as petrol/MS and diesel/HSD, and timezone-aware business dates |
| Security/privacy | Least privilege, encryption, private evidence/report storage, expiring links, rate limits, session revocation, and audited exports |
| Observability | Monitor missing readings, sync failures, duplicate attempts, calculation errors, pending attestation age, variance, report generation, and notification delivery |
| Recovery | Backup/restore tests and approved RPO/RTO are required before production; exact targets are decisions required |

## 20. MVP and later phases

### MVP

- Single operating business with one or a small number of configured locations.
- Configurable machines, nozzles, MS/HSD or other products, one default daily
  price per product/location, and payment/allocation methods.
- Shift opening/closing meter entry in litres and rupees.
- Testing adjustment with actual quantity, price, return status, reason, and
  optional evidence.
- Both direct rupee-meter and litre-at-price values, visible variance, and a
  configured authoritative-value choice after accountant approval.
- Left/right reconciliation with cash, configurable digital/card methods,
  handoffs, new credit, prior-credit recovery, expense/other approved entries.
- Split-entry recipient attestation and manager exception queues.
- Lightweight shared PumpAxis customer/phone flow for credit, credit statement,
  partial recovery, adjustment, dispute, and approved write-off.
- Draft/submission/approval/finalization/reopening with immutable audit and PDF
  versions.
- WhatsApp-shareable EOD PDF and relevant notifications.

### Later phases

- Multiple price periods with intermediate automated/manual readings.
- Payment-provider, POS, dispenser, bank, or accounting integrations.
- Automatic meter ingestion and equipment anomaly detection.
- Advanced cash-chain handoffs, route collections, customer advances, and richer
  receivable ageing.
- Multi-location consolidated owner dashboards and configurable commercial
  tenant onboarding.
- Separate approved Accounts, inventory/tank stock, tax, payroll, maintenance,
  and POS modules.

## 21. Acceptance criteria

### Configuration and readings

- QA can configure more than two machines and more than four nozzles without a
  code/schema change.
- QA can create two isolated organizations, multiple owners and pumps, and
  overlapping staff users with different time-bound scopes without any user
  seeing data outside their grants.
- Each nozzle can be effective-dated to a product, and old closures continue to
  show the historical assignment and price.
- Opening and closing litre/rupee readings retain raw value, actor, time, and
  nozzle and cannot be silently overwritten after submission.
- A previous-close/open mismatch, negative difference, reset, rollover,
  replacement, fault, or missing value follows its explicit exception path.

### Calculations and reconciliation

- Given approved test vectors, the system reproduces gross/adjusted litres and
  rupees, test amount, litre-at-price value, direct-meter value, and variance
  exactly under configured decimal rules.
- The system displays both sale calculations and clearly identifies the selected
  authoritative value and rule version.
- Every left/right total drills into typed source entries.
- Old-credit recovery increases accountable inflow but not current fuel sales or
  Loyalty progress; new credit remains a current-sale allocation and does not
  duplicate sale value.
- A zero difference cannot finalize a closure with missing mandatory readings or
  required attestations.
- Operator totals roll up once into their shift; shared values remain shift-level
  or use an approved allocation; shift totals roll up once into the pump day and
  pump days into the organization summary.
- Owner drill-down reproduces the same total from organization to pump to day to
  shift to operator plus explicitly shared entries.

### Handoffs, credit, and roles

- A sender can declare multiple handoffs to multiple recipients, but cannot
  attest any claim they created.
- A recipient can confirm, partially confirm, or dispute and record the actual
  amount; original claimed amount remains visible.
- Pending/disputed material handoffs appear on the owner dashboard and prevent a
  final label.
- Credit can be issued to an existing or permitted provisional customer, partly
  recovered across multiple methods, disputed, adjusted, or written off only
  with required authority.
- An attendant cannot view confidential credit, evidence, recipient, or
  management history outside active assigned context.

### Reports, audit, and integration

- The PDF contains every required Section 17 element and visibly distinguishes
  Preliminary, Variance Requires Review, Finalized, and Superseded.
- Reopening a finalized closure requires authority/reason and produces a new
  version without changing the prior PDF/data snapshot.
- Every sensitive action and required sensitive read is reconstructable through
  immutable audit events.
- Credit-to-Loyalty rules pass tests for issue-time earning, recovery-time
  earning, partial recovery, correction, reversal, and retry without double count.
- All test environments reference only the approved dedicated PumpAxis Supabase
  resources; cross-business and cross-role access tests fail closed.
- Offline retries do not create duplicate closure, payment, credit, handoff,
  attestation, or report records.

## 22. Success metrics

| Metric | Definition |
| --- | --- |
| Digital close adoption | Eligible shifts closed in PumpAxis ÷ eligible shifts |
| Complete-first-submission rate | Submitted closures needing no missing-field return ÷ submitted closures |
| Time to submit | Median/P95 from close start to Submitted, segmented by role/location |
| Owner review time | Median active time from Submitted to approval decision |
| Balanced-without-correction rate | Closures within tolerance and no post-submit correction ÷ submitted closures |
| Reconciliation variance | Signed/absolute rupee difference and percentage of accountable total |
| Material variance rate | Closures outside approved tolerance ÷ submitted closures |
| Pending attestation age | Median/P95 time from handoff claim to recipient outcome |
| Handoff confirmation rate | Fully confirmed claimed value ÷ total claimed handoff value |
| Partial/disputed handoff rate | Partial or disputed claims ÷ total handoff claims |
| Credit capture completeness | Credit issues with required customer, bill, product, receiver, and terms fields ÷ issues |
| Credit recovery allocation rate | Recovered value allocated to receivables ÷ total recovery value |
| Report reopening rate | Finalized reports later reopened ÷ finalized reports |
| Calculation correction rate | Closures with approved reading/price/calculation correction ÷ submitted closures |
| Staff adoption | Assigned active attendants using the workflow ÷ expected attendants |
| Offline sync error/duplicate rate | Failed or duplicate sync outcomes ÷ offline operations |
| EOD report delivery | Intended recipients receiving authorized report link ÷ intended recipients |
| System availability | Successful access to core closure service during defined operating window |

Each metric needs an owner, baseline, window, exclusions, and target before the
pilot. Alerts, disputes, and variance are review indicators—not proof of fraud
or staff wrongdoing.

## 23. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Wrong interpretation of “stock” | Incorrect inventory/accounting claims | Use meter terminology; validate equipment and accountant definitions before build |
| Choosing wrong rupee authority | Persistent unexplained variance | Preserve both methods, version rule, require accountant approval/tolerance |
| Hard-coded current setup | Expensive expansion | Configurable location/machine/nozzle/product relationships from MVP |
| Attendant enters matching fabricated sides | False balanced report | Independent attestations, source references, provider status, missing-data checks, audit |
| Owner becomes bottleneck | Delayed closes | Exception-based dashboard, delegated thresholds, reminders, clear materiality |
| Credit counted twice | Inflated sales/Loyalty | Separate issue/recovery events, source keys, deterministic projection tests |
| Handoff dispute harms staff | Trust and labor issue | Neutral status, preserve both accounts, evidence-based review, appeal/escalation |
| Offline duplicates | Inflated totals | Idempotency, unique closure scope, conflict queue, no last-write-wins |
| Price change lacks intermediate data | False precision | Require intermediate reading/detail or flag unresolved calculation |
| Report shared beyond audience | Privacy/financial exposure | Expiring authorized link, masking, audit, revocation, minimal embedded personal data |
| Final report silently changes | Loss of audit credibility | Immutable versions, reopening authority/reason, superseded watermark |
| Scope expands into accounting/inventory | Delivery delay and unclear truth | Explicit future boundaries and separate PRDs/integration contracts |

## 24. Open questions and decisions required

### Naming and ownership

1. Is **Shift Close & Reconciliation** approved as the final short module name?
2. Who owns operational, finance/accounting, credit, variance, privacy, and final
   approval policies?

### Equipment, readings, and price

3. Do the handwritten “opening/closing stock” figures definitively represent
   cumulative nozzle litre and rupee meters? What equipment/manual confirms it?
4. Does every nozzle provide both reliable cumulative litre and rupee readings,
   and at what precision/max-counter behavior?
5. What processes apply to calibration, reset, rollover, replacement, and faulty
   meters, and who approves normalized readings?
6. Is one closure per shift, per attendant, per machine, per location/day, or a
   configurable combination?
7. Who records and approves product prices, and what is the source of truth?
8. For a mid-shift price change, which intermediate reading or transaction source
   will allocate litres across prices?
9. Which value is authoritative: direct adjusted rupee meter, adjusted litres ×
   price, an external POS total, or a configurable hierarchy?
10. What absolute and percentage variance tolerance applies by product/equipment,
    and what rounding/precision rules apply?

### Testing and adjustments

11. Is 5 litres only a default, and which quantity deviations require approval?
12. What is the exact treatment when test fuel is not returned, is partly
    returned, or is used for another approved purpose?
13. Which adjustments besides testing/own use are allowed, and who approves them?

### Reconciliation and attestation

14. Does the recommended left/right accounting model match the family's and
    accountant's convention?
15. Which categories are accountable inflows and which are allocations,
    especially expenses, shortages/overages, advances, discounts, and taxes?
16. Can a non-zero within-tolerance difference finalize, and must it have a reason?
17. Which payment methods/providers launch, and is declared, provider-reported,
    or bank-settled value authoritative?
18. Who may be a handoff recipient, how are non-staff recipients verified, and
    what attestation deadline/reminder/escalation applies?
19. Can a pending material handoff be exceptionally approved, by whom, and with
    what evidence/two-person control?
20. Is Balanced a stored workflow state or a calculated condition?

### Credit and Loyalty

21. What credit limits, authority levels, terms, due dates, provisional-customer
    limits, and required evidence apply?
22. May unverified customers receive credit, and how long can provisional status
    remain open?
23. How are overpayments, advances, refunds, write-offs, disputes, and returned
    goods treated?
24. Does Loyalty progress accrue at confirmed credit issue, pro-rata recovery, or
    not at all, and can this vary by scheme?
25. If recovery-time earning is selected, how are partial allocations and scheme
    expiry handled?

### Reporting, security, and operations

26. Which shifts roll into one daily report, who prepares/reviews/finalizes, and
    what happens when one shift remains unresolved?
27. What PDF page size, language, branding, masking, signature/QR verification,
    recipient list, link expiry, and maximum WhatsApp file size apply?
28. What values/statuses may attendants, supervisors, owners, accountants,
    auditors, and customers see?
29. What record/evidence/report retention, legal basis, export, and deletion rules
    apply?
30. What are supported devices, offline limits, RPO/RTO, availability, support
    hours, and incident owners?
31. What are the new PumpAxis Supabase project name/reference, region,
    development/staging/production separation, owners, and backup policy?
32. Which integrations, if any, are launch-critical rather than later-phase?
33. What operator-settlement period and recent-history window may each operator
    view?
34. Which readings and collections can be attributed directly to an operator,
    and which allocation rules are approved for shared counters/payments?
35. What evidence/acknowledgement is required when machine/nozzle responsibility
    transfers or a relief operator takes over?
36. Can a pump-day be finalized with one unresolved shift under an exceptional
    disclosed approval, or is that always prohibited?
37. Which organization-level identities, schemes, credit accounts, payment
    accounts, numbering, prices, and rules are shared versus pump-specific?

## 25. Suggested pilot plan

### Phase 0 — rule validation

- Have the owner, an experienced attendant, equipment operator, and accountant
  annotate one real blank/example sheet together.
- Confirm meter semantics, price source, test handling, left/right categories,
  credit treatment, handoff recipients, tolerance, and final approval authority.
- Collect representative anonymized cases: normal day, price change, partial
  handoff, new/recovered credit, return, meter issue, and unresolved variance.
- Establish baseline close time, correction frequency, variance, pending
  handoffs, owner effort, and credit-record accuracy.
- Define the dedicated PumpAxis Supabase environment plan without linking the
  existing personal project.

Exit criterion: approved formula/accounting examples and answered launch-blocking
questions.

### Phase 1 — controlled simulation

- Configure the actual two machines and four nozzles plus additional synthetic
  machines/nozzles to prove extensibility.
- Replay representative days with synthetic data and compare every result to
  accountant-approved calculations.
- Test multiple attendants/machines, offline conflicts, partial attestations,
  provisional credit, corrections, reopening, permissions, and PDF versions.
- Usability-test numeric entry and exception review on intended low-end devices.

Exit criterion: all acceptance criteria and authorization boundaries pass; no
calculation differs from approved test vectors.

### Phase 2 — limited live operation

- Begin at one location with one shift/team while keeping the existing notebook
  as an explicitly temporary comparison control.
- Require daily owner/accountant review of system versus manual totals and
  classify every difference by cause.
- Do not change authoritative formulas or categories silently; version and
  approve any adjustment.
- Monitor entry time, pending attestations, variance, credit allocation,
  corrections, notification delivery, and report usability.

Exit criterion: pre-agreed accuracy, adoption, close-time, and unresolved-case
targets are met for an agreed period.

### Phase 3 — controlled expansion

- Remove duplicate notebook work only after the owner/accountant accepts the
  system record and recovery procedure.
- Expand shifts/locations gradually, with access reviews and training.
- Use observed gaps to define—not assume—the future Accounts, inventory,
  payment-integration, and commercial platform requirements.
