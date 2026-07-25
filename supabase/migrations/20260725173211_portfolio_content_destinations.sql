begin;

-- Bring the current portfolio vocabulary into one canonical model. The old
-- keys are renamed in-place before the new public destinations are introduced.
alter table portfolio.nav_items
  drop constraint if exists nav_items_section_id_fkey;

alter table portfolio.section_content
  drop constraint if exists section_content_section_key_check;

alter table portfolio.nav_items
  drop constraint if exists nav_items_section_id_check;

update portfolio.section_content
set section_key = 'projects'
where section_key = 'work';

update portfolio.section_content
set section_key = 'github'
where section_key = 'activity';

delete from portfolio.section_content
where section_key = 'writing';

update portfolio.nav_items
set section_id = case section_id
  when 'work' then 'projects'
  when 'writing' then 'blog'
  when 'activity' then 'github'
  else section_id
end;

alter table portfolio.section_content
  add constraint section_content_section_key_check check (
    section_key = any(
      array[
        'hero', 'about', 'skills', 'education', 'experience', 'credentials',
        'github', 'projects', 'contact', 'blog', 'article', 'resume', 'studio',
        'case-studies', 'engineering'
      ]::text[]
    )
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any(
      array[
        'about', 'skills', 'experience', 'github', 'projects', 'blog', 'resume',
        'studio', 'case-studies', 'engineering', 'contact'
      ]::text[]
    )
  );

insert into portfolio.section_content (
  section_key,
  eyebrow,
  headline,
  description,
  supporting_text,
  is_visible
)
values
  (
    'studio',
    'Studio / Product suite',
    'A suite of products built to be used, not just displayed.',
    'Developer tools, private storage, realtime games, activity tracking, calculators, and utilities built and operated as one coherent product suite.',
    'Explore the complete Studio suite and the engineering decisions behind each product.',
    true
  ),
  (
    'case-studies',
    'Case studies / Deep proof',
    'The decisions behind the software.',
    'Selected product and engineering stories covering the problem, role, architecture, security boundaries, tradeoffs, and outcome.',
    'Case studies explain how the work was built; they are not a replacement for the complete project archive.',
    true
  ),
  (
    'engineering',
    'Engineering / Systems and delivery',
    'The foundations behind the products.',
    'Portfolio CMS, authentication and account security, data boundaries, shared packages, testing, migrations, and independent delivery.',
    'Technical depth is presented as decisions and operating boundaries, not as a flat technology list.',
    true
  )
on conflict (section_key) do update
set
  eyebrow = excluded.eyebrow,
  headline = excluded.headline,
  description = excluded.description,
  supporting_text = excluded.supporting_text,
  is_visible = excluded.is_visible;

update portfolio.nav_items
set is_visible = false
where section_id in ('skills', 'experience', 'github');

insert into portfolio.nav_items (section_id, label, note, sort_order, is_visible)
values
  ('about', 'About', 'Story and experience', 0, true),
  ('studio', 'Studio', 'Product suite', 1, true),
  ('projects', 'Projects', 'Independent work', 2, true),
  ('case-studies', 'Case Studies', 'Deep proof', 3, true),
  ('engineering', 'Engineering', 'Systems and delivery', 4, true),
  ('blog', 'Blog', 'Technical writing', 5, true),
  ('resume', 'Resume', 'Professional record', 6, true),
  ('contact', 'Contact', 'Start a conversation', 7, true)
on conflict (section_id) do update
set
  label = excluded.label,
  note = excluded.note,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

alter table portfolio.nav_items
  add constraint nav_items_section_id_fkey
  foreign key (section_id)
  references portfolio.section_content(section_key)
  on update cascade
  on delete restrict;

commit;
