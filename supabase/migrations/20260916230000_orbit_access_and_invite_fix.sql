begin;

insert into iam.role_capabilities (role_key, capability_key)
values ('admin.full_access', 'orbit.operations.manage')
on conflict do nothing;

create or replace function iam.set_orbit_access(
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
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if p_role_key not in ('orbit.participant', 'orbit.creator') then
    raise exception using errcode = '22023', message = 'Invalid Orbit role';
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception using errcode = 'P0002', message = 'Target user not found';
  end if;

  select exists (
    select 1
    from iam.product_memberships membership
    where membership.product_key = 'orbit'
      and membership.user_id = p_target_user_id
      and membership.status = 'active'
  ) into existing_access;

  required_capability := case
    when existing_access then 'orbit.operations.manage'
    else 'orbit.operations.manage'
  end;

  if not iam_private.user_has_capability(p_actor_user_id, required_capability) then
    raise exception using errcode = '42501', message = 'Orbit access change is not allowed';
  end if;

  insert into iam.product_memberships as membership (
    product_key,
    user_id,
    status
  )
  values ('orbit', p_target_user_id, 'active')
  on conflict (product_key, user_id) do update
  set status = 'active';

  delete from iam.product_role_assignments
  where product_key = 'orbit'
    and user_id = p_target_user_id
    and role_key in ('orbit.participant', 'orbit.creator');

  insert into iam.product_role_assignments (product_key, user_id, role_key)
  values ('orbit', p_target_user_id, p_role_key);

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    subject_key,
    source,
    metadata
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'orbit',
    case when existing_access then 'orbit.access.updated' else 'orbit.access.granted' end,
    'product_role',
    p_role_key,
    'admin_web',
    jsonb_build_object('role_key', p_role_key)
  );
end;
$$;

revoke all on function iam.set_orbit_access(uuid, uuid, text) from public, anon, authenticated;
grant execute on function iam.set_orbit_access(uuid, uuid, text) to service_role;

create or replace function iam.revoke_orbit_access(
  p_actor_user_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if not iam_private.user_has_capability(p_actor_user_id, 'orbit.operations.manage') then
    raise exception using errcode = '42501', message = 'Orbit access change is not allowed';
  end if;

  update iam.product_memberships
  set status = 'revoked'
  where product_key = 'orbit'
    and user_id = p_target_user_id;

  delete from iam.product_role_assignments
  where product_key = 'orbit'
    and user_id = p_target_user_id;

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    source
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'orbit',
    'orbit.access.revoked',
    'product_membership',
    'admin_web'
  );
end;
$$;

revoke all on function iam.revoke_orbit_access(uuid, uuid) from public, anon, authenticated;
grant execute on function iam.revoke_orbit_access(uuid, uuid) to service_role;

create or replace function orbit.accept_workspace_invitation(
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_email text;
  v_invitation orbit_private.invitations%rowtype;
  v_workspace_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  select * into v_invitation
  from orbit_private.invitations
  where token_hash = p_token_hash
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invitation invalid or expired' using errcode = 'P0002';
  end if;

  if lower(v_email) <> v_invitation.email_normalized then
    raise exception 'invitation email mismatch' using errcode = '42501';
  end if;

  insert into iam.product_memberships (product_key, user_id, status)
  values ('orbit', v_user_id, 'active')
  on conflict (product_key, user_id) do update set status = 'active';

  insert into iam.product_role_assignments (product_key, user_id, role_key)
  values ('orbit', v_user_id, 'orbit.participant')
  on conflict (product_key, user_id, role_key) do nothing;

  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (v_invitation.workspace_id, v_user_id, v_invitation.workspace_role, 'active')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role, status = 'active', removed_at = null;

  update orbit_private.invitations
  set status = 'accepted'
  where id = v_invitation.id;

  v_workspace_id := v_invitation.workspace_id;
  return v_workspace_id;
end;
$$;

commit;
