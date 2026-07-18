-- Keep future Portfolio CMS rows aligned with the repository-wide UUID contract.

alter table portfolio.section_content
  alter column id set default jg_app.uuid_v7();
