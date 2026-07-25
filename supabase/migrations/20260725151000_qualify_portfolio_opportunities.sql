begin;

update portfolio.section_content
set
  eyebrow = 'Opportunities / Product work',
  headline = 'Have a product that needs an owner?',
  description = 'I help startups and product teams turn ambiguous briefs into secure, dependable software across interface, application logic, data, and delivery.',
  supporting_text = 'Tell me what you are building, where it stands, and the outcome you need. A short brief is enough.'
where section_key = 'contact';

commit;
