-- Keep the shared CMS text-array validator in jg_app so portfolio can depend
-- on the common application schema without creating a reverse schema cycle.

begin;

create or replace function jg_app.is_nonblank_text_array(value text[])
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  item text;
begin
  foreach item in array value loop
    if item is null or btrim(item) = '' then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

alter table portfolio.about
  drop constraint about_story_items_check,
  add constraint about_story_items_check check (
    jg_app.is_nonblank_text_array(story)
  );

alter table portfolio.experience
  drop constraint experience_bullets_items_check,
  add constraint experience_bullets_items_check check (
    jg_app.is_nonblank_text_array(bullets)
  );

alter table portfolio.projects
  drop constraint projects_tags_items_check,
  add constraint projects_tags_items_check check (
    jg_app.is_nonblank_text_array(tags)
  );

alter table jg_app.blog_posts
  drop constraint blog_posts_tags_items_check,
  add constraint blog_posts_tags_items_check check (
    jg_app.is_nonblank_text_array(tags)
  );

drop function portfolio.is_nonblank_text_array(text[]);

commit;
