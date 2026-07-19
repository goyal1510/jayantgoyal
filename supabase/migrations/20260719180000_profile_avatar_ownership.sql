begin;

-- Profiles own user-entered avatar state. Provider avatars remain in
-- auth.identities and are resolved at render time for the current login.
alter table jg_account.profiles
  add column if not exists avatar_mode text not null default 'provider',
  add column if not exists avatar_provider text,
  add column if not exists avatar_storage_path text,
  add column if not exists avatar_updated_at timestamptz;

update jg_account.profiles
set avatar_mode = case
      when nullif(btrim(avatar_url), '') is null then 'provider'
      else 'provider'
    end,
    avatar_updated_at = coalesce(avatar_updated_at, updated_at)
where avatar_mode is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_mode_check'
      and conrelid = 'jg_account.profiles'::regclass
  ) then
    alter table jg_account.profiles
      add constraint profiles_avatar_mode_check
      check (avatar_mode in ('provider', 'upload', 'initials'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_upload_path_check'
      and conrelid = 'jg_account.profiles'::regclass
  ) then
    alter table jg_account.profiles
      add constraint profiles_avatar_upload_path_check
      check (
        avatar_mode <> 'upload'
        or nullif(btrim(avatar_storage_path), '') is not null
      );
  end if;
end;
$$;

-- Stop treating mutable auth user metadata as application profile state.
drop trigger if exists jg_account_profiles_on_auth_user_metadata_updated
  on auth.users;
drop function if exists jg_account.handle_user_metadata_update();

create or replace function jg_account.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into jg_account.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
exception when others then
  raise warning 'jg_account.handle_new_user failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop function if exists jg_account.sync_profile_from_metadata(uuid, jsonb);

-- Uploaded avatars are private and are addressed by user-id-prefixed paths.
insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read own profile avatars" on storage.objects;
create policy "Users can read own profile avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload own profile avatars" on storage.objects;
create policy "Users can upload own profile avatars"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update own profile avatars" on storage.objects;
create policy "Users can update own profile avatars"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete own profile avatars" on storage.objects;
create policy "Users can delete own profile avatars"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
