create table if not exists jg_app.tool_favorites (
  id uuid default jg_app.uuid_v7() not null,
  user_id uuid not null,
  tool_id text not null,
  created_at timestamp with time zone default now() not null,
  constraint tool_favorites_pkey primary key (id),
  constraint tool_favorites_user_tool_key unique (user_id, tool_id),
  constraint tool_favorites_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade,
  constraint tool_favorites_tool_id_check check (length(trim(tool_id)) > 0)
);

create table if not exists jg_app.tool_history (
  id uuid default jg_app.uuid_v7() not null,
  user_id uuid not null,
  tool_id text not null,
  visited_at timestamp with time zone default now() not null,
  visit_count integer default 1 not null,
  constraint tool_history_pkey primary key (id),
  constraint tool_history_user_tool_key unique (user_id, tool_id),
  constraint tool_history_user_id_fkey foreign key (user_id)
    references auth.users(id) on delete cascade,
  constraint tool_history_tool_id_check check (length(trim(tool_id)) > 0),
  constraint tool_history_visit_count_check check (visit_count > 0)
);

create index if not exists idx_tool_favorites_user_created
  on jg_app.tool_favorites using btree (user_id, created_at desc);

create index if not exists idx_tool_history_user_visited
  on jg_app.tool_history using btree (user_id, visited_at desc);

alter table jg_app.tool_favorites enable row level security;
alter table jg_app.tool_history enable row level security;

create policy "Users can view own tool favorites"
  on jg_app.tool_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own tool favorites"
  on jg_app.tool_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own tool favorites"
  on jg_app.tool_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own tool history"
  on jg_app.tool_history
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own tool history"
  on jg_app.tool_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tool history"
  on jg_app.tool_history
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tool history"
  on jg_app.tool_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant all on table jg_app.tool_favorites to authenticated;
grant all on table jg_app.tool_favorites to service_role;
grant all on table jg_app.tool_history to authenticated;
grant all on table jg_app.tool_history to service_role;
revoke all on table jg_app.tool_favorites from anon;
revoke all on table jg_app.tool_history from anon;
