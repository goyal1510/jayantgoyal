-- Public identity and the derived search title now come from shared code. The
-- Admin application no longer selects or writes these duplicate CMS columns.

begin;

set local lock_timeout = '5s';

alter table portfolio.hero
  drop constraint if exists hero_required_fields_nonblank_check;

alter table portfolio.hero
  drop column if exists name,
  drop column if exists display_name,
  drop column if exists seo_title;

alter table portfolio.hero
  add constraint hero_required_fields_nonblank_check check (
    btrim(role) <> ''
    and btrim(tagline) <> ''
    and btrim(blurb) <> ''
    and btrim(headline) <> ''
    and btrim(current_title) <> ''
    and btrim(availability) <> ''
    and btrim(resume_url) <> ''
    and btrim(github_username) <> ''
    and btrim(seo_description) <> ''
  );

commit;
