begin;

-- The public vocabulary is now Work and Writing. Rename the backing objects so
-- the CMS, API routes, and database do not carry a second canonical language.
alter table portfolio.projects rename to work;
alter table jg_app.blog_posts rename to writing_posts;

-- Keep the case-study validation helpers aligned with the renamed Work table.
alter function portfolio.is_project_case_study_shape(jsonb)
  rename to is_work_case_study_shape;
alter function portfolio.is_complete_project_case_study(jsonb)
  rename to is_complete_work_case_study;

create or replace function portfolio.is_complete_work_case_study(value jsonb)
returns boolean
language sql
immutable
set search_path to ''
as $$
  select case
    when not portfolio.is_work_case_study_shape(value) then false
    else
      pg_catalog.btrim(value ->> 'problem') <> ''
      and pg_catalog.btrim(value ->> 'solution') <> ''
      and pg_catalog.btrim(value ->> 'architecture') <> ''
      and pg_catalog.btrim(value ->> 'security') <> ''
      and pg_catalog.btrim(value ->> 'tradeoffs') <> ''
      and pg_catalog.btrim(value ->> 'outcome') <> ''
      and pg_catalog.btrim(value ->> 'next_improvement') <> ''
      and pg_catalog.jsonb_array_length(value -> 'decisions') >= 2
      and not exists (
        select 1
        from pg_catalog.jsonb_array_elements(value -> 'decisions') as decision
        where pg_catalog.btrim(decision ->> 'title') = ''
          or pg_catalog.btrim(decision ->> 'detail') = ''
      )
  end;
$$;

-- Rename constraints, indexes, and triggers so introspection and future work
-- use the same terms as the public product.
alter table portfolio.work rename constraint projects_case_study_publication_check
  to work_case_study_publication_check;
alter table portfolio.work rename constraint projects_case_study_shape_check
  to work_case_study_shape_check;
alter table portfolio.work rename constraint projects_required_fields_nonblank_check
  to work_required_fields_nonblank_check;
alter table portfolio.work rename constraint projects_slug_format_check
  to work_slug_format_check;
alter table portfolio.work rename constraint projects_sort_order_nonnegative_check
  to work_sort_order_nonnegative_check;
alter table portfolio.work rename constraint projects_tags_items_check
  to work_tags_items_check;
alter table portfolio.work rename constraint projects_pkey to work_pkey;

alter index portfolio.idx_projects_sort_order rename to idx_work_sort_order;
alter index portfolio.portfolio_projects_slug_key rename to portfolio_work_slug_key;
alter trigger projects_updated_at on portfolio.work rename to work_updated_at;
alter policy "Admin write access" on portfolio.work rename to "Admin work access";
alter policy "Public read access" on portfolio.work rename to "Public work access";

alter table jg_app.writing_posts rename constraint blog_posts_published_at_check
  to writing_posts_published_at_check;
alter table jg_app.writing_posts rename constraint blog_posts_published_content_check
  to writing_posts_published_content_check;
alter table jg_app.writing_posts rename constraint blog_posts_required_fields_nonblank_check
  to writing_posts_required_fields_nonblank_check;
alter table jg_app.writing_posts rename constraint blog_posts_slug_format_check
  to writing_posts_slug_format_check;
alter table jg_app.writing_posts rename constraint blog_posts_tags_items_check
  to writing_posts_tags_items_check;
alter table jg_app.writing_posts rename constraint blog_posts_pkey to writing_posts_pkey;
alter table jg_app.writing_posts rename constraint blog_posts_slug_key
  to writing_posts_slug_key;
alter index jg_app.idx_blog_published rename to idx_writing_published;
alter trigger update_blog_posts_updated_at on jg_app.writing_posts
  rename to update_writing_posts_updated_at;
alter policy "Admins can manage posts" on jg_app.writing_posts
  rename to "Admins can manage writing";
alter policy "Anyone can read published posts" on jg_app.writing_posts
  rename to "Anyone can read published writing";

-- Re-key CMS rows before restoring the foreign key between navigation and copy.
alter table portfolio.nav_items drop constraint if exists nav_items_section_id_fkey;
alter table portfolio.nav_items drop constraint if exists nav_items_section_id_check;
alter table portfolio.section_content drop constraint if exists section_content_section_key_check;

update portfolio.section_content
set section_key = case section_key
  when 'projects' then 'work'
  when 'blog' then 'writing'
  when 'github' then 'activity'
  else section_key
end
where section_key in ('projects', 'blog', 'github');

update portfolio.nav_items
set section_id = case section_id
  when 'projects' then 'work'
  when 'blog' then 'writing'
  when 'github' then 'activity'
  else section_id
end
where section_id in ('projects', 'blog', 'github');

alter table portfolio.section_content
  add constraint section_content_section_key_check check (
    section_key = any (array[
      'hero', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'work', 'contact', 'writing', 'article', 'resume',
      'studio', 'case-studies', 'engineering'
    ]::text[])
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any (array[
      'hero', 'about', 'skills', 'education', 'experience', 'credentials',
      'activity', 'work', 'contact', 'writing', 'article', 'resume',
      'studio', 'case-studies', 'engineering'
    ]::text[])
  );

alter table portfolio.nav_items
  add constraint nav_items_section_id_fkey
  foreign key (section_id)
  references portfolio.section_content(section_key)
  on update cascade
  on delete restrict;

-- Make the canonical destinations visible in the CMS navigation. GitHub stays
-- the underlying provider; Activity is the public section name.
update portfolio.nav_items
set label = case section_id
  when 'activity' then 'Activity'
  when 'work' then 'Work'
  when 'writing' then 'Writing'
  else label
end,
note = case section_id
  when 'activity' then 'GitHub activity and open-source work'
  when 'work' then 'Products, systems, and case studies'
  when 'writing' then 'Notes on engineering and product work'
  else note
end,
is_visible = case when section_id = 'activity' then true else is_visible end
where section_id in ('activity', 'work', 'writing');

update portfolio.section_content
set eyebrow = case section_key
  when 'activity' then 'Activity'
  when 'work' then 'Work'
  when 'writing' then 'Writing'
  else eyebrow
end
where section_key in ('activity', 'work', 'writing');

commit;
