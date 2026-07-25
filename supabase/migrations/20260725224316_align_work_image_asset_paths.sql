-- Keep the canonical CMS records aligned with the deployed light-mode
-- screenshots used by Portfolio and Admin.
update portfolio.work as work
set image_url = assets.image_url
from (
  values
    ('portfolio', '/images/portfolio-light-desktop.png'),
    ('studio', '/images/studio-home-light-desktop.png'),
    ('admin', '/images/admin-light-desktop.png'),
    ('identity-sso', '/images/auth-security-light-desktop.png')
) as assets(slug, image_url)
where work.slug = assets.slug
  and work.image_url is distinct from assets.image_url;
