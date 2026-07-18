-- Make the approved editorial Portfolio copy fully manageable from Admin.
-- Presentation geometry remains in code; visible personal and section copy lives here.

alter table portfolio.hero
  add column if not exists display_name text;

alter table portfolio.nav_items
  add column if not exists note text;

create table if not exists portfolio.section_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  eyebrow text not null,
  headline text,
  accent text,
  description text,
  supporting_text text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint section_content_key_format_check
    check (section_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists portfolio_section_content_key_key
  on portfolio.section_content (section_key);

create index if not exists idx_section_content_sort_order
  on portfolio.section_content (sort_order);

drop trigger if exists section_content_updated_at
  on portfolio.section_content;

create trigger section_content_updated_at
  before update on portfolio.section_content
  for each row execute function portfolio.update_updated_at_column();

alter table portfolio.section_content enable row level security;

drop policy if exists "Public read access"
  on portfolio.section_content;
create policy "Public read access"
  on portfolio.section_content
  for select
  using (is_visible = true);

drop policy if exists "Admin write access"
  on portfolio.section_content;
create policy "Admin write access"
  on portfolio.section_content
  using (jg_account.is_admin())
  with check (jg_account.is_admin());

grant select, insert, update, delete
  on table portfolio.section_content
  to anon, authenticated;
grant all
  on table portfolio.section_content
  to service_role;

update portfolio.hero
set
  display_name = 'Jayant',
  blurb = 'I''m Jayant Goyal, a full-stack product engineer who turns ambitious, messy ideas into reliable experiences.',
  tagline = 'Healthcare product systems'
where is_visible = true;

update portfolio.about
set summary = 'I care about the path from the first product question to the final interaction detail.'
where is_visible = true;

insert into portfolio.section_content (
  section_key,
  eyebrow,
  headline,
  accent,
  description,
  supporting_text,
  sort_order,
  is_visible
)
values
  (
    'skills',
    'Capabilities / Across the stack',
    'Broad enough to own the path. Focused enough to sweat the details.',
    null,
    'The tools I use to shape interfaces, systems, data, and the space between them.',
    null,
    0,
    true
  ),
  (
    'education',
    'Education / Foundation',
    'Where the foundation was built.',
    null,
    null,
    null,
    1,
    true
  ),
  (
    'experience',
    'Career / The path so far',
    'Each role moved me closer to the whole product.',
    null,
    'What began in enterprise engineering now spans product thinking, systems, interfaces, and the responsibility of shipping them together.',
    null,
    2,
    true
  ),
  (
    'credentials',
    'Credentials / Milestones',
    'A few milestones, kept in one deck.',
    null,
    'Formal chapters from the learning and internships behind the work.',
    null,
    3,
    true
  ),
  (
    'activity',
    'Open source / GitHub',
    'The work between the launches.',
    null,
    'A live view of the repositories, languages, and contribution rhythm behind the public work.',
    null,
    4,
    true
  ),
  (
    'work',
    'Selected work / Product systems',
    'Built for real days, real people, and real pressure.',
    null,
    'A selection spanning developer tools, realtime collaboration, personal workflows, games, utilities, and commerce—designed and engineered from the first decision through delivery.',
    null,
    5,
    true
  ),
  (
    'writing',
    'Writing / Notes from the build',
    null,
    null,
    null,
    null,
    6,
    true
  ),
  (
    'contact',
    'Contact / Start a conversation',
    'Have an idea with',
    'sharp edges?',
    'Tell me what you are trying to make, where it feels difficult, and what a useful outcome would look like.',
    'I normally reply within one business day.',
    7,
    true
  )
on conflict (section_key) do update
set
  eyebrow = excluded.eyebrow,
  headline = excluded.headline,
  accent = excluded.accent,
  description = excluded.description,
  supporting_text = excluded.supporting_text,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

update portfolio.nav_items
set is_visible = false
where section_id not in ('about', 'skills', 'experience', 'projects');

update portfolio.nav_items
set
  section_id = 'work',
  label = 'Work',
  note = 'Projects',
  sort_order = 4,
  is_visible = true
where section_id = 'projects';

insert into portfolio.nav_items (
  section_id,
  label,
  icon_key,
  color,
  note,
  sort_order,
  is_visible
)
values
  ('about', 'About', 'User', null, 'Story', 0, true),
  ('skills', 'Skills', 'BrainCog', null, 'Capabilities', 1, true),
  ('experience', 'Experience', 'BriefcaseBusiness', null, 'Timeline', 2, true),
  ('activity', 'Activity', 'Github', null, 'GitHub', 3, true),
  ('work', 'Work', 'Code2', null, 'Projects', 4, true),
  ('writing', 'Writing', 'FileText', null, 'Journal', 5, true)
on conflict (section_id) do update
set
  label = excluded.label,
  icon_key = excluded.icon_key,
  note = excluded.note,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;
