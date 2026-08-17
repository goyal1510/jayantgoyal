# Product suite

Jayant is the public person and author identity. `jayantgoyal` is the technical
repository slug, `jayantgoyal.com` is the primary domain, and `jg` is the short
visual mark. None of those technical identifiers creates an umbrella product
name.

The monorepo currently contains four implemented products with one web client
each, plus one defined product that has no implemented client or runtime:

| Product   | Status      | Audience                  | Responsibility                                                   |
| --------- | ----------- | ------------------------- | ---------------------------------------------------------------- |
| Portfolio | Implemented | Public                    | Professional identity, work, writing, resume, and contact        |
| Studio    | Implemented | Public and authenticated  | Product discovery, tools, games, and personal workspaces         |
| Admin     | Implemented | Admins                    | Portfolio content, account roles, and deployment operations      |
| Auth      | Implemented | Account holders           | Sign-in, recovery, MFA, profile, providers, and account security |
| Shaamil   | Defined     | Invited community members | Private operator-owned communication and communities             |

Supabase provides Auth, Postgres, Realtime, and Storage. Vercel deploys each
web client independently from the same repository. pnpm workspaces and
Turborepo coordinate packages, validation, and builds.

Shaamil is mobile-first and will use the existing Supabase Auth identity. The
approved IAM/Studio/Portfolio schema normalization is its backend prerequisite.
No Shaamil workspace, database schema, Storage bucket, Edge Function, host, or
distribution configuration exists yet. Its defined boundary and recommended
first implementation constraints live in the [Shaamil product
page](../products/shaamil/README.md).

The architecture is product-first: the product owns its clients, business
rules, and contracts. A platform label describes a delivery technology such as
web; it is not a replacement name for the repository. Shared packages exist only
for stable responsibilities used across products.

Current product routes and feature registries remain more precise than prose.
The important sources are linked from each product document.
