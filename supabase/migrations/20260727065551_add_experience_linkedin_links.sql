begin;

alter table portfolio.experience
  add column company_linkedin_url text;

alter table portfolio.experience
  add constraint experience_company_linkedin_url_check
  check (
    company_linkedin_url is null
    or (
      company_linkedin_url = btrim(company_linkedin_url)
      and company_linkedin_url ~* '^https://([[:alnum:]-]+\.)?linkedin\.com/(company|in)/[^[:space:]]+/?$'
    )
  );

comment on column portfolio.experience.company_linkedin_url is
  'LinkedIn company page or organization profile associated with the experience.';

do $$
declare
  affected integer;
begin
  update portfolio.experience
  set company_linkedin_url = 'https://www.linkedin.com/company/codesyncai/'
  where id = 'c25f3b5d-3011-4e07-9881-af6e8b927e86'::uuid
    and company = 'Neuraoak Technologies Private Limited';

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Expected exactly 1 Neuraoak experience row, updated %', affected;
  end if;

  update portfolio.experience
  set company_linkedin_url = 'https://www.linkedin.com/company/highradius/'
  where id = '94417b8c-23f5-43d0-a298-8b7684f7e2a3'::uuid
    and company = 'HighRadius Technologies Private Ltd.';

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Expected exactly 1 HighRadius experience row, updated %', affected;
  end if;

  update portfolio.experience
  set company_linkedin_url = 'https://in.linkedin.com/in/desire-foundation-915599106/'
  where id = '38ddb744-5b8c-4d0a-b01a-1a4ddf8235ff'::uuid
    and company = 'DESIRE FOUNDATION';

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Expected exactly 1 Desire Foundation experience row, updated %', affected;
  end if;
end
$$;

commit;
