begin;

-- Rebuild Studio policies as capability-aware owner/participant rules. This
-- intentionally removes every policy inherited from the former jg_app schema.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'studio'
  loop
    execute format(
      'drop policy %I on studio.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create or replace function iam_private.is_active_game_participant(
  p_session_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from studio.game_session_participants participant
    where participant.session_id = p_session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  );
$$;

revoke all on function iam_private.is_active_game_participant(uuid)
  from public, anon, authenticated;
grant execute on function iam_private.is_active_game_participant(uuid)
  to authenticated, service_role;

create policy activity_activities_select_owned
  on studio.activity_tracker_activities for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.read'))
  );
create policy activity_activities_insert_owned
  on studio.activity_tracker_activities for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.create'))
  );
create policy activity_activities_update_owned
  on studio.activity_tracker_activities for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.update'))
  );
create policy activity_activities_delete_owned
  on studio.activity_tracker_activities for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.delete'))
  );

create policy activity_entries_select_owned
  on studio.activity_tracker_entries for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.read'))
  );
create policy activity_entries_insert_owned
  on studio.activity_tracker_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.create'))
  );
create policy activity_entries_update_owned
  on studio.activity_tracker_entries for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.update'))
  );
create policy activity_entries_delete_owned
  on studio.activity_tracker_entries for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.activity.delete'))
  );

create policy currency_calculations_select_owned
  on studio.currency_calculations for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.calculator.read'))
  );
create policy currency_calculations_insert_owned
  on studio.currency_calculations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.calculator.create'))
  );
create policy currency_calculations_update_owned
  on studio.currency_calculations for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.calculator.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.calculator.update'))
  );
create policy currency_calculations_delete_owned
  on studio.currency_calculations for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.calculator.delete'))
  );

create policy currency_denominations_select_owned
  on studio.currency_calculation_denominations for select to authenticated
  using (
    exists (
      select 1
      from studio.currency_calculations calculation
      where calculation.id = currency_calculation_denominations.calculation_id
        and calculation.user_id = (select auth.uid())
    )
    and (select iam_private.has_capability('studio.calculator.read'))
  );
create policy currency_denominations_insert_owned
  on studio.currency_calculation_denominations for insert to authenticated
  with check (
    exists (
      select 1
      from studio.currency_calculations calculation
      where calculation.id = currency_calculation_denominations.calculation_id
        and calculation.user_id = (select auth.uid())
    )
    and (select iam_private.has_capability('studio.calculator.create'))
  );
create policy currency_denominations_update_owned
  on studio.currency_calculation_denominations for update to authenticated
  using (
    exists (
      select 1
      from studio.currency_calculations calculation
      where calculation.id = currency_calculation_denominations.calculation_id
        and calculation.user_id = (select auth.uid())
    )
    and (select iam_private.has_capability('studio.calculator.update'))
  )
  with check (
    exists (
      select 1
      from studio.currency_calculations calculation
      where calculation.id = currency_calculation_denominations.calculation_id
        and calculation.user_id = (select auth.uid())
    )
    and (select iam_private.has_capability('studio.calculator.update'))
  );
create policy currency_denominations_delete_owned
  on studio.currency_calculation_denominations for delete to authenticated
  using (
    exists (
      select 1
      from studio.currency_calculations calculation
      where calculation.id = currency_calculation_denominations.calculation_id
        and calculation.user_id = (select auth.uid())
    )
    and (select iam_private.has_capability('studio.calculator.delete'))
  );

create policy file_entries_select_owned
  on studio.file_entries for select to authenticated
  using (
    user_id = (select auth.uid())
    and not is_deleted
    and (select iam_private.has_capability('studio.files.read'))
  );
create policy file_entries_insert_owned
  on studio.file_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.files.create'))
  );
create policy file_entries_update_owned
  on studio.file_entries for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.files.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.files.update'))
  );
create policy file_entries_delete_owned
  on studio.file_entries for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.files.delete'))
  );
create policy file_type_categories_select_members
  on studio.file_type_categories for select to authenticated
  using ((select iam_private.has_capability('studio.files.read')));

create policy scratchpad_select_owned
  on studio.scratchpad_entries for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.scratchpad.read'))
  );
create policy scratchpad_insert_owned
  on studio.scratchpad_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.scratchpad.create'))
  );
create policy scratchpad_update_owned
  on studio.scratchpad_entries for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.scratchpad.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.scratchpad.update'))
  );
create policy scratchpad_delete_owned
  on studio.scratchpad_entries for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.scratchpad.delete'))
  );

create policy tool_favorites_select_owned
  on studio.tool_favorites for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.read'))
  );
create policy tool_favorites_insert_owned
  on studio.tool_favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.create'))
  );
create policy tool_favorites_delete_owned
  on studio.tool_favorites for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.delete'))
  );
create policy tool_history_select_owned
  on studio.tool_history for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.read'))
  );
create policy tool_history_insert_owned
  on studio.tool_history for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.create'))
  );
create policy tool_history_update_owned
  on studio.tool_history for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.update'))
  )
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.update'))
  );
create policy tool_history_delete_owned
  on studio.tool_history for delete to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.tools.delete'))
  );

create policy typing_results_select_owned
  on studio.typing_test_results for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.typing.read'))
  );
create policy typing_results_insert_owned
  on studio.typing_test_results for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select iam_private.has_capability('studio.typing.create'))
  );

create policy game_sessions_select_accessible
  on studio.game_sessions for select to authenticated
  using (
    (select iam_private.has_capability('studio.games.read'))
    and (
      created_by = (select auth.uid())
      or status = 'waiting'::studio.game_session_status
      or (select iam_private.is_active_game_participant(id))
    )
  );
create policy game_participants_select_joined_session
  on studio.game_session_participants for select to authenticated
  using (
    (select iam_private.has_capability('studio.games.read'))
    and (select iam_private.is_active_game_participant(session_id))
  );
create policy game_moves_select_participant
  on studio.game_session_moves for select to authenticated
  using (
    (select iam_private.has_capability('studio.games.read'))
    and (select iam_private.is_active_game_participant(session_id))
  );
create policy game_results_select_participant
  on studio.game_session_results for select to authenticated
  using (
    (select iam_private.has_capability('studio.games.read'))
    and (select iam_private.is_active_game_participant(session_id))
  );

revoke all on all tables in schema studio from public, anon, authenticated;
grant select, insert, update, delete on studio.activity_tracker_activities
  to authenticated;
grant select, insert, update, delete on studio.activity_tracker_entries
  to authenticated;
grant select, insert, update, delete on studio.currency_calculations
  to authenticated;
grant select, insert, update, delete on studio.currency_calculation_denominations
  to authenticated;
grant select, insert, update, delete on studio.file_entries to authenticated;
grant select on studio.file_type_categories to authenticated;
grant select on studio.game_sessions to authenticated;
grant select on studio.game_session_participants to authenticated;
grant select on studio.game_session_moves to authenticated;
grant select on studio.game_session_results to authenticated;
grant select, insert on studio.typing_test_results to authenticated;
grant select, insert, update, delete on studio.scratchpad_entries to authenticated;
grant select, insert, delete on studio.tool_favorites to authenticated;
grant select, insert, update, delete on studio.tool_history to authenticated;
grant all on all tables in schema studio to service_role;
grant usage on type studio.game_session_status to authenticated, service_role;

-- Portfolio read and write capabilities are distinct so admin.viewer can read
-- unpublished content without receiving mutation privileges.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'about',
    'certificates',
    'contact',
    'education',
    'experience',
    'hero',
    'nav_items',
    'section_content',
    'skill_categories',
    'skills',
    'work'
  ]
  loop
    execute format('drop policy if exists %I on portfolio.%I', 'Admin write access', table_name);
    execute format('drop policy if exists %I on portfolio.%I', 'Admin work access', table_name);
    execute format(
      'create policy %I on portfolio.%I for select to authenticated using ((select iam_private.has_capability(''portfolio.content.read'')))',
      'Admin content read',
      table_name
    );
    execute format(
      'create policy %I on portfolio.%I for insert to authenticated with check ((select iam_private.has_capability(''portfolio.content.create'')))',
      'Admin content create',
      table_name
    );
    execute format(
      'create policy %I on portfolio.%I for update to authenticated using ((select iam_private.has_capability(''portfolio.content.update''))) with check ((select iam_private.has_capability(''portfolio.content.update'')))',
      'Admin content update',
      table_name
    );
    execute format(
      'create policy %I on portfolio.%I for delete to authenticated using ((select iam_private.has_capability(''portfolio.content.delete'')))',
      'Admin content delete',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists "Admins can manage writing" on portfolio.writing_posts;
create policy "Admin writing read"
  on portfolio.writing_posts for select to authenticated
  using ((select iam_private.has_capability('portfolio.content.read')));
create policy "Admin writing create"
  on portfolio.writing_posts for insert to authenticated
  with check ((select iam_private.has_capability('portfolio.content.create')));
create policy "Admin writing update"
  on portfolio.writing_posts for update to authenticated
  using ((select iam_private.has_capability('portfolio.content.update')))
  with check ((select iam_private.has_capability('portfolio.content.update')));
create policy "Admin writing delete"
  on portfolio.writing_posts for delete to authenticated
  using ((select iam_private.has_capability('portfolio.content.delete')));

revoke insert, update, delete on all tables in schema portfolio from anon;
grant select on portfolio.writing_posts to anon;
grant select, insert, update, delete on portfolio.writing_posts to authenticated;

-- Portfolio assets stay publicly readable, while each mutation is authorized
-- independently. These policies also retire the last Storage dependency on
-- jg_account.is_admin().
drop policy if exists "Admin insert portfolio assets" on storage.objects;
drop policy if exists "Admin update portfolio assets" on storage.objects;
drop policy if exists "Admin delete portfolio assets" on storage.objects;

create policy "Admin insert portfolio assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio-assets'
    and (select iam_private.has_capability('portfolio.content.create'))
  );
create policy "Admin update portfolio assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and (select iam_private.has_capability('portfolio.content.update'))
  )
  with check (
    bucket_id = 'portfolio-assets'
    and (select iam_private.has_capability('portfolio.content.update'))
  );
create policy "Admin delete portfolio assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio-assets'
    and (select iam_private.has_capability('portfolio.content.delete'))
  );

create or replace function iam.set_admin_access(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_role_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_access boolean;
  required_capability text;
  now_at timestamptz := now();
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if p_role_key not in ('admin.viewer', 'admin.full_access') then
    raise exception using errcode = '22023', message = 'Invalid Admin role';
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception using errcode = 'P0002', message = 'Target user not found';
  end if;

  select exists (
    select 1
    from iam.product_memberships membership
    where membership.product_key = 'admin'
      and membership.user_id = p_target_user_id
      and membership.status = 'active'
  ) into existing_access;
  required_capability := case
    when existing_access then 'admin.users.update'
    else 'admin.users.create'
  end;

  if not iam_private.user_has_capability(
    p_actor_user_id,
    required_capability
  ) then
    raise exception using errcode = '42501', message = 'Admin access change is not allowed';
  end if;

  insert into iam.product_memberships as membership (
    product_key,
    user_id,
    status,
    valid_from,
    expires_at,
    granted_by,
    granted_at,
    revoked_by,
    revoked_at
  )
  values
    ('admin', p_target_user_id, 'active', now_at, null, p_actor_user_id, now_at, null, null),
    ('portfolio', p_target_user_id, 'active', now_at, null, p_actor_user_id, now_at, null, null)
  on conflict (product_key, user_id) do update
  set status = 'active',
      valid_from = excluded.valid_from,
      expires_at = null,
      granted_by = excluded.granted_by,
      granted_at = excluded.granted_at,
      revoked_by = null,
      revoked_at = null;

  delete from iam.product_role_assignments
  where product_key = 'admin'
    and user_id = p_target_user_id;

  insert into iam.product_role_assignments (
    product_key,
    user_id,
    role_key,
    assigned_by,
    assigned_at
  )
  values ('admin', p_target_user_id, p_role_key, p_actor_user_id, now_at);

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    subject_key,
    source
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'admin',
    case when existing_access then 'access_updated' else 'access_created' end,
    'product_role_assignment',
    p_role_key,
    'admin_web'
  );
end;
$$;

create or replace function iam.revoke_admin_access(
  p_actor_user_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := now();
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if not iam_private.user_has_capability(
    p_actor_user_id,
    'admin.users.delete'
  ) then
    raise exception using errcode = '42501', message = 'Admin access revocation is not allowed';
  end if;

  delete from iam.product_role_assignments
  where product_key = 'admin'
    and user_id = p_target_user_id;

  update iam.product_memberships
  set status = 'revoked',
      revoked_by = p_actor_user_id,
      revoked_at = now_at
  where product_key = 'admin'
    and user_id = p_target_user_id;

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    subject_key,
    source
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'admin',
    'access_revoked',
    'product_membership',
    'admin',
    'admin_web'
  );
end;
$$;

revoke all on function iam.set_admin_access(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function iam.revoke_admin_access(uuid, uuid)
  from public, anon, authenticated;
grant execute on function iam.set_admin_access(uuid, uuid, text)
  to service_role;
grant execute on function iam.revoke_admin_access(uuid, uuid)
  to service_role;

-- Schema movement preserves publication membership by table OID. Add the
-- Scratchpad explicitly because its client already subscribes to changes.
alter table studio.scratchpad_entries replica identity full;
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'studio'
      and tablename = 'scratchpad_entries'
  ) then
    alter publication supabase_realtime add table studio.scratchpad_entries;
  end if;
end;
$$;

-- Retire the global enum role and duplicate account profile after every policy
-- has moved to IAM. The non-CASCADE drops deliberately fail if a dependency was
-- missed during review.
drop table jg_account.profiles;
drop function jg_account.count_my_sessions();
drop function jg_account.handle_new_user();
drop function jg_account.handle_updated_at();
drop function jg_account.is_admin();
drop type jg_account.user_role;
drop schema jg_account;

alter role authenticator set pgrst.db_schemas
  to 'public,graphql_public,iam,studio,portfolio';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

commit;
