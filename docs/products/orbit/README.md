# Orbit by Jayant

## Product requirements, permissions, architecture, and implementation specification

**Version:** 1.0 — private alpha in this repository
**Prepared for:** Jayant
**Prepared:** September 16, 2026
**Working application name:** Orbit
**Proposed origin:** `https://orbit.jayantgoyal.com`
**Existing repository:** `goyal1510/jayantgoyal`
**Proposed application:** `apps/orbit/web`
**Package:** `@jayantgoyal/orbit-web`
**Proposed local port:** `3004`, subject to the repository's current port inventory

> Build an original, dependable board-and-card work-management application in the existing monorepo. Reuse Auth, identity, shared web foundations, and Supabase. Do not fork Fizzy, introduce a second account system, or rewrite Portfolio, Studio, Admin, or Auth.

## How to use this specification

This is a proposed target design. Statements marked **verified baseline** describe repository documentation inspected during preparation; statements marked **proposal**, **default**, **target**, or written as requirements describe the intended new product. No application code, production configuration, DNS records, database objects, or deployments were changed in preparing these files.

Read sections 1–5 to decide the product and access model; sections 6–9 for functionality and user experience; sections 10–20 for implementation and operation; sections 21–24 for delivery, acceptance, and unresolved decisions. Give this product documentation and the [implementation contract](implementation-contract.md) together to the implementing developer or coding agent.

**Evidence boundary:** The public repository's `main` branch was inspected. Its branch head was reported as `44c5fc6a405b416d712a283ce8c2f504b1595fed`. The relevant README and contract pages were read; the running database, private deployment settings, full test suite, and every implementation file were not audited. Reconcile this document with code, migrations, and the actual linked environment before implementation. Repository documentation itself distinguishes coordinated target topology from deployed cutovers. [R1–R8]

**Precedence:** explicit owner decisions → verified current repository security/ownership contracts → this proposed specification → implementation convenience. A conflict involving security or an external write must be surfaced, not silently resolved by weakening a guardrail.

---

> **Repository status:** Orbit ships as `@jayantgoyal/orbit-web` with IAM
> registration, `orbit`/`orbit_private` migrations, workspace/board/card flows,
> invitations, labels, assignees, attachments, inbox, Realtime board refresh,
> and Admin Orbit access management. Host `orbit.jayantgoyal.com` and remote
> migration apply are deployment-controlled; run the outbox worker for optional
> invitation email delivery.
>
> The focused pages in this directory preserve the complete proposal while separating product, authorization, implementation, and operational concerns. Start with this page, then use the linked topic pages.

## Orbit documentation map

- [Routes and APIs](routes-and-apis.md)
- [Authorization and roles](authorization-and-roles.md)
- [Capability catalog](capability-catalog.md)
- [Domain lifecycle and experience](domain-lifecycle-and-experience.md)
- [Architecture and integration](architecture-and-integration.md)
- [Data and command contracts](data-and-command-contracts.md)
- [Realtime, files, and jobs](realtime-files-and-jobs.md)
- [Security, operations, and recovery](security-operations-and-recovery.md)
- [Quality and delivery gates](quality-and-delivery-gates.md)
- [Implementation contract](implementation-contract.md)
- [Glossary and sources](glossary-and-sources.md)

## 1. Name, positioning, and product identity

### 1.1 Recommended name: Orbit

**Public presentation:** Orbit by Jayant.
**Short application label:** Orbit.
**Tagline:** “Keep work moving.”
**One-line description:** “A focused workspace for projects, tasks, and team progress.”

Orbit is the recommended working name because it is short, works as a standalone product, and leaves room for boards, personal work, collaboration, and planning without being limited to a single view. This is a creative recommendation, not a claim of unique market ownership or trademark availability.

| Candidate               | Proposed hostname        | Character                          | Trade-off                                                    |
| ----------------------- | ------------------------ | ---------------------------------- | ------------------------------------------------------------ |
| **Orbit — recommended** | `orbit.jayantgoyal.com`  | Product-like; broad enough to grow | The word is not intrinsically descriptive of task management |
| Boards                  | `boards.jayantgoyal.com` | Immediately understandable         | Ties the identity to one interaction model                   |
| Pace                    | `pace.jayantgoyal.com`   | Calm, execution-oriented           | Requires a descriptive subtitle                              |
| Relay                   | `relay.jayantgoyal.com`  | Collaboration and handoffs         | Suggests team workflows more than personal planning          |

The owner should approve the final name before registering hosts, packages, or database schemas. Do not represent this naming exercise as trademark clearance. No hostname was provisioned or availability test performed.

### 1.2 Fit with the existing naming contract

**Verified baseline:** the repository distinguishes the public identity `Jayant`, compact mark `jg`, technical namespace `jayantgoyal`, package scope `@jayantgoyal/*`, and standalone products. It explicitly rejects treating the repository name as an umbrella brand. [R2]

Therefore use **Orbit by Jayant**, not “JayantGoyal Platform,” an expanded-personal-name workspace brand, or a new umbrella account brand. Account copy should say “your account” or identify Auth explicitly. Add Orbit to the identity registry and derive all runtime hosts, URLs, labels, and metadata from the shared packages.

### 1.3 Relationship to Fizzy

Fizzy is a workflow reference, not this product's source implementation. Build original code, copy, assets, and visual treatment. Implement selected board-and-card concepts from a product specification rather than translating Rails files into TypeScript. Do not promise feature parity or automatic data import from Fizzy. Reuse of any third-party code or assets requires a separate license review.

---

---

## 2. Product purpose, users, and scope

### 2.1 Problem statement

Jayant needs a work-management product for personal projects and selected collaborators that fits the existing application family. The product must make it clear what needs doing, who owns it, its current stage, the next action, and what changed. It must work on its own hostname while using the existing login and account-security experience.

### 2.2 Product principles

1. **One identity, separate authorization.** A valid login does not grant workspace, board, or CMS access.
2. **Focused before comprehensive.** Deliver a complete core workflow before adding automation, reporting, or integrations.
3. **Database-backed truth.** Persist real data; optimistic UI must reconcile with committed state.
4. **Private by default.** No public boards, public attachments, or searchable private metadata in the first release.
5. **Independent product ownership.** Orbit owns work-management behavior; shared packages own reusable foundations.
6. **Recoverable actions.** Prefer archive, trash, explicit restore, and verified backups to irreversible deletion.
7. **Accessible interaction.** Drag-and-drop must not be the only way to move a card.

### 2.3 Initial users

| Persona                 | Primary need                                 | Example                                  |
| ----------------------- | -------------------------------------------- | ---------------------------------------- |
| Jayant as an individual | Track personal projects and daily priorities | Website improvements, tools, experiments |
| Workspace owner         | Control a team workspace and its membership  | Small project team                       |
| Contributor             | Create, update, discuss, and complete work   | Developer or designer                    |
| Stakeholder             | Follow progress without changing work        | Read-only collaborator                   |
| Guest collaborator      | Participate only in explicitly shared boards | Client, reviewer, external contributor   |
| Product operator        | Manage entitlement and operational health    | Authorized operator through Admin        |

### 2.4 Success criteria

A release is useful when a permitted user can enter through Auth, create or join a workspace, create a board, add and assign a card, move it through work stages, discuss it, and return later to the same saved state. A teammate sees committed changes without manually reloading. A user outside the workspace cannot retrieve its data through pages, APIs, direct Data API requests, Storage, notifications, or Realtime.

Initial measurement should track successful onboarding, card-save failure rate, invitation acceptance, mutation latency, authorization denials, and job failures. These are operational/product-health measures, not employee productivity scores. Do not add session replay or third-party behavioral analytics by default.

### 2.5 Non-goals for the initial product

No Rails or Fizzy database port; no new identity provider; no billing or paid plans; no open public sign-up to Orbit; no public board links; no native mobile/desktop client; no full offline sync; no simultaneous character-level editing; no Gantt, sprints, time tracking, AI assistant, or marketplace; no automatic migration from other products; no generalized company-wide authorization rewrite.

---

---

## 3. Existing ecosystem and proposed placement

### 3.1 Verified baseline

The repository documents four independently deployed Next.js clients using one Supabase identity/data project. Its shared packages own identity, branding, URLs, web authentication, SEO, UI, and tooling. Supabase Auth issues sessions; Auth owns interactive account entry and security; IAM owns canonical profiles, product entitlements, and capabilities. [R1, R3–R7]

| Existing component                | Ownership that must remain unchanged                                        |
| --------------------------------- | --------------------------------------------------------------------------- |
| `jayantgoyal.com` — Portfolio     | Public portfolio, work, writing, and editorial content                      |
| `studio.jayantgoyal.com` — Studio | Developer tools, utilities, games, and its existing account-backed products |
| `admin.jayantgoyal.com` — Admin   | Authorized CMS, account/access, and operational interfaces                  |
| `auth.jayantgoyal.com` — Auth     | Credentials, OAuth, recovery, MFA, profile, connected providers, logout     |
| `iam` / `iam_private`             | Identity lifecycle, product membership, capabilities, trusted IAM helpers   |

### 3.2 Proposed topology

```text
Existing Git repository: goyal1510/jayantgoyal
    Portfolio web  -> jayantgoyal.com
    Studio web     -> studio.jayantgoyal.com
    Admin web      -> admin.jayantgoyal.com
    Auth web       -> auth.jayantgoyal.com
    Orbit web      -> orbit.jayantgoyal.com       [NEW]

Shared packages: identity / web-auth / web-urls / brand / SEO / UI / tooling

Verified shared Supabase project
    Supabase Auth + existing IAM                 [REUSE]
    Existing product schemas                    [PRESERVE]
    orbit                                       [NEW product data + approved API]
    orbit_private                               [NEW internal helpers / jobs]
    Private orbit-attachments bucket            [NEW]
```

Orbit is a fifth product client, not a page inside Studio and not a separate repository by default. Studio may link to it in an application launcher; that does not move Orbit's data or code into Studio. A Portfolio case study is editorial work and must not be fabricated or automatically published before the product exists.

### 3.3 Shared versus separate Supabase project

**Proposed initial choice:** reuse the existing verified project and identity, adding product-owned schemas. This matches the documented session and IAM model and avoids inventing token federation. It increases shared operational blast radius, so migrations, quotas, and regression tests must protect the existing products.

A separate project is an architectural option only after a documented identity-federation/session design and ownership review. A session issued by one project must not be assumed to work in another simply because both applications use Supabase. Do not silently create a second Supabase Auth tenant.

---

---

## 4. Release strategy and functionality boundaries

Priority labels are release gates, not time estimates.

| Release                      | Goal                               | Required scope                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 — private alpha**       | A secure, complete core workflow   | Shared SSO; product entitlement; workspace/board roles; invitations; board/column/card CRUD; ordering; assignments; labels; comments; basic attachments; search; activity; in-app notifications; Realtime; archive/trash; tests; deployment and recovery documentation |
| **P1 — polished v1**         | Better everyday use                | Checklists; saved views; personal snooze/watch; richer notification preferences and scheduled reminders; bulk actions; exports; templates; optional workspace MFA enforcement; accessibility/performance hardening beyond the alpha floor                              |
| **P2 — separately approved** | Expanded planning and integrations | Dependencies; recurring cards; automations; reporting; public read-only publication; import adapters; GitHub linkage; webhooks; scoped API tokens; optional AI assistance                                                                                              |

A feature's lifecycle, validation, and negative permissions are part of that feature, not optional polish. Security and data integrity are P0 even where the user interface is simple. Do not add visible controls for unfinished P1/P2 functionality or claim stubbed integrations work.

---

## Original reading and execution guide

The source guide's content is retained below so its safety boundary and execution framing are not lost.

### Orbit by Jayant — planning and implementation pack

**Working recommendation:** Orbit
**Public presentation:** Orbit by Jayant
**Proposed address:** `orbit.jayantgoyal.com`
**Prepared:** September 16, 2026

## Files

| File                                  | Use                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ORBIT_PRODUCT_AND_TECHNICAL_SPEC.md` | Full product requirements, features, permissions, data model, architecture, SSO integration, security, operations, and acceptance plan. |
| `ORBIT_BUILD_PROMPT.md`               | Copy-pastable instructions for a coding agent, to be used with the specification.                                                       |
| `ORBIT_DOCUMENTATION.html`            | Browser-readable, offline edition of the full specification and build prompt, with navigation and print styling.                        |
| `START_HERE.md`                       | This reading and execution guide.                                                                                                       |

## Start here

Read sections 1–5 of the specification first: naming, ecosystem fit, release scope, and permissions. The full target product is documented, but the initial private alpha is deliberately separated from later features.

For development, attach both Markdown files to your coding agent, or place them where it can read them. Use the build prompt. Its default execution scope is repository inspection plus the first shared-auth application shell, not uncontrolled implementation or deployment of every future feature.

Suggested first message:

> Read `ORBIT_PRODUCT_AND_TECHNICAL_SPEC.md` and `ORBIT_BUILD_PROMPT.md`. Inspect the current `goyal1510/jayantgoyal` repository. Complete M0 and implement the M1 shared-auth product shell without modifying live infrastructure. Preserve all existing products and report the exact tests run and any integration gaps.

When the first milestone is accepted, explicitly select the next milestone. No time estimate or delivery promise is embedded in the plan.

## Key decisions in this proposal

Orbit is a fifth independently deployed Next.js client inside the existing monorepo. Auth remains the only login/account-security application. IAM continues to own identity and product entitlements. Orbit adds workspace/board authorization and product-owned data in the shared Supabase environment after environment verification.

The document distinguishes **being signed in**, **being allowed to use Orbit**, **being a workspace member**, and **having permission on a board**. These are different checks. Portfolio CMS access does not automatically grant Orbit content access. Workspace owners/admins, however, can access their workspace's private boards; the UI must disclose that policy.

The working name, new hostname, alpha quotas, retention rules, and release targets are proposals. They are not name-clearance results, provisioned infrastructure, legal compliance conclusions, or measured performance.

## Evidence and safety boundary

The repository README and relevant naming, runtime, authentication, technology, data, and documentation contracts were inspected. The full codebase and live environments were not audited. The specification lists the exact sources and the reported branch head.

No repository files, databases, deployments, domains, memberships, or credentials were changed to prepare this pack. No invitations were sent. Application code has not been built or tested. The content is a detailed implementation specification and prompt, not a claim that Orbit already exists.

## Document maintenance

Keep product requirements and implemented behavior distinct. After implementation, update the smallest appropriate product and shared-system pages in the repository. Do not paste this entire planning pack into current-state documentation while implying that all its future capabilities are live.
