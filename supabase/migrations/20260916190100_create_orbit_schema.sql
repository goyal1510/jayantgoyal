begin;

create schema if not exists orbit;
create schema if not exists orbit_private;

revoke all on schema orbit from public, anon;
revoke all on schema orbit_private from public, anon, authenticated;

grant usage on schema orbit to authenticated, service_role;
grant usage on schema orbit_private to service_role;

create type orbit.workspace_member_role as enum (
  'admin',
  'member',
  'viewer',
  'guest'
);

create type orbit.board_member_role as enum (
  'manager',
  'editor',
  'commenter',
  'viewer'
);

create type orbit.board_visibility as enum ('workspace', 'private');

create type orbit.lifecycle_status as enum (
  'active',
  'archived',
  'trashed',
  'pending_deletion'
);

create type orbit.column_category as enum (
  'backlog',
  'active',
  'done',
  'cancelled'
);

create type orbit.card_priority as enum ('none', 'low', 'medium', 'high', 'urgent');

create table orbit.workspaces (
  id uuid primary key default foundation.uuid_v7(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text check (description is null or char_length(description) <= 500),
  owner_user_id uuid not null references iam.profiles (user_id) on delete restrict,
  timezone text not null default 'Asia/Kolkata',
  lifecycle orbit.lifecycle_status not null default 'active',
  deletion_requested_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orbit.workspace_members (
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  role orbit.workspace_member_role not null default 'member',
  status text not null default 'active' check (status in ('active', 'invited', 'suspended', 'removed')),
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (workspace_id, user_id)
);

create table orbit.boards (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  key text not null check (key ~ '^[A-Z0-9]{2,8}$'),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text check (description is null or char_length(description) <= 2000),
  visibility orbit.board_visibility not null default 'workspace',
  lifecycle orbit.lifecycle_status not null default 'active',
  rank text not null default 'a0',
  revision integer not null default 1 check (revision > 0),
  channel_epoch bigint not null default 1,
  default_done_column_id uuid,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

alter table orbit.boards add constraint boards_workspace_id_unique unique (workspace_id, id);

create table orbit.board_members (
  workspace_id uuid not null,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  role orbit.board_member_role not null,
  primary key (board_id, user_id),
  foreign key (workspace_id, user_id)
    references orbit.workspace_members (workspace_id, user_id) on delete cascade,
  foreign key (workspace_id, board_id)
    references orbit.boards (workspace_id, id) on delete cascade
);

create table orbit.columns (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  category orbit.column_category not null default 'active',
  rank text not null default 'a0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, board_id)
    references orbit.boards (workspace_id, id) on delete cascade
);

alter table orbit.columns add constraint columns_board_id_unique unique (board_id, id);

alter table orbit.boards
  add constraint boards_default_done_column_fkey
  foreign key (default_done_column_id)
  references orbit.columns (id)
  deferrable initially deferred;

create table orbit.cards (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  column_id uuid not null references orbit.columns (id) on delete restrict,
  number integer not null check (number > 0),
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 20000),
  priority orbit.card_priority not null default 'none',
  rank text not null default 'a0',
  due_date date,
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_id, number),
  foreign key (workspace_id, board_id)
    references orbit.boards (workspace_id, id) on delete cascade,
  foreign key (board_id, column_id)
    references orbit.columns (board_id, id) on delete restrict
);

alter table orbit.cards add constraint cards_workspace_board_id_unique unique (workspace_id, board_id, id);

create table orbit.card_assignees (
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  assigned_by uuid not null references iam.profiles (user_id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (card_id, user_id),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.labels (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  color_token text not null default 'slate',
  created_at timestamptz not null default now()
);

create unique index labels_workspace_name_idx
  on orbit.labels (workspace_id, lower(name));

alter table orbit.labels add constraint labels_workspace_id_unique unique (workspace_id, id);

create table orbit.card_labels (
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  label_id uuid not null references orbit.labels (id) on delete cascade,
  primary key (card_id, label_id),
  foreign key (workspace_id, label_id)
    references orbit.labels (workspace_id, id) on delete cascade
);

create table orbit.comments (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  author_id uuid not null references iam.profiles (user_id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  version integer not null default 1 check (version > 0),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.activity_events (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid references orbit.boards (id) on delete cascade,
  card_id uuid references orbit.cards (id) on delete set null,
  actor_id uuid references iam.profiles (user_id) on delete set null,
  event_type text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  command_id uuid
);

create table orbit.notifications (
  id uuid primary key default foundation.uuid_v7(),
  recipient_id uuid not null references iam.profiles (user_id) on delete cascade,
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid references orbit.boards (id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  event_id uuid references orbit.activity_events (id) on delete set null,
  reason text not null,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, event_id, reason)
);

create table orbit.user_preferences (
  user_id uuid primary key references iam.profiles (user_id) on delete cascade,
  default_workspace_id uuid references orbit.workspaces (id) on delete set null,
  theme text not null default 'system',
  density text not null default 'comfortable',
  notification_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table orbit.board_favorites (
  workspace_id uuid not null,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (board_id, user_id),
  foreign key (workspace_id, board_id)
    references orbit.boards (workspace_id, id) on delete cascade
);

create table orbit.attachments (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  uploader_id uuid not null references iam.profiles (user_id) on delete restrict,
  object_key text not null unique,
  original_name text not null,
  mime text not null,
  bytes bigint not null check (bytes >= 0),
  checksum text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed', 'deleted')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit_private.invitations (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  email_normalized text not null,
  workspace_role orbit.workspace_member_role not null,
  token_hash text not null unique,
  inviter_id uuid not null references iam.profiles (user_id) on delete restrict,
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  board_scope jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table orbit_private.command_receipts (
  actor_id uuid not null references iam.profiles (user_id) on delete cascade,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  result_ref jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_id, command_name, idempotency_key)
);

create table orbit_private.board_sequences (
  board_id uuid primary key references orbit.boards (id) on delete cascade,
  next_number integer not null default 1 check (next_number > 0)
);

create table orbit_private.outbox_events (
  id uuid primary key default foundation.uuid_v7(),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'dead')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table orbit_private.upload_reservations (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  uploader_id uuid not null references iam.profiles (user_id) on delete cascade,
  object_key text not null unique,
  reserved_bytes bigint not null check (reserved_bytes > 0),
  expires_at timestamptz not null,
  status text not null default 'reserved' check (status in ('reserved', 'finalized', 'expired', 'cancelled')),
  created_at timestamptz not null default now()
);

create index workspace_members_user_status_idx
  on orbit.workspace_members (user_id, status);
create index boards_workspace_visibility_idx
  on orbit.boards (workspace_id, visibility, lifecycle);
create index cards_board_column_rank_idx
  on orbit.cards (board_id, column_id, rank, id)
  where deleted_at is null;
create index notifications_recipient_read_idx
  on orbit.notifications (recipient_id, read_at, created_at desc);
create index outbox_status_next_attempt_idx
  on orbit_private.outbox_events (status, next_attempt_at);

create trigger workspaces_set_updated_at
  before update on orbit.workspaces
  for each row execute function foundation.set_updated_at();
create trigger boards_set_updated_at
  before update on orbit.boards
  for each row execute function foundation.set_updated_at();
create trigger columns_set_updated_at
  before update on orbit.columns
  for each row execute function foundation.set_updated_at();
create trigger cards_set_updated_at
  before update on orbit.cards
  for each row execute function foundation.set_updated_at();

commit;
