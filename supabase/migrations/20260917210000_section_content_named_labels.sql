begin;

alter table portfolio.section_content
  add column if not exists labels jsonb not null default '{}'::jsonb;

alter table portfolio.section_content
  drop constraint if exists section_content_labels_object_check;

alter table portfolio.section_content
  add constraint section_content_labels_object_check check (
    jsonb_typeof(labels) = 'object'
  );

update portfolio.section_content
set
  labels = jsonb_strip_nulls(
    jsonb_build_object(
      'factBuilding', nullif(btrim(split_part(headline, '|', 1)), ''),
      'factWorkingAs', nullif(btrim(split_part(headline, '|', 2)), ''),
      'factBasedIn', nullif(btrim(split_part(headline, '|', 3)), '')
    )
  ),
  headline = ''
where section_key = 'hero'
  and headline like '%|%|%';

update portfolio.section_content
set
  labels = jsonb_strip_nulls(
    jsonb_build_object(
      'readCta', nullif(btrim(split_part(accent, '|', 2)), '')
    )
  ),
  accent = btrim(split_part(accent, '|', 1))
where section_key = 'writing'
  and accent like '%|%';

update portfolio.section_content
set
  labels = jsonb_strip_nulls(
    jsonb_build_object(
      'countNoun', nullif(btrim(split_part(supporting_text, '|', 2)), '')
    )
  ),
  supporting_text = btrim(split_part(supporting_text, '|', 1))
where section_key = 'work'
  and supporting_text like '%|%';

update portfolio.section_content
set
  labels = jsonb_strip_nulls(
    jsonb_build_object(
      'deliveryLabel', nullif(btrim(split_part(supporting_text, '|', 1)), ''),
      'deliveryValue', nullif(btrim(split_part(supporting_text, '|', 2)), '')
    )
  ),
  supporting_text = ''
where section_key = 'engineering'
  and supporting_text like '%|%';

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
  copy_labels jsonb := coalesce(p_copy -> 'labels', '{}'::jsonb);
begin
  if jsonb_typeof(copy_labels) <> 'object' then
    raise exception 'section labels must be a JSON object';
  end if;

  insert into portfolio.section_content (
    section_key,
    eyebrow,
    headline,
    accent,
    description,
    supporting_text,
    labels,
    is_visible
  )
  values (
    p_section_key,
    p_copy ->> 'eyebrow',
    p_copy ->> 'headline',
    p_copy ->> 'accent',
    p_copy ->> 'description',
    p_copy ->> 'supporting_text',
    copy_labels,
    (p_copy ->> 'is_visible')::boolean
  )
  on conflict (section_key) do update
  set
    eyebrow = excluded.eyebrow,
    headline = excluded.headline,
    accent = excluded.accent,
    description = excluded.description,
    supporting_text = excluded.supporting_text,
    labels = excluded.labels,
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
