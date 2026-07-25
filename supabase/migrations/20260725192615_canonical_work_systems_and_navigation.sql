begin;

-- The public Work index represents four systems, not every utility inside
-- Studio. Keep the older records in the CMS for history, but remove them from
-- the public surface and replace them with canonical system-level records.
update portfolio.work
set is_visible = false
where slug in (
  'tech-tools',
  'file-manager',
  'game-hub',
  'activity-tracker',
  'sync-scratchpad',
  'custom-calculator',
  'ecommerce'
);

insert into portfolio.work (
  name,
  short_description,
  github_link,
  live_link,
  sort_order,
  is_visible,
  slug,
  eyebrow,
  impact,
  contribution,
  year_label,
  image_alt,
  image_url,
  tags,
  case_study,
  case_study_published
)
values
(
  'Portfolio',
  'A public professional site backed by a CMS, Writing and Resume publishing, a contact workflow, and cross-application identity.',
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/portfolio',
  'https://jayantgoyal.com',
  1,
  true,
  'portfolio',
  'Public product surface',
  'One source of truth connects public content, editorial operations, resume delivery, and the systems behind the work.',
  'Product engineering · Editorial systems',
  '2025—26',
  'Jayant portfolio homepage showing the public product surface.',
  '/images/portfolio.png',
  array['Next.js App Router', 'Supabase editorial data', 'PostgreSQL CMS schema', 'Vercel delivery'],
  jsonb_build_object(
    'problem', 'A portfolio needed to do more than display a resume. It needed to explain the work clearly, publish Writing, serve a current resume, and remain maintainable as the underlying products grew.',
    'solution', 'I built a database-backed public site with a typed editorial contract, a CMS-owned content model, a Writing system, a resilient contact workflow, and a direct connection to the product systems it describes.',
    'architecture', 'Next.js server components load curated Portfolio records from Supabase schemas. The Admin application writes the same records, shared branding and route contracts keep the applications aligned, and Vercel deploys the public surface independently.',
    'decisions', jsonb_build_array(
      jsonb_build_object('title', 'Make editorial data the source of truth', 'detail', 'Public pages and Admin mutations share the same schema, typed fields, visibility rules, and validation boundaries instead of maintaining a second static content copy.'),
      jsonb_build_object('title', 'Separate public and operational surfaces', 'detail', 'The public Portfolio explains the work while Admin owns publishing and Auth owns account security; visitors never need access to internal operations.'),
      jsonb_build_object('title', 'Treat content as a product surface', 'detail', 'Writing, Resume, Work, and Contact are first-class flows with their own metadata, links, and failure states rather than incidental sections in a single page.' )
    ),
    'security', 'Public reads use curated schema queries, private administrative writes require authenticated roles, and service-role credentials stay out of the browser. Contact submissions are validated and rate limited at the server boundary.',
    'tradeoffs', 'A CMS-backed portfolio has more moving parts than a static personal site, but it makes publishing, route ownership, and content accuracy explicit. The remaining cost is keeping shared contracts and migrations disciplined.',
    'outcome', 'The portfolio is an operating product surface: it communicates the work, publishes technical writing, exposes a usable resume, and gives a founder or recruiter a direct path to evidence and contact.',
    'next_improvement', 'Add inline resume rendering with a reliable PDF fallback, improve editorial preview workflows, and make the relationship between public Work records and their private operating systems even clearer.'
  ),
  true
),
(
  'Studio',
  'A unified product suite for developer tools, private storage, realtime games, activity tracking, Scratchpad, calculators, and utilities.',
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio',
  'https://studio.jayantgoyal.com',
  2,
  true,
  'studio',
  'Product suite',
  'A shared application shell turns several recurring-use products into one coherent surface with common identity, navigation, persistence, and delivery.',
  'Product engineering · Full-stack systems',
  '2025—26',
  'Studio product suite with developer tools, storage, games, and personal utilities.',
  '/images/studio-tools.png',
  array['Next.js App Router', 'Supabase Auth and Realtime', 'PostgreSQL and RLS', 'Storage workflows'],
  jsonb_build_object(
    'problem', 'A growing collection of useful tools and product experiments needed a consistent home without becoming a disconnected gallery of demos. Each surface also carried real requirements around identity, persistence, privacy, and delivery.',
    'solution', 'I built Studio as one product suite. Tech Tools, File Manager, Game Hub, Activity Tracker, Scratchpad, calculators, Weather, and related utilities share the shell while keeping their domain logic explicit.',
    'architecture', 'A Next.js application shell owns navigation, auth gates, loading, SEO, and shared interaction patterns. Supabase provides schema-scoped PostgreSQL data, Auth, Storage, Realtime, and row-level policies; individual products add their own route handlers and state models.',
    'decisions', jsonb_build_array(
      jsonb_build_object('title', 'Group products by a shared user experience', 'detail', 'The public portfolio presents Studio as one product while the application keeps clear boundaries between tools, storage, games, activity, and personal utilities.'),
      jsonb_build_object('title', 'Reuse infrastructure without flattening domain logic', 'detail', 'Auth, navigation, loading, metadata, and persistence patterns are shared, while file workflows, game rules, activity entries, and tool operations remain specialized.'),
      jsonb_build_object('title', 'Keep the server authoritative where state matters', 'detail', 'Storage permissions, game actions, activity writes, and synchronized state are validated at the route or database boundary instead of trusting browser state.' )
    ),
    'security', 'Protected routes use Supabase SSR sessions, role and ownership checks, private Storage policies, signed URLs, and schema-scoped row-level security. Realtime is used for delivery, not as an authorization boundary.',
    'tradeoffs', 'A unified suite makes recurring products easier to discover and operate, but it increases the need for route, metadata, and shared-contract discipline. The portfolio therefore describes Studio once and treats its internal surfaces as capabilities.',
    'outcome', 'Studio demonstrates end-to-end product ownership across a product shell, multiple data models, private storage, realtime state, authentication, and independently shipped features.',
    'next_improvement', 'Add stronger cross-product observability, make shared platform contracts more explicit in the Admin surface, and publish deeper technical notes for the highest-complexity workflows.'
  ),
  true
),
(
  'Admin',
  'A private CMS and operations interface for managing Portfolio content, Work, Writing, assets, users, and publishing state.',
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/admin',
  'https://admin.jayantgoyal.com',
  3,
  true,
  'admin',
  'Editorial operations',
  'The public site can evolve without code edits because one authenticated operations surface manages the same records that visitors read.',
  'Full-stack engineering · CMS architecture',
  '2025—26',
  'Private Admin CMS for Portfolio content and publishing operations.',
  '/images/admin.png',
  array['Next.js App Router', 'Supabase SSR and RLS', 'Role-based access', 'CMS workflows'],
  jsonb_build_object(
    'problem', 'A content-driven portfolio becomes difficult to maintain when every change requires editing code, coordinating duplicated copy, or manually updating several application surfaces.',
    'solution', 'I built a private Admin application that manages Portfolio, About, Work, Writing, Activity, assets, users, roles, and publishing state through the same contracts consumed by the public site.',
    'architecture', 'Admin server routes use Supabase SSR sessions and role checks before writing schema-scoped records. Shared data contracts validate fields and case-study shape, while revalidation tells the public Portfolio when editorial content has changed.',
    'decisions', jsonb_build_array(
      jsonb_build_object('title', 'Keep the CMS contract typed', 'detail', 'Admin forms, API routes, public queries, and database constraints agree on field names, visibility, slugs, and structured case-study content.'),
      jsonb_build_object('title', 'Gate operations by role', 'detail', 'Admin and super-admin permissions are checked server-side, so a hidden button is never treated as the authorization boundary.'),
      jsonb_build_object('title', 'Make publishing explicit', 'detail', 'Visibility, publication state, asset ownership, and cache revalidation are treated as part of the editorial workflow rather than incidental side effects.' )
    ),
    'security', 'The application is private, protected by Supabase SSR sessions and role checks, and backed by database policies. Public Portfolio reads never receive service-role credentials or unrestricted Admin data.',
    'tradeoffs', 'A dedicated CMS adds an application to operate, but it removes fragile content duplication and makes publishing, validation, and rollback paths visible. The private URL is intentionally not a visitor-facing product destination.',
    'outcome', 'Admin turns the portfolio from a one-off website into a maintainable editorial system with clear ownership between content, operations, and public rendering.',
    'next_improvement', 'Add a full preview/diff workflow, capture a clean Admin evidence image for the public case study, and make bulk editorial changes safer through explicit review states.'
  ),
  true
),
(
  'Identity & SSO',
  'A shared authentication and account-security foundation connecting Portfolio, Studio, Admin, and Auth surfaces.',
  'https://github.com/goyal1510/jayantgoyal/tree/main/packages/auth',
  'https://auth.jayantgoyal.com',
  4,
  true,
  'identity-sso',
  'Cross-application identity',
  'One identity layer gives multiple applications consistent sessions, OAuth entry points, protected routes, and account-security controls.',
  'Authentication architecture · Security boundaries',
  '2025—26',
  'Shared authentication and SSO flow across Jayant applications.',
  '/images/identity.png',
  array['Supabase Auth', 'OAuth and PKCE', 'SSR session cookies', 'MFA and RLS'],
  jsonb_build_object(
    'problem', 'Multiple applications need authentication without each inventing its own session handling, callback rules, return URLs, logout behavior, and account-security surface.',
    'solution', 'I built a shared identity foundation for email, Google, GitHub, password recovery, MFA, connected providers, safe redirects, and explicit logout scopes across the application family.',
    'architecture', 'A shared auth package provides browser/server clients, cookie and session contracts, safe-return validation, and logout behavior. Each application retains ownership of its route policy while Auth owns account-security flows and Supabase remains the identity provider.',
    'decisions', jsonb_build_array(
      jsonb_build_object('title', 'Share contracts, keep policy local', 'detail', 'Common session mechanics live in one package, while Portfolio, Studio, and Admin decide which routes are public, protected, or role-gated.'),
      jsonb_build_object('title', 'Validate every return path', 'detail', 'OAuth and logout flows only accept configured application origins and safe paths, preventing a convenient redirect parameter from becoming an open redirect.'),
      jsonb_build_object('title', 'Treat security as a product surface', 'detail', 'Password recovery, MFA, provider management, and explicit logout are exposed as understandable flows instead of hidden implementation details.' )
    ),
    'security', 'PKCE OAuth, SSR session cookies, safe-return validation, MFA challenges, provider controls, and database row-level security combine to keep identity and authorization boundaries explicit.',
    'tradeoffs', 'A shared identity layer requires careful versioned contracts and coordinated deployments, but it avoids four divergent authentication implementations and makes account security reusable.',
    'outcome', 'The applications share a coherent identity experience while preserving application-specific authorization and route ownership.',
    'next_improvement', 'Complete the Auth cutover gate, add cross-application session regression tests, and publish a concise security note explaining the trust boundaries.'
  ),
  true
);

update portfolio.nav_items
set is_visible = false
where section_id not in ('about', 'work', 'writing', 'resume', 'contact');

update portfolio.nav_items
set label = case section_id
  when 'about' then 'About'
  when 'work' then 'Work'
  when 'writing' then 'Writing'
  when 'resume' then 'Resume'
  when 'contact' then 'Contact'
  else label
end,
note = case section_id
  when 'about' then 'About, experience, and education'
  when 'work' then 'Four systems built and shipped'
  when 'writing' then 'Notes on engineering and product work'
  when 'resume' then 'Current resume and experience snapshot'
  when 'contact' then 'Start a product conversation'
  else note
end,
sort_order = case section_id
  when 'about' then 1
  when 'work' then 2
  when 'writing' then 3
  when 'resume' then 4
  when 'contact' then 5
  else sort_order
end,
is_visible = true
where section_id in ('about', 'work', 'writing', 'resume', 'contact');

update portfolio.section_content
set eyebrow = case section_key
  when 'about' then 'About'
  when 'work' then 'Work'
  when 'writing' then 'Writing'
  when 'resume' then 'Resume'
  when 'contact' then 'Contact'
  else eyebrow
end,
headline = case section_key
  when 'work' then 'Four systems built and shipped.'
  when 'resume' then 'The concise version of the path so far.'
  else headline
end,
description = case section_key
  when 'work' then 'A small set of complete systems, each explained from the problem through the engineering decisions and outcome.'
  when 'resume' then 'A current PDF snapshot of the experience, education, and product engineering work behind this portfolio.'
  else description
end,
supporting_text = case section_key
  when 'work' then 'Choose a system to see the problem, solution, architecture, and tradeoffs.'
  when 'resume' then 'View the resume in the browser or download a copy for later.'
  else supporting_text
end
where section_key in ('about', 'work', 'writing', 'resume', 'contact');

commit;
