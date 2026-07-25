begin;

update portfolio.nav_items
set label = 'GitHub',
    note = 'Open source activity'
where section_id = 'github';

update portfolio.section_content
set eyebrow = 'Blog / Notes from the build',
    headline = 'Writing about the decisions behind the build',
    description = 'Technical notes on product engineering, system design, and the lessons that follow shipping real software.'
where section_key = 'blog';

commit;
