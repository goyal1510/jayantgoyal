begin;

create or replace function orbit.seed_qa_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid,
  p_role orbit.workspace_member_role default 'member'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (p_workspace_id, p_user_id, p_role, 'active')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role, status = 'active', removed_at = null;
end;
$$;

revoke all on function orbit.seed_qa_workspace_member(uuid, uuid, orbit.workspace_member_role)
  from public, anon, authenticated;
grant execute on function orbit.seed_qa_workspace_member(uuid, uuid, orbit.workspace_member_role)
  to service_role;

commit;
