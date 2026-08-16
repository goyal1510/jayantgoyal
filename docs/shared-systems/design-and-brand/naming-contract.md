# Naming contract

This contract separates public identity, compact visual branding, technical
namespace, and product names. It applies to code, UI copy, metadata, manifests,
structured data, documentation, assets, and CMS composition.

## Canonical concepts

| Concept         | Value                          | Permitted use                                              |
| --------------- | ------------------------------ | ---------------------------------------------------------- |
| Public person   | `Jayant`                       | UI, author/creator fields, Portfolio, SEO, structured data |
| Official person | `Jayant`                       | Identity records that require the official name            |
| Short mark      | `jg`                           | Favicon and compact visual brand treatment                 |
| Repository      | `jayantgoyal`                  | Git repository and root package name                       |
| Package scope   | `@jayantgoyal/*`               | Every internal workspace package                           |
| Primary domain  | `jayantgoyal.com`              | Canonical Portfolio host and subdomain family              |
| Products        | Portfolio, Studio, Admin, Auth | Product ownership and visible application names            |

`jayantgoyal` is a technical slug. Never split, title-case, or expand it into a
personal full name. There is no umbrella product named after the repository or
domain.

## Source ownership

- `@jayantgoyal/identity` owns the fixed person record, technical identifiers,
  product identities, canonical origins/hosts, and local development origins.
- `@jayantgoyal/web-brand` projects that foundation into descriptions, title
  templates, product labels, social-preview records, and asset paths.
- `@jayantgoyal/web-urls` constructs and validates URLs from the product host
  registry. It does not own another copy of the hosts.
- `@jayantgoyal/web-auth` consumes the same hosts for cookie and Auth-entry
  trust decisions.
- `@jayantgoyal/web-seo` owns complete root, page, article, and manifest
  projections for Next.js clients.
- `assets/brand/web` and `assets/brand/social` contain canonical binary sources;
  deployed app copies are synchronized artifacts checked by the repository.

Application-local `@/*` aliases continue to mean that client's `src/*` tree.
They are not workspace package scopes.

## Product presentation

| Product   | Public presentation                                   | Short application label |
| --------- | ----------------------------------------------------- | ----------------------- |
| Portfolio | `Jayant` or `Jayant Portfolio` where context requires | `Portfolio`             |
| Studio    | `Studio by Jayant`                                    | `Studio`                |
| Admin     | `Admin by Jayant`                                     | `Admin`                 |
| Auth      | `Auth by Jayant`                                      | `Auth`                  |

The person name is not an account-system or workspace umbrella. Prefer “your
account,” “connected applications,” or the explicit product names instead of
phrases such as “Jayant account” or “every Jayant workspace.”

## Portfolio CMS boundary

The Portfolio CMS owns mutable editorial content: role, headline,
introduction, current focus/title, availability, résumé link, GitHub username,
and descriptive SEO copy. Runtime composition injects the fixed name and
derives the title from the fixed identity plus the editorial role.

Legacy database columns for name, display name, and SEO title remain temporarily
for schema compatibility. Admin does not expose them as editable fields, public
queries do not select them, and a new hero row receives fixed compatibility
values on the server. Removing the columns requires a separately reviewed
migration after the deployed runtime is verified.

## Guardrails

Run `pnpm check:identity` after package, naming, host, metadata, or CMS changes.
The check rejects legacy workspace scopes, non-private internal packages,
expanded public names, hardcoded public identity/domain literals in runtime
source, and obsolete identity property names. Applied migrations are immutable
and therefore excluded from retroactive content enforcement.

Run `pnpm check:brand-assets` after changing an icon or social preview. It
validates each public copy and every Next.js special favicon against the
canonical binary sources.
