begin;

update jg_app.writing_posts
set content = replace(
  replace(
    replace(
      content,
      'Check out the platform at [jayantgoyal.com](https://www.jayantgoyal.com)',
      'Check out the site at [jayantgoyal.com](https://www.jayantgoyal.com)'
    ),
    'Browse all [blog posts](https://www.jayantgoyal.com/writing)',
    'Browse all [Writing](https://www.jayantgoyal.com/writing)'
  ),
  'This platform is a living project.',
  'This product suite is a living project.'
)
where slug in (
  'fixing-google-indexing-seo',
  'introducing-jayantgoyal-com'
);

commit;
