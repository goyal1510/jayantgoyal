-- The database contract can accept Resume before the Portfolio web release is
-- live, but the old navigation renderer would treat it as a homepage anchor.
-- Keep the item staged until the matching web code is deployed, then enable it
-- through Admin as the release activation step.
update portfolio.nav_items
set is_visible = false
where section_id = 'resume';
