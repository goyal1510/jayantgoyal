# Portfolio Content Blueprint

Status: approved content direction; canonical implementation complete; UI and release follow-up pending

Scope: content, information architecture, audience paths, project hierarchy,
case-study structure, navigation, and conversion messaging. UI styling,
visual design, screenshots, responsive behavior, accessibility auditing, and
deployment are explicitly out of scope until this blueprint is implemented and
reviewed.

## 1. Positioning

The public identity is **Jayant**. The domain remains `jayantgoyal.com`, but
the surname is not used as the visitor-facing name. Runtime product, route,
API, and database vocabulary must match the public vocabulary. Historical
migration filenames may retain their original names as audit records only.

The primary professional description is:

> Jayant is a software engineer who builds complete software products from
> product decisions to production systems.

This position supports three audiences without creating separate personas:

| Audience                       | What they need to understand                                                                            | Primary path                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Founder or client              | Jayant can own a product or meaningful product slice from ambiguity to delivery.                        | Hero → scope → products → systems → case study → contact |
| Recruiter or hiring manager    | Jayant is a working software engineer with professional experience, evidence, and an accessible résumé. | Hero → Resume → About → Work → contact                   |
| Engineer or technical reviewer | The work has real architecture, data, security, tradeoffs, and operational depth.                       | Hero → Work detail → Writing → source                    |

The portfolio should not present Jayant as a generic freelancer, agency, or
résumé-only candidate. It should show an employed software engineer who also
has the judgment and independence to help startups and product teams.

## 2. Current implementation baseline

The content decisions below are based on the current CMS and repository state,
not assumptions:

- The live CMS Hero now uses `Jayant`, `Software Engineer`, the approved
  product-engineering headline, and the updated SEO copy.
- The visible primary navigation is About, Work, Writing, Resume, and Contact;
  the home link is the brand mark. Resume and Writing remain first-class
  destinations.
- The public Work index contains four system-level records: Portfolio, Studio,
  Admin, and Identity & SSO. Historical Studio product records remain in the
  CMS for editorial history but are nested capabilities, not parallel public
  Work cards.
- Each system has a canonical `/work/[slug]` detail page using the same
  problem, solution, architecture, decisions, security, tradeoffs, outcome,
  and next-improvement contract.
- Writing records remain in the canonical `writing_posts` table. Their links,
  names, counts, and architecture references were accuracy-checked and
  corrected on 2026-07-26.
- The current CMS has substantial experience, education, skills, About,
  contact, Resume, and GitHub content. The blueprint reorganizes their role and
  order; it does not discard the underlying professional record.

## 3. Homepage information order

The homepage should communicate information in this order:

1. Header and Hero
2. Short About preview
3. Work systems: Portfolio, Studio, Admin, Identity & SSO
4. Writing and build notes
5. Resume reminder
6. Contact and opportunity routing

The order gives clients product proof early, keeps Admin/CMS/Auth visible as
real engineering work, and preserves the recruiter path without making career
history the opening story.

## 4. Header and Hero

### Information to show

- Name: `Jayant`
- Primary destinations: About, Work, Writing, Resume, Contact
- A persistent Resume path and a clear Contact path

### Final Hero copy

Identity label:

> Jayant · Software Engineer

Headline:

> I build complete software products—from product decisions to production
> systems.

Supporting description:

> I work across product decisions, interfaces, backend systems, data,
> authentication, and delivery to turn ambiguous requirements into dependable
> software.

Status copy:

> Currently a Product Associate Engineer in Hyderabad, India. Open to
> selective freelance product engagements and startup collaborations.

Actions:

- Explore my work
- Resume
- Discuss a product

### Hero metadata

Page title:

> Jayant | Software Engineer

Meta description:

> Jayant is a software engineer who builds web applications, APIs, data
> systems, authentication flows, and production infrastructure.

The Hero should not contain the project list, CMS/SSO explanation, long skill
lists, testimonials, or employment history. Those claims need evidence in the
sections below.

## 5. Scope and credibility

Section heading:

> What I build and operate

Introduction:

> I take software from a product question to a working, maintainable system.

Information blocks:

### Product software

> Web applications, internal tools, workflows, and interactive products.

### End-to-end engineering

> Interfaces, APIs, data models, authentication, storage, realtime behavior,
> and deployment.

### Studio products

> Developer tools, file management, games, activity tracking, calculators, and
> utilities.

### Systems and operations

> Admin CMS, publishing workflows, role-based access, shared application
> authentication, quality checks, and production delivery.

This is a scope statement, not a project list and not a keyword dump. It makes
the CMS, Admin, Auth, and delivery work visible before the project cards.

## 6. Product and system taxonomy

There is no umbrella project using a personal-brand label. Studio is the name
of the product suite. At the portfolio level, Studio is one work item. Its
products remain named sub-products so the suite can prove breadth without
turning the homepage or navigation into an app directory.

### Studio product suite

| Product                       | Homepage priority | Archive status                         | Content role                                                  |
| ----------------------------- | ----------------- | -------------------------------------- | ------------------------------------------------------------- |
| Tech Tools                    | Flagship          | Visible                                | Detailed case study                                           |
| File Manager                  | Flagship          | Visible                                | Detailed case study                                           |
| Game Hub                      | Flagship          | Visible                                | Detailed case study                                           |
| Activity Tracker              | Flagship          | Visible                                | Product walkthrough; deeper case study when evidence is ready |
| Sync Scratchpad               | Secondary         | Visible                                | Keep and explain as private realtime utility                  |
| Custom Drag & Drop Calculator | Secondary         | Visible                                | Keep as interaction and state-design work                     |
| Currency Calculator           | Secondary/archive | Visible in complete archive and Studio | Keep as a practical utility, not a flagship proof point       |
| Weather App                   | Secondary/archive | Visible in complete archive and Studio | Keep as API and interaction work, not a flagship proof point  |

“Secondary” means lower homepage priority, not removal. Every legitimate
project remains findable in the complete Work archive and through Studio.

### Earlier independent work

**E-commerce Application** remains visible under Earlier Work. It should be
described as an earlier MERN storefront foundation with browsing,
authentication, cart state, and an API-backed catalog. Payments, order
processing, and administration must remain explicitly described as incomplete
areas rather than implied capabilities.

### Engineering systems

These are visible work items, but they are systems rather than consumer
products:

1. **Portfolio CMS & Publishing** — Admin, database-backed editorial content,
   project and case-study management, Writing, Resume, assets, role-gated writes,
   transactional section updates, and public revalidation.
2. **Authentication & Account Security** — sign-in, recovery, MFA,
   connected providers, safe return handling, logout scopes, authorization
   boundaries, and shared application session behavior.
3. **Application Delivery & Quality** — the monorepo, shared contracts,
   migrations, automated tests and checks, independent deployments, and
   production environment ownership.

These systems should be presented as engineering proof and detailed case
studies, not hidden inside a generic “platform” project.

## 7. Work section

Section heading:

> Products and systems I have built

Introduction:

> A complete view of the tools, products, and engineering systems behind the
> work.

The Work section has four canonical system records. The layers below describe
what each record can explain; they are not separate navigation surfaces:

### Studio suite

Introduce Studio once as a suite of products built and operated by Jayant. The
suite overview should state its scope (developer tools, storage, games,
tracking, calculators, and utilities), its shared engineering foundations,
and the link to `studio.jayantgoyal.com`.

Inside the Studio detail page, name the strongest product examples—Tech Tools,
File Manager, Game Hub, Activity Tracker, Sync Scratchpad, calculators, and
Weather—as nested capabilities. They may be described or linked from the
Studio page, but they are not separate public Work cards or primary
navigation items.

Each highlighted product should still state its purpose, Jayant’s contribution,
meaningful technologies or decisions, and the available product/source path.

### System detail pages

Each of Portfolio, Studio, Admin, and Identity & SSO is a detailed Work page.
“Case study” describes the page template, not a second navigation category.
Studio's internal products are evidence inside the Studio page, while Admin
and Identity make the operational and security depth visible without creating
duplicate Engineering or Case Studies sections.

### Engineering evidence

Show editorial operations and identity/security as the engineering evidence
inside the Portfolio, Admin, and Identity & SSO detail pages. Application
delivery and quality belongs in the architecture and tradeoffs sections and in
relevant Writing posts, rather than a separate top-level page.

### Earlier work

Show the E-commerce Application as an earlier independent project with honest
scope boundaries.

The homepage may prioritize the flagship products, but `/work` must retain the
complete inventory. A lower visual priority is not deletion.

## 8. Project positioning

### Tech Tools

Current product truth: 87 developer utilities in a searchable, typed registry.

Positioning:

> A registry-driven utility workspace that makes repeated developer tasks
> discoverable, consistent, and easy to extend.

Prove: typed registry design, route and metadata contracts, favorites and
history persistence, usage synchronization, and category discovery.

### File Manager

Positioning:

> A private file workspace with hierarchical organization, direct uploads,
> signed access, recovery, and owner-scoped storage security.

Prove: relational folder modeling, private object storage, signed URLs,
conflict handling, soft deletion, RLS, storage policies, and partial-failure
tradeoffs.

### Game Hub

Positioning:

> A reusable game-session system supporting solo, local, and realtime
> multiplayer experiences across multiple rule sets.

Prove: shared session and participant models, server-authoritative rules,
transactional action persistence, realtime delivery, reconnectable state, and
concurrency tradeoffs.

### Activity Tracker

Positioning:

> A recurring-use tracking product that turns daily entries into progress
> feedback and useful monthly views.

Prove: user-owned relational data, recurring workflows, completion analytics,
and a product designed around repeated use rather than a one-time demo.

### Sync Scratchpad

Positioning:

> A private realtime scratchpad for moving temporary text, links, and notes
> between personal sessions and devices.

Do not describe it as a public messaging or social product unless the
implementation supports that claim.

### Custom Drag & Drop Calculator

Positioning:

> A configurable calculator builder that lets users compose a tool around
> their own workflow.

Prove: drag-and-drop composition, state persistence, duplicate prevention,
history actions, and hydration-safe client state.

### Currency Calculator

Positioning:

> A practical cash-denomination workflow with bundle counting, notes, dated
> history, and persistent records.

Keep it accessible, but do not position it as a flagship product.

### Weather App

Positioning:

> A location-aware forecast experience combining search, browser geolocation,
> current conditions, and multi-day forecast data.

Keep it accessible, but do not give it equal prominence with the systems and
products that demonstrate deeper ownership.

### E-commerce Application

Positioning:

> An earlier MERN storefront foundation demonstrating separated React and
> Express architecture, catalog data, authentication, and cart state.

Keep incomplete payments, order processing, and administration explicit.

### Verified technology language

The public technology labels below are the meaningful implementation evidence
to use in cards and case studies. They are intentionally narrower than a raw
dependency list:

| Work                              | Technology and engineering evidence to name                                                                                                    | Do not imply                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Tech Tools                        | Next.js App Router, TypeScript registry design, Zustand persistence, Supabase usage synchronization, metadata and route contracts              | A tool count that is not current, or that every utility is independently production-hardened |
| File Manager                      | Next.js App Router, PostgreSQL hierarchy, Supabase Auth and Storage, signed URLs, RLS, ownership checks, soft deletion                         | Public buckets, unrestricted file access, or enterprise storage scale                        |
| Game Hub                          | Next.js, TypeScript, PostgreSQL session models, Supabase Auth and Realtime, server-side move validation, RLS                                   | A generalized multiplayer platform beyond the implemented game/session scope                 |
| Activity Tracker                  | Next.js, TypeScript, PostgreSQL, Supabase Auth, RLS, date-based aggregation                                                                    | Clinical, team, or large-scale analytics claims                                              |
| Sync Scratchpad                   | Next.js, Supabase Database/Auth/Realtime, RLS, authenticated records                                                                           | A public chat product, social graph, or broad collaboration suite                            |
| Custom Drag & Drop Calculator     | React, TypeScript, `react-dnd`, Zustand persistence, hydration-safe client state                                                               | A general low-code builder or server-backed workflow engine                                  |
| Currency Calculator               | React/Next.js product surface, local or persisted calculator state, history workflow                                                           | Financial advice, exchange-rate intelligence, or a broader accounting product                |
| Weather App                       | Next.js/React, browser geolocation, external forecast API integration, search and forecast state                                               | Ownership of forecast data or a weather platform                                             |
| E-commerce Application            | React/Vite, Redux Toolkit, React Router, Axios, Tailwind CSS, Node/Express, MongoDB/Mongoose, JWT, bcrypt                                      | Completed payments, order processing, administration, or transaction scale                   |
| Portfolio CMS & Publishing        | Next.js Admin and Portfolio applications, Supabase/PostgreSQL, role-gated writes, editorial contracts, storage, revalidation                   | A generic CMS product sold to external customers                                             |
| Authentication & Account Security | Supabase Auth/SSR contracts, OAuth/password recovery where supported, MFA surfaces, safe return validation, logout scopes, route authorization | A completed Auth-owned production cutover until its rollout gate passes                      |
| Application Delivery & Quality    | pnpm/Turborepo, shared TypeScript packages, PostgreSQL migrations, Vitest/check-types/lint, independent Vercel deployments                     | A claim that every deployment or check is fully automated if it is not                       |

HTML, CSS, and generic “JavaScript” labels do not belong in the primary
project technology lists. Add a technology only when it explains a real
architecture, security, state, delivery, or product decision.

## 9. Engineering-system content

### Portfolio CMS & Publishing

Problem:

> Public portfolio content, Writing, Resume, project stories, assets, and section
> visibility need one governed source instead of duplicated page literals.

What Jayant built:

> A database-backed editorial system with Admin workspaces, role-gated writes,
> project and case-study management, publishing state, media storage,
> transactional section updates, and public revalidation.

Technical proof:

- Next.js Admin and Portfolio applications
- Supabase/PostgreSQL editorial schema
- Server-only privileged writes
- Admin and super-admin authorization
- Project and case-study publication contracts
- Writing and Resume content ownership
- Asset and storage boundaries

Business value:

> Content can be updated and published through a governed workflow without
> editing application code or maintaining competing copies of the portfolio.

### Authentication & Account Security

Problem:

> Multiple applications need reliable identity, recovery, provider management,
> authorization boundaries, and safe movement between application surfaces.

What Jayant built:

> A shared authentication foundation covering sign-in, recovery, MFA,
> connected providers, safe return handling, explicit logout scopes, and
> application-specific authorization.

Technical proof:

- Supabase Auth and SSR session contracts
- OAuth and password/recovery flows where currently supported
- MFA and account-security surfaces
- Admin role checks and protected routes
- Safe return validation
- Service-role isolation from public applications
- Shared session compatibility across application domains

Claim boundary:

> Describe shared session behavior and authentication contracts accurately. Do
> not claim the final Auth-owned production cutover is complete until that
> rollout and observation gate has actually passed.

### Application Delivery & Quality

Problem:

> A multi-application product system needs consistent contracts, repeatable
> checks, safe migrations, and independent deployment boundaries.

What Jayant built:

> A pnpm/Turborepo monorepo with shared authentication, brand, platform, SEO,
> and UI contracts, explicit PostgreSQL schemas, migration history, automated
> tests, targeted builds, and separate Vercel application deployments.

Business value:

> The system can evolve across several applications without turning every
> product change into an unreviewable, coupled release.

## 10. Case-study model

Deep Work detail pages should exist for Portfolio, Studio, Admin, and Identity
& SSO. Each page uses the same case-study contract so a recruiter, founder, or
engineer can compare systems without learning a new structure.

Every case study uses the same information contract:

1. Problem — who had the problem and why it mattered
2. Role and constraints — what Jayant owned and what was constrained
3. Solution — what was built
4. Architecture — how the system fits together
5. Key decisions — at least three meaningful engineering decisions
6. Security and trust boundaries — identity, authorization, data, storage
7. Tradeoffs — what was chosen and what was accepted
8. Outcome — useful result without invented scale or revenue
9. Next improvement — what would be changed with more time or evidence
10. Product and source paths — only where the link is genuinely useful

Case studies are not replacements for the complete project archive. They are
deeper explanations of selected work.

## 11. Writing and build notes

Writing remains a primary navigation destination and a meaningful homepage
section. It demonstrates how Jayant thinks, not just what has shipped.

Writing pillars:

- Product engineering and decision-making
- Web architecture, data, authentication, and security
- Delivery, automation, SEO, and operational lessons
- Build notes from Studio and independent work

Existing article direction:

- Keep the live Resume-download article; it demonstrates automation and
  production delivery.
- Keep the indexing/SEO article, but make the claim and page count current.
- Rewrite “Introducing jayantgoyal.com — More Than a Portfolio” as a truthful
  build note about creating a product suite alongside a portfolio. Remove
  unsupported “99+” language and avoid umbrella-brand positioning.

Writing posts should link to relevant case studies and work, but they should
not duplicate an entire case study.

## 12. Experience, About, Education and Skills

### Experience

Homepage summary:

> The professional experience behind the products.

Show the current Product Associate Engineer role first, with evidence about
RCM software, billing workflows, claims automation, user feedback, and the
verified impact claims. Keep HighRadius as the relevant earlier engineering
experience. Keep the full timeline, including the non-engineering internship,
on Resume rather than making it a primary homepage proof point.

### About

Heading:

> I care about the whole problem, not only the screen.

Recommended copy:

> I am a software engineer who moves between product questions, interfaces,
> application logic, data, and delivery. I enjoy turning ambiguous
> requirements into systems that are useful now and clear enough to change
> later.

Working principles:

- Find the real user tension.
- Make the system clear enough to evolve.
- Ship useful increments and learn from use.
- Sweat the details that make software dependable.

### Education and credentials

Keep the full education and credential record available, but place it after
professional work on the homepage and fully on Resume. Do not let school
details compete with product and engineering evidence.

### Skills

Public capabilities should be grouped by meaningful work rather than a flat
list of HTML, CSS, JavaScript, and every library:

- Application development — Next.js, React, TypeScript, Node.js, REST APIs
- Backend and data — Supabase, PostgreSQL, SQL, RLS, schema design, migrations
- Product systems — authentication, authorization, storage, realtime, state
  design, product discovery
- Delivery — Turborepo, pnpm, GitHub, CI, Vercel, Vitest
- Enterprise foundation — Java, Spring/Hibernate, SQL, earlier API work

The complete technical inventory remains available on Resume and in relevant
project or case-study evidence.

## 13. Resume

Resume is a first-class destination, visible in the main navigation and Hero.

Resume content:

- Official current title: Product Associate Engineer
- Professional experience and verified outcomes
- Selected work with links to case studies
- Technical capabilities and meaningful tools
- Education and credentials
- Inline PDF viewer plus downloadable résumé source
- GitHub, Writing, and contact paths

The portfolio identity can say Software Engineer; the Resume must preserve the
official employment title.

## 14. Contact and conversion

Contact should support clients, recruiters, and technical collaborators from
one entry point.

Heading:

> Have a product, engineering opportunity, or collaboration in mind?

Supporting copy:

> Tell me what you are building, hiring for, or exploring. I’ll reply with the
> right context.

First question:

> What would you like to discuss?

Options:

- Build or improve a product
- Full-time or contract opportunity
- Technical collaboration
- Something else

Product-engagement details:

- What are you building?
- Current stage
- Desired timeline
- Outcome needed
- Optional context and links

Recruiter details:

- Role or opportunity
- Company
- Relevant link
- Message or context

The form must not force a recruiter to complete a startup-MVP brief. Email,
LinkedIn, GitHub, Resume, and Writing remain available as alternate paths.

## 15. Navigation

Recommended primary navigation:

- About — personal context, experience, education, and credentials
- Work — Portfolio, Studio, Admin, and Identity & SSO
- Writing — technical notes and build decisions
- Resume — official professional record, inline PDF, and download
- Contact — opportunity routing

The home link is the brand mark. Engineering and Case Studies are content
patterns inside Work and Writing, not duplicate top-level destinations.
Individual Studio products remain nested in the Studio detail page. Resume and
Writing are never hidden inside a secondary menu or footer-only destination.

### Supporting-page contracts

The same information model continues beyond the homepage:

- `/work` — the four canonical systems with links to consistent detail pages.
  The Studio page names its internal products without promoting each one to a
  separate Work card. Legacy project URLs redirect here.
- `/writing` — all published writing, organized by the four pillars above, with
  links into relevant work or case studies.
- `/about` — the concise story, working principles, current professional
  context, and a link to the complete Resume.
- `/resume` — the official employment record, skills, education, credentials,
  inline PDF viewer, and download path.
- `/contact` — the intent-routed form and alternate email, LinkedIn, GitHub,
  Resume, and Writing paths.

Engineering depth remains directly reachable through every Work detail page and
through Writing; it is not hidden behind an unnamed “platform” card.

## 16. Messaging rules

- Use `Jayant` as the visitor-facing name.
- Use `Software Engineer` as the public identity.
- Use `Product Associate Engineer` for the current company role.
- Keep “SaaS” in relevant project, Writing, case-study, and client context; do
  not make it the identity or SEO title.
- Keep “full-stack” as an evidenced capability in skills, Resume, and project
  descriptions; do not make it the public title.
- Do not use a personal-brand umbrella project name.
- Do not claim revenue, scale, client results, testimonials, or adoption that
  cannot be verified.
- Prefer specific outcomes, decisions, constraints, and links over adjectives.

## 17. Implementation and release gate

The canonical route, vocabulary, CMS, database, and editorial accuracy work is
complete. The remaining release sequence is:

1. Complete the separate UI, responsive, accessibility, and visual audit.
2. Commit, deploy, and smoke-test canonical routes and compatibility redirects.

UI styling and UI audit remain separate phases and must not be mixed into
content approval.

## 18. Canonical naming contract

- Public section keys are `about`, `work`, `writing`, `resume`, and `contact`.
  `case-studies`, `projects`, `studio`, and `engineering` remain compatibility
  route terms only where redirects are needed.
- GitHub remains the underlying provider and source URL for the Activity
  section; it is not the public section label.
- The product is `Sync Scratchpad`; its route is `/scratchpad`, its API is
  `/api/scratchpad`, and its live table is `jg_app.scratchpad_entries` with
  `entry_type`.
- `Projects`, `Blog`, and the old GitHub section key are historical
  compatibility terms only. Active runtime code, CMS rows, schema snapshots,
  and docs use Work, Writing, and Activity. Compatibility redirects remain for
  existing links.
