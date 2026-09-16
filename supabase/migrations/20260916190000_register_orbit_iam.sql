begin;

insert into iam.products (key, name)
values ('orbit', 'Orbit')
on conflict (key) do nothing;

insert into iam.capabilities (
  key,
  product_key,
  resource,
  action,
  description,
  is_sensitive
)
values
  ('orbit.app.enter', 'orbit', 'app', 'enter', 'Enter the Orbit product.', false),
  ('orbit.workspace.create', 'orbit', 'workspace', 'create', 'Create a new Orbit workspace.', true),
  ('orbit.operations.read', 'orbit', 'operations', 'read', 'Read Orbit operational summaries.', true),
  ('orbit.operations.manage', 'orbit', 'operations', 'manage', 'Manage Orbit product entitlements.', true)
on conflict (key) do nothing;

insert into iam.roles (key, name, description, scope_type, product_key)
values
  ('orbit.participant', 'Participant', 'Enter Orbit and participate in assigned workspaces.', 'product', 'orbit'),
  ('orbit.creator', 'Creator', 'Enter Orbit and create workspaces.', 'product', 'orbit'),
  ('orbit.operator', 'Operator', 'Manage Orbit operational controls without content access.', 'product', 'orbit')
on conflict (key) do nothing;

insert into iam.role_capabilities (role_key, capability_key)
select 'orbit.participant', 'orbit.app.enter'
on conflict do nothing;

insert into iam.role_capabilities (role_key, capability_key)
select 'orbit.creator', key
from iam.capabilities
where key in ('orbit.app.enter', 'orbit.workspace.create')
on conflict do nothing;

insert into iam.role_capabilities (role_key, capability_key)
select 'orbit.operator', key
from iam.capabilities
where key in ('orbit.operations.read', 'orbit.operations.manage')
on conflict do nothing;

with preserved_users as (
  select id
  from auth.users
  where lower(email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
)
insert into iam.product_memberships (product_key, user_id, status)
select 'orbit', preserved.id, 'active'
from preserved_users preserved
on conflict (product_key, user_id) do update
set status = excluded.status;

with preserved_users as (
  select id
  from auth.users
  where lower(email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
)
insert into iam.product_role_assignments (product_key, user_id, role_key)
select 'orbit', id, 'orbit.creator'
from preserved_users
on conflict (product_key, user_id, role_key) do nothing;

commit;
