begin;

update portfolio.work
set github_link = case github_link
  when 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/portfolio'
    then 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/portfolio/web'
  when 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio'
    then 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio/web'
  when 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/admin'
    then 'https://github.com/goyal1510/jayantgoyal/tree/main/apps/admin/web'
  when 'https://github.com/goyal1510/jayantgoyal/tree/main/packages/auth'
    then 'https://github.com/goyal1510/jayantgoyal/tree/main/packages/web/auth'
  else github_link
end
where github_link in (
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/portfolio',
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/studio',
  'https://github.com/goyal1510/jayantgoyal/tree/main/apps/admin',
  'https://github.com/goyal1510/jayantgoyal/tree/main/packages/auth'
);

commit;
