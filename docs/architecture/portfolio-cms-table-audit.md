# Portfolio CMS Table Audit

## Verdict

The current entity boundaries are appropriate for the redesigned Portfolio. No
active editorial column is unused, and no current table should be removed or
split merely for normalization. The main weakness was database enforcement:
several operational columns were nullable despite application assumptions,
simple string lists were stored as unvalidated JSON, and compile-time section
keys were not fully protected in the database.

The audit therefore keeps the content model intact and hardens its integrity.
The Admin redesign can build on this contract without carrying dashboard-era
fields or inventing speculative content.

## Evidence

The audit covered the linked `jayantgoyal` Supabase project
(`orwfvyditlguqvxvztkw`), the Portfolio server queries and render paths, and all
Admin Portfolio and Blog editors.

- 11 active tables in the `portfolio` schema and `jg_app.blog_posts`
- 1 hero, 1 about record, and 1 contact record
- 3 education entries and 4 experience entries
- 5 skill categories and 30 skills
- 9 projects and 5 credentials
- 6 navigation items and 13 canonical section-copy records
- 3 published Blog posts
- No unexpected nulls, blank required values, malformed slugs, invalid array
  shapes, orphaned skills, duplicate or gapped sort positions, hidden legacy
  rows, or missing timestamps
- Every current editorial field has a Portfolio consumer; fields that look
  similar have separate jobs (for example full name versus wordmark, general
  role versus current title, and certificate document versus verifier URL)

## Table decisions

| Table                        | Purpose                                                  | Decision                                                                       |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `portfolio.hero`             | Public identity, hero copy, resume, GitHub, and SEO      | Keep as the required identity singleton                                        |
| `portfolio.about`            | About narrative, facts, story, and principles            | Keep as the required narrative singleton                                       |
| `portfolio.contact`          | Contact destination, location, and social links          | Keep as the required contact singleton                                         |
| `portfolio.education`        | Ordered education timeline                               | Keep                                                                           |
| `portfolio.experience`       | Ordered experience timeline and outcomes                 | Keep                                                                           |
| `portfolio.skill_categories` | Capability-group headings and descriptions               | Keep normalized parent table                                                   |
| `portfolio.skills`           | Skills, proficiency, and evidence                        | Keep normalized child table                                                    |
| `portfolio.projects`         | Ordered project stories and media                        | Keep                                                                           |
| `portfolio.certificates`     | Credential metadata, preview, document, and verification | Keep; the URLs serve distinct UI actions                                       |
| `portfolio.nav_items`        | Ordered labels and mobile-menu notes                     | Keep as the editable navigation subset                                         |
| `portfolio.section_content`  | Canonical section and subpage interface copy             | Keep; it avoids hardcoded Portfolio headings                                   |
| `jg_app.blog_posts`          | Blog content and publishing state                        | Keep in `jg_app`; it is a public product-content table, not a profile fragment |

## Changes made from the audit

Migrations `20260719120000_harden_portfolio_cms_integrity.sql` and
`20260719123000_centralize_cms_array_validator.sql`:

1. Uses `jg_app.uuid_v7()` for all future Portfolio primary keys.
2. Makes timestamps, visibility flags, and sort positions non-null wherever the
   applications already assume a value.
3. Converts `about.story`, `experience.bullets`, and `projects.tags` from JSONB
   to native `text[]` while preserving order and content.
4. Validates nonblank array items and the exact object shapes used by personal
   facts, principles, and social links.
5. Rejects blank required copy, negative sort positions, malformed slugs,
   unsupported proficiency values, and published Blog posts without content or
   a publication timestamp.
6. Locks section and navigation keys to the canonical keys compiled into the
   Portfolio and links navigation records to their section-copy records.
7. Prevents publicly visible navigation or skills from outliving a hidden
   owning section or skill category.
8. Removes redundant Blog-slug and skill-category indexes and simplifies the
   project-slug unique index now that slugs are required.
9. Keeps the shared primitive-array validator in `jg_app`, preserving a
   one-directional schema dependency (`portfolio` → `jg_app`) for clean schema
   restoration.

## Deliberately not added

- Numeric skill percentages, featured flags, decorative icons/colors, duplicate
  media keys, project status fields, and other retired dashboard-era metadata.
- Separate tables for About facts, principles, or social links. These are small,
  ordered collections owned by a singleton and are simpler to edit atomically.
- Structured start/end dates for education and experience. Their public periods
  are editorial labels and their order is explicitly managed.
- Unique sort-order constraints. They would make ordinary one-record-at-a-time
  reordering fail during swaps; the Admin redesign should provide an atomic
  reorder operation instead.
- A partial media-assets inventory or nullable `asset_id` columns. The Admin
  redesign should introduce a complete media library with replacement and
  deletion semantics rather than create a URL-plus-ID half-contract.
- Generic revisions or approval workflow. The current personal CMS is direct
  publish; preview/revision history should be introduced only with a designed
  Admin publishing experience.

## Admin UI follow-up

The schema is ready for an Admin redesign. The next phase should focus on a
Portfolio-specific editorial workspace rather than generic CRUD cards:

- a content-health overview mapped to the public Portfolio order;
- clear singleton editors for Identity, About, and Contact;
- drag-and-drop, transaction-backed ordering for timelines, skills, projects,
  credentials, and navigation;
- dedicated narrative editors and accurate public-page previews;
- a complete media library with usage tracking and safe replacement/deletion;
- explicit draft, visibility, and publication states where they are meaningful;
- field labels that explain similar-but-distinct values such as `role`,
  `current_title`, `name`, and `display_name`.
