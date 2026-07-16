# Jayant Goyal Platform Architecture Blueprint

**Date:** 2026-07-16
**Status:** Approved planning baseline
**Scope:** Long-term application boundaries, platform contracts, data ownership, authentication, deployment, and growth rules
**Implementation:** See [Platform Restructure Implementation Guide](./2026-07-16-platform-restructure-implementation-guide.md)

> This is an architecture document only. It does not authorize implementation, production changes, database migrations, DNS changes, or Vercel reconfiguration by itself.

---

## 1. Executive decision

Evolve the repository into four independently deployable applications over one shared platform:

```text
apps/
    portfolio/
    studio/
    admin/
    auth/
```

The platform remains a Turborepo monorepo using one Supabase project and a deliberately small set of shared packages.

```text
jayantgoyal.com              Portfolio — Who is Jayant?
studio.jayantgoyal.com       Studio — What has Jayant built?
admin.jayantgoyal.com        Admin — How is the platform operated?
auth.jayantgoyal.com         Auth — Who is the user?
```

The existing `apps/jayantgoyal` application is the technical predecessor of Studio. Portfolio is introduced as a focused application rather than retaining the current combined product shell. Admin remains an independent application. Auth becomes an independent application because authentication UI and flows are already duplicated between the current main and Admin applications.

The architecture does not introduce new database schemas or general-purpose shared packages without demonstrated need.

---

## 2. Architecture constitution

These rules are the primary decision filter for all future work:

1. Every application should feel complete on its own.
2. Applications communicate through platform contracts, not implementation details.
3. Authentication is invisible until required.
4. Public discovery comes before authentication.
5. Identity is global.
6. Permissions are local.
7. Infrastructure is shared.
8. Experiences are independent.
9. Prefer adding products over adding applications.
10. A new application must justify its own deployment lifecycle.
11. Shared packages remove existing duplication, not hypothetical future duplication.
12. Optimize for deleting code, not adding abstractions.

### Clarification: global identity, local permissions

`auth.users.id` is the canonical identity across the platform. Each application still defines and enforces its own authorization policy.

Examples:

- Auth decides whether a user has proved an identity and completed a required security step.
- Studio decides whether a user may access or modify a product resource.
- Admin requires an authenticated user, an authoritative administrator role, and AAL2.
- Portfolio ordinarily requires no permission at all.

Role data may be stored centrally, but its meaning and enforcement remain with the application that owns the protected operation.

---

## 3. Platform mental model

### 3.1 Portfolio — Who is Jayant?

**Question answered:** Who is Jayant Goyal professionally?

**Problem solved:** Communicate professional identity, experience, capabilities, work, writing, and contact information clearly.

**Primary users:** Recruiters, clients, collaborators, peers, and people learning about Jayant.

**Owns:**

- Home
- About
- Experience
- Skills
- Featured projects
- Resume
- Professional writing and blog
- Contact
- Professional SEO and structured metadata

**Never owns:**

- Games or utilities
- Product workspaces
- Messenger, Files, Weather, Activity Tracker, or calculators
- Login, registration, callbacks, MFA, or account security
- CMS and platform operations
- Developer API credentials

**Future-feature test:** A feature belongs in Portfolio only when it materially improves the answer to “Who is Jayant?”

**Operational posture:** Public, lightweight, cacheable, accessible, and independent of authentication for normal navigation.

### 3.2 Studio — What has Jayant built?

**Question answered:** What has Jayant built, and what can I use?

**Problem solved:** Help people discover, understand, evaluate, and launch products.

**Primary users:** Visitors, users, developers, collaborators, and open-source consumers.

**Owns:**

- Studio home and brand
- Product catalog
- Public product detail pages
- Apps
- Games
- Developer tools
- AI products
- Utilities
- Experiments
- Open-source projects
- Authenticated product experiences
- Product-specific settings and permissions

**Never owns:**

- Professional autobiography
- Global login and security screens
- Administrator operations
- Portfolio CMS
- Shared identity implementation details

**Future-feature test:** A new build should begin as a Studio product unless it proves an independent deployment, security, runtime, or release lifecycle.

**Operational posture:** Public discovery first; authentication only after a user enters a product that needs identity, persistence, personalization, or collaboration.

### 3.3 Admin — How is everything operated?

**Question answered:** How is the platform managed and operated?

**Problem solved:** Provide one protected operational surface for content, users, deployments, and system controls.

**Primary users:** Jayant and future trusted administrators.

**Owns:**

- Portfolio CMS
- Studio catalog management
- Product metadata and featured status
- Administrator user and role operations
- Deployments
- Terms and policy content
- Safe operational configuration
- Future audit and observability tools

**Never owns:**

- Public product experiences
- Authentication forms and callbacks
- Self-service password, provider, passkey, or MFA management
- Product implementation
- Infrastructure secrets editable through ordinary CMS interfaces

**Future-feature test:** Admin receives an operation only when a trusted operator needs to manage existing platform state without changing application code.

**Operational posture:** Protected by current identity validation, database-backed authorization, and mandatory AAL2.

### 3.4 Auth — Who is the user?

**Question answered:** Who are you, how do you prove it, and how do you secure that identity?

**Problem solved:** Provide one trusted identity, session, and account-security experience.

**Primary users:** Every user who needs an account-backed platform capability.

**Owns:**

- Login
- Registration
- Email verification
- Forgot and reset password
- OAuth and SAML callbacks
- MFA enrollment and challenge
- Connected identity providers
- Password and security settings
- Passkeys when the provider support is stable
- Current-session controls
- Logout
- Account-security activity when available
- Account deletion initiation and security confirmation

**Never owns:**

- Studio product preferences
- Product subscriptions or entitlements
- Workspace membership
- Administrator role assignment
- Portfolio content
- API tokens owned by a product or future developer platform
- General notification or personalization preferences

**Future-feature test:** A feature belongs in Auth only when it proves, links, protects, recovers, or terminates a user identity or session.

**Operational posture:** Security-focused, minimal, stable, and independently deployable.

---

## 4. The Platform

The Platform is not another application. It is the shared foundation upon which applications run.

It includes:

- Supabase Auth
- Postgres and the existing database schemas
- Supabase Storage and Realtime
- Shared packages
- Shared UI primitives
- Email delivery
- Analytics
- Monitoring and logging
- CI/CD
- Vercel deployment conventions
- Environment-variable conventions
- Security and validation standards

```text
Applications
    ↓ depend on stable contracts
Platform packages and services
    ↓ provide infrastructure
Supabase, Vercel, email, analytics, monitoring
```

### 4.1 Allowed application communication

Applications may communicate through:

- Shared authentication and session contracts
- Stable database ownership contracts
- Explicit redirect and URL contracts
- Versioned public APIs when they exist
- Shared packages that eliminate real duplication

Applications must not:

- Import source code from another application
- Reach into another application’s private routes
- Depend on another application’s folder structure
- Share business logic by copying it
- Treat a database table as unowned global state

### 4.2 Intentional runtime dependencies

Unauthenticated applications redirect to the published Auth URL. This is an identity-platform contract, not a source dependency.

If Auth is unavailable:

- New login and security operations are unavailable.
- Existing valid sessions in Studio and Admin continue to work.
- Portfolio remains public.
- Applications continue validating sessions with Supabase.

Admin manages Portfolio and Studio content through their documented database contracts. It does not call or import their implementation internals.

---

## 5. Target application structure

```text
apps/
    portfolio/
        src/app/
        src/components/
        src/lib/

    studio/
        src/app/
            (marketing)/
            (products)/
            (workspace)/
        src/features/
            activity/
            files/
            games/
            messenger/
        src/components/
        src/lib/

    admin/
        src/app/
            portfolio/
            studio/
            system/
        src/components/
        src/lib/

    auth/
        src/app/
            (public)/
                login/
                register/
                forgot-password/
                callback/
            (account)/
                security/
                providers/
                sessions/
        src/components/
        src/lib/

packages/
    auth/
    ui/
    eslint-config/
    tailwind-config/
    typescript-config/

supabase/
    schemas/
    migrations/

docs/
    plan/
    sessions/
```

This structure is directional, not a command to create every displayed directory immediately. Directories are added only when the corresponding application or domain is implemented.

---

## 6. Authentication architecture

### 6.1 Identity authority

- One Supabase project
- One `auth.users` identity table
- One canonical UUID per non-SAML-linked identity
- One optional `jg_account.profiles` row keyed by `auth.users.id`
- No Portfolio-, Studio-, Admin-, or Auth-specific user tables

`jg_account.profiles` is an application profile and authorization extension, not a second identity authority.

### 6.2 Canonical web authentication flow

```text
Protected application route
    → no valid session
    → auth.jayantgoyal.com/login?return_to=<validated destination>
    → password, Google, GitHub, or future SAML
    → Supabase Auth
    → auth.jayantgoyal.com/callback
    → PKCE code exchange
    → shared parent-domain session cookie
    → validated return destination
```

No other production application owns login, registration, recovery, MFA, or provider callback pages after migration compatibility routes are retired.

### 6.3 Production cookie contract

```text
Name:     __Secure-jg-session-v1
Domain:   jayantgoyal.com
Path:     /
Secure:   true
SameSite: Lax
```

The cookie name is versioned so a future incompatible storage change can coexist with a controlled migration window.

Consequences:

- All trusted subdomains participate in one browser security boundary.
- User-controlled content must never be hosted on `*.jayantgoyal.com`.
- Abandoned DNS records and deployment aliases are security risks.
- Every application needs a strong CSP and careful third-party-script policy.
- Authorization remains mandatory even when the shared cookie exists.

### 6.4 Session validation and refresh

- Auth, Studio, and Admin use the shared package for browser/server clients and proxy refresh.
- A new server client is created for every request.
- Server authorization uses validated claims or a current user lookup, never an unvalidated session object.
- Cookie refresh updates both request and response state.
- Any response that writes auth cookies is private and non-cacheable.
- Portfolio does not refresh sessions on every public page.

### 6.5 Authentication versus authorization

Auth proves the identity. Each application authorizes its own operations.

Admin access requires:

```text
valid identity
    + current admin or super_admin role
    + AAL2
```

Studio permissions remain product-specific. Portfolio remains public unless a future isolated feature has a concrete reason for identity.

### 6.6 CSRF and redirect requirements

- State-changing operations use POST or another appropriate non-GET method.
- Sensitive Auth mutations verify the request Origin.
- High-risk operations use CSRF protection and recent authentication.
- OAuth state and PKCE are validated.
- `return_to` accepts only relative paths or exact allowlisted platform origins.
- Tokens and refresh credentials are never placed in URLs, logs, or proof notes.

### 6.7 Logout behavior

- Default sign-out terminates the current session and clears the shared cookie.
- “Sign out everywhere” is a separate explicit action.
- Open tabs on other origins detect logout on navigation, visibility recheck, or refresh.
- No cross-subdomain real-time logout bus is planned.
- Sensitive Admin operations always perform fresh server authorization.

### 6.8 Deferred authentication capabilities

The following belong conceptually to Auth but are not initial scope:

- Passkeys while Supabase support remains experimental and the repository client version is below the documented requirement
- SAML until an actual organization requires it
- Full active-device visualization until supported session metadata and APIs justify it
- Advanced account-recovery orchestration

API tokens do not belong in Auth. They belong to the product or future developer platform that defines their scopes and usage.

---

## 7. Shared package policy

### 7.1 Approved packages

| Package | Consumers | Immediate value | Decision |
| --- | --- | --- | --- |
| `@repo/ui` | Applications as needed | Existing shared primitives | Keep |
| `@repo/auth` | Auth, Studio, Admin; optional Portfolio | Removes current Supabase client, callback-support, cookie, refresh, and claims duplication | Add |
| `@repo/eslint-config` | All workspaces | Existing shared lint policy | Keep |
| `@repo/typescript-config` | All workspaces | Existing compiler policy | Keep |
| `@repo/tailwind-config` | UI applications | Existing shared styling foundation | Keep while used by multiple apps |

### 7.2 Rejected or deferred packages

Do not introduce these without current duplication in at least two consumers:

- `packages/content`
- `packages/database`
- `packages/features`
- `packages/utils`
- `packages/contracts`
- `packages/analytics`
- `packages/email`

Infrastructure can remain application-local or repository-level until a second real consumer makes a package cheaper than duplication.

### 7.3 `packages/auth` boundary

May contain:

- Browser client factory
- Per-request server client factory
- Proxy/session-refresh helper
- Cookie configuration
- Claims/session normalization
- Safe redirect validation
- Pure AAL and role predicates
- Provider identifiers
- Shared authentication types

Must not contain:

- Pages or layouts
- Forms or dialogs
- MFA UI
- Admin role database queries
- Product entitlements
- Service-role clients
- Studio or Portfolio navigation
- API-token issuance
- General database repositories

Use explicit browser and server subpath exports so browser code cannot accidentally import server-only utilities.

---

## 8. Studio information architecture

### 8.1 Initial primary navigation

```text
Home
Products
```

Apps, Games, Tools, AI, Experiments, and Open Source begin as product types and filters rather than top-level navigation destinations.

### 8.2 Discovery model

Studio should provide:

- Featured products
- Search
- Product-type filters
- Recently updated products
- Clear public product pages
- Authentication requirements disclosed before launch
- Consistent Launch actions
- Related products

### 8.3 Experience layers

```text
(marketing)    Studio brand, home, and catalog
(products)     Product detail and public product experiences
(workspace)    Authenticated account-backed experiences
```

The authenticated shell appears only after a user launches a product that needs it. It does not wrap the Studio landing page.

### 8.4 Writing and changelogs

- Professional writing stays in Portfolio.
- Product-specific release notes belong to Studio.
- A global Studio Changelog is added only after a real release cadence exists.
- Documentation remains product-local until it justifies an independent docs lifecycle.

---

## 9. Feature organization

Feature-first organization is selective, not mandatory.

Use a Studio feature folder when a domain:

- Owns multiple routes
- Owns a data model or API surface
- Contains several cohesive components and services
- Is difficult to identify inside generic folders
- Has meaningful internal behavior worth isolating

Likely initial vertical features:

- Files
- Messenger
- Activity Tracker
- Games when shared game infrastructure is substantial

Small products remain route-local using `_components` and `_lib`.

```text
src/app/.../weather/
    page.tsx
    _components/
    _lib/
```

Do not create a feature directory for every small tool. Do not introduce feature registries, dependency injection, domain events, or mandatory barrel files without a demonstrated need.

---

## 10. Admin information architecture

```text
Portfolio
    Profile
    Experience
    Skills
    Projects
    Resume
    Blog
    Contact

Studio
    Products
    Categories
    Featured products
    Product metadata
    Releases later

System
    Users and access
    Deployments
    Terms and policies
    Operational settings
    Audit activity later
```

User responsibilities are divided by actor:

- Auth provides self-service identity security.
- Admin provides operator-level role, access, suspension, and support operations.

Infrastructure secrets remain in Supabase, Vercel, and environment configuration. Admin must not become a browser-based secrets manager.

Account-wide terms are coordinated as follows:

- Admin manages policy content and versions.
- Auth presents and records acceptance.
- `jg_account` stores acceptance state.

---

## 11. Database architecture

Keep the current schemas:

```text
auth          Supabase-managed identities and sessions
jg_account    Profiles, roles, terms, and account-level state
portfolio     Professional content
jg_app        Studio product data
```

Rules:

- Use `auth.users.id` as every user foreign key.
- Do not create application-specific user tables.
- Do not create a custom Auth session registry.
- Do not rename `jg_app` merely because the public brand becomes Studio.
- Add a Studio product catalog table under `jg_app` only when Admin-managed catalog data is required.
- Add permission tables only when current roles are demonstrably insufficient.
- Add audit tables only after meaningful administrative actions need durable audit history.
- Evolve schemas because ownership, RLS, retention, or lifecycle differs—not because a folder is renamed.

---

## 12. Deployment and environments

### 12.1 Production

Four Vercel projects:

| Application | Domain | Independent deployment |
| --- | --- | --- |
| Portfolio | `jayantgoyal.com` and `www.jayantgoyal.com` | Yes |
| Studio | `studio.jayantgoyal.com` | Yes |
| Admin | `admin.jayantgoyal.com` | Yes |
| Auth | `auth.jayantgoyal.com` | Yes |

All use the same Supabase project. Service-role credentials are provided only to applications with a proven server-side need and are never exposed to browser bundles.

### 12.2 Local development

```text
portfolio: localhost:3000
studio:    localhost:3001
admin:     localhost:3002
auth:      localhost:3003
```

Local cookies omit Domain and Secure. Cookies are shared across localhost ports because cookies are host-scoped, not port-scoped.

### 12.3 Stable staging

Use stable subdomains for cross-application authentication validation:

```text
portfolio.staging.jayantgoyal.com
studio.staging.jayantgoyal.com
admin.staging.jayantgoyal.com
auth.staging.jayantgoyal.com
```

Use a staging-specific cookie name and `Domain=staging.jayantgoyal.com`.

### 12.4 Vercel previews

Arbitrary sibling Vercel preview domains cannot share a parent cookie. Therefore:

- Use previews for builds, public routes, and application-local validation.
- Use stable staging for real cross-subdomain SSO.
- Do not build a custom preview token broker.
- Do not add an unsafe authentication bypass.

---

## 13. Route ownership

### 13.1 Portfolio destinations

Retain or introduce on `jayantgoyal.com`:

- `/`
- `/about`
- `/experience`
- `/skills`
- `/projects`
- `/resume`
- `/blog`
- `/blog/[slug]`
- `/contact`

### 13.2 Studio destinations

Move product experiences to `studio.jayantgoyal.com`, generally preserving paths:

- `/products`
- `/activity-tracker/**`
- `/calculator/**`
- `/custom-calculator/**`
- `/files/**`
- `/games/**`
- `/github-stats/**`
- `/messenger/**`
- `/tools/**`
- `/weather/**`

### 13.3 Auth destinations

Move new authentication flows to `auth.jayantgoyal.com`:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify`
- `/callback`
- `/mfa`
- `/account/security`
- `/account/providers`
- `/account/sessions`
- `/logout`

Legacy callback and recovery routes require a compatibility window. Do not replace a code-exchange endpoint with a blind permanent redirect.

### 13.4 Admin destinations

Keep Admin routes on `admin.jayantgoyal.com` and reorganize navigation by Portfolio, Studio, and System without requiring an immediate URL rewrite unless the existing route becomes misleading.

---

## 14. Future growth rules

Mobile, desktop, CLI, and extension clients share identity but do not share browser cookie helpers. They use native Supabase SDK storage, PKCE, deep links, or system-browser authentication.

Create a new application only when at least one of these is true:

- It requires an independent deployment lifecycle.
- It requires a different runtime or technology stack.
- It requires a separate security boundary.
- It requires independent availability or scaling.
- It has a release cadence that cannot reasonably follow Studio.
- It has become a product platform rather than a Studio feature.

Potential future applications are not created in advance:

```text
apps/api
apps/docs
apps/mobile
apps/desktop
apps/extension
apps/cli
```

Introduce `packages/contracts` only when at least two real deployed clients consume the same versioned API contract.

---

## 15. Explicit non-goals

This architecture does not propose:

- Microservices
- Separate Supabase projects
- A custom identity provider
- A token-broker service
- A general permissions engine
- A new schema per application
- A universal content repository package
- A universal database package
- A feature framework
- A no-code Admin platform
- Full passkey, SAML, session-device, or API-token implementation in the initial migration
- Rewriting working product domains merely to fit a folder pattern

---

## 16. Decision checklist for future features

Before adding a feature, answer in order:

1. Which user question does it answer: who Jayant is, what Jayant built, who the user is, or how the platform is operated?
2. Which application owns the user experience and data semantics?
3. Can it remain inside that application?
4. Does it require authentication immediately, later, or never?
5. Which application defines its permissions?
6. Does it duplicate logic that already exists in another application?
7. Would a shared package delete more code and concepts than it adds?
8. Does it require an independent deployment lifecycle?
9. Does the existing database schema already express the correct domain?
10. What existing code or abstraction can be deleted as part of the change?

If the feature can remain inside its owning application, keep it there.

---

## 17. Architecture success criteria

The migration is architecturally complete when:

- All four applications deploy independently.
- Each application has one clear responsibility and complete experience.
- The current main application no longer mixes professional identity with products.
- Users authenticate once across production subdomains.
- Admin requires role authorization and AAL2.
- No production application other than Auth owns new authentication UI.
- Portfolio remains usable without authentication infrastructure.
- Studio presents public discovery before authenticated workspaces.
- Shared packages are limited to proven cross-application infrastructure.
- Existing schemas continue unless a separately approved migration is justified.
- Legacy routes have tested redirects or compatibility handlers.
- Obsolete duplicate auth and application-shell code has been removed.
- The final repository contains fewer duplicated concepts than the starting repository.

---

## 18. Reference material

- [Supabase server-side authentication](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Next.js SSR client guidance](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase SAML](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml)
- [Supabase passkeys](https://supabase.com/docs/guides/auth/passkeys)
- [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
