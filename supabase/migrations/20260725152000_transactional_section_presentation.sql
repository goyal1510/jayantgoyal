begin;

create or replace function portfolio.save_section_presentation(
  p_section_key text,
  p_copy jsonb,
  p_navigation jsonb default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  saved_copy portfolio.section_content%rowtype;
  saved_navigation portfolio.nav_items%rowtype;
begin
  insert into portfolio.section_content (
    section_key,
    eyebrow,
    headline,
    accent,
    description,
    supporting_text,
    is_visible
  )
  values (
    p_section_key,
    p_copy ->> 'eyebrow',
    p_copy ->> 'headline',
    p_copy ->> 'accent',
    p_copy ->> 'description',
    p_copy ->> 'supporting_text',
    (p_copy ->> 'is_visible')::boolean
  )
  on conflict (section_key) do update
  set
    eyebrow = excluded.eyebrow,
    headline = excluded.headline,
    accent = excluded.accent,
    description = excluded.description,
    supporting_text = excluded.supporting_text,
    is_visible = excluded.is_visible
  returning * into saved_copy;

  if p_navigation is not null and p_navigation <> 'null'::jsonb then
    insert into portfolio.nav_items (
      section_id,
      label,
      note,
      sort_order,
      is_visible
    )
    values (
      p_section_key,
      p_navigation ->> 'label',
      p_navigation ->> 'note',
      (p_navigation ->> 'sort_order')::integer,
      (p_navigation ->> 'is_visible')::boolean
    )
    on conflict (section_id) do update
    set
      label = excluded.label,
      note = excluded.note,
      sort_order = excluded.sort_order,
      is_visible = excluded.is_visible
    returning * into saved_navigation;
  end if;

  return jsonb_build_object(
    'sectionContent',
    to_jsonb(saved_copy),
    'navigation',
    case
      when saved_navigation.id is null then null
      else to_jsonb(saved_navigation)
    end
  );
end;
$$;

revoke all
  on function portfolio.save_section_presentation(text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute
  on function portfolio.save_section_presentation(text, jsonb, jsonb)
  to service_role;

commit;
