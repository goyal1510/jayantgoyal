begin;

create or replace function orbit.list_board_import_jobs(p_board_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id into v_workspace_id
  from orbit.boards where id = p_board_id;

  if v_workspace_id is null then
    raise exception 'board not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', j.id,
      'status', j.status,
      'created_at', j.created_at,
      'processed_at', j.processed_at,
      'result', j.result
    ) order by j.created_at desc)
    from orbit_private.import_jobs j
    where j.board_id = p_board_id
      and (j.requester_id = v_user_id or orbit_private.is_workspace_admin(v_workspace_id, v_user_id))
    limit 20
  ), '[]'::jsonb);
end;
$$;

grant execute on function orbit.list_board_import_jobs(uuid) to authenticated;

commit;
