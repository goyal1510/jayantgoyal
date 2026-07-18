-- Harden the canonical Portfolio CMS contract after the field-level usage and
-- live-data audit. This migration preserves all editorial content while making
-- the database reject states the Portfolio and Admin applications cannot use.

begin;

-- Normalize operational values before tightening nullability.
update portfolio.about
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.certificates
set sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.contact
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.education
set sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.experience
set bullets = coalesce(bullets, '[]'::jsonb),
    sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.hero
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.nav_items
set sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.projects
set tags = coalesce(tags, '[]'::jsonb),
    sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.skill_categories
set sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update portfolio.skills
set sort_order = coalesce(sort_order, 0),
    is_visible = coalesce(is_visible, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

update jg_app.blog_posts
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

-- These values are ordered lists of strings, not arbitrary JSON documents.
-- Native arrays make their shape explicit and match the existing Blog tags.
alter table portfolio.about
  add column story_values text[] default '{}'::text[] not null;

update portfolio.about as source
set story_values = array(
  select item.value
  from jsonb_array_elements_text(source.story)
    with ordinality as item(value, ordinal)
  order by item.ordinal
);

alter table portfolio.about
  drop column story;

alter table portfolio.about
  rename column story_values to story;

alter table portfolio.experience
  add column bullet_values text[] default '{}'::text[] not null;

update portfolio.experience as source
set bullet_values = array(
  select item.value
  from jsonb_array_elements_text(source.bullets)
    with ordinality as item(value, ordinal)
  order by item.ordinal
);

alter table portfolio.experience
  drop column bullets;

alter table portfolio.experience
  rename column bullet_values to bullets;

alter table portfolio.projects
  add column tag_values text[] default '{}'::text[] not null;

update portfolio.projects as source
set tag_values = array(
  select item.value
  from jsonb_array_elements_text(source.tags)
    with ordinality as item(value, ordinal)
  order by item.ordinal
);

alter table portfolio.projects
  drop column tags;

alter table portfolio.projects
  rename column tag_values to tags;

-- Use the repository's monotonic UUID convention for all future CMS rows.
alter table portfolio.about
  alter column id set default jg_app.uuid_v7(),
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.certificates
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.contact
  alter column id set default jg_app.uuid_v7(),
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.education
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.experience
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.hero
  alter column id set default jg_app.uuid_v7(),
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.nav_items
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.projects
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.skill_categories
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table portfolio.skills
  alter column id set default jg_app.uuid_v7(),
  alter column sort_order set not null,
  alter column is_visible set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table jg_app.blog_posts
  alter column created_at set not null,
  alter column updated_at set not null;

-- Reusable immutable validators keep ordered CMS arrays strict without
-- normalizing small singleton-owned collections into unnecessary tables.
create or replace function portfolio.is_nonblank_text_array(value text[])
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  item text;
begin
  foreach item in array value loop
    if item is null or btrim(item) = '' then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function portfolio.is_exact_text_object_array(
  value jsonb,
  required_fields text[]
)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  element jsonb;
  required_field text;
  object_key text;
begin
  if jsonb_typeof(value) is distinct from 'array' then
    return false;
  end if;

  for element in
    select item
    from jsonb_array_elements(value) as elements(item)
  loop
    if jsonb_typeof(element) is distinct from 'object' then
      return false;
    end if;

    foreach required_field in array required_fields loop
      if jsonb_typeof(element -> required_field) is distinct from 'string'
        or btrim(element ->> required_field) = '' then
        return false;
      end if;
    end loop;

    for object_key in
      select key
      from jsonb_object_keys(element) as object_keys(key)
    loop
      if not object_key = any(required_fields) then
        return false;
      end if;
    end loop;
  end loop;

  return true;
end;
$$;

-- Required copy must contain content, not merely a non-null empty string.
alter table portfolio.about
  add constraint about_required_copy_nonblank_check check (
    btrim(summary) <> ''
    and btrim(headline) <> ''
    and btrim(objective) <> ''
  ),
  add constraint about_story_items_check check (
    portfolio.is_nonblank_text_array(story)
  ),
  add constraint about_personal_shape_check check (
    portfolio.is_exact_text_object_array(
      personal,
      array['label', 'value']::text[]
    )
  ),
  add constraint about_principles_shape_check check (
    portfolio.is_exact_text_object_array(
      principles,
      array['title', 'copy']::text[]
    )
  );

alter table portfolio.certificates
  add constraint certificates_required_fields_nonblank_check check (
    btrim(name) <> ''
    and btrim(category) <> ''
    and btrim(issuer) <> ''
    and btrim(image_alt) <> ''
    and btrim(document_url) <> ''
    and btrim(preview_url) <> ''
  ),
  add constraint certificates_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table portfolio.contact
  add constraint contact_required_fields_nonblank_check check (
    btrim(email) <> ''
    and btrim(phone) <> ''
    and btrim(location) <> ''
  ),
  add constraint contact_socials_shape_check check (
    portfolio.is_exact_text_object_array(
      socials,
      array['label', 'href', 'icon_key']::text[]
    )
  );

alter table portfolio.education
  add constraint education_required_fields_nonblank_check check (
    btrim(school) <> ''
    and btrim(degree) <> ''
    and btrim(period) <> ''
  ),
  add constraint education_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table portfolio.experience
  add constraint experience_required_fields_nonblank_check check (
    btrim(company) <> ''
    and btrim(role) <> ''
    and btrim(period) <> ''
  ),
  add constraint experience_bullets_items_check check (
    portfolio.is_nonblank_text_array(bullets)
  ),
  add constraint experience_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table portfolio.hero
  add constraint hero_required_fields_nonblank_check check (
    btrim(name) <> ''
    and btrim(display_name) <> ''
    and btrim(role) <> ''
    and btrim(tagline) <> ''
    and btrim(blurb) <> ''
    and btrim(headline) <> ''
    and btrim(current_title) <> ''
    and btrim(availability) <> ''
    and btrim(resume_url) <> ''
    and btrim(github_username) <> ''
    and btrim(seo_title) <> ''
    and btrim(seo_description) <> ''
  );

alter table portfolio.nav_items
  add constraint nav_items_required_fields_nonblank_check check (
    btrim(section_id) <> ''
    and btrim(label) <> ''
  ),
  add constraint nav_items_section_id_check check (
    section_id = any(
      array[
        'about',
        'skills',
        'experience',
        'activity',
        'work',
        'writing'
      ]::text[]
    )
  ),
  add constraint nav_items_sort_order_nonnegative_check check (
    sort_order >= 0
  ),
  add constraint nav_items_section_id_fkey foreign key (section_id)
    references portfolio.section_content(section_key)
    on update cascade
    on delete restrict;

alter table portfolio.projects
  drop constraint projects_slug_format_check,
  add constraint projects_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  add constraint projects_required_fields_nonblank_check check (
    btrim(name) <> ''
    and btrim(short_description) <> ''
    and btrim(slug) <> ''
    and btrim(eyebrow) <> ''
    and btrim(impact) <> ''
    and btrim(contribution) <> ''
    and btrim(year_label) <> ''
    and btrim(image_alt) <> ''
    and btrim(image_url) <> ''
  ),
  add constraint projects_tags_items_check check (
    portfolio.is_nonblank_text_array(tags)
  ),
  add constraint projects_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table portfolio.section_content
  drop constraint section_content_key_format_check,
  add constraint section_content_section_key_check check (
    section_key = any(
      array[
        'hero',
        'about',
        'skills',
        'education',
        'experience',
        'credentials',
        'activity',
        'work',
        'writing',
        'contact',
        'blog',
        'article',
        'resume'
      ]::text[]
    )
  ),
  add constraint section_content_required_fields_nonblank_check check (
    btrim(section_key) <> ''
    and btrim(eyebrow) <> ''
  );

alter table portfolio.skill_categories
  add constraint skill_categories_required_fields_nonblank_check check (
    btrim(title) <> ''
    and btrim(description) <> ''
  ),
  add constraint skill_categories_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table portfolio.skills
  drop constraint skills_proficiency_check,
  add constraint skills_proficiency_check check (
    proficiency = any(
      array['core', 'strong', 'working', 'exploring']::text[]
    )
  ),
  add constraint skills_required_fields_nonblank_check check (
    btrim(name) <> ''
    and btrim(evidence) <> ''
  ),
  add constraint skills_sort_order_nonnegative_check check (
    sort_order >= 0
  );

alter table jg_app.blog_posts
  add constraint blog_posts_slug_format_check check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  add constraint blog_posts_required_fields_nonblank_check check (
    btrim(title) <> ''
    and btrim(slug) <> ''
  ),
  add constraint blog_posts_tags_items_check check (
    portfolio.is_nonblank_text_array(tags)
  ),
  add constraint blog_posts_published_content_check check (
    not is_published or btrim(content) <> ''
  ),
  add constraint blog_posts_published_at_check check (
    not is_published or published_at is not null
  );

-- The unique indexes already cover these lookups.
drop index if exists portfolio.idx_skills_category_id;
drop index if exists jg_app.idx_blog_slug;

-- Slugs are now non-null, so the old partial predicate is redundant.
drop index if exists portfolio.portfolio_projects_slug_key;
create unique index portfolio_projects_slug_key
  on portfolio.projects (slug);

-- Public child records should not leak when their owning CMS record is hidden.
drop policy if exists "Public read access" on portfolio.nav_items;
create policy "Public read access"
  on portfolio.nav_items
  for select
  using (
    is_visible
    and exists (
      select 1
      from portfolio.section_content
      where section_content.section_key = nav_items.section_id
        and section_content.is_visible
    )
  );

drop policy if exists "Public read access" on portfolio.skills;
create policy "Public read access"
  on portfolio.skills
  for select
  using (
    is_visible
    and exists (
      select 1
      from portfolio.skill_categories
      where skill_categories.id = skills.category_id
        and skill_categories.is_visible
    )
  );

commit;
