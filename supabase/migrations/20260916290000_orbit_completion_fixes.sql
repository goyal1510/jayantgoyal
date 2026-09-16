begin;

create or replace function orbit.create_board_from_template(
  p_workspace_id uuid,
  p_template_id uuid,
  p_name text,
  p_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_template orbit.board_templates%rowtype;
  v_board_id uuid;
  v_column jsonb;
  v_done_column_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;

  select * into v_template from orbit.board_templates where id = p_template_id;
  if not found then
    raise exception 'template not found' using errcode = 'P0002';
  end if;

  v_board_id := orbit.create_board(
    p_workspace_id,
    trim(p_name),
    upper(trim(p_key)),
    'workspace'::orbit.board_visibility
  );

  update orbit.boards set default_done_column_id = null where id = v_board_id;
  delete from orbit.columns where board_id = v_board_id;

  for v_column in
    select * from jsonb_array_elements(coalesce(v_template.template_data->'columns', '[]'::jsonb))
  loop
    perform orbit.create_column(
      v_board_id,
      v_column->>'name',
      coalesce((v_column->>'category')::orbit.column_category, 'active'::orbit.column_category)
    );
  end loop;

  if not exists (select 1 from orbit.columns where board_id = v_board_id) then
    perform orbit.create_column(v_board_id, 'To do', 'backlog'::orbit.column_category);
  end if;

  select id into v_done_column_id
  from orbit.columns
  where board_id = v_board_id and category = 'done'
  order by rank
  limit 1;

  if v_done_column_id is null then
    select id into v_done_column_id
    from orbit.columns
    where board_id = v_board_id
    order by rank desc
    limit 1;
  end if;

  update orbit.boards
  set default_done_column_id = v_done_column_id
  where id = v_board_id;

  return v_board_id;
end;
$$;

create or replace function orbit.process_due_recurrences_worker()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  return orbit_private.process_due_recurrences();
end;
$$;

revoke all on function orbit.process_due_recurrences_worker() from public, anon, authenticated;
grant execute on function orbit.process_due_recurrences_worker() to service_role;

commit;
