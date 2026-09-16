# Orbit architecture and integration

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page defines the proposed application architecture and its integration with the existing identity, URL, Auth, IAM, Studio, Admin, and deployment contracts.

## 9. Proposed application architecture and stack

### 9.1 Stack aligned to the repository

**Verified baseline:** the repository technology catalog lists pnpm/Turborepo, Next.js 16, React 19, strict TypeScript 5.9, Tailwind v4, Radix/CVA, Supabase services, Vitest, and independent Vercel projects. Exact installed patches must come from manifests and lockfile. [R6]

**Proposal:** reuse those versions and packages unless a compatibility/security review requires an upgrade. Reuse the existing Markdown/GFM rendering approach for descriptions and comments. Evaluate the current drag-and-drop dependency before adding dnd kit; choose one maintained implementation inside Orbit and test pointer/keyboard/non-drag behavior. Do not add an unrelated UI framework, ORM, or state library without a need.

| Layer                                   | Responsibility                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Next.js Server Components               | Initial authorized reads, safe data projections, shell composition                        |
| Client Components                       | Board interactions, drafts, dialogs, optimistic state, subscriptions                      |
| Next.js Server Actions / Route Handlers | Input validation, origin checks, live identity, application commands, provider boundaries |
| Orbit application services              | Permission decisions, orchestration, safe DTOs, error mapping                             |
| Supabase Data API                       | User-context reads and approved command RPC entrypoints                                   |
| PostgreSQL                              | Transactional invariants, membership, permissions, ordering, activity/outbox persistence  |
| Supabase Realtime                       | Minimal private invalidation delivery; not authoritative content storage                  |
| Supabase Storage                        | Private bytes with resource-aware policies                                                |
| Durable worker                          | Outbox delivery, file validation, expiry/purge, reminders and exports when enabled        |

### 9.2 Request and mutation flow

```text
Browser
   -> Orbit proxy/session integration
   -> Server Component or action/route
   -> existing web-auth user-context client + verified identity
   -> IAM product gate + Orbit workspace/board authorization
   -> typed query or approved PostgreSQL command
   -> committed product rows + activity + outbox in one transaction
   -> response to initiator
   -> durable worker / private invalidation -> teammates refetch with RLS
```

A Server Action is not a private method just because it lives on the server. Treat each exported mutation as an externally callable endpoint with validation and authorization. Share the same application command between a Server Action and Route Handler rather than implementing two conflicting paths. [S6]

### 9.3 Read model and caching

Queries return deliberate DTOs: no invitation secrets, profile emails beyond purpose, token hashes, job payloads, storage service metadata, or other tenants' identifiers. Use request-scoped user clients. No module-global authenticated Supabase client. Personalized responses must not enter a shared CDN/ISR cache. Session-refresh responses preserve no-store headers. [S1]

Cache safe product configuration separately from user data. Query keys include user/workspace/board and filter context; discard authorized caches on logout, workspace switch, access denial, and membership changes. Do not rely on a cached capability snapshot for privileged writes.

### 9.4 Source layout

```text
apps/orbit/
  web/
    package.json
    .env.example
    src/
      app/                  # route composition; thin handlers
      features/
        workspaces/
        boards/
        cards/
        comments/
        attachments/
        notifications/
      server/
        commands/           # orchestration, typed inputs, policy checks
        queries/            # permission-safe projections
        jobs/               # producer/worker adapters actually implemented
      lib/                  # Orbit-local helpers only
      components/           # product-level UI composition
      proxy.ts              # follow the current client's convention
  contracts/                # create only when Orbit + Admin genuinely share DTOs

packages/foundation/identity/  # extend canonical product/host registry
packages/web/{auth,urls,...}/  # minimal shared-contract extensions
supabase/migrations/          # one existing migration authority
supabase/...                  # current schema snapshot conventions
 docs/products/orbit/         # proposed first, current behavior as shipped
```

The diagram does not authorize creating empty future clients or large abstraction packages. Follow the actual repository's file placement conventions rather than mechanically copying these names.

---

---

## 11. SSO and cross-application integration

### 11.1 Preserve the existing contract

**Verified baseline:** production uses the shared `__Secure-jg-session-v1` cookie family scoped to trusted `jayantgoyal.com` hosts, with secure/SameSite Lax/path rules; localhost and Preview behave differently. Shared helpers construct Auth entry URLs and validate exact return origins. Auth owns credentials and logout; products reauthorize after login. [R4, R5]

Add Orbit as a deliberately trusted sibling host through the identity registry and shared web-auth/web-urls contracts. Do not hand-roll new cookie parsing, copy tokens through query strings, implement an invented `/sso/token` endpoint, or assume suffix matching is a safe origin check. Preserve the existing `platform`/compatibility/legacy vocabulary without renaming the product family.

### 11.2 Required integration changes

| Location/owner           | Proposed change                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Identity foundation      | Add Orbit product ID, production origin, local origin/port, labels                                                 |
| web-urls                 | Derive Orbit links and permit intended cross-product navigation                                                    |
| web-auth                 | Recognize Orbit as a trusted production host; reuse existing session client and safe return handling               |
| Auth client              | Accept exact Orbit return origin; account/application UI links where registry-driven                               |
| IAM                      | Register Orbit only when implemented; add participant/creator/operator capabilities and audited provisioning paths |
| Orbit client             | Route classification, entitlement checks, recovery/MFA/terms behavior, user-context reads                          |
| Admin client             | Narrow entitlement/operations screen with new specific capabilities, not content browsing by default               |
| Studio                   | Optional application-launcher entry; do not automatically enroll Studio users                                      |
| CI / docs / env examples | Include the fifth app and cross-product regression coverage                                                        |

### 11.3 End-to-end flows

**Existing session:** request Orbit → shared helper refreshes/validates identity → live IAM check → workspace/board check → render safe data. **No session:** Orbit → Auth with exact return → existing Auth sign-in/OAuth/MFA → shared session → Orbit rechecks all product/resource access. **Invitation:** preview minimal invite → authenticate through Auth → explicit accept command with current identity → minimal entitlement plus workspace/board membership → authorized destination.

**Logout:** account controls delegate to Auth and preserve its explicit local/global semantics. Do not implement “log out of Orbit” by deleting the shared cookie while claiming other products stay logged in. A product exit action may clear Orbit client caches without ending authentication; label it differently.

### 11.4 Revocation and session freshness

Product/workspace/board revocation must be checked from current database state, not merely JWT metadata. Changing a role must not wait for JWT refresh to restrict data. Do not store authorization roles in user-editable metadata. Read the existing IAM lifecycle/revocation helpers and reuse them.

JWT verification alone is not a universal proof that all server-side session state remains active. Audit the current shared session contract and its handling of issued access tokens. If immediate session revocation is required across direct Data API/Storage paths, add a reviewed caller-bound live-session predicate through IAM and test it; do not claim that UI logout alone invalidates every issued token. This is a specific pre-launch security gate, not permission to redesign Auth wholesale. [S1, S7]

### 11.5 Shared-domain risk

A domain-wide session increases the trust placed in sibling applications. Orbit must meet the shared CSP, XSS prevention, origin-validation, dependency, and secret-handling standards. SameSite cookies do not replace CSRF protection between sibling subdomains. Do not broadly allow `*.jayantgoyal.com` or `*.vercel.app`; use the existing exact-origin registry and explicit Preview allowlists.

---
