-- Add the canonical fields needed by the redesigned Portfolio before removing
-- any legacy contract. This migration is intentionally backward compatible
-- with the currently deployed application.

alter table portfolio.hero
  add column if not exists github_username text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

update portfolio.hero
set
  github_username = coalesce(nullif(github_username, ''), 'goyal1510'),
  seo_title = coalesce(
    nullif(seo_title, ''),
    'Jayant Goyal | Full-Stack Product Engineer'
  ),
  seo_description = coalesce(
    nullif(seo_description, ''),
    'The portfolio of Jayant Goyal, a full-stack product engineer shaping clear, dependable digital products from idea through delivery.'
  );

alter table portfolio.hero
  alter column github_username set not null,
  alter column seo_title set not null,
  alter column seo_description set not null;

alter table portfolio.projects
  add column if not exists image_url text;

update portfolio.projects
set image_url = '/images/' || image_key || '.png'
where image_url is null
  and image_key is not null;

alter table portfolio.projects
  alter column image_url set not null;

alter table portfolio.certificates
  add column if not exists document_url text,
  add column if not exists preview_url text;

update portfolio.certificates
set
  document_url = '/documents/certificates/' || document_key || '.pdf',
  preview_url = '/images/certificates/' || preview_key || '.png'
where document_url is null
   or preview_url is null;

alter table portfolio.certificates
  alter column document_url set not null,
  alter column preview_url set not null;

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
    'hero',
    'Portfolio / 2026',
    null,
    null,
    null,
    'Field note / Current',
    -2,
    true
  ),
  (
    'about',
    'About / Product mind, engineering hands',
    null,
    null,
    null,
    null,
    -1,
    true
  ),
  (
    'blog',
    'Writing / Notes from the build',
    'Ideas get sharper when they are written down.',
    null,
    'Field notes on product engineering, web architecture, automation, and the decisions that surface while making software real.',
    'New writing will appear here after it is published.',
    8,
    true
  ),
  (
    'article',
    'Field note / Published',
    'Notes from building products end to end.',
    null,
    'Full-stack product engineering across product decisions, interfaces, application systems, data, and delivery.',
    'From the workbench',
    9,
    true
  ),
  (
    'resume',
    'Resume / Current snapshot',
    'The concise version of the path so far.',
    null,
    'Product engineering across interfaces, application systems, data, and delivery—along with the experience and education behind the work.',
    null,
    10,
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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  15728640,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read portfolio assets" on storage.objects;
create policy "Public read portfolio assets"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-assets');

drop policy if exists "Admin insert portfolio assets" on storage.objects;
create policy "Admin insert portfolio assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and jg_account.is_admin()
  );

drop policy if exists "Admin update portfolio assets" on storage.objects;
create policy "Admin update portfolio assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and jg_account.is_admin()
  )
  with check (
    bucket_id = 'portfolio-assets'
    and jg_account.is_admin()
  );

drop policy if exists "Admin delete portfolio assets" on storage.objects;
create policy "Admin delete portfolio assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and jg_account.is_admin()
  );
