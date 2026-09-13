# PumpAxis Client Strategy

| Attribute | Value |
| --- | --- |
| Product | **PumpAxis** — confirmed |
| Status | Proposed delivery architecture; confirmed role surfaces plus recommended platform choices |
| Scope | Operator, supervisor, management, audit, and customer access across PumpAxis modules |
| Data platform | Dedicated new PumpAxis Supabase project; the existing personal project is prohibited |

This document defines how different PumpAxis users should access the product.
It does not create an application workspace, choose a mobile framework, or
authorize implementation.

## 1. Decision summary

PumpAxis should use a **hybrid client strategy** rather than forcing every role
into one web or mobile application:

| User group | Recommended client | MVP position |
| --- | --- | --- |
| Operator/salesman | Android-first mobile application | Primary operational client |
| Shift supervisor | Mobile application for live shift work, with scoped responsive web access when useful | Include essential shift functions |
| Owner/pump manager | Responsive web application | Primary management client |
| Accountant/finance | Responsive web application | Role-scoped financial and approval surfaces |
| Auditor/viewer | Responsive web application | Read-only assigned scope |
| Customer/fleet owner | Lightweight responsive web portal opened from SMS/WhatsApp links | Primary customer client; no installation required |
| Native customer app | Not recommended for MVP | Consider only after demonstrated repeat-use demand |
| iOS operator app | Not recommended by default for MVP | Build only if the approved device inventory requires it |

The already-confirmed product direction is:

- attendants use a mobile application;
- managers use a web dashboard;
- customers use a lightweight web portal and are not required to install an
  application initially; and
- SMS or WhatsApp notifications provide secure entry links.

The **Android-first**, no-native-customer-app, and no-iOS-by-default choices are
recommendations pending device and pilot validation.

## 2. Why the hybrid model fits PumpAxis

### Operators need an operational device client

The operator experience includes rapid numeric entry, draft recovery, weak or
unavailable connectivity, camera-controlled evidence, device/session revocation,
handoffs, credit activity, and shift settlement. A mobile application gives the
product stronger control over local persistence, queued synchronization, camera
capture, device state, and foreground operational behavior.

Android's official offline-first guidance recommends a persistent local data
source, explicit write strategy, synchronization queues, and conflict handling
rather than assuming continuous network access. See [Android offline-first app
architecture](https://developer.android.com/topic/architecture/data-layer/offline-first).

### Managers need information density and comparison

Owners, managers, accountants, and auditors need larger tables and drill-downs:

```text
Organization → pump → day → shift → operator → source entry/evidence
```

They also need scheme configuration, credit exposure, pending attestations,
variance review, report/PDF generation, staff access, and audit history. A
responsive web application supports desktop, laptop, tablet, and occasional
phone use without requiring a separate manager installation.

### Customers need immediate access, not installation

Most customer actions begin with a purchase, reward, credit, membership, or
dispute notification. A secure web link can open the exact permitted action with
minimal friction. The portal may be installable later, but installation must not
be a prerequisite for registration, confirmation, progress, statements,
redemption, or dispute reporting.

Web camera access is technically possible in secure contexts through
`getUserMedia`, but it depends on browser permissions and device behavior. See
[MDN `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
This is useful for customer-assisted flows, but it does not remove the
recommendation for an operator mobile client where controlled live capture and
offline work are central.

## 3. Logical client architecture

```text
Android-first operator/supervisor app
        │
        ├──────────────┐
        ▼              ▼
PumpAxis service/API boundary ──> dedicated PumpAxis Supabase project
        ▲              ▲
        │              │
Management web app     Customer/fleet web portal
```

All clients use the same versioned business contracts and server-side
authorization. They do not implement independent reward, reconciliation,
credit, or approval truth.

The diagram is logical, not a deployment decision. The management dashboard and
customer portal may share a web workspace or be separately deployed after auth,
security, failure, branding, and operational ownership are reviewed.

## 4. Operator mobile application

### Primary responsibilities

- show only the logged-in operator's organization, assigned pump, shift,
  machines/nozzles, tasks, settlement, permitted customer context, and required
  handoffs;
- capture opening/closing meter readings, testing adjustments, allocations,
  credit events, and live evidence where required;
- provide large numeric inputs, explicit units/currency, sensible defaults,
  validation, autosave, and clear local/sync/server states;
- support responsibility transfers and temporary/relief assignments;
- display the familiar left/accountable versus right/allocated mental model;
- preserve local work during connectivity loss; and
- prevent operator access to owner-wide financials, other operators' full
  settlements, confidential customer histories, fraud flags, or manager-only
  records.

### Offline state model

```text
Local Draft → Queued for Sync → Server Validating → Submitted
                    ├─────────→ Conflict / Review Required
                    └─────────→ Rejected with actionable reason
```

- The device may treat its encrypted local store as the source for the user's
  unsynchronized working draft.
- The server remains authoritative for submission time, accepted transaction
  state, uniqueness, permissions, calculations, scheme progress, rewards,
  attestations, approvals, and report finalization.
- Offline UI must never claim that another person attested, a reward was issued,
  a notification was delivered, or a report was finalized.
- Every queued write uses a stable idempotency key. Synchronization conflicts are
  resolved by explicit domain rules and review, not silent last-write-wins.
- Sensitive actions such as final approval, high-risk redemption, phone change,
  or recipient attestation may remain online-only when fresh server state is
  required.

### Camera and evidence

- Required live evidence opens an app-controlled camera flow rather than a
  general file/gallery picker.
- The application binds capture intent, local draft/transaction reference,
  operator, device/session, and capture time before upload.
- Server receipt/submission time remains authoritative; device/EXIF time is
  secondary.
- Evidence upload may retry idempotently, but the server must not mark evidence
  complete until integrity and subject binding pass.
- A camera denial/failure follows the configured alternative or manager-review
  path; the client must not substitute a gallery image where live capture is
  mandatory.

### Device controls

- Each production device/session is attributable and revocable.
- Lost/replaced devices and departed staff lose access promptly without erasing
  historical attribution.
- Local data is encrypted, minimized to assigned work, protected by platform
  storage controls, and removed according to logout/revocation/retention policy.
- The client must fail closed when an assignment expires or server policy
  indicates that access was revoked.

## 5. Supervisor experience

Supervisors need two complementary surfaces:

- mobile access for live shift operations, operator assignment/handover,
  completeness checks, and permitted exception handling; and
- responsive web access for comparing operators, reviewing pending
  attestations/variance, and handling a larger queue when the role allows it.

The product should not require feature-for-feature duplication. Each workflow
has one primary client, and secondary surfaces expose only what is genuinely
needed. Server permissions remain identical regardless of client.

## 6. Management, finance, and audit web application

### Required characteristics

- responsive desktop-first information layout with usable tablet/phone fallback;
- organization and selected-pump dashboards with pump/day/shift/operator
  drill-down;
- queues for pending handoffs, preliminary closures, disputes, corrections,
  variance, credit, reward delivery, and access reviews;
- role-specific scheme, pump, price, payment, staff, approval, and report
  configuration;
- versioned PDFs, exports, audit views, and secure evidence access;
- read-only enforcement for auditor/viewer roles; and
- no assumption that an owner, manager, accountant, and auditor share the same
  navigation or fields merely because they use one web application.

### Responsive priority

Desktop/tablet is primary for dense review. Critical owner actions—view daily
summary, confirm receipt, inspect material alert, or approve within authority—
should remain usable on a phone browser reached through a secure notification.

## 7. Customer and fleet web portal

### Entry and capabilities

Customers enter through a trusted PumpAxis URL from SMS/WhatsApp or direct login.
The portal supports:

- phone-first verification and progressive profile completion;
- purchase confirmation/problem reporting;
- Loyalty progress, rewards, redemption, expiry, and disputes;
- primary account, member, redemption-authority, and vehicle management;
- credit issue confirmation, balance, statement, repayment allocation, and
  dispute status where implemented;
- notification history and privacy/consent actions; and
- secure handoff attestation when the recipient is authorized through a customer
  or external-recipient flow.

### Security and privacy

- Links use expiring, high-entropy, single-purpose tokens and contain no sensitive
  record data in the URL.
- Sensitive actions require recent authentication or step-up verification.
- A link reveals only the permitted customer/account/action and never unrelated
  group members, other pumps' confidential data, evidence, or management flags.
- Shared/reassigned phone handling follows stable customer IDs and reviewed
  recovery rather than trusting current phone possession as permanent identity.

## 8. Shared backend and source-of-truth rules

- Use one PumpAxis service/API boundary with versioned domain contracts across
  mobile and web clients.
- Use only the dedicated new PumpAxis Supabase project and its approved
  environments. Do not reuse the personal project's URL, keys, schema,
  migrations, buckets, or production data.
- Enforce organization, selected-pump, pump, shift, own-record, relationship,
  state, and action limits on the server/database—not only through client UI.
- Published scheme rules, accepted closure calculations, credit allocations,
  handoff attestations, approvals, and finalized reports have one authoritative
  owner and idempotent events.
- Notifications and PDFs are delivery projections; structured server records
  remain authoritative.
- Mobile/web clients may cache purpose-limited views but cannot become alternate
  business ledgers.

## 9. PWA and web-only prototype boundary

A responsive progressive web application may be appropriate for an early
prototype when:

- the goal is workflow and form validation rather than production control;
- pilot devices and browsers are known and tested;
- network connectivity is consistently reliable;
- offline write guarantees are not yet required; and
- camera/evidence behavior passes the intended device matrix.

A web-only production decision should be rejected or explicitly risk-accepted if
the pilot proves that operators need durable offline writes, dependable
background synchronization, app-controlled capture, managed device behavior, or
fast recovery across long shifts.

Web push can support installed web experiences on modern platforms, including
Home Screen web apps on supported iOS versions, but customer transactional SMS
or WhatsApp remains the initial dependable entry channel. See [Apple web push
documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

## 10. Recommended delivery sequence

| Phase | Client work | Purpose |
| --- | --- | --- |
| Prototype | Responsive operator workflow prototype plus management/customer web flows | Validate terminology, navigation, calculations, and role disclosure using non-production data |
| Foundation | Shared API/auth contracts, dedicated PumpAxis environments, organization/pump scopes, audit, notification, sync protocol | Prevent divergent client business logic |
| Operational MVP | Android-first operator/supervisor client; management web dashboard; customer/fleet web portal | Deliver the smallest complete Loyalty and/or shift-close loop approved for pilot |
| Hardening | Offline conflict handling, device revocation, low-end performance, accessibility, multilingual use, monitoring | Prepare controlled production operation |
| Later | iOS operator client, installable customer PWA/native app, richer tablet experiences | Add only when device/user evidence justifies ongoing cost |

The Android app and web application should not be built as isolated products.
Shared domain contracts and backend authorization must be established before
parallel feature expansion.

## 11. Acceptance criteria

### Role and client fit

- An operator can complete the approved shift or Loyalty transaction workflow on
  the supported Android device without accessing another operator's settlement
  or owner-wide data.
- An owner can drill organization → pump → day → shift → operator from the web
  dashboard and use a phone browser for critical notification-linked review.
- A customer can register, confirm/report a purchase, view progress or statement,
  and complete permitted actions without installing an application.
- Auditor access is read-only and limited to assigned organization/pumps/periods
  regardless of browser route or API call.

### Offline and synchronization

- An operator can create and recover an encrypted local draft during network
  loss with unmistakable local/queued status.
- Repeated synchronization does not duplicate transactions, meter entries,
  credit, allocations, handoffs, evidence, rewards, or reports.
- A permission/configuration conflict does not resolve through last-write-wins;
  the client shows rejection or review status while preserving the user's draft.
- Offline operation cannot falsely display server confirmation, attestation,
  notification delivery, reward issuance, or finalization.

### Camera, devices, and security

- Where live evidence is mandatory, gallery selection is unavailable and camera
  output is bound to the intended record.
- Evidence upload interruption is recoverable without associating the image with
  a different transaction.
- Revoking an operator/device prevents further protected access while historical
  records still name the original actor/device context as allowed.
- Cross-organization, cross-pump, expired-assignment, and unauthorized role tests
  fail on the backend even if requests bypass the visible UI.

### Web delivery

- Responsive management tables and approval queues remain usable at approved
  desktop/tablet sizes, and selected critical actions work on approved phone
  browsers.
- Secure customer links expire, enforce their intended action, and do not expose
  sensitive data in URLs or unauthenticated previews.
- Generated PDFs and notification links remain projections of the same
  authoritative structured record/version.

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Building three independent products | Conflicting calculations and slow delivery | One service/API contract, shared domain ownership, role-specific clients |
| Web-only operator client under weak connectivity | Lost work or duplicate submissions | Android-first offline store, idempotent queue, explicit conflict handling |
| Native app increases MVP cost | Delayed validation | Prototype workflows on responsive web, then build narrow operational Android client after validation |
| Operator devices include iPhones | Excluded staff or second client cost | Inventory actual devices before framework/platform decision; choose cross-platform only if evidence supports it |
| Mobile cache exposes financial/customer data | Privacy and fraud risk | Minimized scoped cache, encryption, revocation, expiry, secure device policy |
| Customer install requirement reduces adoption | Registration and confirmation drop-off | Secure mobile web links; no required customer app |
| Manager web app becomes unusable on phone | Slow urgent approvals | Preserve critical summary/attestation/approval flows responsively |
| Offline conflict changes financial truth | Incorrect reconciliation/reward/credit | Server authority, versions, idempotency, domain conflict review |
| Camera permissions fail | Blocked transaction or invalid evidence | Preflight/education, explicit alternative/review policy, no silent gallery substitution |
| Premature framework lock-in | Rework before device/workflow validation | Decide client responsibilities first; select framework after device, offline, camera, support, and team assessment |

## 13. Decisions required

1. Is the Android-first operator strategy approved, or must the MVP support both
   Android and iOS based on the actual staff device inventory?
2. Will the business provide managed pump devices, permit personal devices, or
   use both? What enrollment, lock, revocation, and replacement policy applies?
3. Which operator devices, Android/iOS versions, screen sizes, camera behavior,
   storage limits, and low-connectivity conditions must be supported?
4. Which mobile implementation approach—native Android, cross-platform, or
   another approved option—best meets the validated device matrix, offline sync,
   camera, security, team, maintenance, and budget constraints?
5. Which workflows may be completed offline, and which remain online-only because
   they require current authorization, attestation, payment, reward, or approval
   state?
6. What local retention, encryption, logout, remote revocation, failed-sync,
   conflict-resolution, and lost-device rules apply?
7. Is a web/PWA operator prototype sufficient before native development, and
   what measured network/camera/offline result triggers the production choice?
8. Are the management dashboard and customer portal one web workspace/deployment
   or separate security/brand/deployment surfaces?
9. Which manager/supervisor actions must work well on phone browsers versus
   desktop/tablet only?
10. Which customer actions require step-up authentication, and what fallback
    exists when the verified phone or messaging provider is unavailable?
11. What notification channels, web-push role, installability, browser support,
    languages, and accessibility targets launch in the MVP?
12. What are the dedicated PumpAxis Supabase project/environment topology, API
    boundary, sync protocol, server ownership, backup, RPO/RTO, and deployment
    regions?
13. What evidence justifies a later native customer app or iOS operator app, and
    which engagement/operational metrics will trigger that investment?

## 14. Validation metrics

- median/P95 operator task and shift-close time by device/network state;
- draft recovery and offline sync success, conflict, rejection, and duplicate
  rate;
- camera permission/capture/upload completion and fallback rate;
- operator adoption and abandoned/error-prone step rate;
- manager review time by desktop, tablet, and phone;
- customer secure-link open, verification, action completion, and install-related
  drop-off;
- device/session revocation time and unauthorized retry rate;
- web page/API latency, client crash/error rate, and supported-device coverage;
- notification delivery and authenticated-link success; and
- development/maintenance cost per client compared with measured user value.

Numeric targets require pilot baselines and business approval.
