# PumpAxis Loyalty — Business and Product Requirements

| Document attribute | Value |
| --- | --- |
| Product | **PumpAxis** — confirmed product name |
| Module | **Loyalty** — confirmed short module name |
| Document type | Combined Business Requirements Document (BRD) and Product Requirements Document (PRD) |
| Status | Draft for business validation; not an implementation specification |
| Intended readers | Business owners, petrol-pump managers, designers, developers, QA teams, investors, and prospective business customers |
| Data platform | A new, dedicated Supabase project; it must not use or link to the existing personal `jayantgoyal` Supabase project |

See the [PumpAxis product boundary](README.md) and the separate [Shift Close &
Reconciliation requirements](shift-close-reconciliation-requirements.md). Shared
identity, business, location, staff, evidence, notification, approval, and audit
records must be reused rather than duplicated between modules.

This document uses four explicit labels:

- **Confirmed:** provided or subsequently approved by the business owner.
- **Recommendation:** proposed direction that is safe for planning but still needs business acceptance.
- **Assumption:** temporary interpretation used to make the document coherent; it must be validated.
- **Decision Required / Open Question:** implementation must not hard-code an answer until an authorized owner decides it.

Requirement keywords have their normal meaning: **must** is mandatory for the stated scope, **should** is recommended, and **may** is optional.

## 1. Executive summary

PumpAxis is a proposed modular operations product for petrol pumps and, later, adjacent mobility and dealer businesses. Its first planned module addresses loyalty transparency and purchase verification. The module name is **Loyalty**. A future daily sales, accounts-management, and reporting capability is anticipated, but it is explicitly outside this document's functional scope.

PumpAxis Loyalty will connect every qualifying purchase to the primary account receiving the benefit, the person who actually purchased, the relevant vehicle when applicable, the staff member who recorded it, the bill, the scheme, and any required evidence. Customers will not initially need an installed application: phone-first registration, SMS or WhatsApp notifications, and secure web links provide the main customer experience. Attendants use a mobile application and authorized managers use a web dashboard.

The product is designed to reduce missing benefits, incorrect customer attribution, unauthorized purchases, duplicate evidence, and reward leakage without making routine refuelling feel like surveillance. Most normal transactions should use a verified phone number, customer QR or membership ID, vehicle number, and authorized-member selection. Live photographs are risk-based evidence, not universal proof of purchase.

The MVP is for one operating business and its locations, but its domain and authorization boundaries should avoid blocking later multi-business commercialization. Each future client business will require isolated branding, users, locations, schemes, records, permissions, and audit history.

## 2. Problem statement

Petrol-pump loyalty schemes often depend on manually attributed purchases, staff-mediated benefits, fragmented records, and incomplete communication. This creates several problems:

- customers may not know what they earned or whether the full benefit reached them;
- purchases may be credited to the wrong customer or group;
- primary account owners may not know what family members, employees, or drivers purchased;
- the actual purchaser, vehicle, staff member, and bill may not be reliably connected;
- photographs or bills can be reused, while a photograph alone still does not prove a sale;
- customers may abandon registration if asked for excessive personal information;
- managers may lack a tamper-evident explanation of corrections, cancellations, disputes, and reward delivery; and
- the business cannot confidently measure scheme performance or confirmed leakage.

The core business need is therefore a fast, privacy-conscious, auditable system of attribution and confirmation—not merely a points calculator.

## 3. Product vision

> Give every eligible purchase a transparent, verifiable path from the pump to the correct customer benefit.

Customer value proposition:

> Receive immediate purchase confirmation, monitor your scheme progress, and ensure that every benefit reaches you directly.

PumpAxis should become a modular operating system for high-trust customer and outlet workflows. Loyalty is the first module. Future modules may cover accounts, reports, fleet operations, inventory, staff, billing, or integrations, but those modules must have their own validated requirements and ownership boundaries.

## 4. Business objectives

| Objective | Intended outcome | Measurement |
| --- | --- | --- |
| Accurate attribution | Qualifying purchases reach the intended primary account | Correctly attributed transaction rate; dispute rate |
| Benefit transparency | Customers can independently see progress and reward status | Portal engagement; missing-benefit complaints |
| Direct benefit delivery | Reduce employee-mediated reward leakage | Verified benefit-delivery rate; confirmed leakage value |
| Fleet visibility | Primary owners see authorized purchaser and vehicle activity | Fleet notifications delivered; fleet retention |
| Faster resolution | Managers can reconstruct and resolve issues | Median dispute-resolution time; audit completeness |
| Low-friction operations | Routine transactions remain fast | Median and P95 entry time; attendant adoption |
| Privacy-respecting growth | Registration asks only for data currently needed | Registration completion; verification-related drop-off |
| Commercial readiness | Avoid architecture that prevents later tenant isolation | Tenant-boundary review; configuration coverage |

**Decision Required:** numeric targets, financial baselines, target customer segments, and the pilot budget are not yet confirmed.

## 5. Confirmed decisions

### Product and architecture

- The product name is **PumpAxis**.
- This loyalty and purchase-verification capability is one feature/module of a broader application.
- The future daily sales, accounts-management, and reporting feature is not part of the current requirements exercise.
- PumpAxis will use a new, dedicated Supabase project. It must not use the existing personal Supabase project.
- The new Supabase project name, reference, region, environments, and ownership contacts remain decisions required.
- An organization can own or authorize multiple petrol-pump locations and can
  have multiple owners with scoped access.
- Customers use an organization-scoped shared directory. Every purchase retains
  the exact pump, shift, operator, time, and machine/nozzle when applicable.
- Scheme contribution and reward redemption can span all participating pumps or
  be limited to selected pumps through explicit scheme configuration.
- Phone uniqueness, duplicate-customer resolution, groups, vehicles, and reward
  balances are resolved within the organization boundary; one organization can
  never view another organization's data.

### Customer experience and identity

- Registration is phone-number-first and the phone number must be verified.
- Every account also has an immutable internal customer ID.
- A phone number is a contact and authentication factor, not permanent proof of identity.
- Additional customer details are collected progressively and only when necessary.
- Customers are not required to install an application initially.
- Customers receive SMS or WhatsApp notifications with secure web links.
- Customers use a lightweight web portal; attendants use a mobile application; managers use a web dashboard.
- Staff see only the minimum customer information needed for the current task.

### Account, evidence, control, and audit

- A primary account may represent an individual, family, fleet owner, transport company, other business, or agricultural operation.
- The primary member controls group membership and reward redemption unless authority is explicitly delegated.
- Every purchase identifies the primary account, actual purchaser, applicable vehicle, recording staff member, bill, items, location, scheme, and progress.
- Live evidence, when required, is captured from the camera; gallery upload is not accepted.
- Server submission time is authoritative; embedded image metadata is only secondary evidence.
- Duplicate-image detection is distinct from face-identity matching.
- A repeated face must not by itself cause a fresh photograph to be rejected.
- Photographs are risk-based and do not independently prove a purchase.
- Sensitive manager actions must be recorded in audit history.
- Risk alerts trigger review, not automatic accusations or penalties.

## 6. Assumptions

The following are planning assumptions and require validation:

- The initial pilot is operated by one business with one or a small number of petrol-pump locations.
- A bill or invoice identifier is available for every completed purchase, even if the platform does not generate the fiscal invoice.
- The primary account can have one controlling primary member at MVP launch.
- Group members may have their own verified phone numbers, but a phone number may also be unavailable for some drivers or guests.
- Monetary values are stored in the smallest currency unit and displayed in Indian rupees for the initial launch.
- The business can lawfully send transactional notifications after collecting the required consent or other lawful basis.
- An authorized manager is available to resolve exceptions, approve corrections, and investigate disputes.
- SMS and WhatsApp provider selection, template approval, pricing, and fallback behavior will be decided before production.

## 7. Scope and non-scope

### MVP scope

- phone-first registration and phone verification;
- internal customer IDs, primary accounts, groups, authorized members, and vehicles;
- attendant mobile transaction entry and bill recording;
- optional, policy-driven live evidence capture;
- routine and high-risk confirmation paths;
- SMS or WhatsApp notifications with secure action links;
- configurable basic value- or quantity-based schemes;
- progress, earned benefits, redemption, reversals, and adjustments;
- customer confirmation and dispute submission;
- manager review, corrections, approvals, and audit history;
- role-based access and staff lifecycle controls; and
- degraded/offline-safe draft capture with controlled synchronization.

### Explicit non-scope for MVP

- the future Accounts module, including daily sales books, reconciliation, accounting, and management reporting;
- general ledger, tax filing, payroll, inventory, nozzle-meter, or tank-dip management;
- automated facial identification or facial recognition;
- automated near-duplicate image enforcement or advanced fraud scoring;
- automatic bill OCR, point-of-sale, dispenser, ERP, bank, or accounting integrations;
- native customer mobile applications;
- fully automated reward payments;
- multi-business self-service onboarding, subscriptions, or white-label administration;
- predictive analytics; and
- conclusive legal identity verification unless separately required and approved.

### Design-for-later constraints

MVP records should carry a business boundary and location boundary where appropriate. This is not authorization to build a complete multi-tenant SaaS product in the MVP; it prevents a single-business data model from becoming an avoidable migration trap.

## 8. Personas

| Persona | Goals and responsibilities | Key permissions | Frustrations to prevent | Key journey |
| --- | --- | --- | --- | --- |
| Primary customer or fleet owner | Receive every benefit, authorize people and vehicles, monitor purchases | Manage own group; view account history; confirm/dispute; redeem or delegate | Missing rewards, unknown driver purchases, excessive registration | Register → create account → authorize members/vehicles → monitor → redeem |
| Authorized family member | Make purchases for the household and receive confirmation | Identify self; view own activity; confirm/dispute own purchases | Being unable to credit the family account or seeing unrelated private data | Accept invite → identify at pump → purchase → confirm |
| Authorized driver or employee | Buy for an approved fleet or business | Use assigned account/vehicle within permission limits; view own transaction | Slow checks, unclear authorization, personal data exposure | Accept authorization → select vehicle → purchase → notify owner |
| Guest or unregistered purchaser | Complete an occasional purchase with minimal friction | Provide limited details/consent; receive a secure claim or confirmation path if offered | Forced account creation or photo capture without explanation | Purchase → limited identification → notification/claim path |
| Petrol-pump attendant or salesman | Record a correct purchase quickly | Search minimum identifiers; create draft; submit transaction; capture live evidence when prompted | Long forms, unreliable network, access to irrelevant records | Identify → enter bill/items → capture required evidence → submit |
| Shift supervisor | Keep queue moving and handle bounded exceptions | View shift/location queue; approve defined low-risk exceptions; escalate | Unclear responsibility and broad manager dependency | Monitor → resolve allowed exception → escalate high-risk case |
| Official manager | Protect customers and resolve transactions | Review evidence, disputes, corrections, cancellations, risk alerts, and approvals within assignment | Missing audit context; destructive edits; false fraud assumptions | Review case → compare evidence → decide → notify → audit |
| Scheme or finance manager | Configure approved schemes and control benefit liabilities | Draft/publish schemes; approve defined adjustments/redemptions; view financial summaries | Ambiguous rounding, retroactive rule changes, reward leakage | Configure → validate → publish → monitor → reconcile benefits |
| Auditor or compliance reviewer | Independently reconstruct important events | Read-only access to scoped records, evidence metadata, decisions, and audit history | Mutable history, excessive live-system privilege | Select period/case → inspect chain → export/report findings |
| Business owner or platform administrator | Govern business, locations, roles, and policies | Highest business-scoped administration; no audit alteration | Uncontrolled staff access and lack of outcome visibility | Configure organization → assign managers → monitor controls |
| Support and dispute-resolution representative | Help customers and coordinate resolution | View minimum case context; communicate; propose—not self-approve—sensitive changes | Overexposure of customer history or inability to trace decisions | Verify requester → open case → gather facts → escalate/resolve |
| Future client business | Operate its own branded deployment or tenant | Manage own locations, users, schemes, policies, and data only | Data leakage between businesses and rigid configuration | Onboard → brand/configure → import/setup → operate → audit |

## 9. Roles and permission matrix

Legend: **O** own records only, **L** assigned location, **B** assigned business, **C** create/submit, **A** approve/decide, **R** read-only, **D** explicitly delegated, and **—** no access. Compound values combine the scopes.

| Role | Register customer | Manage group | View purchases | Enter purchase | Correct/cancel | Manage schemes | Redeem reward | Review disputes/risk | View evidence | Manage staff/roles | View audit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Primary member | O | O | O | — | Request | — | O | Own case | Own transaction | — | Own security events |
| Authorized family member | Accept invite | — | O | — | Request | — | D | Own case | Own transaction | — | — |
| Driver/employee | Accept invite | — | O | — | Request | — | D | Own case | Own transaction | — | — |
| Guest | Limited/self | — | Secure-link only | — | Report only | — | — | Own report | Own transaction if authorized | — | — |
| Attendant | C, minimum data | — | Current transaction only | C at L | — | — | Initiate only if policy permits | — | Capture/current only | — | — |
| Shift supervisor | C at L | — | Operational queue at L | C at L | Propose/limited A | — | Policy-limited initiation | Triage at L | Case-scoped at L | — | Operational subset at L |
| Official manager | C at B | — | B, role-scoped | C if needed | A within authority | Read active | A within authority | A at B | Case-scoped B | — | R at B |
| Scheme/finance manager | — | — | Scheme-related B | — | Approve financial adjustment | C/A with separation rules | A/reconcile | Scheme/risk context | Only if required | — | Scheme/redemption audit |
| Auditor/compliance | — | — | R, assigned scope | — | — | R | R | R | R, assigned scope | — | R, immutable |
| Business owner/admin | C | Exceptional support only | B | — | A, policy-bound | A | A, policy-bound | A/B | Case-scoped B | C/A at B | R/B, immutable |
| Support representative | Assisted C | Propose only | Case-scoped | — | Propose only | — | — | Triage/propose | Case-scoped | — | Case audit only |
| Future client admin | Same as business admin within tenant | Tenant-scoped | Tenant-scoped | Policy | Policy | Tenant-scoped | Policy | Tenant-scoped | Tenant/case-scoped | Tenant-scoped | Tenant-scoped R |

No role may alter or delete audit history. Platform infrastructure operators, if later introduced, require a separately defined break-glass access policy and are not implicitly business administrators.

## 10. Customer and group model

### Core model

```text
Customer ──controls──> Primary account ──receives──> Scheme progress/rewards
    │                        │
    └──acts as member of─────┤──authorizes──> Group members
                             └──links───────> Vehicles

Transaction ──identifies──> actual purchaser + primary account + vehicle
            ──recorded by─> staff + location
            ──supported by> bill + items + optional live evidence
```

- A **customer** is a person-level record with an internal ID and zero or more verified contact methods over time.
- A **primary account** is the benefit-owning relationship boundary. It may represent a person, family, fleet, transport company, business, or agricultural operation.
- A **primary member** is the controlling customer for the primary account in the MVP.
- A **group member** is a customer or limited authorized-person record allowed to purchase for the primary account.
- **Group-member permissions** specify what the member may do, for which vehicles/locations/time period, and whether reward redemption is delegated.
- A **vehicle relationship** records ownership, assignment, or purchase authorization; it is not proof of legal vehicle ownership unless separately verified.
- A **guest purchaser** can be recorded without automatically becoming a reusable authorized member.

### Mandatory rules

- Only the primary member may add or remove group members or delegate redemption, unless a later approved business rule creates an equivalent legally authorized controller.
- Adding, removing, or changing redemption authority requires confirmation appropriate to the risk and notification to the primary member.
- A group membership has status and effective dates; removal prevents future use but does not erase historical attribution.
- Staff cannot silently attach a purchaser or vehicle to a primary account.
- Customer search results shown to staff must be minimized and designed to avoid exposing full phone numbers or account histories.
- One person may legitimately belong to more than one group, but unusual unrelated memberships generate review signals rather than automatic rejection.

**Decision Required:** whether an account may have multiple co-primary members, whether minors are allowed, and which documents—if any—are required for fleet/business authority.

## 11. End-to-end workflows

### 11.1 Phone-first registration

```text
Enter phone → Send OTP → Verify OTP → Create internal customer ID
     → obtain required consent → create or join primary account
     → optionally add name/vehicle → send registration confirmation
```

1. The attendant or customer enters the phone number with country code.
2. The system rate-limits and sends an OTP through an approved provider.
3. Successful verification creates or reconnects the verified phone record; it does not by itself prove legal identity.
4. The system checks likely duplicate customer records and follows a controlled recovery/merge path.
5. Only the minimum data needed for the current scheme or account is requested.
6. The customer receives a registration notification and secure portal link.

### 11.2 Add an authorized member or vehicle

1. The primary member initiates the action through a secure portal link or assisted flow.
2. The system shows the requested person, permissions, scope, and expiry before confirmation.
3. The primary member confirms with a recent authenticated session or step-up verification.
4. The member is invited or registered; any required live evidence is captured under policy.
5. The system records consent/authorization and notifies the primary member.
6. Vehicle relationships use the same explicit authorization pattern.

### 11.3 Routine qualifying purchase

```text
Identify account/member/vehicle → enter bill and items → validate eligibility
    → submit → notify purchaser + primary member → passive/active confirmation
    → confirm → update scheme progress → issue reward if milestone reached
```

1. The attendant scans a customer QR/member ID or uses a minimally disclosed lookup.
2. The attendant selects the actual purchaser and vehicle from authorized choices, or records a permitted guest/unregistered case.
3. The attendant enters bill number, item, quantity, amount, and location context.
4. The system validates duplicates, authorization, scheme dates, and transaction rules.
5. If no evidence trigger applies, the attendant submits immediately.
6. Notifications show before/after progress and a secure confirm/report action.
7. A routine transaction may auto-confirm after the configured dispute period.

### 11.4 High-risk purchase

1. A deterministic policy flags the purchase for active confirmation and/or live evidence.
2. The application explains the additional step in neutral language.
3. Required live evidence is captured from the camera and bound to the pending transaction.
4. The customer or primary member actively confirms through a secure link or approved alternative.
5. Failure to confirm keeps the transaction pending or routes it to review; it does not automatically accuse the customer or staff.

### 11.5 Correction, cancellation, return, or reversal

1. Staff/customer requests a change with a reason and supporting context.
2. The original completed record remains immutable.
3. An authorized manager reviews and approves or rejects a correction event.
4. The system calculates compensating scheme-progress and reward effects.
5. If a reward has already been issued or redeemed, the case follows the approved negative-balance or recovery policy.
6. All affected parties are notified and the audit chain links original and corrective records.

### 11.6 Reward redemption

1. The primary member or explicitly delegated member selects an available reward.
2. The system performs step-up verification when policy requires it.
3. Eligibility, expiry, balance, prior redemption, risk holds, and authority are checked atomically.
4. The benefit is delivered directly where possible.
5. Employee-mediated cash or physical delivery requires customer acknowledgement and required evidence.
6. A receipt/notification records value, method, location, staff member, and resulting balance.

### 11.7 Dispute

1. The purchaser or primary member opens the secure transaction link and selects **Report a problem**.
2. The user selects a reason, adds a comment/evidence if needed, and receives a case reference.
3. The transaction becomes Disputed without deleting its prior state history.
4. A manager moves it Under Review, examines the bill, evidence, authorization, staff context, and related alerts.
5. The manager records a reasoned outcome: uphold, correct, cancel, reverse, or reject the dispute.
6. Both applicable customer parties are notified without revealing unrelated group-member data.

### 11.8 Weak or unavailable internet

1. The application may save an encrypted local draft with a device-generated idempotency key.
2. Offline drafts cannot become confirmed, issue rewards, or claim that a notification was sent.
3. When connectivity returns, the server validates authoritative time, bill duplication, scheme eligibility, and evidence integrity.
4. The UI clearly distinguishes locally saved, syncing, submitted, rejected, and review-required states.

## 12. Functional requirements

| ID | Requirement |
| --- | --- |
| FR-REG-01 | The system must register a customer with a verified phone number and assign an internal customer ID. |
| FR-REG-02 | The system must preserve phone-verification history and never use the current phone number as the customer primary key. |
| FR-REG-03 | The system must support progressive profile completion and explain why newly requested data is required. |
| FR-REG-04 | The system must detect likely duplicate customer accounts and route uncertain matches to recovery/review. |
| FR-ACC-01 | The system must create primary accounts for the supported account types without conflating the account with a phone number. |
| FR-GRP-01 | The primary member must be able to invite, authorize, suspend, and remove group members. |
| FR-GRP-02 | Membership and redemption-authority changes must be confirmed, notified, effective-dated, and audited. |
| FR-GRP-03 | Staff must not add or change reusable group authorization on a customer's behalf without the required customer confirmation. |
| FR-VEH-01 | Authorized users must be able to register and link vehicles to accounts and permitted purchasers. |
| FR-VEH-02 | The system must preserve historical vehicle relationships after removal. |
| FR-TXN-01 | An attendant must be able to create a draft and submit bill, item, quantity, amount, purchaser, account, vehicle, location, and staff attribution. |
| FR-TXN-02 | The server must assign the authoritative transaction ID and submission time. |
| FR-TXN-03 | Submission must be idempotent and must detect duplicate bill identifiers within the configured uniqueness scope. |
| FR-TXN-04 | The system must implement Draft, Pending, Confirmed, Disputed, Under Review, Corrected, Cancelled, and Reversed states with valid transitions. |
| FR-TXN-05 | Completed transactions must not be overwritten or deleted; corrections and reversals must be linked events. |
| FR-TXN-06 | The system must calculate and persist before/after scheme progress using the scheme version applicable to the transaction. |
| FR-EVD-01 | When evidence is required, the attendant application must use live camera capture and reject gallery selection. |
| FR-EVD-02 | The system must bind evidence to the transaction, record server receipt time, integrity hash, capture context, and duplicate-check outcome. |
| FR-EVD-03 | The system must treat EXIF data as secondary and must not equate face recurrence with image duplication. |
| FR-SCH-01 | Authorized scheme managers must be able to draft, review, publish, suspend, and close versioned schemes. |
| FR-SCH-02 | Scheme configuration must cover the fields listed in Section 13 and prevent silent retroactive changes. |
| FR-RWD-01 | The system must create earned rewards once per qualifying milestone and prevent duplicate issuance under retries/concurrency. |
| FR-RWD-02 | Only an authorized primary or delegated member may redeem, subject to policy checks and holds. |
| FR-RWD-03 | The system must record delivery method, value, status, acknowledgement, staff, location, and evidence requirements. |
| FR-CNF-01 | Secure customer links must allow confirmation or problem reporting without exposing unrelated account data. |
| FR-DSP-01 | Customers must receive a case reference and status for disputes; managers must record reasoned outcomes. |
| FR-NOT-01 | The system must notify the actual purchaser when verified contact is available and the primary member after every qualifying purchase. |
| FR-NOT-02 | Notification delivery, retries, provider result, fallback, and secure-link expiry must be recorded. |
| FR-MGR-01 | Managers must have queues for pending confirmations, disputes, correction approvals, redemption exceptions, and risk alerts scoped to their role. |
| FR-AUD-01 | Sensitive reads and all sensitive actions must create immutable, attributable audit events. |
| FR-SEC-01 | Authorization must be enforced server-side using business, location, role, relationship, and record scope—not only hidden UI controls. |
| FR-OFF-01 | Offline/degraded entry must preserve idempotency and prevent local confirmation or reward issuance. |
| FR-ADM-01 | Authorized administrators must be able to disable lost devices and revoke staff sessions promptly. |

## 13. Scheme and reward rules

### Required configurable scheme properties

- scheme name, description, status, version, start time, and end time;
- eligible fuels, products, or services;
- qualifying purchase value and/or quantity milestones;
- account/customer eligibility and enrolment rules;
- reward type, value, delivery method, and expiry;
- group contribution rules;
- excluded transactions and channels;
- treatment of pending, disputed, corrected, cancelled, returned, and reversed transactions;
- redemption authority and step-up requirements;
- maximum benefit limits per transaction, account, person, vehicle, location, and period where applicable; and
- location inclusion/exclusion.
- participating-pump scope for contribution and reward redemption.

### Confirmed rules

- Customers can see eligible purchases, current total, next milestone, remaining amount/quantity, benefits earned/redeemed/expired, adjustments, reversals, and pending/disputed transactions.
- Rewards should preferably be delivered through invoice discount, account credit, digital voucher, bank/digital payment, or acknowledged physical payment.
- Employee-mediated cash requires customer confirmation.
- Cancelled or reversed value must not continue contributing as if it were an eligible completed purchase.

### Recommendations requiring acceptance

- Freeze a versioned rules snapshot when a scheme is published. New changes create a new version with an effective time.
- Count only Confirmed transactions toward available rewards; display Pending contribution separately.
- Calculate money in paise using integer arithmetic. Calculate quantities in a declared base unit and precision.
- Define rounding per scheme at the final calculation boundary, not repeatedly per intermediate operation.
- Create reward issuance and redemption with atomic database operations and unique idempotency constraints.
- Put a reward on hold when its earning transaction is disputed or reversed until policy resolves the liability.
- Never silently reduce historical progress; show a labeled adjustment or reversal entry.

### Decisions required before build

- Whether milestones are single-use, repeatable, tiered, or cumulative.
- Whether excess value carries forward after a milestone.
- Whether group purchases pool automatically and whether any members/vehicles are excluded.
- The routine confirmation/dispute window and timezone cutoff.
- Exact rounding mode, quantity precision, tax inclusion, discounts, and partial-return allocation.
- Reward expiry, grace periods, maximum limits, stacking, transferability, and negative-balance treatment.
- Whether customers must explicitly enrol or are enrolled automatically with suitable notice/consent.

## 14. Notification rules

### Recipients and events

After every qualifying transaction, notify the actual purchaser when a verified contact is available and always notify the primary member. Important event notifications are:

- registration;
- purchase recorded;
- group member added, removed, suspended, or granted/revoked redemption authority;
- phone number changed;
- transaction corrected, cancelled, or reversed;
- reward milestone reached;
- reward redeemed or delivery failed;
- reward expiry approaching;
- dispute opened, moved to review, and resolved; and
- security-sensitive account or consent changes.

### Transaction notification contents

- petrol-pump name and location;
- bill number;
- server-recorded transaction date and time;
- fuel/product, quantity, and amount;
- vehicle number when applicable;
- actual purchaser name or privacy-safe identifier;
- primary account label;
- scheme progress before and after;
- reward earned, if any; and
- secure actions to confirm or report a problem.

### Privacy and delivery rules

- Do not expose unrelated group members, full confidential histories, photographs, fraud flags, or management notes.
- Secure links must use high-entropy, single-purpose, expiring tokens and must not place sensitive data in the URL.
- The user must be re-authenticated or step-up verified before sensitive profile, group, phone, or redemption actions.
- Delivery failure must not silently imply customer confirmation.
- Notifications must distinguish Pending from Confirmed and later correction from the original message.
- Templates, language, quiet-hour policy, WhatsApp opt-in, SMS fallback, retry limits, and expiry-warning schedule are decisions required.

## 15. Evidence and verification approach

### Evidence principles

- Evidence is corroborating context. A photograph alone does not prove that fuel or a product was purchased.
- When live evidence is required, the camera must capture it in the attendant application; gallery uploads are disabled for that flow.
- Server submission time is authoritative. Device time and EXIF time are secondary signals because they may be absent, wrong, or modified.
- The capture flow may display a transaction-bound reference containing transaction ID, customer ID, and submission time. **Decision Required:** whether the reference appears on-screen beside the subject, as a server-generated overlay, or both.
- Exact/near-duplicate image detection and face-identity matching are separate controls. Crops, compression, filters, screenshots, and re-encoding may be near duplicates.
- A fresh photograph must not be rejected merely because the same customer's face appeared before.
- Stronger liveness or identity verification may be used for high-risk transactions or redemption only after privacy, legal, bias, accuracy, and fallback review.

### Risk-based capture policy

Live evidence is recommended for initial registration, adding an authorized person, large transactions, suspicious transactions, reward redemption, transactions without a registered vehicle, and disputes. Routine purchases should normally use a verified phone, QR/member ID, vehicle number, and authorized-member selection.

### Evidence package for a verified transaction

The record connects any required live evidence to server time, bill/invoice number, item, quantity, amount, location, vehicle, actual purchaser, primary account, staff member, applicable scheme, and progress effect. Evidence access is case-scoped and must be logged.

### MVP versus later capability

- **MVP:** live capture control, file integrity hash, basic exact-file duplicate hash, capture metadata, manual review, retention controls.
- **Later:** perceptual similarity, screenshot/crop detection, configurable liveness, device attestation, or facial matching after separate approval.

## 16. Fraud-prevention approach

### Control model

PumpAxis should combine prevention, detection, review, correction, and learning:

```text
Prevent with authorization/idempotency → detect unusual signals → create alert
    → human review with context → record outcome → correct controls/rules
```

No signal alone labels a person fraudulent. Alerts must include the triggering facts, severity rationale, related records, reviewer, decision, and outcome. Customer-facing language remains neutral unless a formally approved investigation process decides otherwise.

### Required alert categories

| Signal | Example review question | Initial treatment |
| --- | --- | --- |
| One phone linked to many unrelated accounts | Shared business phone, recycled number, or abuse? | Step-up/review; do not auto-block all accounts |
| Frequent phone changes | Legitimate recovery or account takeover? | Hold sensitive changes; verify old/new channels where possible |
| Exact or near-duplicate photographs | Same file/screenshot/crop reused? | Compare images and transaction context; face recurrence is not duplication |
| Duplicate bill numbers | Retry, data-entry error, reused bill, or scope collision? | Prevent duplicate submission or route to review |
| Late/backdated entry | Offline delay, missed entry, or fabricated attribution? | Require reason and approval above threshold |
| Excess registrations by one employee | Busy shift, campaign, or synthetic accounts? | Supervisor review by employee/location/time window |
| Large purchase on a new account | Legitimate first fleet purchase or reward gaming? | Active confirmation and optional evidence |
| Person in many unrelated groups | Driver for multiple businesses or account farming? | Review relationship context; do not infer identity solely from face |
| Unexpected purchaser across vehicles | Substitute driver or unauthorized use? | Notify primary; request confirmation |
| Reward delivered without acknowledgement | Provider failure or leakage? | Block final delivered state when acknowledgement is mandatory |
| Cancellation after reward issuance | Genuine return or benefit extraction? | Hold/recover according to approved liability policy |
| Unusual frequency, quantity, amount, or location | Fleet pattern, data error, or collusion? | Compare customer/account/vehicle/location baselines |

### Recommended MVP controls

- OTP throttling and abuse limits;
- role- and location-scoped access;
- device/session revocation;
- server-side idempotency keys;
- duplicate bill uniqueness rules;
- exact evidence hashing;
- configurable large/late/unregistered-vehicle triggers;
- active customer confirmation for high-risk events;
- two-person approval for high-value manual adjustments/redemptions; and
- immutable audit and case outcomes.

Thresholds, alert severity, review service levels, and escalation authority are decisions required and must be configurable rather than embedded in application code.

## 17. Basic database structure

This is a conceptual, expandable model—not SQL. Every business-owned record should include a business boundary, stable ID, creation metadata, and lifecycle status where relevant. Sensitive mutable records should also include update metadata; important state changes belong in append-only event or history records.

Abbreviations in the access column: **Customer** means the person using the customer portal for their authorized scope; **Staff** means location-scoped operational staff; **Manager** means an assigned official manager; **Finance** means scheme/finance manager; **Admin** means business owner/platform administrator; and **Auditor** means assigned read-only reviewer.

| Entity | Purpose | Essential fields | Important relationships | Create / view / update / approve |
| --- | --- | --- | --- | --- |
| Businesses | Isolates an operating company or future tenant | ID, legal/display name, status, timezone, locale, branding/config refs, created time | Has locations, staff, accounts, schemes, audit records | Platform onboarding creates; business Admin views/updates allowed fields; platform authority approves activation |
| Petrol-pump locations | Represents an outlet where transactions occur | ID, business ID, name, address/geocode, timezone, status, contact, policy overrides | Belongs to business; has staff, transactions, schemes | Admin creates/updates; assigned Staff view minimum; Manager approves activation/change if policy requires |
| Staff users | Represents workforce access, not customer identity | ID, business ID, auth-user ref, employee ref, display name, phone/contact, status, assigned locations, joined/left times | Assigned roles, devices, transactions, approvals | Admin creates/disables; self and management view scoped; only authorized Admin approves roles/status |
| Roles and permissions | Defines least-privilege capabilities and scopes | Role ID, business/system ownership, capability set, scope rules, version, status | Assigned to staff; referenced by authorization/audit | Platform defines system roles; Admin assigns business roles; ordinary Staff read only own effective access; sensitive changes approved/audited |
| Customers | Stable person record independent of phone | Customer ID, business boundary if tenant-local, display/preferred name if provided, status, progressive-profile fields, created source/time, risk-review state | Has phones, memberships, vehicle links, confirmations, consents | Customer/self-service or Staff-assisted create; Customer views/updates allowed profile; Staff minimum view; sensitive merges/status need Manager approval |
| Verified phone numbers | Tracks phone ownership/control over time | ID, normalized number, masked display, verification status/method/time, valid-from/to, reassignment/shared flags, verification attempt metadata | Belongs to customer for a validity period; used by notifications/auth | Customer initiates; verification service confirms; Staff cannot change; Manager handles recovery/conflicts; Auditor read scoped metadata |
| Primary accounts | Benefit-owning account boundary | ID, business ID, type, label, status, primary-member customer ID, created time, closure time | Has members, vehicles, enrolments, progress, rewards, transactions | Customer creates/owns; Staff minimum lookup; Manager support is audited; primary-member change requires approved recovery |
| Group members | Records a person's membership in a primary account | ID, account ID, customer/limited-person ID, relationship label, status, effective/expiry times, invited/confirmed times | Joins customer/person to account; has permissions and vehicle scope | Primary member creates/removes; member views own; Staff sees selectable active member only; Manager exceptional changes require evidence/approval |
| Group-member permissions | Defines bounded authority | ID, membership ID, permission type, vehicle/location limits, transaction limits, redemption flag, effective/expiry times, granted-by/confirmed-by | Belongs to group member; checked by transactions/redemptions | Primary member proposes/confirms; member views own; Manager read/review; staff cannot edit |
| Vehicles | Identifies a vehicle or machine | ID, business boundary, normalized registration/asset number, type, alias, status, verification level, non-sensitive descriptors | Linked to accounts/customers; referenced by transactions | Customer/authorized Staff may propose; primary member confirms account link; Manager resolves duplicates; minimum lookup for attendants |
| Customer-vehicle relationships | Records ownership, assignment, or authorization without overstating legal ownership | ID, customer ID, vehicle ID, account ID, relationship type, status, effective/expiry dates, evidence/confirmation ref | Joins customer, vehicle, and primary account | Primary member creates/confirms; relevant customer views; Manager exception approval; Staff cannot silently persist a relationship |
| Transactions | Authoritative purchase and lifecycle header | ID, business/location IDs, state, server submitted time, bill ref, primary-account ID, purchaser ID/type, vehicle ID, staff ID, totals, currency, scheme snapshot ref, risk status, idempotency key | Has items, bill, evidence, confirmations, progress effects, disputes, corrections, alerts | Attendant creates/submits; involved customers view; Manager decides exceptions; no completed-row deletion/overwrite |
| Transaction items | Records purchased fuel/products/services | ID, transaction ID, product code/type, description, quantity, unit, unit price, tax/discount fields if needed, line total, eligibility result | Belongs to transaction; evaluated by scheme rules | Attendant creates before submit; customers/managers view scoped; corrections use approved event, not silent overwrite |
| Bills or invoices | Connects platform entry to source sale evidence | ID, transaction ID, issuer/location, normalized bill number, bill date/time, total, source/system ref, duplicate scope/key, optional document ref | One or more controlled links to transaction; duplicate checks | Attendant records; Customer sees relevant details; Manager corrects via approval; fiscal-system ownership is an open question |
| Evidence photographs | Stores controlled evidence metadata and protected object reference | ID, transaction/case ref, storage object ref, capture purpose, server receipt time, device/capture session, hash, MIME/size, retention class, access classification | Belongs to transaction, membership action, redemption, or dispute; has duplicate results | Attendant/customer flow captures when required; case-scoped Manager/Auditor view; no ordinary Staff history access; deletion only by retention/privacy workflow |
| Evidence duplicate-check results | Records detection output separately from evidence | ID, evidence ID, method/version, candidate evidence ID, similarity score, threshold, result, processed time, reviewer outcome | Compares evidence items; may create risk alert | System creates; authorized Manager/Auditor views; Manager records review outcome; algorithm result cannot directly accuse/cancel |
| Schemes | Defines a loyalty program identity and lifecycle | ID, business ID, name, description, status, owner, current version, location scope | Has versions/rules, enrolments, progress, rewards | Finance drafts; authorized approver publishes; Customer sees active relevant scheme; Staff read minimal summary |
| Scheme eligibility rules | Stores immutable published rule versions | ID, scheme/version ID, effective dates, eligible items/accounts/locations, milestone logic, exclusions, rounding, caps, group/return/redemption rules | Belongs to scheme version; referenced by transaction calculation snapshot | Finance creates draft; separate authorized role approves/publishes; no retroactive edit; Auditor reads |
| Customer scheme enrolments | Connects account/customer to scheme | ID, scheme ID, primary-account ID, status, enrolled/consented time, channel, eligibility snapshot, exit reason | Joins account to scheme; owns progress | System or Customer creates per enrolment policy; Customer views/exits if allowed; Manager handles exception; Finance read aggregate/scoped |
| Scheme progress | Materialized, explainable progress state | ID, enrolment ID, milestone/version, confirmed/pending/disputed totals, unit, last-calculated time, version | Derived from immutable transaction effects and adjustments; leads to rewards | System creates/updates atomically; Customer views; Finance/Manager review; manual changes only through approved adjustment |
| Rewards | Represents earned benefit entitlement | ID, enrolment/milestone ID, type, value, currency/unit, earned/available/held/redeemed/expired status, issued/expiry time, source transaction refs | Belongs to account/enrolment; has redemption(s) and adjustments | System issues; Customer views; Finance/Manager can hold/release under policy; no duplicate issuance |
| Reward redemptions | Records attempted and completed benefit delivery | ID, reward ID, requester/customer, authority ref, method, amount, status, provider ref, initiated/completed times, staff/location, acknowledgement/evidence refs, idempotency key | Belongs to reward; has confirmation and audit events | Authorized Customer initiates; Staff may assist; system/provider completes; high-value/manual delivery needs Manager/Finance approval |
| Customer confirmations | Records explicit confirmation, rejection, or passive confirmation basis | ID, subject type/ID, customer ID, response, channel, verified-session/token ref, server time, expiry, device/network metadata as permitted | Relates to transaction, membership, phone change, or redemption | Customer creates; system may create labeled passive confirmation after policy window; scoped Manager/Auditor view; immutable |
| Disputes | Manages customer-reported incorrect/unauthorized activity | ID, transaction/reward ref, reporter, reason category, description, status, priority, assignee, opened/resolved times, outcome/reason | Has evidence, review actions, correction/approval, notifications | Customer/support creates; Manager owns decision; support updates communications only; Customer views own status; Auditor reads |
| Corrections and approvals | Preserves proposed and authorized compensating changes | ID, subject ref, proposed changes, reason, proposer, approver(s), status, before/after representation, effective time, financial/scheme effects | Links original record, dispute/risk case, progress adjustment, notifications | Staff/support may propose; authorized Manager/Finance approves by policy; system applies; all involved read scoped; immutable after decision |
| Notifications | Tracks intended and actual communications | ID, business ID, recipient/contact ref, event type, template/version, channel, locale, payload ref/redacted preview, status, provider ref, attempts, sent/delivered/failed times, secure-link ref | Relates to customer and business event | System creates/sends; Customer sees communication history if offered; support/Manager sees delivery status; templates managed by authorized Admin |
| Customer consent | Records purpose-specific permission or acknowledgement | ID, customer ID, purpose, notice/version, status, captured time/channel, actor, expiry/withdrawal time, evidence ref | Governs messaging, evidence, enrolment, optional analytics, identity controls | Customer grants/withdraws; Staff may facilitate but not fabricate; compliance/Admin manages notice versions; Auditor reads |
| Audit logs | Provides immutable history of sensitive actions and reads | ID, business ID, actor type/ID, role/session, action, target type/ID, server time, location/device context, outcome, reason, correlation ID, protected change summary | References any sensitive entity/event | System only creates; no user updates/deletes; assigned Manager/Auditor reads; export access audited |
| Fraud or risk alerts | Creates neutral review work from configured signals | ID, business ID, signal type/version, severity, subject refs, facts/features, status, assigned reviewer, created/resolved times, outcome, rationale | Relates to transactions, accounts, people, vehicles, evidence, staff, rewards | System or authorized reporter creates; Manager reviews/resolves; Auditor reads; ordinary Staff/customer cannot see internal alert labels |

### Conceptual integrity rules

- IDs are stable and never recycled. Display labels, phones, vehicle links, and memberships are effective-dated.
- Every transaction mutation after submission is represented by a state event, correction, cancellation, or reversal—not destructive replacement.
- Published scheme rules and their calculation inputs are versioned and reproducible.
- Sensitive storage objects use non-public buckets and expiring authorized access.
- Cross-business references are prohibited except through explicitly governed platform-control records.
- The final physical schema, RLS policies, indexes, constraints, storage design, and retention jobs require a separate technical design and threat model.

## 18. Privacy, security, consent, and audit requirements

### Privacy and progressive data collection

- Collect only information needed for registration, account authorization, purchase attribution, scheme operation, dispute handling, security, or a documented legal obligation.
- Present a purpose explanation at the point of collecting optional profile data, photographs, vehicle data, or identity evidence.
- Separate required transactional communications from optional marketing consent.
- Do not display full phone numbers, photographs, balances, purchase histories, fraud reviews, or other members' details to ordinary staff.
- Customer exports and deletion/closure requests must be identity-verified and must account for legally or contractually retained financial/audit records.

### Authentication and phone changes

- OTPs must be short-lived, rate-limited, single-purpose, and protected against enumeration and replay.
- Sensitive actions require a recent authenticated session or step-up verification.
- A phone change must verify the new number and, where safely possible, notify/confirm through the old number. Loss of old-number access uses a reviewed recovery path.
- Reassigned/shared numbers must support detachment from a prior customer without merging unrelated histories.
- Recovery must prioritize the stable customer ID, account relationships, prior confirmations, and approved evidence rather than phone possession alone.

### Authorization and tenancy

- Enforce least privilege on the server and database. Client-side hiding is not authorization.
- Authorization evaluates business, assigned locations, role/capability, customer/account relationship, transaction state, and action-specific limits.
- New Supabase resources must be created under the dedicated PumpAxis project. Existing personal project URLs, references, keys, migrations, buckets, or production data must not be reused.
- Separate production from non-production data. **Decision Required:** whether this means separate Supabase projects for development/staging/production or another reviewed environment model.
- Elevated service credentials must remain server-side, narrowly used, rotated, monitored, and unavailable to customer or attendant clients.

### Audit

- Log authentication/recovery events, phone changes, group/permission changes, sensitive evidence access, transaction submissions and transitions, corrections, cancellations, reversals, scheme publication, manual adjustments, reward delivery, dispute decisions, staff/role changes, exports, and retention/privacy actions.
- Each event records actor, effective role, target, server time, correlation ID, outcome, source context, and reason where required.
- Audit records must be append-only to business users. Access to the audit viewer/export is itself audited.
- Clock synchronization, log integrity monitoring, restricted retention jobs, and tested restoration are required.

### Retention and customer rights

**Decision Required:** retention periods for transaction records, bills, evidence photographs, duplicate features/hashes, notifications, consents, disputes, security logs, and audit logs. The business must obtain qualified legal/privacy review for applicable jurisdictions before launch.

Recommended approach:

- define retention by purpose and record class rather than one universal period;
- delete or irreversibly de-identify raw photographs as soon as their approved purpose and retention obligation expire;
- retain only derived similarity data when justified and legally permitted;
- place disputes/legal holds under a documented exception process;
- provide access, correction, closure, consent-withdrawal, and deletion-request workflows; and
- preserve required audit/financial records with restricted access even when the customer-facing account closes, while removing them when the retention basis expires.

## 19. Edge cases and exception handling

| Scenario | Required handling |
| --- | --- |
| OTP delayed, expired, or repeatedly requested | Show neutral retry state, enforce rate limits, allow approved fallback, and prevent account enumeration |
| Phone belongs to an existing or former customer | Do not expose the prior person; use recovery/reassignment review and stable customer IDs |
| One phone is intentionally shared | Record shared-contact limitation, require stronger checks for sensitive actions, and avoid treating it as unique identity |
| Duplicate customer suspected | Block automatic merge; preserve both histories until authorized review confirms a safe merge/link outcome |
| Member removed while transaction draft exists | Revalidate authorization on server submission and reject/escalate if no longer valid |
| Vehicle belongs to multiple legitimate accounts | Require explicit account selection and scoped relationship; do not assume exclusivity |
| Unregistered vehicle or no vehicle | Apply configured evidence/confirmation policy and record reason; do not fabricate a placeholder vehicle |
| Guest wants credit later | Use a secure claim/review flow; do not silently reassign a confirmed transaction |
| Duplicate bill entered | Return existing transaction when idempotent retry; otherwise prevent or review according to duplicate scope |
| Bill corrected after submission | Use approved correction linked to original; notify affected customers and recalculate progress |
| Bill date is earlier than entry | Capture server time and stated bill time separately; require reason/approval beyond configured lateness |
| Device clock is wrong | Use server time; retain device time only as a diagnostic signal |
| Evidence camera permission denied | Explain purpose; permit approved alternative or manager review according to risk policy, never gallery substitution where live capture is mandatory |
| Evidence upload interrupted | Keep transaction Pending or local draft, retry idempotently, and do not mark evidence present until server verifies it |
| Same face appears in a new photo | Do not reject on that basis; evaluate image duplication separately |
| Near-duplicate detector is uncertain | Queue human review and expose similarity facts, not an accusation |
| Customer and primary member disagree | Preserve both responses, mark Disputed, stop passive confirmation, and route to review |
| Customer does not respond | Routine transaction may confirm only after the approved dispute window; high-risk transaction remains pending/reviewed under policy |
| Notification provider fails | Retry/fallback per policy, show delivery state to authorized staff, and never infer confirmation |
| Milestone crossed by concurrent transactions | Use atomic calculation/idempotency so a reward is issued exactly once |
| Transaction reversed after reward earned | Hold or adjust benefit through an explicit policy; never erase the history |
| Reward already redeemed before reversal | Create a reviewable liability/negative-balance case under approved policy; do not silently debit unrelated value |
| Reward expires during dispute | Pause expiry or apply the decided grace rule; the exact rule is a decision required |
| Offline drafts collide on sync | Deduplicate using device/idempotency keys and bill rules; present conflict for correction rather than duplicating progress |
| Lost/replaced staff device | Admin revokes sessions/device trust; offline drafts require controlled recovery and revalidation |
| Staff member leaves | Disable access promptly, preserve historical attribution, reassign open cases, and review active sessions/devices |
| Location closes or changes business | Prevent new activity, preserve historical display, and follow tenant/data-transfer decisions |
| Customer closes account | Revoke interactive access/authorizations, settle rewards per policy, retain only justified records, and notify primary/member relationships |

## 20. Non-functional requirements

Values marked **recommended target** are proposed for MVP validation, not confirmed contractual service levels.

| Area | Requirement or recommended target |
| --- | --- |
| Performance | Routine attendant flow should require no more than a few deliberate actions after lookup. Recommended target: P95 server response under 2 seconds for normal API operations and P95 submit-to-acknowledgement under 5 seconds when providers/evidence are not blocking. |
| Transaction speed | Recommended target: median routine entry under 15 seconds after customer/account identification, excluding physical fueling and external bill creation. Validate in the pilot. |
| Availability | Recommended production target: 99.9% monthly availability for core transaction and customer-confirmation services, excluding approved maintenance. Contractual SLA is a decision required. |
| Reliability | Submitted operations are idempotent; reward issuance/redemption is atomic; provider retries cannot duplicate records or benefits. |
| Offline resilience | Encrypted local drafts, explicit sync state, conflict handling, and no false confirmation or reward issuance while offline. |
| Security | Encryption in transit/at rest, secure secrets, least privilege, RLS or equivalent database controls, session/device revocation, rate limiting, dependency scanning, and regular access review. |
| Privacy | Data minimization, purpose limitation, masked staff views, consent/version history, case-scoped evidence access, and approved retention/deletion. |
| Auditability | Important decisions and sensitive reads are reconstructable by actor, time, reason, inputs, outcome, and related records. |
| Accessibility | Customer and manager web experiences should target WCAG 2.2 AA; attendant flows support large targets, high contrast, and one-handed use where practical. |
| Localization | Architecture supports local languages, locale-specific dates/numbers, and template variants. MVP languages are a decision required. |
| Scalability | Design must support high-volume bursts by location, background notification processing, partitionable audit/event data, and later business isolation without premature microservices. |
| Maintainability | Business rules are versioned/configurable, calculations have deterministic tests, and state transitions use explicit domain services/contracts. |
| Observability | Monitor API latency/errors, queue backlog, notification delivery, evidence processing, auth abuse, sync failures, reward inconsistencies, and privileged actions. |
| Recovery | Backups, restore tests, RPO, and RTO are required. Exact RPO/RTO and regional disaster-recovery design are decisions required. |
| Compatibility | Attendant device/browser and camera support matrix, minimum OS versions, low-end device performance, and supported customer browsers require pilot validation. |

## 21. MVP definition

### MVP outcome

A participating customer can register with a verified phone, create or use a primary account, authorize members and vehicles, receive correctly attributed qualifying purchases, see scheme progress, confirm or dispute activity, and redeem an earned benefit. Staff and managers can complete, review, and audit the entire lifecycle without deleting history or viewing unnecessary customer data.

### Included

1. Phone-first customer registration and OTP verification.
2. Internal customer IDs, primary accounts, groups, permissions, and vehicles.
3. Attendant mobile experience for fast transaction/bill entry.
4. Deterministic evidence triggers and optional live camera capture.
5. Transaction state machine and routine/high-risk confirmation.
6. SMS or WhatsApp transactional notifications with secure web links.
7. Basic versioned value/quantity scheme calculations.
8. Customer portal for progress, transactions, rewards, confirmation, and disputes.
9. Manager web dashboard for queues, corrections, approvals, and risk review.
10. Reward issuance, authorization, redemption, acknowledgement, and reversal effects.
11. Role/location-scoped access, staff/device disablement, consent, and audit history.
12. Safe offline draft/sync support if the pilot's connectivity assessment confirms it is launch-critical; otherwise it becomes the first post-MVP release blocker for affected locations.

### Deferred

- advanced fraud scoring and machine-learning anomaly models;
- automated perceptual image similarity and face/liveness verification;
- complex scheme stacking, partner rewards, predictive campaigns, and personalization;
- POS, dispenser, accounting, payment, bank, messaging-aggregator, vehicle-registry, or ERP integrations beyond the chosen notification provider;
- native customer app and advanced fleet telematics;
- self-service multi-business commercialization; and
- Accounts, daily sales, reconciliation, accounting, and management reporting.

## 22. Future roadmap

Roadmap sequencing is a recommendation and must be revisited after pilot evidence.

| Phase | Focus | Candidate capabilities |
| --- | --- | --- |
| MVP | Trustworthy loyalty loop | Registration, groups, purchases, notifications, progress, disputes, rewards, roles, audit |
| Post-MVP hardening | Operational reliability | Offline improvements, multilingual UI, better recovery, configurable risk thresholds, richer evidence review |
| Intelligence | Scaled controls | Perceptual duplicate detection, anomaly scoring, advanced analytics, liveness/identity only if justified |
| Integrations | Reduce manual entry | POS/dispenser, messaging, digital payments, accounting/ERP, fleet and voucher providers |
| PumpAxis Accounts | Separate future requirements | Daily sales, collections, expenses, reconciliation, and management reporting—not defined here |
| Commercial platform | Multi-business product | Tenant provisioning, branding, policy packs, subscriptions, support tooling, data residency and exports |
| Adjacent verticals | Broader dealer network | CNG, EV charging, industrial fuel, lubricants, car wash, tyres/batteries, service, parts, distributor loyalty |

## 23. Commercialization opportunities

### Target segments

- independent petrol pumps needing loyalty transparency;
- fuel-station chains needing standardized schemes and centralized oversight;
- fleet operators wanting purchaser/vehicle visibility across approved suppliers;
- CNG and EV-charging stations;
- doorstep and industrial fuel suppliers;
- lubricant distributors;
- car-wash chains;
- tyre and battery dealers;
- vehicle service centres and spare-parts dealers; and
- other dealer/distributor loyalty programs where benefits pass through intermediaries.

### Configurable multi-business model

Each future business requires its own:

- tenant/business identity, legal configuration, branding, locale, timezone, and communication templates;
- locations, staff identities, role assignments, devices, and approval limits;
- customer/account namespace and cross-business sharing policy;
- vehicles, products, bills, transactions, schemes, rewards, disputes, evidence, and audit history;
- notification sender/provider settings and consent text;
- risk policies, thresholds, evidence triggers, retention schedules, and reporting access; and
- encryption/secrets boundary, exports, backups, deletion, and offboarding procedure.

Tenant isolation must be enforced in every query and storage path, preferably with database-level controls in addition to application authorization. **Decision Required:** shared database with strict tenant isolation, separate schema, or separate project/deployment tiers for larger clients.

### Possible commercial models — future ideas

- per-location monthly subscription;
- usage tiers based on qualifying transactions or active primary accounts;
- enterprise chain licensing with centralized administration;
- paid messaging/evidence storage allowances;
- integration and onboarding fees; and
- white-label or co-branded deployments.

Pricing, customer ownership, cross-business loyalty, implementation services, and data-processing terms require market and legal validation.

## 24. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Customer perceives surveillance | Low adoption and reputational harm | Risk-based photos, plain-language purpose, visible value, alternatives/review, minimal retention |
| Phone treated as identity | Account takeover or wrong history | Stable customer ID, phone history, step-up, reassignment/recovery workflow |
| Staff bypasses attribution | Missing/incorrect progress | Fast UX, mandatory core fields, notifications, adoption monitoring, exception review |
| Reward rules are ambiguous | Financial disputes and liability | Versioned rules, worked examples, acceptance tests, finance approval before publish |
| Duplicate or late entries | Inflated progress/reward leakage | Idempotency, bill uniqueness, server time, backdate approvals, alerts |
| False-positive fraud alerts | Customer/staff harm | Human review, explainable facts, neutral language, documented outcomes/appeals |
| Evidence data is breached | Severe privacy and trust harm | Private storage, case-scoped access, encryption, audit, short justified retention |
| Notification failure | Customer cannot verify purchase | Provider tracking, retry/fallback, portal history, no assumed confirmation |
| Weak connectivity | Queue delays and duplicate submissions | Encrypted drafts, idempotent sync, clear state, pilot network testing |
| Manager abuse or collusion | Corrections/reward leakage | Separation of duties, approval limits, immutable audit, periodic independent review |
| Reversal after redemption | Financial loss and customer dispute | Holds, explicit negative-balance/recovery policy, finance review |
| New Supabase project misconfigured | Cross-environment exposure or data loss | Dedicated project checklist, environment separation, RLS tests, secret isolation, backup/restore test |
| Premature multi-tenant complexity | Delayed MVP | Carry business IDs and clean boundaries; defer self-service tenant platform |
| Accounts scope leaks into Loyalty | Requirements and delivery expansion | Separate module ownership and future PRD; only define integration boundary now |

## 25. Success metrics

Every metric needs a baseline, reporting period, eligible population, owner, and target before launch. Targets are decisions required.

| Metric | Definition | Why it matters |
| --- | --- | --- |
| Customer registration rate | Verified new registrations ÷ eligible unique customers offered registration | Measures reach and onboarding acceptance |
| Registration-to-first-purchase conversion | Newly registered customers/accounts with a qualifying purchase within the chosen window ÷ new registrations | Detects low-value or broken onboarding |
| Repeat purchase rate | Customers/accounts with another qualifying purchase within the chosen period ÷ customers/accounts with an initial purchase | Loyalty/retention indicator |
| Purchase frequency | Confirmed qualifying purchases per active account/customer per period | Shows engagement while requiring segment controls |
| Average purchase value | Confirmed eligible amount ÷ confirmed qualifying transactions | Tracks commercial value and mix |
| Scheme participation | Eligible accounts enrolled or contributing ÷ eligible accounts | Shows scheme reach |
| Scheme completion | Enrolments reaching defined milestone ÷ eligible active enrolments | Shows attainability and engagement |
| Reward redemption | Redeemed rewards ÷ available earned rewards, measured before/after expiry | Shows benefit usefulness and delivery |
| Verified benefit-delivery rate | Rewards with required recipient acknowledgement/provider proof ÷ rewards marked delivered | Primary anti-leakage outcome |
| Missing-benefit complaints | Valid missing/partial benefit complaints per 1,000 qualifying transactions or rewards | Direct trust measure |
| Disputed transactions | Disputed transactions ÷ submitted qualifying transactions, segmented by outcome, staff, location, and reason | Attribution/control health |
| Confirmed fraud or leakage | Reviewed cases confirmed under policy, including value prevented/lost/recovered | Outcome metric; alerts alone are not fraud |
| Transaction-entry time | Median and P95 from customer identification to successful server submission, excluding fueling | Protects forecourt throughput |
| Verification drop-off | Started registrations/high-risk confirmations not completed ÷ started attempts, by reason | Quantifies friction |
| Fleet-customer retention | Active fleet accounts retained over the chosen renewal/activity period | Commercial durability |
| Staff adoption | Active assigned attendants submitting valid transactions ÷ expected active attendants; include bypass/error rates | Operational adoption |
| System availability | Successful core-service availability during defined service window | Reliability and contractual readiness |

Recommended supporting guardrails include OTP failure rate, notification delivery rate, pending-age distribution, correction rate, reward issuance/reconciliation mismatch, evidence-trigger rate, dispute-resolution time, and privileged-action anomalies.

## 26. Acceptance criteria

### Customer identity and access

- A new customer can verify a phone number, receive a distinct internal customer ID, and access a secure portal without installing an app.
- A reused/reassigned phone cannot automatically expose or merge another customer's history.
- Staff search and transaction screens never reveal prohibited history, balances, photographs, risk reviews, or unrelated members.

### Primary accounts, groups, and vehicles

- A primary member can add/remove an authorized member and delegate/revoke redemption only through the approved confirmation flow.
- The primary member receives notifications for every membership/authority change.
- Removed memberships and vehicle relationships cannot authorize new purchases but remain historically attributable.
- An attendant cannot create reusable membership or vehicle authority without required customer authorization.

### Transactions and evidence

- A submitted transaction records all required parties, location, bill, items, scheme, server time, and progress effect.
- Every specified state exists and invalid state transitions are rejected and audited.
- Routine transactions can complete without a photograph when policy does not require one.
- When live evidence is required, gallery upload is unavailable and the evidence is bound to the correct pending record.
- Exact duplicate evidence and duplicate bill checks create the configured prevention/review outcome without treating face recurrence as duplication.
- Retries or offline synchronization do not create duplicate transactions, progress, or rewards.

### Schemes, notifications, and rewards

- QA can configure a value-based and a quantity-based scheme with eligible items, dates, milestone, reward, exclusions, caps, expiry, location, group, return, and redemption rules.
- The same published scheme version produces deterministic results for documented boundary examples, including rounding and reversals.
- Purchaser and primary member receive the required privacy-safe transaction content when contact is available, with delivery state recorded.
- Secure links expire and cannot be reused outside their intended action.
- A reward is issued once per qualifying milestone and cannot be redeemed twice under concurrent requests.
- Employee-mediated cash/physical delivery cannot reach final delivered status when customer acknowledgement is required but absent.

### Disputes, management, and audit

- A customer can report a transaction, receive a case reference, and see resolution status.
- A manager can review scoped evidence and apply an approved correction/cancellation/reversal without overwriting the original transaction.
- Progress, reward liability, and notifications update consistently after the decision.
- All sensitive actions and required sensitive reads appear in immutable audit history with actor, time, target, reason, and outcome.
- Lost devices and departed staff can be disabled without removing historical attribution.

### Data boundary and readiness

- All PumpAxis environments used for the pilot point only to approved dedicated PumpAxis Supabase resources.
- Automated authorization tests demonstrate that attendants, customers, managers, auditors, and users from another test business cannot cross their allowed record scopes.
- Backup restoration, notification failure, provider retry, low-connectivity sync, and high-risk confirmation scenarios pass before production pilot.

## 27. Open questions and decisions required

### Business and product ownership

1. What customer-facing subtitle or explanation, if any, should accompany the
   confirmed **Loyalty** module name?
2. Who is the accountable business owner and who can approve scheme, finance, privacy, fraud, and support policies?
3. Which outlet(s), customer segments, fuel/product types, and scheme will participate in the first pilot?
4. What are the baseline complaint/leakage figures and quantified pilot objectives?

### Account and authorization rules

5. Can one primary account have co-primary controllers?
6. What proof, if any, is required for company/fleet authority, vehicle relationship, or high-value account recovery?
7. Can a person belong to multiple accounts, and what limits or disclosures apply?
8. Can delegated members further delegate, or is delegation always non-transferable? Recommended: non-transferable.
9. Are minors permitted as family members, and under what guardian controls?

### Transactions and confirmation

10. What makes a transaction qualifying, and is the platform the bill system of record or a loyalty copy of another bill?
11. What is the duplicate bill-number scope: location, business, issuer series, day, or another composite?
12. What values define large, suspicious, late, or backdated transactions?
13. What is the routine dispute window, and which timezone/business-day cutoff applies?
14. Who may approve corrections, cancellations, returns, and reversals at each value threshold?
15. What customer fallback exists when SMS/WhatsApp or the registered phone is unavailable?

### Scheme and reward policy

16. Is enrolment explicit or automatic after notice/consent?
17. Are milestones single, repeatable, tiered, or cumulative, and does excess carry forward?
18. Are taxes/discounts included in qualifying value? What are rounding and quantity precision rules?
19. How do partial returns, disputes, expiry during review, and reversal after redemption affect balances?
20. Which reward methods launch first, who funds them, and what proof completes delivery?
21. What are expiry, grace period, caps, stacking, transfer, and negative-balance rules?

### Evidence, fraud, privacy, and support

22. Which deterministic triggers require a live photograph in the pilot?
23. What non-photo alternative or escalation exists for camera/accessibility/privacy exceptions?
24. What evidence overlay/reference design is acceptable and understandable?
25. What retention period and lawful basis apply to each record/evidence class?
26. Which risk signals and thresholds launch in MVP, who reviews them, and within what service level?
27. What appeal/escalation path exists for rejected disputes or held rewards?
28. Which legal jurisdictions, languages, consent wording, messaging rules, and customer-rights procedures apply?

### Technology and operations

29. What will the new Supabase organization/project be called, who owns it, which region is selected, and how are environments separated?
30. What are the approved attendant devices, browsers/OS versions, device-management approach, and offline requirement?
31. Which SMS/WhatsApp provider, sender identities, templates, fallback, and cost limits are approved?
32. What are the production availability, support hours, RPO, RTO, backup retention, and incident owners?
33. Which exports or integrations are required for MVP, if any?
34. What data must the future Accounts module receive from Loyalty, and which system will own financial truth? This needs a separate future PRD.

### Commercialization

35. Is commercialization initially single-tenant deployment, shared multi-tenant SaaS, or both?
36. Who owns customer relationships and data when a fleet transacts across multiple businesses?
37. Which tenant isolation, branding, pricing, support, portability, deletion, and contractual commitments are required?
38. Does PumpAxis require formal trademark and domain clearance before public branding? Recommended: yes.

## 28. Suggested pilot plan

### Phase 0 — decisions and baseline (approximately 1–2 weeks; recommendation)

- Name the business, product, scheme, privacy, fraud-review, support, and technical owners.
- Resolve launch-blocking questions from Section 27.
- Document the current scheme with worked purchase, group, return, rounding, expiry, and redemption examples.
- Measure current transaction time, eligible customer volume, complaint rate, benefit delivery method, leakage cases, network quality, and staff/device readiness.
- Create and secure the dedicated PumpAxis Supabase project/environment plan; do not link it to the personal project.

Exit criterion: signed business-rule pack, data/consent approval, technical threat model, and measurable pilot targets.

### Phase 1 — controlled internal validation

- Configure one test business and location with synthetic customers, staff, vehicles, bills, schemes, and rewards.
- Run permission, state-transition, calculation, concurrency, notification, evidence, offline, recovery, and audit test cases.
- Conduct role-based usability tests with attendants, managers, primary customers, and fleet drivers.
- Measure routine entry time and remove unnecessary steps before live customer use.

Exit criterion: acceptance criteria pass; no critical security/privacy issue; scheme examples reconcile exactly.

### Phase 2 — limited live pilot

- Start with one location, one simple scheme, a trained staff group, and a capped customer cohort.
- Use deterministic evidence triggers rather than universal photography.
- Provide an on-shift supervisor and daily case/reconciliation review.
- Monitor registration funnel, transaction time, notification delivery, disputes, corrections, reward issuance/delivery, staff adoption, and customer feedback.
- Do not change published scheme rules silently during the pilot; version any approved change.

Recommended duration: enough time for a meaningful share of participants to approach or achieve the actual scheme milestone. Exact cohort and duration are decisions required.

### Phase 3 — evaluate and expand

- Compare results with the Phase 0 baseline and investigate segment/location/staff differences.
- Confirm whether reduced complaints and verified delivery justify operational cost and customer friction.
- Fix high-severity issues before adding locations or complex schemes.
- Decide go, revise, or stop using pre-agreed thresholds.
- Only after a successful pilot, define the separate PumpAxis Accounts PRD and assess multi-location/commercial requirements.

### Pilot governance

- Daily: operational exception and notification-delivery review.
- Weekly: business, customer, fraud-control, privacy, and reliability metrics review.
- At each phase gate: written approval by the accountable business and technical owners.
- Customer complaints and risk alerts remain cases for evidence-based review, never automated accusations.
