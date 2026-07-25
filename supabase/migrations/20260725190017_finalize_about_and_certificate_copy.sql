begin;

update portfolio.about
set objective = 'I am a software engineer with full-stack capability, working across product thinking, interface craft, APIs, data, and delivery. I care about building useful systems that remain clear as they grow.';

update portfolio.certificates
set image_alt = replace(image_alt, 'Jayant Goyal', 'Jayant')
where image_alt like '%Jayant Goyal%';

commit;
