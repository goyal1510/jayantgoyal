begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'private-files',
  'private-files',
  false,
  26214400
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "All access to authenticated user only 1r47xkd_0"
  on storage.objects;
drop policy if exists "All access to authenticated user only 1r47xkd_1"
  on storage.objects;
drop policy if exists "All access to authenticated user only 1r47xkd_2"
  on storage.objects;
drop policy if exists "All access to authenticated user only 1r47xkd_3"
  on storage.objects;

drop policy if exists "Users can read own private files"
  on storage.objects;
create policy "Users can read own private files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'private-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload own private files"
  on storage.objects;
create policy "Users can upload own private files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'private-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update own private files"
  on storage.objects;
create policy "Users can update own private files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'private-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'private-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete own private files"
  on storage.objects;
create policy "Users can delete own private files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'private-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
