begin;

update portfolio.hero
set name = 'Jayant',
    display_name = 'Jayant',
    role = 'Software Engineer',
    headline = 'I build complete software products—from product decisions to production systems.',
    blurb = 'I work across product decisions, interfaces, backend systems, data, authentication, and delivery to turn ambiguous requirements into dependable software.',
    tagline = 'Product engineering, end to end.',
    seo_title = 'Jayant | Software Engineer',
    seo_description = 'Jayant is a software engineer who builds complete software products across product decisions, interfaces, application systems, data, security, and delivery.';

update portfolio.section_content
set eyebrow = 'Portfolio / Software Engineer',
    supporting_text = 'Field note / Current'
where section_key = 'hero';

commit;
