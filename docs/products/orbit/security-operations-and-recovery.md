# Orbit security, operations, and recovery

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page defines proposed threats, controls, quotas, retention, performance, deployment, environment, cost, backup, and recovery behavior.

## 18. Security, privacy, quotas, and retention

### 18.1 Threats and required controls

| Threat                              | Required design/test                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------------- |
| Cross-workspace ID substitution     | Composite relationships; current membership predicates; raw API negative tests          |
| Role escalation                     | No browser role writes; caller-bound commands; hierarchy and self-modification tests    |
| Private data in caches              | Per-user scope; no shared private SSR caching; cache clearing on access changes         |
| Stored XSS from Markdown/filenames  | Safe renderer; no arbitrary HTML; URL scheme allowlist; sanitized headers               |
| CSRF across sibling hosts           | Existing exact-origin mutation checks; no GET mutations                                 |
| Broad Realtime policies             | Audit all topic policies; Orbit namespace isolation; epoch rotation                     |
| Public/unverified file access       | Private bucket; ready-only object policy; quarantine; size/type/scanner gates           |
| Secret leakage                      | Server-only modules; no `NEXT_PUBLIC_` secret keys; redacted structured logs            |
| Stale invitation/token replay       | Hashed one-use invites; expiry; explicit acceptance; scoped idempotency                 |
| Privileged function misuse          | Minimal private definer functions; current identity; fixed search path; explicit grants |
| Denial of service/cost abuse        | Bounded uploads, pagination, jobs, quotas, and per-action rate limiting                 |
| Failed database/provider dependency | Fail closed for access; explicit retryable errors; outbox for external effects          |

### 18.2 Proposed alpha quotas

These are configurable product defaults, not vendor allowances or a commitment that the chosen plan supports them.

| Control                            | Starting default                                                            |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Workspace creation                 | Creator capability; 5 workspaces per creator unless operator raises limit   |
| Workspace members                  | 50 active members; invitations count against a bounded pending-invite quota |
| Boards                             | 50 active boards/workspace                                                  |
| Columns                            | 20/board                                                                    |
| Card title / description / comment | 200 / 20,000 / 5,000 characters                                             |
| Attachments                        | 25 MiB/file, 50/card, 1 GiB/workspace reserved + committed                  |
| General list pagination            | 50 default; 200 maximum                                                     |
| Bulk operation                     | 100 cards, one board                                                        |
| Invite issuance                    | 20/workspace/hour plus recipient resend cooldown                            |
| Invite acceptance attempts         | Bounded by IP and account with generic failure messaging                    |
| Standard mutations                 | Start at 120/user/minute; tune from legitimate usage and abuse tests        |
| Concurrent exports                 | One active workspace export per workspace and requester                     |

Do not use a process-local counter as the only abuse control in a horizontally scaled deployment. Database or durable edge controls enforce action-critical quotas; infrastructure rate limits provide a second layer. Rate limiting must not expose account existence.

### 18.3 Proposed retention

Trash: 30 days; pending invitation validity: 7 days; ownership offer: 24 hours; upload reservation: 1 hour; command receipt: at least 24 hours; export download: 24 hours; security audit: 365 days; application logs: 30 days with sensitive fields excluded. Failed job detail should be minimal and expire after a reviewed period. Define exceptions for investigations explicitly; do not silently retain everything forever.

### 18.4 Cross-product security rule

Orbit must not loosen IAM, Auth, Studio, Portfolio, or global Storage/Realtime permissions. Some shared changes are necessary to add a product, but each requires tests against existing consumers. New product-wide defaults cannot be applied to shared infrastructure without checking impact. Do not assume an exposed schema or public role is isolated merely because the new UI does not link to it.

---

---

## 19. Performance, reliability, and operational targets

These are proposed engineering targets to validate, not measurements or service guarantees.

| Target                   | Proposed acceptance condition                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Interaction feedback     | A card drag/edit immediately shows local feedback, normally under 100 ms on the reference test device          |
| Standard command latency | p95 below 750 ms in same-region staging for normal card actions, including defined auth/database path          |
| Board load               | Useful first board view within 2.5 s on the documented reference network/device for the representative dataset |
| Realtime convergence     | Authorized clients reflect committed changes within 2 s under normal test conditions                           |
| Initial data payload     | Selected summaries only; target under 300 KiB compressed for the representative first board page               |
| Pagination               | Load bounded visible summaries; do not hydrate all card bodies/comments/attachments                            |
| Availability             | Monitor observed uptime; set an initial operational objective of 99.5%, without claiming vendor-backed SLA     |
| Recovery point           | Target no more than 24 hours of lost product data only if configured backup frequency actually supports it     |
| Recovery time            | Target restoration to a verified usable state within 4 hours in a rehearsed recovery exercise                  |

Reference load: 50 active workspace members, 50 concurrent board viewers, 1,000 active cards on a large board with paginated loading, and 10,000 cards across a workspace. These are test fixtures, not claimed supported scale. Keep browser rendering bounded with virtualization only when profiling shows it is needed and accessibility remains intact.

Instrument request ID, operation name, elapsed time, error class, non-sensitive actor/workspace references, job attempts, queue age, and upload failures. Never record card bodies in performance traces by default. Track authorization-denial patterns without making them publicly visible. Health liveness returns no configuration; deeper readiness checks are authenticated and never leak provider/database secrets.

Set alerts for sustained command failures, auth integration regressions, growing outbox age, quota exhaustion, failed backups, and missing expected worker runs. Degraded email must not prevent viewing boards; failed identity/authorization services must not produce fail-open access.

---

---

## 20. Environments, deployment, cost, and recovery

### 20.1 Environment isolation

Maintain local development, staging, and production configurations. Use isolated test users/data and preferably an isolated staging project or appropriately isolated approved environment. Never use production account data in automated tests or a reset command. Generated Preview hosts must use the repository's explicit host-only/exact-return behavior, not the shared production cookie domain.

Reuse existing environment variable names and helpers. Document which values are browser-visible and which are server-only. Do not rename a legacy shared public-key variable or switch all applications to new key types as a side effect of adding Orbit; coordinate any key migration separately. The current public key is not an authorization substitute. New secret/service keys remain server-only.

### 20.2 Configuration inventory

| Configuration                            | Ownership/handling                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| Supabase project URL + public client key | Existing shared contract; verify target project per environment             |
| Auth session mode / exact return origins | Existing web-auth/Auth configuration                                        |
| Orbit origin and local port              | Derive from identity registry, not scattered runtime literals               |
| Orbit feature flags                      | Typed server config with client-safe projection where needed                |
| Worker invocation credential             | Server-only; dedicated scope and rotation                                   |
| Email provider credential / sender       | Reuse approved provider integration when appropriate; server-only           |
| Upload scanner configuration             | Server-only; unavailable scanner disables dependent file types              |
| Invitation-context signing secret        | Server-only, scoped, rotatable; only if selected handoff design requires it |
| Quotas / retention / notification timing | Typed validated product configuration, not mutable client claims            |
| Logging/monitoring destinations          | Existing operational conventions; sensitive-field filtering                 |

### 20.3 Deployment sequence

1. Reconcile current schemas, app manifests, auth helpers, IAM commands, CI, and hostname registry. Record what is verified versus a required change.
2. Build Orbit and the minimal shared registry updates behind a disabled launch flag. Keep independent deployment roots and builds.
3. Test forward-compatible migrations on staging. Add schemas, constraints, grants, RLS, commands, and bucket policies without modifying unrelated product data.
4. Deploy backward-compatible shared package/Auth/IAM changes first where required; verify existing four-app login, logout, MFA, and safe-return behavior.
5. Deploy the Orbit client to an independently configured hosting project. Keep access restricted until acceptance tests pass.
6. Add `orbit.jayantgoyal.com` using the hosting provider's actual custom-domain instructions and the exact DNS values it supplies. Do not guess a CNAME/IP or point the hostname at a Supabase database endpoint.
7. Configure approved return origins, sender verification, worker execution, quotas, monitoring, backups, and any enabled file scanner.
8. Smoke-test through the real hostname with Owner, Editor, Viewer, Guest, and revoked-account fixtures. Enable a small invited group only after all critical tests pass.

These are implementation instructions, not authorization to deploy or modify the user's live resources during documentation preparation.

### 20.4 CI and quality gates

Reuse and extend the existing checks: `pnpm check:architecture`, `check:brand-assets`, `check:identity`, `check:seo`, `check:service-role`, `check:source-health`, `check:dead-code`, `check:docs`, plus lint, type checks, tests, and build. Verify exact available scripts from the current package manifest before running them. [R1]

Changes in shared packages must trigger all affected app checks, not only Orbit. Add database policy/command tests, browser tests, dependency/security checks, and isolated migration validation. Keep test evidence in the test/CI system; repository current-state documentation must not become a chronological work log. [R8]

### 20.5 Backup and recovery

Database backups do not include Storage object bytes. Back up both product data and files with matching manifests; verify plan-specific backup capabilities rather than assuming free-tier protection. Keep an off-site recovery path and rehearse restoration. [S9]

Because production is a shared Supabase project, restoring the entire project to fix one Orbit error can rewind other applications. Prefer restoration to an isolated environment followed by reviewed product-scoped repair. Any whole-project restore requires coordinated downtime/data-impact review across all products. Protect keys and credentials separately; validate current credential state after any restore.

An application rollback must remain compatible with forward database changes. Prefer expand/contract migrations and feature flags; rollback is not “drop the new schema while workers run.” Disable affected jobs, stop new writes if needed, preserve evidence, and verify restored objects and membership boundaries before reopening.

### 20.6 Cost model

Budget for web hosting, database compute/storage/egress, Realtime usage, private file storage/egress, email, workers/scanning, monitoring, and backups. Existing accounts may absorb early usage, but that is not a promise of free production operation. Record current provider limits and prices during deployment planning; no paid plan or recurring charge is selected by this specification.

---
