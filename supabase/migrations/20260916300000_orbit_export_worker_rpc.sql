begin;

create or replace function orbit.process_pending_export_jobs(p_limit integer default 10)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job orbit_private.export_jobs%rowtype;
  v_count integer := 0;
  v_manifest jsonb;
begin
  for v_job in
    select *
    from orbit_private.export_jobs
    where status = 'pending'
    order by created_at
    limit greatest(p_limit, 1)
    for update skip locked
  loop
    update orbit_private.export_jobs set status = 'processing' where id = v_job.id;

    select jsonb_build_object(
      'exportedAt', now(),
      'workspace', (
        select to_jsonb(w)
        from orbit.workspaces w
        where w.id = v_job.workspace_id
      ),
      'boards', coalesce((
        select jsonb_agg(to_jsonb(b))
        from orbit.boards b
        where b.workspace_id = v_job.workspace_id
      ), '[]'::jsonb),
      'cards', coalesce((
        select jsonb_agg(to_jsonb(c))
        from orbit.cards c
        where c.workspace_id = v_job.workspace_id
      ), '[]'::jsonb),
      'members', coalesce((
        select jsonb_agg(to_jsonb(m))
        from orbit.workspace_members m
        where m.workspace_id = v_job.workspace_id
      ), '[]'::jsonb)
    )
    into v_manifest;

    update orbit_private.export_jobs
    set
      status = 'ready',
      manifest = v_manifest,
      processed_at = now(),
      expires_at = now() + interval '7 days'
    where id = v_job.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function orbit.process_pending_export_jobs(integer) from public, anon, authenticated;
grant execute on function orbit.process_pending_export_jobs(integer) to service_role;

commit;
