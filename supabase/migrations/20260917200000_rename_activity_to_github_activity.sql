begin;

alter table portfolio.nav_items
  drop constraint if exists nav_items_section_id_check;

alter table portfolio.section_content
  drop constraint if exists section_content_section_key_check;

alter table portfolio.section_content
  add constraint section_content_section_key_check check (
    section_key = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'github_activity', 'analytics', 'work', 'contact', 'writing',
      'article', 'resume', 'studio', 'case-studies', 'engineering'
    ]::text[])
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'github_activity', 'analytics', 'work', 'contact', 'writing',
      'article', 'resume', 'studio', 'case-studies', 'engineering'
    ]::text[])
  );

update portfolio.section_content
set section_key = 'github_activity'
where section_key = 'activity';

alter table portfolio.nav_items
  drop constraint nav_items_section_id_check;

alter table portfolio.section_content
  drop constraint section_content_section_key_check;

alter table portfolio.section_content
  add constraint section_content_section_key_check check (
    section_key = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'github_activity', 'analytics', 'work', 'contact', 'writing', 'article',
      'resume', 'studio', 'case-studies', 'engineering'
    ]::text[])
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any (array[
      'hero', 'home', 'about', 'skills', 'education', 'experience', 'credentials',
      'github_activity', 'analytics', 'work', 'contact', 'writing', 'article',
      'resume', 'studio', 'case-studies', 'engineering'
    ]::text[])
  );

commit;
