begin;

create or replace function orbit.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role orbit.workspace_member_role default 'member',
  p_token_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_invitation_id uuid;
  v_hash text := coalesce(p_token_hash, encode(extensions.gen_random_bytes(32), 'hex'));
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;

  if p_role = 'admin' and not exists (
    select 1 from orbit.workspaces
    where id = p_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'only the owner may invite admins' using errcode = '42501';
  end if;

  insert into orbit_private.invitations (
    workspace_id,
    email_normalized,
    workspace_role,
    token_hash,
    inviter_id,
    expires_at
  )
  values (
    p_workspace_id,
    lower(trim(p_email)),
    p_role,
    v_hash,
    v_user_id,
    now() + interval '7 days'
  )
  returning id into v_invitation_id;

  insert into orbit_private.outbox_events (event_type, payload)
  values (
    'invitation.created',
    jsonb_build_object('invitation_id', v_invitation_id)
  );

  return v_invitation_id;
end;
$$;

revoke all on function orbit.create_workspace_invitation(uuid, text, orbit.workspace_member_role, text)
  from public, anon;
grant execute on function orbit.create_workspace_invitation(uuid, text, orbit.workspace_member_role, text)
  to authenticated;

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
  perform orbit_private.require_orbit_access();

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

  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (v_invitation.workspace_id, v_user_id, v_invitation.workspace_role, 'active')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role, status = 'active', removed_at = null;

  update orbit_private.invitations
  set status = 'accepted'
  where id = v_invitation.id;

  if not iam_private.user_has_product_access(v_user_id, 'orbit') then
    insert into iam.product_memberships (product_key, user_id, status)
    values ('orbit', v_user_id, 'active')
    on conflict (product_key, user_id) do update set status = 'active';

    insert into iam.product_role_assignments (product_key, user_id, role_key, status)
    values ('orbit', v_user_id, 'orbit.participant', 'active')
    on conflict (product_key, user_id, role_key) do update set status = 'active';
  end if;

  v_workspace_id := v_invitation.workspace_id;
  return v_workspace_id;
end;
$$;

revoke all on function orbit.accept_workspace_invitation(text)
  from public, anon;
grant execute on function orbit.accept_workspace_invitation(text)
  to authenticated;

commit;
