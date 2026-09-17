begin;

do $$
begin
  alter publication supabase_realtime drop table orbit.cards;
exception
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime drop table orbit.comments;
exception
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime drop table orbit.notifications;
exception
  when undefined_object then null;
end;
$$;

drop policy if exists "Orbit members read own attachment paths" on storage.objects;
drop policy if exists "Orbit editors upload attachment paths" on storage.objects;

-- Orbit attachment bytes and the `orbit-attachments` bucket must be removed
-- through the Storage API. Hosted Supabase treats storage metadata DML as
-- read-only in migrations.

drop function if exists iam.set_orbit_access(uuid, uuid, text);
drop function if exists iam.revoke_orbit_access(uuid, uuid);

delete from iam.product_role_assignments where product_key = 'orbit';
delete from iam.product_memberships where product_key = 'orbit';
delete from iam.role_capabilities
where role_key in ('orbit.participant', 'orbit.creator', 'orbit.operator');
delete from iam.roles where product_key = 'orbit';
delete from iam.capabilities where product_key = 'orbit';
delete from iam.products where key = 'orbit';

drop schema if exists orbit_private cascade;
drop schema if exists orbit cascade;

commit;
