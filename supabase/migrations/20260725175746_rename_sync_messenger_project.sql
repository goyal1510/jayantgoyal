begin;

update portfolio.projects
set slug = 'sync-scratchpad',
    name = 'Sync Scratchpad',
    eyebrow = 'Private realtime scratchpad'
where slug = 'sync-messenger';

commit;
