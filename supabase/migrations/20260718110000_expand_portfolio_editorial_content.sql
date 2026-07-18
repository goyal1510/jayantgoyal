-- Expand the canonical portfolio content model for the editorial redesign
-- while preserving every legacy column during the application transition.

alter table portfolio.hero
  add column if not exists headline text,
  add column if not exists current_title text,
  add column if not exists availability text,
  add column if not exists resume_url text;

alter table portfolio.about
  add column if not exists headline text,
  add column if not exists objective text,
  add column if not exists story jsonb not null default '[]'::jsonb,
  add column if not exists principles jsonb not null default '[]'::jsonb;

alter table portfolio.skill_categories
  add column if not exists description text;

alter table portfolio.skills
  add column if not exists proficiency text,
  add column if not exists evidence text,
  add column if not exists is_featured boolean not null default true;

alter table portfolio.skills
  drop constraint if exists skills_proficiency_check;

alter table portfolio.skills
  add constraint skills_proficiency_check
  check (
    proficiency is null
    or proficiency in ('core', 'strong', 'working', 'exploring')
  );

alter table portfolio.projects
  add column if not exists slug text,
  add column if not exists eyebrow text,
  add column if not exists impact text,
  add column if not exists contribution text,
  add column if not exists year_label text,
  add column if not exists image_key text,
  add column if not exists image_alt text,
  add column if not exists is_featured boolean not null default false;

alter table portfolio.projects
  drop constraint if exists projects_slug_format_check;

alter table portfolio.projects
  add constraint projects_slug_format_check
  check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table portfolio.certificates
  add column if not exists issued_at date,
  add column if not exists credential_id text,
  add column if not exists credential_url text,
  add column if not exists document_key text,
  add column if not exists preview_key text,
  add column if not exists image_alt text;

update portfolio.hero
set
  name = 'Jayant Goyal',
  role = 'Full-stack product engineer',
  headline = 'I turn ambitious product ideas into clear, dependable software.',
  current_title = 'Product Associate Engineer',
  tagline = 'Working across product thinking, interface craft, APIs, data, and delivery.',
  blurb = 'I enjoy the whole problem: finding the real constraint, shaping the system, shipping an early version, and polishing the details that make it feel dependable.',
  location = 'Hyderabad, India',
  availability = 'Open to thoughtful product and engineering collaborations.',
  resume_url = 'https://jayantgoyal.com/api/resume'
where is_visible = true;

update portfolio.about
set
  headline = 'I like the whole problem, not only the screen.',
  summary = 'I build useful digital products from the first product question through interface, application logic, data, and delivery.',
  objective = 'I am a full-stack product engineer working across product thinking, interface craft, APIs, data, and delivery. I care about building useful systems that remain clear as they grow.',
  story = jsonb_build_array(
    'My work moves comfortably between Next.js interfaces, TypeScript application logic, Supabase backends, and the smaller interaction details that make software feel dependable.',
    'I enjoy ambiguous product problems: finding the real constraint, mapping the system, shipping an early version, and learning from how people actually use it.'
  ),
  personal = jsonb_build_array(
    jsonb_build_object('label', 'Name', 'value', 'Jayant Goyal'),
    jsonb_build_object('label', 'Location', 'value', 'Hyderabad, India'),
    jsonb_build_object('label', 'Experience', 'value', 'Building professionally since 2023'),
    jsonb_build_object('label', 'Current role', 'value', 'Product Associate Engineer'),
    jsonb_build_object('label', 'Degree', 'value', 'B.Tech, Computer Science & Engineering')
  ),
  highlights = jsonb_build_array(
    'Full-stack product engineering',
    'React and Next.js',
    'TypeScript application architecture',
    'Supabase and PostgreSQL systems',
    'REST and realtime experiences',
    'Design systems and interaction craft'
  ),
  principles = jsonb_build_array(
    jsonb_build_object('title', 'Find the signal', 'copy', 'Start with the real user tension, not the requested interface.'),
    jsonb_build_object('title', 'Shape the system', 'copy', 'Turn messy constraints into a clear model that can survive change.'),
    jsonb_build_object('title', 'Ship the feeling', 'copy', 'Polish the moments that make a product feel fast, obvious, and alive.'),
    jsonb_build_object('title', 'Learn in public', 'copy', 'Release, observe, and let real use sharpen the next decision.')
  )
where is_visible = true;

update portfolio.skill_categories
set
  title = case id
    when '11111111-1111-1111-1111-111111111111'::uuid then 'Frontend & Interaction'
    when '22222222-2222-2222-2222-222222222222'::uuid then 'Backend & Data'
    when '33333333-3333-3333-3333-333333333333'::uuid then 'Tooling & Delivery'
    when '44444444-4444-4444-4444-444444444444'::uuid then 'Languages & Enterprise'
    else title
  end,
  description = case id
    when '11111111-1111-1111-1111-111111111111'::uuid then 'Responsive interfaces, interaction systems, and accessible product experiences.'
    when '22222222-2222-2222-2222-222222222222'::uuid then 'Application services, authentication, APIs, realtime data, storage, and relational systems.'
    when '33333333-3333-3333-3333-333333333333'::uuid then 'The workflows that keep a multi-application platform testable, deployable, and maintainable.'
    when '44444444-4444-4444-4444-444444444444'::uuid then 'Languages and enterprise technologies used across product work and earlier engineering roles.'
    else description
  end
where id in (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid
);

update portfolio.skill_categories
set
  icon_key = 'Bot',
  color = 'text-violet-500 dark:text-violet-400',
  description = 'AI-assisted engineering workflows and agent systems backed by demonstrable work.'
where title = 'AI Agent';

insert into portfolio.skill_categories (
  id,
  title,
  icon_key,
  color,
  description,
  sort_order,
  is_visible
)
select
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Product Engineering',
  'Workflow',
  'text-amber-500 dark:text-amber-400',
  'Product discovery, interface decisions, state design, and the systems thinking behind delivery.',
  4,
  true
where not exists (
  select 1
  from portfolio.skill_categories
  where lower(trim(title)) = lower('Product Engineering')
);

update portfolio.skill_categories
set sort_order = 5
where title = 'AI Agent';

update portfolio.skills as skill
set
  proficiency = updates.proficiency,
  evidence = updates.evidence,
  is_featured = updates.is_featured
from (
  values
    ('HTML', 'strong', 'Semantic foundations across every public and product interface.', true),
    ('CSS3', 'strong', 'Responsive editorial layouts, design systems, and interaction details.', true),
    ('Tailwind CSS', 'core', 'Tailwind CSS v4 across the Portfolio, Studio, Admin, Auth, and shared UI.', true),
    ('React', 'core', 'React 19 application architecture, stateful tools, games, and product workflows.', true),
    ('JavaScript', 'strong', 'Application logic, integrations, utilities, and browser interactions.', true),
    ('TypeScript', 'core', 'Strict TypeScript contracts across the full monorepo.', true),
    ('Next.js', 'core', 'Next.js 16 applications, server routes, metadata, authentication, and delivery.', true),
    ('Redux', 'working', 'Earlier state-management work in the e-commerce application.', false),
    ('Supabase', 'core', 'Auth, PostgreSQL, Realtime, Storage, RLS, and server-side data flows.', true),
    ('JWT', 'strong', 'Authentication and authorization flows across product work.', false),
    ('Node.js', 'strong', 'Server routes, integrations, automation, and application tooling.', true),
    ('PostgreSQL', 'strong', 'Relational modeling, policies, migrations, and application queries.', true),
    ('Vercel', 'core', 'Independent application deployments, domains, previews, and environment management.', true),
    ('Git', 'strong', 'Worktree-based development, reviewable changes, and multi-application delivery.', true),
    ('Java', 'strong', 'Enterprise APIs and backend performance work at HighRadius.', true),
    ('Python', 'exploring', 'Supporting scripting and problem-solving experience.', false)
) as updates(name, proficiency, evidence, is_featured)
where lower(skill.name) = lower(updates.name);

insert into portfolio.skills (
  category_id,
  name,
  icon_key,
  level,
  proficiency,
  evidence,
  sort_order,
  is_visible,
  is_featured
)
select category_id, name, icon_key, level, proficiency, evidence, sort_order, true, is_featured
from (
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Framer Motion', 'framer-motion', 85, 'strong', 'Scroll-linked motion, reduced-motion handling, and reusable interaction primitives.', 8, true),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'Radix UI', 'radix-ui', 80, 'working', 'Accessible primitives used throughout the shared component system.', 9, true),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'REST APIs', 'api', 90, 'strong', 'Designed and delivered API routes for products, integrations, and enterprise services.', 4, true),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Realtime systems', 'realtime', 85, 'strong', 'Presence, messaging, multiplayer rooms, and live Supabase subscriptions.', 5, true),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'Object storage', 'storage', 82, 'strong', 'Private uploads, signed URLs, previews, folders, recovery, and user-scoped policies.', 6, true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'GitHub', 'github', 90, 'strong', 'Source control, pull requests, Actions, repository APIs, and contribution data.', 2, true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Turborepo', 'turborepo', 85, 'strong', 'A four-application monorepo with shared packages and targeted pipelines.', 3, true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'pnpm', 'pnpm', 85, 'strong', 'Workspace dependency management and reproducible monorepo workflows.', 4, true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'Vitest', 'vitest', 78, 'working', 'Focused regression tests for shared platform, brand, auth, and SEO contracts.', 5, true),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'SQL', 'sql', 85, 'strong', 'Queries, schema design, migrations, policies, and performance-focused backend work.', 2, true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Product discovery', 'search', 86, 'strong', 'Finding the real constraint and shaping ambiguous requirements into a product direction.', 0, true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Design systems', 'component', 86, 'strong', 'Reusable tokens, components, interaction patterns, and cross-application consistency.', 1, true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'State design', 'workflow', 84, 'strong', 'Modeling persistent, realtime, and interaction-heavy application state.', 2, true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'Product analytics', 'chart', 76, 'working', 'Activity, usage, code, and operational views designed around useful decisions.', 3, true)
) as additions(category_id, name, icon_key, level, proficiency, evidence, sort_order, is_featured)
where not exists (
  select 1
  from portfolio.skills existing
  where existing.category_id = additions.category_id
    and lower(trim(existing.name)) = lower(trim(additions.name))
);

update portfolio.projects as project
set
  slug = updates.slug,
  eyebrow = updates.eyebrow,
  short_description = updates.short_description,
  impact = updates.impact,
  contribution = updates.contribution,
  year_label = updates.year_label,
  image_key = updates.image_key,
  image_alt = updates.image_alt,
  live_link = updates.live_link,
  github_link = updates.github_link,
  tags = updates.tags,
  is_featured = updates.is_featured
from (
  values
    ('Tech Tools', 'tech-tools', 'Developer utility collection', 'Generators, converters, parsers, validators, formatters, and code tools in one searchable workspace.', 'A broad utility catalog shaped into a consistent experience with categories, favorites, responsive navigation, and instant results.', 'Product engineering · Design systems', '2025—26', 'studio-tools', 'Tech Tools catalog showing the complete developer utilities interface.', 'https://studio.jayantgoyal.com/tools', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'React', 'TypeScript', 'Tailwind CSS'), true),
    ('Sync Messenger', 'sync-messenger', 'Realtime messaging', 'Private conversations with instant synchronization, authentication, and durable message history.', 'Supabase subscriptions keep conversations current across devices while a focused interface keeps the stream readable.', 'Full-stack engineering · Realtime UX', '2025', 'messenger', 'Sync Messenger conversation interface with navigation and message history.', 'https://studio.jayantgoyal.com/messenger', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'TypeScript', 'Supabase', 'Realtime'), true),
    ('Activity Tracker', 'activity-tracker', 'Personal analytics', 'Daily activity tracking with custom habits, month navigation, completion rates, and useful performance context.', 'A private, authenticated record that turns repeated daily actions into a view of progress over time.', 'Product design · Data experience', '2025', 'activity-tracker', 'Activity Tracker calendar and analytics interface.', 'https://studio.jayantgoyal.com/activity-tracker/dashboard', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'TypeScript', 'Supabase', 'Analytics'), true),
    ('Game Hub', 'game-hub', 'Local and online play', 'A growing collection of interactive games with solo, local, computer, and realtime room-based modes.', 'Shared game foundations support Tic Tac Toe, Connect Four, Memory Match, Wordle, Chess, Ludo, Dare X, and more.', 'Game systems · Interaction engineering', '2025—26', 'games', 'Game Hub catalog showing the available solo, local, and online games.', 'https://studio.jayantgoyal.com/games', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'TypeScript', 'Supabase', 'Game logic'), true),
    ('File Manager', 'file-manager', 'Private cloud workspace', 'Hierarchical folders, uploads, previews, search, move and copy operations, and recoverable deletion.', 'A complete storage workflow backed by private Supabase buckets, row-level security, and user-scoped data.', 'Full-stack engineering · Storage systems', '2025', 'file-manager', 'File Manager workspace showing folders, files, search, and private storage controls.', 'https://studio.jayantgoyal.com/files', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'Supabase Storage', 'PostgreSQL', 'RLS'), false),
    ('Currency Calculator', 'currency-calculator', 'Everyday utility', 'Cash denomination totals with bundle counting, dated history, optional notes, and persistent records.', 'A repetitive manual calculation becomes a fast, reliable workflow with full CRUD history.', 'Product engineering · Utility design', '2025', 'currency-calculator', 'Currency Calculator denomination interface with totals and persistent history.', 'https://studio.jayantgoyal.com/calculator/new', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'Supabase', 'CRUD', 'Responsive UI'), false),
    ('Custom Drag & Drop Calculator', 'custom-calculator', 'Drag-and-drop builder', 'A calculator users can assemble themselves by arranging operations and controls around their workflow.', 'Drag-and-drop composition, duplicate prevention, history actions, and persisted state turn a calculator into a small builder.', 'Interaction engineering · State design', '2025', 'custom-calculator', 'Custom Calculator drag-and-drop builder interface.', 'https://studio.jayantgoyal.com/custom-calculator', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('React', 'Zustand', 'Drag and drop', 'Tailwind CSS'), false),
    ('Weather App', 'weather', 'Location-aware forecast', 'City search, geolocation, current conditions, and a responsive multi-day forecast.', 'A familiar utility focused on fast scanning, graceful location access, and useful forecast context.', 'Frontend engineering · API integration', '2025', 'weather', 'Weather application showing current conditions and a multi-day forecast.', 'https://studio.jayantgoyal.com/weather', 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio', jsonb_build_array('Next.js', 'TypeScript', 'OpenWeather', 'Geolocation'), false),
    ('E-commerce Application', 'ecommerce', 'Product and cart experience', 'Responsive product browsing, cart state, authentication, and live API-backed catalog updates.', 'A complete commerce flow built to connect discovery, product decisions, and transaction-ready state.', 'Frontend engineering · Application state', '2024', 'ecommerce', 'E-commerce product catalog and shopping interface.', 'https://ecommerce.jayantgoyal.com/', 'https://github.com/goyal1510/jayant-ecommerce-website', jsonb_build_array('React', 'Redux', 'React Router', 'API integration'), false)
) as updates(name, slug, eyebrow, short_description, impact, contribution, year_label, image_key, image_alt, live_link, github_link, tags, is_featured)
where project.name = updates.name;

update portfolio.projects
set sort_order = case slug
  when 'tech-tools' then 0
  when 'sync-messenger' then 1
  when 'activity-tracker' then 2
  when 'game-hub' then 3
  when 'file-manager' then 4
  when 'currency-calculator' then 5
  when 'custom-calculator' then 6
  when 'weather' then 7
  when 'ecommerce' then 8
  else sort_order
end
where slug in (
  'tech-tools',
  'sync-messenger',
  'activity-tracker',
  'game-hub',
  'file-manager',
  'currency-calculator',
  'custom-calculator',
  'weather',
  'ecommerce'
);

update portfolio.certificates as certificate
set
  name = updates.name,
  issuer = updates.issuer,
  document_key = updates.document_key,
  preview_key = updates.preview_key,
  image_alt = updates.image_alt
from (
  values
    ('Hackerrank Basic', 'HackerRank Problem Solving (Basic)', 'HackerRank', 'hackerrank-basic', 'hackerrank-basic', 'HackerRank Problem Solving Basic certificate awarded to Jayant Goyal.'),
    ('Hackerrank Intermediate', 'HackerRank Problem Solving (Intermediate)', 'HackerRank', 'hackerrank-intermediate', 'hackerrank-intermediate', 'HackerRank Problem Solving Intermediate certificate awarded to Jayant Goyal.'),
    ('HighRadius Internship Appreciation', 'HighRadius Internship Appreciation', 'HighRadius', 'highradius-appreciation', 'highradius-appreciation', 'HighRadius internship appreciation certificate awarded to Jayant Goyal.'),
    ('HighRadius Internship Completion', 'HighRadius Product Engineering Internship', 'HighRadius', 'highradius-product-engineer', 'highradius-product-engineer', 'HighRadius Product and Engineering internship certificate awarded to Jayant Goyal.'),
    ('Full Stack Development', 'Full Stack Development', 'Internshala', 'full-stack-development', 'full-stack-development', 'Internshala Full Stack Development certificate awarded to Jayant Goyal.')
) as updates(current_name, name, issuer, document_key, preview_key, image_alt)
where certificate.name = updates.current_name;

create unique index if not exists portfolio_projects_slug_key
  on portfolio.projects (slug)
  where slug is not null;

create unique index if not exists portfolio_nav_items_section_id_key
  on portfolio.nav_items (section_id);

create unique index if not exists portfolio_skill_categories_title_key
  on portfolio.skill_categories (lower(trim(title)));

create unique index if not exists portfolio_skills_category_name_key
  on portfolio.skills (category_id, lower(trim(name)));

create unique index if not exists portfolio_hero_singleton_key
  on portfolio.hero ((true));

create unique index if not exists portfolio_about_singleton_key
  on portfolio.about ((true));

create unique index if not exists portfolio_contact_singleton_key
  on portfolio.contact ((true));
