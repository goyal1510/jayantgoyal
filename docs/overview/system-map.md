# System map

Jayant is one monorepo containing four implemented products and the defined
Shaamil product. Each product owns its clients and policies; shared packages
own only stable cross-product contracts.

```text
Public users ──► Portfolio web ────────────► portfolio data
       │
       └───────► Studio web ───────────────► studio + IAM-authorized data

Account holders ─► Auth web ───────────────► Supabase Auth + iam
                          │
                          └── shared web session ─► Studio / Admin

Authorized operators ─► Admin web ─────────► Portfolio CMS, IAM, Vercel

All web clients ─► shared web identity, URLs, auth, SEO, UI, and styling
Selected clients ─► GitHub, Resend, Google, OpenWeather, and Vercel providers
GitHub main ──────► Vercel projects ───────► independent production hosts
```

## Product and client matrix

| Product   | Current client | Primary audience           | Main responsibility                    |
| --------- | -------------- | -------------------------- | -------------------------------------- |
| Portfolio | Web            | Public                     | Professional and editorial presence    |
| Studio    | Web            | Public and account holders | Products, utilities, games, workspaces |
| Admin     | Web            | Authorized operators       | Content, access, deployment operations |
| Auth      | Web            | Account holders            | Entry, recovery, MFA, account security |

Web is the only implemented client platform. Mobile, desktop, command-line,
commerce, subscription, sales, and advertising clients/modules do not
currently exist.

## Defined product boundary

Shaamil is an approved mobile-first communication product but is not part of
the runtime diagram because no client or backend objects exist. When its first
milestone begins, it remains in this monorepo, uses the existing Supabase Auth
identity and project, and receives product-owned data rather than extending
`studio` or `iam` with communication-specific tables. The IAM/Studio/Portfolio
normalization is already deployed.
See [Shaamil](../products/shaamil/README.md) and [Database schema ownership and
evolution](../shared-systems/data/schema-ownership.md).

## Authority order

Use the most specific source when facts differ:

1. Runtime behavior, migrations, schema snapshots, and tests.
2. Package manifests, route trees, registries, and `.env.example` contracts.
3. Product and shared-system documentation.
4. Overview and reference summaries.

The summaries are navigation aids, not duplicate runtime registries. Product
documents link to their canonical inventories when counts or route sets change
frequently.
