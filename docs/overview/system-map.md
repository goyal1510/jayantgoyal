# System map

Jayant is one monorepo containing four products. Each product owns its clients
and policies; shared packages own only stable cross-product contracts.

```text
Public users ──► Portfolio web ────────────► portfolio + jg_app data
       │
       └───────► Studio web ───────────────► jg_app + jg_account data

Account holders ─► Auth web ───────────────► Supabase Auth + jg_account
                          │
                          └── shared web session ─► Studio / Admin

Administrators ─► Admin web ───────────────► Portfolio CMS, users, Vercel

All web clients ─► shared web identity, URLs, auth, SEO, UI, and styling
Selected clients ─► GitHub, Resend, Google, OpenWeather, and Vercel providers
GitHub main ──────► Vercel projects ───────► independent production hosts
```

## Product and client matrix

| Product   | Current client | Primary audience           | Main responsibility                    |
| --------- | -------------- | -------------------------- | -------------------------------------- |
| Portfolio | Web            | Public                     | Professional and editorial presence    |
| Studio    | Web            | Public and account holders | Products, utilities, games, workspaces |
| Admin     | Web            | Admins and super admins    | Content, users, deployment operations  |
| Auth      | Web            | Account holders            | Entry, recovery, MFA, account security |

Web is the only implemented client platform. Mobile, desktop, command-line,
commerce, sales, and advertising implementations do not currently exist.

## Authority order

Use the most specific source when facts differ:

1. Runtime behavior, migrations, schema snapshots, and tests.
2. Package manifests, route trees, registries, and `.env.example` contracts.
3. Product and shared-system documentation.
4. Overview and reference summaries.

The summaries are navigation aids, not duplicate runtime registries. Product
documents link to their canonical inventories when counts or route sets change
frequently.
