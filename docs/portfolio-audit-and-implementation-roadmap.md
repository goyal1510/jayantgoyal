# Portfolio Audit and Accelerated Implementation Roadmap

**Owner:** Jayant
**Audit date:** 2026-07-25
**Status:** Canonical IA implementation in progress; focused validation and release follow-up pending
**Scope:** Portfolio, Studio, Admin, Auth, shared packages, and Supabase
**Primary goal:** Position Jayant as a software engineer who can independently
design, build, secure, and operate complete SaaS products.

## Operating constraints

- Resume remains visible and easy to access.
- Writing remains a primary part of the portfolio.
- Technical depth stays explicit.
- The site must work for recruiters, engineers, founders, and potential clients.
- Changes build on the current editorial design language and component system.
- No Figma, image generation, or external redesign workflow is part of this plan.
- Work is delivered in small, testable checkpoints rather than held for a large
  redesign launch.

## Executive summary

The underlying platform is substantially stronger than the public portfolio
currently communicates. It is not a collection of disconnected demos. It is a
four-application product system with a database-backed editorial platform,
cross-application authentication, role-gated administration, real-time product
features, shared packages, and deployment boundaries.

The main positioning problem is sequencing. The homepage asked visitors to read
through career and résumé material before it proved what Jayant can build. The
approved implementation now makes Work the canonical system index: Portfolio,
Studio, Admin, and Identity & SSO. Studio's internal products remain nested
evidence instead of becoming a second project directory.

The target is not a résumé website with more polished project cards. The target
is a product-engineering portfolio with three layers of proof:

1. Outcomes: what problems Jayant can solve for a company or founder.
2. Products: the systems he has designed and shipped.
3. Engineering: the architecture, tradeoffs, security, and operational details
   behind those systems.

The current visual language can support this. The first work should correct
security and content-system risks, make the navigation and claims truthful, and
then restructure the public story around flagship case studies.

## 1. Current portfolio summary

### Product ecosystem

| Application | Role                                                       | Public proof                                              |
| ----------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Portfolio   | Public identity, work, writing, résumé, and contact        | Editorial system and professional narrative               |
| Studio      | Product inventory, tools, games, workspaces, and utilities | Breadth of shipped product functionality                  |
| Admin       | Content management and user administration                 | Ability to build internal tools and operational workflows |
| Auth        | Sign-in, recovery, MFA, providers, and account security    | Authentication and security depth                         |

The system uses a Turborepo monorepo with pnpm workspaces, Next.js 16, React 19,
TypeScript, Tailwind CSS, Supabase Auth/Database/Realtime/Storage, PostgreSQL,
and Vercel. Shared packages own UI, authentication contracts, brand identity,
canonical platform URLs, and SEO behavior.

### Current public narrative

The public site presents a thoughtful editorial identity and a credible
professional history. Its hero promises dependable software and its pages make
the résumé, writing, work, and contact information discoverable. However:

- The strongest product proof appears too late.
- The homepage reads more like a modern résumé than a product-engineering site.
- The Work archive gives work similar visual weight regardless of
  significance.
- The complete cross-application platform is not presented as a flagship system.
- Project descriptions emphasize features and generic technology labels more
  than constraints, decisions, outcomes, and business value.
- Resume is a dedicated, primary navigation page with an inline PDF viewer and
  download fallback.
- “Writing” clearly signals technical notes without making the site feel
  publishing-only.
- “Portfolio / 2025” is stale in July 2026.

## 2. Strong points

### Engineering

- The four-application split has clear responsibilities rather than arbitrary
  micro-frontend fragmentation.
- Shared `auth`, `brand`, `platform`, `seo`, and `ui` packages reduce
  cross-application drift.
- Portfolio content is database-authoritative and typed. Public pages and Admin
  use the same content model instead of maintaining a static fallback.
- Supabase SSR, safe-return validation, PKCE OAuth, logout scopes, recovery,
  provider management, and MFA demonstrate authentication depth.
- Admin authorization is separated from authentication and checks roles from
  the account schema.
- The database has meaningful schemas, relations, RLS policies, storage usage,
  real-time behavior, soft deletion, and content ordering.
- State management is restrained: server/database state is not unnecessarily
  copied into global client stores.
- SEO and metadata coverage are unusually mature for a personal product.
- The Studio demonstrates repeated product execution across file management,
  tracking, games, developer tools, messaging, calculators, and weather.
- The Admin app demonstrates operational thinking, not just public UI work.

### Product and content

- The existing visual identity feels intentional and differentiated.
- Writing posts provide strong technical credibility and should become more
  prominent, not less.
- A dedicated résumé page and PDF path serve recruiters without forcing the
  entire portfolio to behave like a résumé.
- Contact information is clear and the site already communicates openness to
  collaboration.
- The strongest products solve understandable problems and can support detailed
  case studies without inventing new work.

## 3. Weak points and risks

### Critical technical risks

#### SEC-01 — Session RPC authorization

The canonical account schema contains `SECURITY DEFINER` session functions that
accept a caller-supplied user ID, access `auth.sessions`, and are executable by
public application roles. The functions do not enforce that the requested user
matches `auth.uid()`. The current applications do not use these functions.

**Recommendation:** remove public execution immediately and either drop the
unused functions or replace them with caller-bound versions. Add database-level
authorization tests before any future session-management integration.

#### CMS-01 — Hidden section contract

Public RLS returns only visible `portfolio.section_content` rows, while the
Portfolio loader requires every editorial key before components evaluate the
row's visibility flag. Hiding a section can therefore break the public page
instead of hiding that section.

**Recommendation:** make the data contract and read policy agree, and add a
regression test for hidden sections.

### High-priority engineering gaps

- **CI-01:** There is no repository CI workflow. Linting, type checks, tests,
  architecture checks, brand checks, and service-role checks are local-only.
- **CI-02:** Studio and Auth builds ignore TypeScript errors. This is acceptable
  only if a separate type-check gate is reliably enforced.
- **DATA-01:** Some multi-step mutations, especially game moves and Admin
  presentation updates, need database transactions or RPCs to avoid partial
  state and race conditions.
- **DATA-02:** Storage configuration and policies for private file management
  need a canonical, testable source of truth.
- **SEC-02:** Contact rate limiting is process-local and not durable across
  serverless instances.
- **SEC-03:** Word-game seeding should use a purpose-specific secret rather than
  the Supabase service-role key.
- **TEST-01:** RLS and database permission behavior needs automated negative
  tests in addition to TypeScript and component tests.

### Public-positioning gaps

- Product proof is below résumé-like material.
- The current title can anchor perception at a lower level than the actual
  system demonstrates.
- Claims are broad where concrete proof would be stronger.
- Project cards do not explain why a feature was difficult, what tradeoff was
  made, or who receives value.
- Tool-count and some project descriptions have drifted from the implementation.
- The GitHub line-count estimate is a weak proof point and should not lead the
  credibility story.
- Contact asks for a message but does not help a founder communicate product
  stage, desired outcome, or timing.
- The mobile navigation needs stronger menu-dialog and focus behavior.

## 4. Technical architecture review

### Folder and application architecture

The monorepo is appropriately organized around deployable applications and
shared contracts:

- `apps/portfolio`: public editorial experience.
- `apps/studio`: public and authenticated products.
- `apps/admin`: content and account administration.
- `apps/auth`: authentication and account-security owner.
- `packages/*`: reusable cross-application contracts.
- `supabase/*`: migrations and canonical schema snapshots.

This structure is a strong portfolio asset because it reflects organizational
boundaries found in a real product company. The architecture should be
explained as a platform case study rather than left for repository reviewers to
discover.

### Components and state

Server components own initial data loading and pass typed data to focused client
components. Shared primitives are centralized while application-specific
components remain within their owning app.

Zustand is used only where persistent client behavior is appropriate, including
the custom calculator and tool favorites. Most page state remains local. This
is a good example of avoiding global-state overuse.

Improvement priorities:

- Keep component ownership aligned with app boundaries.
- Extract domain services only for complex multi-step mutations, not for every
  query.
- Add tests around content contracts and permissions, where type safety alone
  cannot protect behavior.

### API and database communication

The codebase uses Next.js route handlers for server-only operations and direct
Supabase server/client access where appropriate. Schema selection is explicit,
and the Portfolio intentionally avoids a service-role key.

Improvements:

- Move atomic business workflows into reviewed transactional database
  functions.
- Standardize error mapping and authorization checks in high-risk endpoints.
- Preserve the existing rule that service-role credentials never reach client
  bundles.

### Authentication and authorization

The authentication design demonstrates meaningful depth:

- Supabase SSR sessions.
- Email/password and OAuth flows.
- Recovery and verification.
- MFA and provider management.
- Validated return targets.
- Cross-subdomain session compatibility.
- Explicit current-session and global logout.
- Application-specific route and role policy.

The temporary compatibility modes add legitimate migration complexity, but
they should be retired after the Auth application becomes canonical. Public
documentation should present this as a staged authentication migration rather
than permanent complexity.

### Middleware and security

Next.js proxies enforce public/protected route boundaries and attach request
context. Admin additionally enforces role membership. This separation is
sound, but application-layer checks must remain paired with RLS.

Immediate security work is SEC-01, followed by durable rate limiting,
purpose-specific secrets, transactional mutations, and automated RLS testing.

### Database design

The three schemas communicate clear domain ownership:

- `jg_account`: profiles, roles, and account concerns.
- `portfolio`: public editorial content and content-management structure.
- `jg_app`: Studio product data.

Positive design choices include UUID defaults, updated-at triggers, relational
models, ordered editorial content, role-aware policies, and soft-deletion
patterns.

Unnecessary or temporary complexity includes compatibility-era authentication
contracts and historical migration experimentation. Future migrations should
be narrowly scoped, reversible where practical, and accompanied by refreshed
schema snapshots after remote application.

## 5. Audience evaluation

### Senior full-stack recruiter

**Current result:** Credible professional experience and technical range are
visible, but senior product ownership is under-evidenced.

The recruiter can find skills, experience, work, writing, and résumé material.
What is missing is fast proof of scope: systems owned, difficult decisions,
cross-functional impact, quality practices, and measurable outcomes.

**Required improvement:** Place three flagship case studies near the top of the
homepage, make the résumé a first-class navigation item, and attach explicit
scope and outcomes to experience claims.

### Startup founder

**Current result:** The founder can infer broad capability but must translate a
tool archive into “this person can take my product from idea to operation.”

Trust comes from the working applications, Admin system, Auth depth, and
professional experience. Confusion comes from equal-weight project cards,
generic technology labels, and a contact flow that does not frame a product
engagement.

**Required improvement:** State the product outcomes Jayant can own, show the
end-to-end cross-application platform, describe tradeoffs and delivery boundaries, and ask
contact leads for product stage, desired outcome, and timing.

### Software engineer

**Current result:** The implementation contains substantial depth, but the
public site does not expose enough of the decisions behind it.

An engineer would respect the monorepo, auth model, RLS, real-time features,
CMS, and shared packages after reading the repository. They should not need to
perform that archaeology.

**Required improvement:** Add architecture diagrams or concise system maps,
decision/tradeoff sections, data-model explanations, security boundaries, and
“what I would improve next” notes in case studies.

## 6. Project-by-project evaluation

| Project                        | Category                           | Recommendation                                                                     |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- |
| cross-application architecture | D — detailed case study            | New flagship story connecting Portfolio, Studio, Admin, Auth, Supabase, and Vercel |
| Tech Tools                     | D — detailed case study            | Present registry architecture, discoverability, persistence, and usage tracking    |
| Game Hub                       | D — detailed case study            | Present multiplayer session model, validation, Realtime, RLS, and concurrency work |
| File Manager                   | D — detailed case study            | Present storage hierarchy, signed access, soft deletion, and security boundaries   |
| Activity Tracker               | A — keep and highlight             | Strong practical product with recurring use and analytics                          |
| Sync Scratchpad                | B — keep but rewrite               | Position truthfully as a private real-time scratchpad, not a conversation product  |
| Custom Calculator              | B — keep but rewrite               | Position as an interaction and persistent-state experiment                         |
| E-commerce                     | B — archive only                   | Keep as earlier full-stack work; remove overclaims and describe incomplete areas   |
| Currency Calculator            | C — hide from professional archive | Keep accessible inside Studio but not in the primary proof set                     |
| Weather App                    | C — hide from professional archive | Keep accessible inside Studio but not in the primary proof set                     |

### cross-application architecture

**Current positioning:** Not presented as a single product case study.

**Better positioning:** A multi-application product platform built and operated
by one engineer, with public content, authenticated products, internal
operations, account security, shared packages, and a relational backend.

- **Problem:** Personal products and professional content need shared identity,
  secure accounts, editorial control, and independent deployment boundaries.
- **Solution:** Four purpose-built applications connected by shared packages
  and one governed data platform.
- **Technical implementation:** Turborepo boundaries, shared SSR auth contracts,
  cross-domain session migration, RLS, CMS data contracts, Admin RBAC, and
  independent Vercel deployments.
- **Technology:** Next.js App Router, TypeScript, Turborepo, Supabase Auth,
  PostgreSQL/RLS, Realtime, Storage, and Vercel.
- **Business value:** Demonstrates the ability to own a SaaS platform beyond a
  landing page or isolated feature.

### Tech Tools

**Current positioning:** A large collection of developer utilities.

**Better positioning:** A registry-driven utility platform that makes dozens of
tools searchable, consistent, and easy to extend.

- **Problem:** Small developer tasks are fragmented across ad-heavy tools with
  inconsistent interfaces.
- **Solution:** A unified catalog with discovery, command-style navigation,
  favorites, metadata, and shared tool patterns.
- **Technical implementation:** Typed registry, route generation, persisted
  favorites, usage sync, metadata, and reusable UI.
- **Technology:** Next.js App Router, TypeScript registry design, Zustand
  persistence, Supabase usage synchronization, and SEO metadata.
- **Business value:** Shows platform thinking and the ability to turn repeated
  implementation into an extensible product system.
- **Accuracy note:** The live registry currently contains 87 tools. Do not claim
  99+ until the implementation supports it.

### Game Hub

**Current positioning:** A collection of web games.

**Better positioning:** A real-time game platform with shared session,
participant, move, and result models across multiple game types.

- **Problem:** Repeated multiplayer infrastructure becomes inconsistent when
  every game owns a separate backend.
- **Solution:** A reusable game-session layer paired with game-specific rules
  and interfaces.
- **Technical implementation:** PostgreSQL session model, server-side move
  validation, Supabase Realtime, Auth, RLS, and reconnectable state.
- **Technology:** Next.js, TypeScript, PostgreSQL, Supabase Auth/Realtime, and
  row-level security.
- **Business value:** Demonstrates real-time state, concurrency awareness, and
  reusable domain modeling.

### File Manager

**Current positioning:** A cloud file and folder manager.

**Better positioning:** A secure hierarchical storage product with controlled
access, signed delivery, and recoverable deletion.

- **Problem:** Users need an understandable way to organize and retrieve private
  files without exposing storage objects publicly.
- **Solution:** Folder navigation, upload, retrieval, search, and soft deletion
  backed by private object storage.
- **Technical implementation:** Relational hierarchy, Supabase Storage, signed
  URLs, RLS, ownership checks, and soft deletion.
- **Technology:** Next.js App Router, PostgreSQL hierarchy, Supabase Storage,
  signed URLs, Auth, and RLS.
- **Business value:** Shows secure data and file workflows common to real SaaS
  products.

### Activity Tracker

**Current positioning:** Daily activity tracking with an analytics dashboard.

**Better positioning:** A focused personal operations product that turns
recurring activity logs into useful progress visibility.

- **Problem:** Consistent habits are difficult to maintain without low-friction
  logging and visible trends.
- **Solution:** Daily entries, recurring activity definitions, and progress
  views.
- **Technical implementation:** Authenticated relational data, RLS, date-based
  aggregation, and responsive dashboard states.
- **Technology:** Next.js, TypeScript, PostgreSQL, Supabase Auth, and RLS.
- **Business value:** Demonstrates recurring-use product design and data-backed
  feedback loops.

### Sync Scratchpad

**Current positioning:** Real-time messaging.

**Better positioning:** A private cross-device real-time scratchpad for quickly
moving text between authenticated sessions.

- **Problem:** Moving temporary text, links, and notes between personal devices
  is unnecessarily cumbersome.
- **Solution:** A private authenticated stream that synchronizes in real time.
- **Technical implementation:** Supabase Realtime subscriptions, authenticated
  records, RLS, and local React interaction state.
- **Technology:** Next.js, Supabase Database/Auth/Realtime, and RLS.
- **Business value:** Shows a clear small-product use case and real-time data
  synchronization without overstating a full conversation platform.

### Custom Drag-and-Drop Calculator

**Current positioning:** A customizable calculator.

**Better positioning:** An interaction experiment in user-configured tools,
drag-and-drop composition, and persistent client state.

- **Problem:** Fixed calculator layouts do not match every repeated workflow.
- **Solution:** A user-arranged calculator interface with saved configuration.
- **Technical implementation:** Drag-and-drop composition, persisted Zustand
  store, hydration handling, and calculation state.
- **Technology:** React, `react-dnd`, Zustand persistence, and TypeScript.
- **Business value:** Demonstrates complex client interaction and state
  persistence.

### E-commerce

**Current positioning:** A complete or transaction-ready shopping experience.

**Better positioning:** An earlier MERN full-stack storefront foundation with
catalog, authentication, cart state, and API-backed data; payments, orders, and
administration remain future work.

- **Problem:** Learn and demonstrate a conventional separated frontend/backend
  commerce architecture.
- **Solution:** Product browsing, authentication, client cart state, and an
  Express/MongoDB API.
- **Technical implementation:** Vite React client, Redux Toolkit, router and
  Axios integration, Express API, Mongoose models, JWT, and password hashing.
- **Technology:** React/Vite, Redux Toolkit, React Router, Axios, Tailwind CSS,
  Node/Express, MongoDB/Mongoose, JWT, and bcrypt.
- **Business value:** Useful as historical evidence of full-stack progression,
  not a flagship production-commerce claim.

## 7. Technology-verification principles

Project technology lists should communicate decisions, not enumerate the web
platform.

Use:

- Framework architecture when it materially shapes the product.
- Auth, RLS, storage, real-time, data modeling, deployment, state, or
  interaction technology when it explains a real decision.
- Specific system patterns such as signed URLs, typed registries, SSR sessions,
  or persisted stores.

Avoid:

- Listing HTML, CSS, JavaScript, or responsive design as differentiators.
- Naming libraries that do not affect the project story.
- Claiming analytics, transactions, conversations, payments, or scale that the
  implementation does not support.

## 8. Information architecture recommendation

### Primary navigation

| Item        | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| Home / logo | Reset point and personal identity                    |
| About       | Profile, experience, education, and credentials      |
| Work        | Portfolio, Studio, Admin, and Identity & SSO systems |
| Writing     | Technical thinking and communication credibility     |
| Resume      | Recruiter path, inline PDF, and downloadable record  |
| Contact     | Clear opportunity and collaboration path             |

Skills and Experience remain available as About content and in the Resume.
Engineering depth and case-study narratives are directly reachable from Work
detail pages and Writing, so they do not need duplicate top-level destinations.

## 9. Homepage recommendation

### Target sequence

1. Outcome-led hero.
2. Short About preview.
3. Four system-level Work cards linking to consistent detail pages.
4. Selected technical writing.
5. Resume reminder with an easy PDF path.
6. Qualified contact call to action.

### Hero

The hero must answer within one screen:

- Who: software engineer with full-stack capability.
- What: designs and builds complete web products and SaaS systems.
- Why it matters: can take ambiguous product problems through architecture,
  implementation, security, and operation.

Recommended CTA hierarchy:

1. View Work.
2. Download résumé.
3. Discuss a product.

The professional title remains factual, but it should not be the primary value
proposition.

### About

Lead with product and engineering philosophy, then support it with the career
journey. The section should explain how Jayant works:

- Starts with user and business constraints.
- Designs maintainable systems.
- Ships end to end.
- Makes security and operational tradeoffs explicit.
- Improves products from real usage.

### Work

Show the four system-level records—Portfolio, Studio, Admin, and Identity &
SSO—on the homepage. Each card links to `/work/[slug]`; Studio's internal
products are described on the Studio detail page rather than duplicated as
separate home cards.

## 10. Conversion and business positioning

### Opportunity statement

The site should make clear that Jayant can help with:

- Turning an MVP brief into a working product.
- Building authenticated SaaS applications and internal tools.
- Designing product architecture, data models, and secure access.
- Taking ownership across frontend, backend, deployment, and iteration.

Avoid presenting availability as a generic freelance offer. The stronger
position is a software engineer with product ownership available for selective
product and engineering collaborations.

### Contact flow

Keep direct email and social paths. Add lightweight qualification:

- What are you building?
- What stage is it at?
- What outcome do you need?
- Is there a target timeline?

Do not create a long sales form. The goal is enough context to begin a useful
conversation.

### Trust and proof

Priority proof types:

1. Working product links.
2. Case studies with concrete scope and tradeoffs.
3. Professional outcomes and ownership.
4. Technical writing.
5. Testimonials only when they are specific and verifiable.

Do not use vanity metrics such as estimated lines of code as primary proof.

### Writing strategy

Maintain Writing as a first-class navigation item and feature selected posts on the
homepage. Focus future posts on:

- Architecture decisions made in the cross-application platform.
- Authentication and authorization lessons.
- Product tradeoffs and migration stories.
- Postmortems and “what I would change” analysis.
- Building complete features from problem to operation.

## 11. Accelerated implementation plan

The target is a sequence of deployable checkpoints over one to two focused
weeks, not a three-month redesign.

### Checkpoint 1 — Correctness foundation (today)

- [x] **DOC-01:** Save this audit and roadmap as the implementation source of
      truth.
- [x] **SEC-01:** Prepare a reviewed migration that removes or secures the
      unsafe session RPC surface.
- [x] **CMS-01:** Fix the hidden-section data contract and add regression
      coverage.
- [x] **CI-01:** Add a quality workflow for architecture checks, brand checks,
      service-role checks, lint, type checking, and tests.
- [x] **NAV-01:** Make Resume explicitly accessible from desktop and mobile
      primary navigation.

**Definition of done:** Security and content fixes are tested locally; quality
gates run automatically in the repository; résumé access no longer depends on
discovering a secondary route.

### Checkpoint 2 — Truthful positioning (today and next working day)

- [x] **CONTENT-01:** Correct the current year and tool count.
- [x] **CONTENT-02:** Rewrite misleading project descriptions and technology
      tags.
- [x] **CONTENT-03:** Rename/reframe Sync Scratchpad.
- [x] **CONTENT-04:** Remove unsupported E-commerce claims.
- [x] **CONTENT-05:** Replace vague hero and Work CTAs with explicit actions.
- [x] **NAV-02:** Use “Writing” as the primary navigation label while preserving
      the editorial Writing identity within the page.

**Definition of done:** Every public claim can be traced to the current
implementation, and the primary paths are understandable without prior context.

### Checkpoint 3 — Homepage and Work hierarchy (days 2–4)

- [x] **IA-01:** Move product proof ahead of résumé-like detail on the homepage.
- [x] **IA-02:** Add an outcome-oriented proof strip.
- [x] **WORK-01:** Separate flagship work from the complete archive.
- [x] **WORK-02:** Hide Category C products from the professional archive while
      retaining them in Studio.
- [x] **HOME-01:** Add selected Writing content before the long professional
      context.
- [x] **A11Y-01:** Improve mobile navigation dialog and focus behavior.

**Definition of done:** A founder, recruiter, or engineer can identify Jayant's
product-engineering value and reach relevant proof within the first two screens.

### Checkpoint 4 — Flagship case studies (days 4–7)

- [x] **CASE-01:** cross-application architecture.
- [x] **CASE-02:** File Manager.
- [x] **CASE-03:** Game Hub.
- [x] **CASE-04:** Tech Tools.
- [x] **CASE-05:** Reusable case-study content model and route.

Each case study includes problem, role, constraints, solution, architecture,
key decisions, security, tradeoffs, outcome, and next improvement.

**Definition of done:** At least three complete case studies are public and
linked from Home and Work.

### Checkpoint 5 — Opportunity conversion (days 6–8)

- [x] **CONV-01:** Add capability/outcome framing.
- [x] **CONV-02:** Add lightweight contact qualification.
- [x] **CONV-03:** Add verifiable proof points and testimonials only where
      available.
- [x] **CONV-04:** Add clearer product-engagement CTAs without weakening the
      recruiter path.

**Definition of done:** Visitors understand what Jayant can own, why they should
trust him, and how to start the right conversation.

### Checkpoint 6 — Reliability follow-through (week 2)

- [x] **DATA-01:** Make game move/result persistence transactional.
- [x] **DATA-02:** Make Admin section presentation updates transactional.
- [x] **SEC-02:** Replace process-local contact rate limiting.
- [x] **SEC-03:** Introduce a purpose-specific Word-game seed secret.
- [x] **STORAGE-01:** Capture and test private-file bucket policies canonically.
- [x] **TEST-01:** Add database authorization and critical-flow coverage.
- [x] **AUTH-01:** Document the cutover gate and retirement plan for legacy auth
      compatibility.

**Definition of done:** High-risk product workflows have atomic writes,
purpose-specific security controls, and automated negative tests.

## 12. Priority action plan

### Quick wins — 1 to 3 days

- Fix the critical session RPC surface.
- Fix hidden-section behavior.
- Add CI quality gates.
- Add Resume and Writing to primary navigation.
- Correct stale or inaccurate claims.
- Reframe the hero and CTA labels.
- Lead the homepage with flagship product proof.

### Medium changes — compressed into the first week

- Build the cross-application architecture, File Manager, Game Hub, and Tech Tools case studies.
- Separate flagship Work from the full archive.
- Add contact qualification and capability framing.
- Improve mobile navigation accessibility.
- Add a reusable case-study CMS contract.

### Reliability follow-through — second week

- Transactional game and Admin mutations.
- Durable contact abuse protection.
- Canonical storage policy coverage.
- Purpose-specific secrets.
- Database authorization tests and critical-path browser tests.
- Auth compatibility retirement plan.

## 13. Validation and release strategy

Every checkpoint should be independently reviewable and deployable.

Required validation:

- Repository architecture and boundary checks.
- Lint with zero warnings.
- Strict type checking independent of Next.js build settings.
- Automated tests.
- Migration review against canonical schema snapshots.
- Database permission tests for security-sensitive functions and policies.
- Desktop and mobile verification of navigation and core conversion paths.
- Claim-to-implementation review for every published project.

Remote database migrations are prepared and reviewed locally first. They are
applied only through the repository's guarded remote-migration workflow, after
target-project and migration-history verification. Canonical schema snapshots
must be refreshed in the same migration change.

Resume navigation passed its release gate with the dedicated `/resume` renderer
and is enabled in the primary desktop and mobile navigation.

## 14. Final success criteria

The implementation is successful when:

- The homepage communicates product-engineering value before résumé detail.
- Resume and Writing are both first-class paths.
- Four consistent Work detail pages demonstrate end-to-end product ownership:
  Portfolio, Studio, Admin, and Identity & SSO.
- The application ecosystem is legible as one connected system without
  inventing an umbrella product name.
- Founders understand what Jayant can build and how to contact him.
- Recruiters can quickly verify experience and download the résumé.
- Engineers can inspect architecture, decisions, security, and tradeoffs.
- Public claims match the current code.
- Critical authorization and content-system risks are closed.
- Quality gates protect the monorepo on every pull request.

## Canonical vocabulary update — 2026-07-25

The implementation now treats public vocabulary as the source of truth across
runtime code and the live database. `About`, `Work`, `Writing`, `Resume`, and
`Contact` are the canonical portfolio destinations. Studio is a Work system,
not a second primary navigation surface. The product formerly called Sync
Messenger is now `Sync Scratchpad` everywhere:
`/scratchpad`, `/api/scratchpad`, `jg_app.scratchpad_entries`, and
`entry_type`. Historical migration filenames and compatibility redirects for
Projects, Blog, and the old GitHub section key are retained only to preserve
auditability and old links; no active CMS or runtime contract uses those names.
