-- Allow the Admin application to stop reading and writing the legacy identity
-- columns before the columns are removed in a follow-up migration. Existing
-- values remain untouched so the currently deployed application stays valid
-- throughout the transition.

begin;

set local lock_timeout = '5s';

alter table portfolio.hero
  alter column name drop not null,
  alter column display_name drop not null,
  alter column seo_title drop not null;

commit;
