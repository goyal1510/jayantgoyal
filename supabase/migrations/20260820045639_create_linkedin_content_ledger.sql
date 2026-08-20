begin;

create table portfolio.linkedin_posts (
  id uuid primary key default foundation.uuid_v7(),
  status text not null default 'planned',
  topic text,
  content text not null,
  article_url text,
  writing_slug text,
  linkedin_post_urn text unique,
  linkedin_post_url text,
  scheduled_for timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  replaces_id uuid unique references portfolio.linkedin_posts (id) on delete set null,
  publication_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkedin_posts_status_check check (
    status in (
      'planned',
      'scheduled',
      'publishing',
      'published',
      'replaced',
      'deleted',
      'failed'
    )
  ),
  constraint linkedin_posts_content_check check (
    char_length(btrim(content)) between 1 and 3000
  ),
  constraint linkedin_posts_topic_check check (
    topic is null or char_length(btrim(topic)) between 1 and 160
  ),
  constraint linkedin_posts_article_url_check check (
    article_url is null or article_url ~ '^https://'
  ),
  constraint linkedin_posts_writing_slug_check check (
    writing_slug is null
    or writing_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint linkedin_posts_urn_check check (
    linkedin_post_urn is null
    or linkedin_post_urn ~ '^urn:li:(share|ugcPost):[0-9]+$'
  ),
  constraint linkedin_posts_url_check check (
    linkedin_post_url is null
    or linkedin_post_url ~ '^https://www[.]linkedin[.]com/feed/update/urn:li:(share|ugcPost):[0-9]+/?$'
  ),
  constraint linkedin_posts_schedule_check check (
    status <> 'scheduled' or scheduled_for is not null
  ),
  constraint linkedin_posts_publication_check check (
    status not in ('published', 'replaced', 'deleted')
    or (
      linkedin_post_urn is not null
      and linkedin_post_url is not null
      and published_at is not null
    )
  ),
  constraint linkedin_posts_removal_check check (
    (status in ('replaced', 'deleted')) = (deleted_at is not null)
  ),
  constraint linkedin_posts_replacement_check check (replaces_id is distinct from id),
  constraint linkedin_posts_error_check check (
    publication_error is null or char_length(publication_error) <= 2000
  )
);

create index linkedin_posts_queue_idx
  on portfolio.linkedin_posts (status, scheduled_for, created_at);

create index linkedin_posts_published_at_idx
  on portfolio.linkedin_posts (published_at desc)
  where published_at is not null;

create trigger linkedin_posts_updated_at
  before update on portfolio.linkedin_posts
  for each row execute function foundation.set_updated_at();

alter table portfolio.linkedin_posts enable row level security;

revoke all
  on table portfolio.linkedin_posts
  from public, anon, authenticated;
grant select, insert, update
  on table portfolio.linkedin_posts
  to authenticated;
grant all
  on table portfolio.linkedin_posts
  to service_role;

create policy "Admin LinkedIn read"
  on portfolio.linkedin_posts
  for select
  to authenticated
  using (
    (select iam_private.has_capability('portfolio.content.read'))
  );

create policy "Admin LinkedIn create"
  on portfolio.linkedin_posts
  for insert
  to authenticated
  with check (
    (select iam_private.has_capability('portfolio.content.create'))
  );

create policy "Admin LinkedIn update"
  on portfolio.linkedin_posts
  for update
  to authenticated
  using (
    (select iam_private.has_capability('portfolio.content.update'))
  )
  with check (
    (select iam_private.has_capability('portfolio.content.update'))
  );

commit;
