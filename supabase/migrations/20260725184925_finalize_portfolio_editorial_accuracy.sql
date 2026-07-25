begin;

-- Keep the published project record aligned with the canonical Scratchpad route
-- and asset naming. The old path remains a compatibility redirect in Studio,
-- but public content should link to the canonical destination.
update portfolio.work
set live_link = 'https://studio.jayantgoyal.com/scratchpad',
    image_url = '/images/scratchpad.png',
    image_alt = 'Sync Scratchpad private scratchpad interface with entry history.'
where slug = 'sync-scratchpad';

-- Refresh older Writing records so their links, names, counts, and architecture
-- descriptions match the current Portfolio/Studio implementation.
update jg_app.writing_posts
set content = replace(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(content,
                    'https://www.jayantgoyal.com/tools',
                    'https://studio.jayantgoyal.com/tools'
                  ),
                  'https://www.jayantgoyal.com/github-stats',
                  'https://studio.jayantgoyal.com/github-stats'
                ),
                'https://www.jayantgoyal.com/blogs',
                'https://www.jayantgoyal.com/writing'
              ),
              'Jayant Goyal',
              'Jayant'
            ),
            'full-stack developer profile',
            'software engineer profile'
          ),
          '99+ dev tools',
          '87 developer tools'
        ),
        '99+ Developer Tools',
        '87 Developer Tools'
      ),
      '7 games built',
      '9 games built'
    ),
    '### Messenger',
    '### Sync Scratchpad'
  ),
  'Real-time chat powered by Supabase Realtime. Messages sync instantly across tabs and devices.',
  'A private realtime scratchpad for moving text, links, and notes between devices. Supabase Realtime keeps entries synchronized across sessions.'
)
where slug in (
  'live-resume-download-google-docs-nextjs-vercel',
  'fixing-google-indexing-seo',
  'introducing-jayantgoyal-com'
);

update jg_app.writing_posts
set excerpt = 'A walkthrough of the portfolio and Studio suite I built, including developer tools, games, private storage, Scratchpad, and the engineering decisions behind them.'
where slug = 'introducing-jayantgoyal-com';

update jg_app.writing_posts
set content = replace(
  replace(
    content,
    'full-stack platform that doubles as my portfolio and a suite of tools I reach for daily.',
    'product suite that combines my portfolio with tools I reach for daily.'
  ),
  'This is the core utility of the platform.',
  'This is the core utility of the Studio suite.'
)
where slug = 'introducing-jayantgoyal-com';

update jg_app.writing_posts
set content = replace(
  content,
  '**Portfolio data system** — Multi-tenant by hostname. Portfolio content is managed via a separate admin app and served through a React Context provider.',
  '**Portfolio data system** — The public Portfolio app reads typed editorial contracts from Supabase, while the separate Admin app writes the same canonical content tables and asset bucket.'
)
where slug = 'introducing-jayantgoyal-com';

commit;
