begin;

alter table portfolio.nav_items
  drop constraint if exists nav_items_section_id_check;

alter table portfolio.section_content
  drop constraint if exists section_content_section_key_check;

alter table portfolio.section_content
  add constraint section_content_section_key_check check (
    section_key = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'analytics', 'work', 'contact', 'writing', 'article', 'resume',
      'studio', 'case-studies', 'engineering'
    ]::text[])
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'analytics', 'work', 'contact', 'writing', 'article', 'resume',
      'studio', 'case-studies', 'engineering'
    ]::text[])
  );

insert into portfolio.section_content (
  section_key,
  eyebrow,
  headline,
  accent,
  description,
  supporting_text,
  is_visible
)
values
  (
    'home',
    'Home',
    'Portfolio',
    '',
    'The public overview of the work, writing, and product systems.',
    'Portfolio overview',
    true
  ),
  (
    'analytics',
    'Analytics',
    'Live site analytics',
    'See the site at work.',
    'A public, privacy-conscious view of traffic, global reach, cache efficiency, and the experience measured in real visitors'' browsers.',
    'A public, privacy-conscious view of traffic, global reach, cache efficiency, and the experience measured in real visitors'' browsers.',
    true
  )
on conflict (section_key) do update
set
  eyebrow = excluded.eyebrow,
  headline = excluded.headline,
  accent = excluded.accent,
  description = excluded.description,
  supporting_text = excluded.supporting_text,
  is_visible = excluded.is_visible;

update portfolio.nav_items
set section_id = 'home'
where section_id = 'hero';

update portfolio.nav_items
set section_id = 'analytics'
where section_id = 'activity';

update portfolio.section_content
set
  accent = '',
  supporting_text = 'Contribution history stays derived from the public GitHub profile.'
where section_key = 'activity';

commit;
