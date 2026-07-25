begin;

-- Keep the primary navigation focused on visitor intent. Skills, Experience,
-- and Activity remain on the homepage but no longer compete with the paths to
-- product proof, technical writing, professional context, and the résumé.
update portfolio.nav_items
set
  sort_order = case section_id
    when 'work' then 0
    when 'writing' then 1
    when 'about' then 2
    when 'resume' then 3
    else sort_order
  end,
  is_visible = case
    when section_id in ('work', 'writing', 'about') then true
    when section_id in ('skills', 'experience', 'activity') then false
    else is_visible
  end
where section_id in (
  'about',
  'skills',
  'experience',
  'activity',
  'work',
  'writing',
  'resume'
);

-- Resume stays release-gated until the navigation renderer containing its
-- dedicated /resume routing is deployed.
update portfolio.nav_items
set is_visible = false
where section_id = 'resume';

commit;
