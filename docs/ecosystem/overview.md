# Ecosystem overview

**Jayant** is the identity of this product ecosystem and repository.
`jayantgoyal.com` is its primary public domain. It is not the platform name.

The monorepo currently contains four products with one web client each:

| Product   | Audience                 | Responsibility                                                   |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| Portfolio | Public                   | Professional identity, work, writing, resume, and contact        |
| Studio    | Public and authenticated | Product discovery, tools, games, and personal workspaces         |
| Admin     | Admins                   | Portfolio content, account roles, and deployment operations      |
| Auth      | Account holders          | Sign-in, recovery, MFA, profile, providers, and account security |

Supabase provides Auth, Postgres, Realtime, and Storage. Vercel deploys each
web client independently from the same repository. pnpm workspaces and
Turborepo coordinate packages, validation, and builds.

The architecture is product-first: the product owns its clients, business
rules, and contracts. A platform label describes a delivery technology such as
web; it is not a replacement name for the ecosystem. Shared packages exist only
for stable responsibilities used across products.

Current product routes and feature registries remain more precise than prose.
The important sources are linked from each product document.
