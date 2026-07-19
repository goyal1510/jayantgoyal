begin;

-- Keep the application profile aligned with the identity metadata Supabase
-- receives from Google, GitHub, and future OAuth providers. Names entered in
-- the account UI remain authoritative; provider avatars can be refreshed.
create or replace function jg_account.sync_profile_from_metadata(
  p_user_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  full_name text;
  first_name text;
  last_name text;
  avatar_url text;
begin
  full_name := coalesce(
    nullif(btrim(metadata ->> 'full_name'), ''),
    nullif(btrim(metadata ->> 'name'), ''),
    nullif(btrim(metadata ->> 'user_name'), '')
  );

  first_name := coalesce(
    nullif(btrim(metadata ->> 'first_name'), ''),
    nullif(btrim(metadata ->> 'given_name'), ''),
    nullif(split_part(full_name, ' ', 1), '')
  );

  if full_name is not null and position(' ' in full_name) > 0 then
    last_name := nullif(
      btrim(regexp_replace(full_name, '^[^[:space:]]+[[:space:]]+', '')),
      ''
    );
  end if;

  last_name := coalesce(
    nullif(btrim(metadata ->> 'last_name'), ''),
    nullif(btrim(metadata ->> 'family_name'), ''),
    last_name
  );

  avatar_url := coalesce(
    nullif(btrim(metadata ->> 'avatar_url'), ''),
    nullif(btrim(metadata ->> 'picture'), ''),
    nullif(btrim(metadata ->> 'avatar_url_https'), '')
  );

  insert into jg_account.profiles as profile (
    user_id,
    first_name,
    last_name,
    avatar_url,
    terms_accepted
  )
  values (
    p_user_id,
    coalesce(first_name, ''),
    coalesce(last_name, ''),
    avatar_url,
    false
  )
  on conflict (user_id) do update
  set first_name = case
        when nullif(btrim(profile.first_name), '') is null
          then excluded.first_name
        else profile.first_name
      end,
      last_name = case
        when nullif(btrim(profile.last_name), '') is null
          then excluded.last_name
        else profile.last_name
      end,
      avatar_url = coalesce(excluded.avatar_url, profile.avatar_url);
end;
$$;

revoke all on function jg_account.sync_profile_from_metadata(uuid, jsonb)
  from public, anon, authenticated;

create or replace function jg_account.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform jg_account.sync_profile_from_metadata(
    new.id,
    new.raw_user_meta_data
  );
  return new;
exception when others then
  raise warning 'jg_account.handle_new_user failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

create or replace function jg_account.handle_user_metadata_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    perform jg_account.sync_profile_from_metadata(
      new.id,
      new.raw_user_meta_data
    );
  end if;
  return new;
exception when others then
  raise warning 'jg_account.handle_user_metadata_update failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function jg_account.handle_user_metadata_update()
  from public, anon, authenticated;

drop trigger if exists jg_account_profiles_on_auth_user_created on auth.users;
create trigger jg_account_profiles_on_auth_user_created
  after insert on auth.users
  for each row
  execute function jg_account.handle_new_user();

drop trigger if exists jg_account_profiles_on_auth_user_metadata_updated on auth.users;
create trigger jg_account_profiles_on_auth_user_metadata_updated
  after update of raw_user_meta_data on auth.users
  for each row
  execute function jg_account.handle_user_metadata_update();

-- Backfill profiles created before metadata synchronization was installed.
do $$
declare
  auth_user record;
begin
  for auth_user in
    select id, raw_user_meta_data
    from auth.users
  loop
    perform jg_account.sync_profile_from_metadata(
      auth_user.id,
      auth_user.raw_user_meta_data
    );
  end loop;
end;
$$;

commit;
