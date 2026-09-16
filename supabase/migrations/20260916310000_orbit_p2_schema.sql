begin;

alter table orbit.card_recurrence
  add column if not exists timezone text not null default 'UTC',
  add column if not exists title_template text;

create table orbit.automation_rules (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  trigger_type text not null check (trigger_type in ('card_moved', 'card_created')),
  trigger_config jsonb not null default '{}'::jsonb,
  action_type text not null check (action_type in ('set_label', 'add_comment')),
  action_config jsonb not null default '{}'::jsonb,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now()
);

create index automation_rules_board_idx on orbit.automation_rules (board_id, enabled);

create table orbit_private.automation_runs (
  id uuid primary key default foundation.uuid_v7(),
  rule_id uuid not null references orbit.automation_rules (id) on delete cascade,
  card_id uuid references orbit.cards (id) on delete set null,
  status text not null check (status in ('completed', 'skipped', 'failed')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table orbit.card_github_links (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  repo_full_name text not null,
  issue_number integer not null,
  issue_url text not null,
  issue_title text,
  issue_state text,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (card_id, issue_url),
  foreign key (workspace_id, board_id, card_id) references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit_private.webhook_subscriptions (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  url text not null,
  secret_hash text not null,
  events text[] not null default array['card.created', 'card.moved']::text[],
  enabled boolean not null default true,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint webhook_subscriptions_url_https check (url ~* '^https://')
);

create table orbit_private.webhook_deliveries (
  id uuid primary key default foundation.uuid_v7(),
  subscription_id uuid not null references orbit_private.webhook_subscriptions (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table orbit_private.api_tokens (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  token_prefix text not null,
  scopes text[] not null default array['boards:read', 'cards:read']::text[],
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table orbit.published_boards (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid not null references orbit.boards (id) on delete cascade unique,
  slug text not null unique,
  projection jsonb not null default '{}'::jsonb,
  field_allowlist text[] not null default array['title', 'column', 'priority']::text[],
  published_by uuid not null references iam.profiles (user_id) on delete restrict,
  published_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index published_boards_active_idx on orbit.published_boards (slug) where revoked_at is null;

create table orbit_private.import_jobs (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid not null references orbit.boards (id) on delete cascade,
  requester_id uuid not null references iam.profiles (user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  source_format text not null default 'orbit_json',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table orbit.ai_preferences (
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

alter table orbit.automation_rules enable row level security;
alter table orbit.card_github_links enable row level security;
alter table orbit.published_boards enable row level security;
alter table orbit.ai_preferences enable row level security;

create policy automation_rules_select on orbit.automation_rules for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy automation_rules_manage on orbit.automation_rules for all to authenticated
  using (orbit_private.can_manage_board(board_id))
  with check (orbit_private.can_manage_board(board_id));

create policy card_github_links_select on orbit.card_github_links for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy card_github_links_manage on orbit.card_github_links for all to authenticated
  using (orbit_private.can_edit_board(board_id))
  with check (orbit_private.can_edit_board(board_id));

create policy published_boards_select on orbit.published_boards for select to authenticated
  using (orbit_private.is_active_workspace_member(workspace_id, orbit_private.current_user_id()));
create policy published_boards_manage on orbit.published_boards for all to authenticated
  using (exists (
    select 1 from orbit.workspaces w
    where w.id = workspace_id and w.owner_user_id = orbit_private.current_user_id()
  ))
  with check (exists (
    select 1 from orbit.workspaces w
    where w.id = workspace_id and w.owner_user_id = orbit_private.current_user_id()
  ));

create policy ai_preferences_self on orbit.ai_preferences for all to authenticated
  using (user_id = orbit_private.current_user_id())
  with check (user_id = orbit_private.current_user_id());

grant select on orbit.automation_rules, orbit.card_github_links, orbit.published_boards, orbit.ai_preferences
  to authenticated;

revoke all on table orbit_private.automation_runs from public, anon, authenticated;
revoke all on table orbit_private.webhook_subscriptions from public, anon, authenticated;
revoke all on table orbit_private.webhook_deliveries from public, anon, authenticated;
revoke all on table orbit_private.api_tokens from public, anon, authenticated;
revoke all on table orbit_private.import_jobs from public, anon, authenticated;
grant select, insert, update on table orbit_private.automation_runs,
  orbit_private.webhook_subscriptions, orbit_private.webhook_deliveries,
  orbit_private.api_tokens, orbit_private.import_jobs to service_role;

commit;
