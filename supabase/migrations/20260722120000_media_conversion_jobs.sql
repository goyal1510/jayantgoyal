begin;

create table if not exists jg_app.media_conversion_jobs (
  id uuid default jg_app.uuid_v7() not null primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  output_format text not null,
  quality text not null,
  status text default 'queued' not null,
  progress smallint default 0 not null,
  title text,
  output_filename text,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint media_conversion_jobs_source_url_check
    check (char_length(btrim(source_url)) between 1 and 2048),
  constraint media_conversion_jobs_output_format_check
    check (output_format in ('mp3', 'mp4')),
  constraint media_conversion_jobs_quality_check
    check (quality in ('small', 'balanced', 'high')),
  constraint media_conversion_jobs_status_check
    check (
      status in (
        'queued',
        'downloading',
        'converting',
        'uploading',
        'completed',
        'failed',
        'expired'
      )
    ),
  constraint media_conversion_jobs_progress_check
    check (progress between 0 and 100),
  constraint media_conversion_jobs_size_bytes_check
    check (size_bytes is null or size_bytes >= 0)
);

create index if not exists idx_media_conversion_jobs_queue
  on jg_app.media_conversion_jobs (created_at)
  where status = 'queued';

create index if not exists idx_media_conversion_jobs_user_created
  on jg_app.media_conversion_jobs (user_id, created_at desc);

create unique index if not exists idx_media_conversion_jobs_one_active_per_user
  on jg_app.media_conversion_jobs (user_id)
  where status in ('queued', 'downloading', 'converting', 'uploading');

create index if not exists idx_media_conversion_jobs_cleanup
  on jg_app.media_conversion_jobs (expires_at)
  where status in ('completed', 'expired');

drop trigger if exists update_media_conversion_jobs_updated_at
  on jg_app.media_conversion_jobs;
create trigger update_media_conversion_jobs_updated_at
  before update on jg_app.media_conversion_jobs
  for each row execute function jg_app.update_updated_at();

alter table jg_app.media_conversion_jobs enable row level security;

drop policy if exists "Users can view own media conversion jobs"
  on jg_app.media_conversion_jobs;
create policy "Users can view own media conversion jobs"
  on jg_app.media_conversion_jobs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can enqueue own media conversion jobs"
  on jg_app.media_conversion_jobs;
create policy "Users can enqueue own media conversion jobs"
  on jg_app.media_conversion_jobs
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'queued'
    and progress = 0
    and title is null
    and output_filename is null
    and mime_type is null
    and size_bytes is null
    and storage_path is null
    and error_message is null
    and started_at is null
    and completed_at is null
    and expires_at is null
  );

revoke all on table jg_app.media_conversion_jobs from anon;
revoke all on table jg_app.media_conversion_jobs from authenticated;
grant select, insert on table jg_app.media_conversion_jobs to authenticated;
grant all on table jg_app.media_conversion_jobs to service_role;

create or replace function jg_app.claim_media_conversion_job()
returns setof jg_app.media_conversion_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
    with candidate as (
      select queued.id
      from jg_app.media_conversion_jobs as queued
      where queued.status = 'queued'
      order by queued.created_at
      for update skip locked
      limit 1
    )
    update jg_app.media_conversion_jobs as job
    set
      status = 'downloading',
      progress = 1,
      started_at = now(),
      error_message = null
    from candidate
    where job.id = candidate.id
    returning job.*;
end;
$$;

create or replace function jg_app.requeue_stale_media_conversion_jobs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  update jg_app.media_conversion_jobs
  set
    status = 'queued',
    progress = 0,
    started_at = null,
    error_message = 'The worker restarted before this job completed. Retrying.'
  where status in ('downloading', 'converting', 'uploading')
    and updated_at < now() - interval '30 minutes';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function jg_app.claim_expired_media_conversion_job()
returns table (job_id uuid, object_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_id uuid;
begin
  select job.id
  into claimed_id
  from jg_app.media_conversion_jobs as job
  where
    job.status = 'expired'
    or (
      job.status = 'completed'
      and job.expires_at is not null
      and job.expires_at <= now()
    )
    or (
      job.status in ('failed', 'queued')
      and job.updated_at < now() - interval '24 hours'
    )
  order by job.updated_at
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  update jg_app.media_conversion_jobs
  set status = 'expired'
  where id = claimed_id;

  return query
    select job.id, job.storage_path
    from jg_app.media_conversion_jobs as job
    where job.id = claimed_id;
end;
$$;

revoke all on function jg_app.claim_media_conversion_job() from public;
revoke all on function jg_app.claim_media_conversion_job() from anon;
revoke all on function jg_app.claim_media_conversion_job() from authenticated;
grant execute on function jg_app.claim_media_conversion_job() to service_role;

revoke all on function jg_app.requeue_stale_media_conversion_jobs() from public;
revoke all on function jg_app.requeue_stale_media_conversion_jobs() from anon;
revoke all on function jg_app.requeue_stale_media_conversion_jobs() from authenticated;
grant execute on function jg_app.requeue_stale_media_conversion_jobs() to service_role;

revoke all on function jg_app.claim_expired_media_conversion_job() from public;
revoke all on function jg_app.claim_expired_media_conversion_job() from anon;
revoke all on function jg_app.claim_expired_media_conversion_job() from authenticated;
grant execute on function jg_app.claim_expired_media_conversion_job() to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'media-converter-output',
  'media-converter-output',
  false,
  536870912,
  array['audio/mpeg', 'video/mp4']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own media conversion output"
  on storage.objects;
create policy "Users can read own media conversion output"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'media-converter-output'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
