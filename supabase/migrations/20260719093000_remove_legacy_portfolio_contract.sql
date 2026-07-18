-- Remove fields and rows used only by the retired dashboard Portfolio. Apply
-- this migration only after the synchronized Portfolio and Admin code is live.

delete from portfolio.nav_items
where section_id not in (
  'about',
  'skills',
  'experience',
  'activity',
  'work',
  'writing'
);

delete from portfolio.skill_categories
where title = 'AI Agent'
  and is_visible = false;

update portfolio.contact
set socials = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'label', social ->> 'label',
        'href', social ->> 'href',
        'icon_key', social ->> 'icon_key'
      )
    )
    from jsonb_array_elements(socials) as social
  ),
  '[]'::jsonb
);

update portfolio.about
set personal = coalesce(
  (
    select jsonb_agg(fact)
    from jsonb_array_elements(personal) as fact
    where lower(fact ->> 'label') <> 'name'
  ),
  '[]'::jsonb
);

drop policy if exists "Public read access" on portfolio.hero;
create policy "Public read access"
  on portfolio.hero
  for select
  using (true);

drop policy if exists "Public read access" on portfolio.about;
create policy "Public read access"
  on portfolio.about
  for select
  using (true);

drop policy if exists "Public read access" on portfolio.contact;
create policy "Public read access"
  on portfolio.contact
  for select
  using (true);

alter table portfolio.hero
  drop column if exists location,
  drop column if exists is_visible;

alter table portfolio.about
  drop column if exists highlights,
  drop column if exists is_visible;

alter table portfolio.contact
  drop column if exists is_visible;

alter table portfolio.hero
  alter column display_name set not null,
  alter column tagline set not null,
  alter column blurb set not null,
  alter column headline set not null,
  alter column current_title set not null,
  alter column availability set not null,
  alter column resume_url set not null;

alter table portfolio.about
  alter column summary set not null,
  alter column personal set not null,
  alter column headline set not null,
  alter column objective set not null;

alter table portfolio.contact
  alter column email set not null,
  alter column phone set not null,
  alter column location set not null,
  alter column socials set not null;

alter table portfolio.nav_items
  drop column if exists icon_key,
  drop column if exists color;

alter table portfolio.section_content
  drop column if exists sort_order;

alter table portfolio.skill_categories
  drop column if exists icon_key,
  drop column if exists color;

alter table portfolio.skill_categories
  alter column description set not null;

alter table portfolio.skills
  drop column if exists level,
  drop column if exists icon_key,
  drop column if exists is_featured;

alter table portfolio.skills
  alter column proficiency set not null,
  alter column evidence set not null;

alter table portfolio.projects
  drop column if exists full_description,
  drop column if exists image_light,
  drop column if exists image_dark,
  drop column if exists image_key,
  drop column if exists is_featured;

alter table portfolio.projects
  alter column slug set not null,
  alter column eyebrow set not null,
  alter column short_description set not null,
  alter column impact set not null,
  alter column contribution set not null,
  alter column year_label set not null,
  alter column image_alt set not null;

alter table portfolio.certificates
  drop column if exists path,
  drop column if exists document_key,
  drop column if exists preview_key;

alter table portfolio.certificates
  alter column category set not null,
  alter column issuer set not null,
  alter column image_alt set not null;

drop table if exists portfolio.tech_icons;

alter table jg_app.blog_posts
  drop column if exists sort_order;
