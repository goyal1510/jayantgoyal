begin;

-- These legacy helpers accepted a caller-supplied user ID while running as
-- postgres. No application uses them, so removing the RPC surface is safer
-- than preserving an authorization contract that the product does not need.
drop function if exists jg_account.list_user_sessions(uuid);
drop function if exists jg_account.revoke_other_sessions(uuid, uuid);
drop function if exists jg_account.revoke_session(uuid, uuid);

-- The remaining helper is caller-bound through auth.uid(). Anonymous callers
-- cannot have a session to count, so keep the function available only to
-- authenticated application requests and the service role.
revoke execute
  on function jg_account.count_my_sessions()
  from public, anon;
grant execute
  on function jg_account.count_my_sessions()
  to authenticated, service_role;

-- Section visibility is a presentation control, not a confidentiality
-- boundary. Public readers need every canonical section row so the typed
-- loader can validate the complete CMS contract before components decide
-- which sections to render.
drop policy if exists "Public read access"
  on portfolio.section_content;
create policy "Public read access"
  on portfolio.section_content
  for select
  to anon, authenticated
  using (true);

-- Resume is a first-class public destination even though it is not a homepage
-- section. Keep it in the same managed navigation model as Work and Blog.
alter table portfolio.nav_items
  drop constraint if exists nav_items_section_id_check;
alter table portfolio.nav_items
  add constraint nav_items_section_id_check check (
    section_id = any(
      array[
        'about',
        'skills',
        'experience',
        'activity',
        'work',
        'writing',
        'resume'
      ]::text[]
    )
  );

update portfolio.nav_items
set
  label = 'Blog',
  note = 'Articles'
where section_id = 'writing';

insert into portfolio.nav_items (
  section_id,
  label,
  note,
  sort_order,
  is_visible
)
values (
  'resume',
  'Resume',
  'Download',
  6,
  true
)
on conflict (section_id) do update
set
  label = excluded.label,
  note = excluded.note,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

commit;
