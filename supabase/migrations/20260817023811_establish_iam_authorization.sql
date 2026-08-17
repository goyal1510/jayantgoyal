begin;

create schema if not exists foundation;
create schema if not exists iam;
create schema if not exists iam_private;

revoke all on schema foundation from public, anon, authenticated;
revoke all on schema iam_private from public, anon, authenticated;
revoke all on schema iam from public, anon;
grant usage on schema iam to authenticated, service_role;
grant usage on schema iam_private to authenticated, service_role;
grant usage on schema foundation to authenticated, service_role;

-- Promote the existing framework-neutral helpers without changing dependent
-- table defaults, constraints, or triggers. PostgreSQL tracks those dependencies
-- by object identity when a function moves schemas.
alter function jg_app.uuid_v7() set schema foundation;
alter function foundation.uuid_v7() set search_path = '';
alter function jg_app.update_updated_at() set schema foundation;
alter function foundation.update_updated_at() rename to set_updated_at;
alter function foundation.set_updated_at() set search_path = '';
alter function jg_app.is_nonblank_text_array(text[]) set schema foundation;

revoke all on all functions in schema foundation from public, anon, authenticated;
grant execute on function foundation.uuid_v7() to service_role;
grant execute on function foundation.set_updated_at() to service_role;
grant execute on function foundation.is_nonblank_text_array(text[]) to service_role;
grant execute on function foundation.uuid_v7() to authenticated;
grant execute on function foundation.set_updated_at() to authenticated;
grant execute on function foundation.is_nonblank_text_array(text[]) to authenticated;

create table iam.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  avatar_url text,
  avatar_mode text not null default 'provider',
  avatar_provider text,
  avatar_storage_path text,
  avatar_updated_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_avatar_mode_check
    check (avatar_mode in ('provider', 'upload', 'initials')),
  constraint profiles_avatar_upload_path_check
    check (
      avatar_mode <> 'upload'
      or nullif(btrim(avatar_storage_path), '') is not null
    ),
  constraint profiles_status_check
    check (status in ('active', 'suspended', 'deactivated'))
);

create table iam.products (
  key text primary key,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_key_check
    check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint products_name_check
    check (nullif(btrim(name), '') is not null),
  constraint products_status_check
    check (status in ('active', 'disabled'))
);

create table iam.product_memberships (
  product_key text not null references iam.products(key) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  valid_from timestamptz not null default now(),
  expires_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (product_key, user_id),
  constraint product_memberships_status_check
    check (status in ('pending', 'active', 'suspended', 'revoked')),
  constraint product_memberships_expiry_check
    check (expires_at is null or expires_at > valid_from),
  constraint product_memberships_revocation_check
    check (
      (status = 'revoked' and revoked_at is not null)
      or (status <> 'revoked' and revoked_at is null and revoked_by is null)
    )
);

create index product_memberships_user_status_idx
  on iam.product_memberships (user_id, status, product_key);
create index product_memberships_active_expiry_idx
  on iam.product_memberships (expires_at)
  where status = 'active' and expires_at is not null;
create index product_memberships_granted_by_idx
  on iam.product_memberships (granted_by)
  where granted_by is not null;
create index product_memberships_revoked_by_idx
  on iam.product_memberships (revoked_by)
  where revoked_by is not null;

create table iam.workforces (
  id uuid primary key default foundation.uuid_v7(),
  key text not null unique,
  name text not null,
  status text not null default 'active',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workforces_key_check
    check (key ~ '^[a-z][a-z0-9_-]*$'),
  constraint workforces_name_check
    check (nullif(btrim(name), '') is not null),
  constraint workforces_status_check
    check (status in ('active', 'disabled'))
);

create index workforces_owner_user_idx on iam.workforces (owner_user_id);

create table iam.workforce_memberships (
  workforce_id uuid not null references iam.workforces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  expires_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (workforce_id, user_id),
  constraint workforce_memberships_status_check
    check (status in ('invited', 'active', 'suspended', 'revoked')),
  constraint workforce_memberships_expiry_check
    check (expires_at is null or expires_at > joined_at),
  constraint workforce_memberships_revocation_check
    check (
      (status = 'revoked' and revoked_at is not null)
      or (status <> 'revoked' and revoked_at is null and revoked_by is null)
    )
);

create index workforce_memberships_user_status_idx
  on iam.workforce_memberships (user_id, status, workforce_id);
create index workforce_memberships_granted_by_idx
  on iam.workforce_memberships (granted_by)
  where granted_by is not null;
create index workforce_memberships_revoked_by_idx
  on iam.workforce_memberships (revoked_by)
  where revoked_by is not null;

create table iam.roles (
  key text primary key,
  name text not null,
  description text not null default '',
  scope_type text not null,
  product_key text references iam.products(key) on delete cascade,
  workforce_id uuid references iam.workforces(id) on delete cascade,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_key_check
    check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint roles_name_check
    check (nullif(btrim(name), '') is not null),
  constraint roles_scope_type_check
    check (scope_type in ('product', 'workforce')),
  constraint roles_scope_check
    check (
      (scope_type = 'product' and product_key is not null and workforce_id is null)
      or
      (scope_type = 'workforce' and product_key is null and workforce_id is not null)
    ),
  unique (key, product_key),
  unique (key, workforce_id)
);

create index roles_product_key_idx
  on iam.roles (product_key) where product_key is not null;
create index roles_workforce_id_idx
  on iam.roles (workforce_id) where workforce_id is not null;

create table iam.capabilities (
  key text primary key,
  product_key text not null references iam.products(key) on delete cascade,
  resource text not null,
  action text not null,
  description text not null default '',
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  constraint capabilities_key_check
    check (
      key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'
    ),
  constraint capabilities_key_parts_check
    check (key = product_key || '.' || resource || '.' || action),
  constraint capabilities_resource_check
    check (resource ~ '^[a-z][a-z0-9_]*$'),
  constraint capabilities_action_check
    check (action ~ '^[a-z][a-z0-9_]*$')
);

create index capabilities_product_key_idx
  on iam.capabilities (product_key, key);

create table iam.role_capabilities (
  role_key text not null references iam.roles(key) on delete cascade,
  capability_key text not null references iam.capabilities(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, capability_key)
);

create index role_capabilities_capability_role_idx
  on iam.role_capabilities (capability_key, role_key);

create table iam.product_role_assignments (
  product_key text not null,
  user_id uuid not null,
  role_key text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (product_key, user_id, role_key),
  foreign key (product_key, user_id)
    references iam.product_memberships(product_key, user_id) on delete cascade,
  foreign key (role_key, product_key)
    references iam.roles(key, product_key) on delete cascade,
  constraint product_role_assignments_expiry_check
    check (expires_at is null or expires_at > assigned_at)
);

create index product_role_assignments_user_idx
  on iam.product_role_assignments (user_id, product_key, role_key);
create index product_role_assignments_role_idx
  on iam.product_role_assignments (role_key, product_key);
create index product_role_assignments_assigned_by_idx
  on iam.product_role_assignments (assigned_by)
  where assigned_by is not null;

create table iam.workforce_role_assignments (
  workforce_id uuid not null,
  user_id uuid not null,
  role_key text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (workforce_id, user_id, role_key),
  foreign key (workforce_id, user_id)
    references iam.workforce_memberships(workforce_id, user_id)
    on delete cascade,
  foreign key (role_key, workforce_id)
    references iam.roles(key, workforce_id) on delete cascade,
  constraint workforce_role_assignments_expiry_check
    check (expires_at is null or expires_at > assigned_at)
);

create index workforce_role_assignments_user_idx
  on iam.workforce_role_assignments (user_id, workforce_id, role_key);
create index workforce_role_assignments_role_idx
  on iam.workforce_role_assignments (role_key, workforce_id);
create index workforce_role_assignments_assigned_by_idx
  on iam.workforce_role_assignments (assigned_by)
  where assigned_by is not null;

create table iam.policy_versions (
  id uuid primary key default foundation.uuid_v7(),
  product_key text not null references iam.products(key) on delete cascade,
  policy_key text not null,
  version text not null,
  effective_at timestamptz not null,
  is_required boolean not null default true,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_key, policy_key, version),
  constraint policy_versions_key_check
    check (policy_key ~ '^[a-z][a-z0-9_]*$'),
  constraint policy_versions_version_check
    check (nullif(btrim(version), '') is not null),
  constraint policy_versions_retirement_check
    check (retired_at is null or retired_at > effective_at)
);

create index policy_versions_active_product_idx
  on iam.policy_versions (product_key, policy_key, effective_at desc)
  where retired_at is null;

create table iam.policy_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version_id uuid not null references iam.policy_versions(id) on delete restrict,
  accepted_at timestamptz not null default now(),
  acceptance_source text not null default 'web',
  primary key (user_id, policy_version_id),
  constraint policy_acceptances_source_check
    check (acceptance_source in ('web', 'native', 'migration', 'operator'))
);

create index policy_acceptances_policy_version_idx
  on iam.policy_acceptances (policy_version_id, user_id);

create table iam.access_audit_events (
  id uuid primary key default foundation.uuid_v7(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  product_key text references iam.products(key) on delete set null,
  workforce_id uuid references iam.workforces(id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_key text,
  request_id text,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint access_audit_events_action_check
    check (nullif(btrim(action), '') is not null),
  constraint access_audit_events_subject_type_check
    check (nullif(btrim(subject_type), '') is not null),
  constraint access_audit_events_source_check
    check (source in ('migration', 'admin_web', 'trusted_backend', 'system')),
  constraint access_audit_events_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create index access_audit_events_occurred_at_idx
  on iam.access_audit_events (occurred_at desc);
create index access_audit_events_actor_idx
  on iam.access_audit_events (actor_user_id, occurred_at desc)
  where actor_user_id is not null;
create index access_audit_events_target_idx
  on iam.access_audit_events (target_user_id, occurred_at desc)
  where target_user_id is not null;
create index access_audit_events_product_idx
  on iam.access_audit_events (product_key, occurred_at desc)
  where product_key is not null;
create index access_audit_events_workforce_idx
  on iam.access_audit_events (workforce_id, occurred_at desc)
  where workforce_id is not null;

create trigger profiles_set_updated_at
  before update on iam.profiles
  for each row execute function foundation.set_updated_at();
create trigger products_set_updated_at
  before update on iam.products
  for each row execute function foundation.set_updated_at();
create trigger product_memberships_set_updated_at
  before update on iam.product_memberships
  for each row execute function foundation.set_updated_at();
create trigger workforces_set_updated_at
  before update on iam.workforces
  for each row execute function foundation.set_updated_at();
create trigger workforce_memberships_set_updated_at
  before update on iam.workforce_memberships
  for each row execute function foundation.set_updated_at();
create trigger roles_set_updated_at
  before update on iam.roles
  for each row execute function foundation.set_updated_at();

insert into iam.products (key, name)
values
  ('auth', 'Auth'),
  ('portfolio', 'Portfolio'),
  ('studio', 'Studio'),
  ('admin', 'Admin');

insert into iam.profiles (
  user_id,
  first_name,
  last_name,
  avatar_url,
  avatar_mode,
  avatar_provider,
  avatar_storage_path,
  avatar_updated_at,
  created_at,
  updated_at
)
select
  user_id,
  first_name,
  last_name,
  avatar_url,
  avatar_mode,
  avatar_provider,
  avatar_storage_path,
  avatar_updated_at,
  created_at,
  updated_at
from jg_account.profiles;

with owner_user as (
  select id
  from auth.users
  where lower(email) = 'goyal151002@gmail.com'
)
insert into iam.workforces (key, name, owner_user_id)
select 'jayant-operations', 'Jayant operations', id
from owner_user;

insert into iam.capabilities (
  key,
  product_key,
  resource,
  action,
  description,
  is_sensitive
)
values
  ('admin.console.enter', 'admin', 'console', 'enter', 'Enter the Admin product.', false),
  ('admin.users.read', 'admin', 'users', 'read', 'View users and access assignments.', true),
  ('admin.users.create', 'admin', 'users', 'create', 'Create user access assignments.', true),
  ('admin.users.update', 'admin', 'users', 'update', 'Change user access assignments.', true),
  ('admin.users.delete', 'admin', 'users', 'delete', 'Remove user access assignments.', true),
  ('admin.access.read', 'admin', 'access', 'read', 'View IAM configuration.', true),
  ('admin.access.create', 'admin', 'access', 'create', 'Create IAM configuration.', true),
  ('admin.access.update', 'admin', 'access', 'update', 'Change IAM configuration.', true),
  ('admin.access.delete', 'admin', 'access', 'delete', 'Delete IAM configuration.', true),
  ('admin.access.transfer', 'admin', 'access', 'transfer', 'Transfer workforce ownership.', true),
  ('admin.deployments.read', 'admin', 'deployments', 'read', 'View deployment state.', true),
  ('admin.deployments.create', 'admin', 'deployments', 'create', 'Create a deployment.', true),
  ('admin.deployments.update', 'admin', 'deployments', 'update', 'Retry or promote a deployment.', true),
  ('admin.deployments.delete', 'admin', 'deployments', 'delete', 'Remove a deployment record.', true),
  ('portfolio.content.read', 'portfolio', 'content', 'read', 'View unpublished Portfolio content.', false),
  ('portfolio.content.create', 'portfolio', 'content', 'create', 'Create Portfolio content.', true),
  ('portfolio.content.update', 'portfolio', 'content', 'update', 'Update Portfolio content.', true),
  ('portfolio.content.delete', 'portfolio', 'content', 'delete', 'Delete Portfolio content.', true),
  ('portfolio.content.publish', 'portfolio', 'content', 'publish', 'Publish Portfolio content.', true),
  ('studio.activity.read', 'studio', 'activity', 'read', 'Read owned activity data.', false),
  ('studio.activity.create', 'studio', 'activity', 'create', 'Create owned activity data.', false),
  ('studio.activity.update', 'studio', 'activity', 'update', 'Update owned activity data.', false),
  ('studio.activity.delete', 'studio', 'activity', 'delete', 'Delete owned activity data.', false),
  ('studio.calculator.read', 'studio', 'calculator', 'read', 'Read owned calculator data.', false),
  ('studio.calculator.create', 'studio', 'calculator', 'create', 'Create owned calculator data.', false),
  ('studio.calculator.update', 'studio', 'calculator', 'update', 'Update owned calculator data.', false),
  ('studio.calculator.delete', 'studio', 'calculator', 'delete', 'Delete owned calculator data.', false),
  ('studio.files.read', 'studio', 'files', 'read', 'Read owned Studio files.', false),
  ('studio.files.create', 'studio', 'files', 'create', 'Create owned Studio files.', false),
  ('studio.files.update', 'studio', 'files', 'update', 'Update owned Studio files.', false),
  ('studio.files.delete', 'studio', 'files', 'delete', 'Delete owned Studio files.', false),
  ('studio.games.read', 'studio', 'games', 'read', 'Read joined game sessions.', false),
  ('studio.games.play', 'studio', 'games', 'play', 'Create, join, and play game sessions.', false),
  ('studio.scratchpad.read', 'studio', 'scratchpad', 'read', 'Read owned scratchpad entries.', false),
  ('studio.scratchpad.create', 'studio', 'scratchpad', 'create', 'Create owned scratchpad entries.', false),
  ('studio.scratchpad.update', 'studio', 'scratchpad', 'update', 'Update owned scratchpad entries.', false),
  ('studio.scratchpad.delete', 'studio', 'scratchpad', 'delete', 'Delete owned scratchpad entries.', false),
  ('studio.tools.read', 'studio', 'tools', 'read', 'Read owned tool activity.', false),
  ('studio.tools.create', 'studio', 'tools', 'create', 'Create owned tool activity.', false),
  ('studio.tools.update', 'studio', 'tools', 'update', 'Update owned tool activity.', false),
  ('studio.tools.delete', 'studio', 'tools', 'delete', 'Delete owned tool activity.', false),
  ('studio.typing.read', 'studio', 'typing', 'read', 'Read owned typing results.', false),
  ('studio.typing.create', 'studio', 'typing', 'create', 'Create owned typing results.', false);

insert into iam.roles (
  key,
  name,
  description,
  scope_type,
  product_key
)
values
  ('admin.full_access', 'Full access', 'All current Admin operations.', 'product', 'admin'),
  ('admin.viewer', 'Viewer', 'Admin entry and read-only operational access.', 'product', 'admin'),
  ('studio.member', 'Member', 'Use the current Studio features with owned data.', 'product', 'studio');

insert into iam.roles (
  key,
  name,
  description,
  scope_type,
  workforce_id
)
select
  role.key,
  role.name,
  role.description,
  'workforce',
  workforce.id
from iam.workforces workforce
cross join (
  values
    ('operations.owner', 'Owner', 'Own the operator workforce and transfer ownership.'),
    ('operations.administrator', 'Administrator', 'Administer current products and access.')
) as role(key, name, description)
where workforce.key = 'jayant-operations';

insert into iam.role_capabilities (role_key, capability_key)
select 'admin.full_access', key
from iam.capabilities
where product_key in ('admin', 'portfolio');

insert into iam.role_capabilities (role_key, capability_key)
select 'admin.viewer', key
from iam.capabilities
where key in (
  'admin.console.enter',
  'admin.users.read',
  'admin.access.read',
  'admin.deployments.read',
  'portfolio.content.read'
);

insert into iam.role_capabilities (role_key, capability_key)
select 'studio.member', key
from iam.capabilities
where product_key = 'studio';

insert into iam.role_capabilities (role_key, capability_key)
select role.key, capability.key
from iam.roles role
cross join iam.capabilities capability
where role.key in ('operations.owner', 'operations.administrator')
  and capability.product_key in ('admin', 'portfolio');

insert into iam.product_memberships (product_key, user_id)
select 'auth', auth_user.id
from auth.users auth_user;

with preserved_users as (
  select id
  from auth.users
  where lower(email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
)
insert into iam.product_memberships (product_key, user_id)
select product.key, preserved.id
from preserved_users preserved
cross join iam.products product
where product.key in ('portfolio', 'studio', 'admin');

with preserved_users as (
  select id
  from auth.users
  where lower(email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
)
insert into iam.workforce_memberships (workforce_id, user_id)
select workforce.id, preserved.id
from preserved_users preserved
cross join iam.workforces workforce
where workforce.key = 'jayant-operations';

with preserved_users as (
  select id
  from auth.users
  where lower(email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
)
insert into iam.product_role_assignments (product_key, user_id, role_key)
select 'admin', id, 'admin.full_access' from preserved_users
union all
select 'studio', id, 'studio.member' from preserved_users;

insert into iam.workforce_role_assignments (
  workforce_id,
  user_id,
  role_key
)
select
  workforce.id,
  auth_user.id,
  case lower(auth_user.email)
    when 'goyal151002@gmail.com' then 'operations.owner'
    else 'operations.administrator'
  end
from auth.users auth_user
cross join iam.workforces workforce
where lower(auth_user.email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com')
  and workforce.key = 'jayant-operations';

insert into iam.policy_versions (
  product_key,
  policy_key,
  version,
  effective_at
)
values ('studio', 'terms', '2026-01-26', '2026-01-26T00:00:00Z');

insert into iam.policy_acceptances (
  user_id,
  policy_version_id,
  accepted_at,
  acceptance_source
)
select
  profile.user_id,
  policy.id,
  profile.terms_accepted_at,
  'migration'
from jg_account.profiles profile
cross join iam.policy_versions policy
where profile.terms_accepted
  and profile.terms_accepted_at is not null
  and policy.product_key = 'studio'
  and policy.policy_key = 'terms'
  and policy.version = '2026-01-26';

create or replace function iam_private.user_has_product_access(
  p_user_id uuid,
  p_product_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from iam.product_memberships membership
    join iam.profiles profile on profile.user_id = membership.user_id
    join iam.products product on product.key = membership.product_key
    where membership.user_id = p_user_id
      and membership.product_key = p_product_key
      and membership.status = 'active'
      and membership.valid_from <= now()
      and (membership.expires_at is null or membership.expires_at > now())
      and profile.status = 'active'
      and product.status = 'active'
  );
$$;

create or replace function iam_private.user_has_capability(
  p_user_id uuid,
  p_capability_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from iam.capabilities capability
    where capability.key = p_capability_key
      and iam_private.user_has_product_access(
        p_user_id,
        capability.product_key
      )
      and (
        exists (
        select 1
        from iam.product_role_assignments assignment
        join iam.product_memberships assignment_membership
          on assignment_membership.product_key = assignment.product_key
         and assignment_membership.user_id = assignment.user_id
        join iam.role_capabilities role_capability
          on role_capability.role_key = assignment.role_key
        where assignment.user_id = p_user_id
          and assignment_membership.status = 'active'
          and assignment_membership.valid_from <= now()
          and (
            assignment_membership.expires_at is null
            or assignment_membership.expires_at > now()
          )
          and role_capability.capability_key = capability.key
          and (assignment.expires_at is null or assignment.expires_at > now())
        )
        or exists (
          select 1
          from iam.workforce_role_assignments assignment
          join iam.workforce_memberships membership
            on membership.workforce_id = assignment.workforce_id
           and membership.user_id = assignment.user_id
          join iam.workforces workforce
            on workforce.id = assignment.workforce_id
          join iam.role_capabilities role_capability
            on role_capability.role_key = assignment.role_key
          where assignment.user_id = p_user_id
            and membership.status = 'active'
            and workforce.status = 'active'
            and (membership.expires_at is null or membership.expires_at > now())
            and (assignment.expires_at is null or assignment.expires_at > now())
            and role_capability.capability_key = capability.key
        )
      )
  );
$$;

create or replace function iam_private.has_product_access(
  p_product_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    iam_private.user_has_product_access((select auth.uid()), p_product_key),
    false
  );
$$;

create or replace function iam_private.has_capability(
  p_capability_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    iam_private.user_has_capability((select auth.uid()), p_capability_key),
    false
  );
$$;

create or replace function iam.has_product_access(
  p_product_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(iam_private.has_product_access(p_product_key), false);
$$;

create or replace function iam.has_capability(
  p_capability_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(iam_private.has_capability(p_capability_key), false);
$$;

create or replace function iam.list_my_capabilities()
returns table (capability_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select capability.key
  from iam.capabilities capability
  where iam_private.has_capability(capability.key)
  order by capability.key;
$$;

create or replace function iam.count_my_sessions()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from auth.sessions session
  where session.user_id = (select auth.uid())
    and (session.not_after is null or session.not_after > now());
$$;

create or replace function iam_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into iam.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into iam.product_memberships (product_key, user_id)
  values ('auth', new.id)
  on conflict (product_key, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists jg_account_profiles_on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
create trigger iam_profile_on_auth_user_created
  after insert on auth.users
  for each row execute function iam_private.handle_new_user();

revoke all on all functions in schema iam_private from public, anon, authenticated;
grant execute on function iam_private.user_has_product_access(uuid, text)
  to service_role;
grant execute on function iam_private.user_has_capability(uuid, text)
  to service_role;
grant execute on function iam_private.has_product_access(text)
  to authenticated, service_role;
grant execute on function iam_private.has_capability(text)
  to authenticated, service_role;
revoke all on function iam_private.handle_new_user()
  from public, anon, authenticated;

revoke all on all functions in schema iam from public, anon, authenticated;
grant execute on function iam.has_product_access(text) to authenticated, service_role;
grant execute on function iam.has_capability(text) to authenticated, service_role;
grant execute on function iam.list_my_capabilities() to authenticated, service_role;
grant execute on function iam.count_my_sessions() to authenticated, service_role;

alter table iam.profiles enable row level security;
alter table iam.products enable row level security;
alter table iam.product_memberships enable row level security;
alter table iam.workforces enable row level security;
alter table iam.workforce_memberships enable row level security;
alter table iam.roles enable row level security;
alter table iam.capabilities enable row level security;
alter table iam.role_capabilities enable row level security;
alter table iam.product_role_assignments enable row level security;
alter table iam.workforce_role_assignments enable row level security;
alter table iam.policy_versions enable row level security;
alter table iam.policy_acceptances enable row level security;
alter table iam.access_audit_events enable row level security;

create policy profiles_select_self_or_user_reader
  on iam.profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.users.read'))
  );
create policy profiles_update_self
  on iam.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy products_select_authenticated
  on iam.products for select to authenticated using (true);
create policy product_memberships_select_self_or_access_reader
  on iam.product_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy workforces_select_members_or_access_reader
  on iam.workforces for select to authenticated
  using (
    exists (
      select 1
      from iam.workforce_memberships membership
      where membership.workforce_id = workforces.id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
    )
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy workforce_memberships_select_self_or_access_reader
  on iam.workforce_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy roles_select_authenticated
  on iam.roles for select to authenticated using (true);
create policy capabilities_select_authenticated
  on iam.capabilities for select to authenticated using (true);
create policy role_capabilities_select_authenticated
  on iam.role_capabilities for select to authenticated using (true);
create policy product_role_assignments_select_self_or_access_reader
  on iam.product_role_assignments for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy workforce_role_assignments_select_self_or_access_reader
  on iam.workforce_role_assignments for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy policy_versions_select_authenticated
  on iam.policy_versions for select to authenticated using (true);
create policy policy_acceptances_select_self_or_access_reader
  on iam.policy_acceptances for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select iam_private.has_capability('admin.access.read'))
  );
create policy policy_acceptances_insert_self
  on iam.policy_acceptances for insert to authenticated
  with check (user_id = (select auth.uid()));

revoke all on all tables in schema iam from public, anon, authenticated;
grant select on iam.profiles to authenticated;
grant update (
  first_name,
  last_name,
  avatar_url,
  avatar_mode,
  avatar_provider,
  avatar_storage_path,
  avatar_updated_at
) on iam.profiles to authenticated;
grant select on iam.products to authenticated;
grant select on iam.product_memberships to authenticated;
grant select on iam.workforces to authenticated;
grant select on iam.workforce_memberships to authenticated;
grant select on iam.roles to authenticated;
grant select on iam.capabilities to authenticated;
grant select on iam.role_capabilities to authenticated;
grant select on iam.product_role_assignments to authenticated;
grant select on iam.workforce_role_assignments to authenticated;
grant select on iam.policy_versions to authenticated;
grant select, insert on iam.policy_acceptances to authenticated;
grant all on all tables in schema iam to service_role;

alter default privileges for role postgres in schema foundation
  revoke execute on functions from public;
alter default privileges for role postgres in schema iam_private
  revoke execute on functions from public;
alter default privileges for role postgres in schema iam
  revoke execute on functions from public;
alter default privileges for role postgres in schema iam
  revoke all on tables from public, anon, authenticated;

insert into iam.access_audit_events (
  target_user_id,
  product_key,
  action,
  subject_type,
  subject_key,
  source
)
select
  auth_user.id,
  'admin',
  'access_backfilled',
  'product_role_assignment',
  'admin.full_access',
  'migration'
from auth.users auth_user
where lower(auth_user.email) in ('goyal151002@gmail.com', 'gacbbl@gmail.com');

commit;
