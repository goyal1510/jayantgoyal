# Ownership matrix

| Responsibility                           | Owner               | Canonical source                                     |
| ---------------------------------------- | ------------------- | ---------------------------------------------------- |
| Public professional experience           | Portfolio web       | Portfolio routes and editorial loaders               |
| Product/tool/game inventory              | Studio web          | Studio inventory, surface, game, and tool registries |
| Portfolio and Writing administration     | Admin web           | Admin workspaces and authorized APIs                 |
| Entry, recovery, MFA, account security   | Auth web            | Auth routes/actions and `@jayantgoyal/web-auth`      |
| Private communication product definition | Shaamil             | `docs/products/shaamil/README.md`                    |
| Product-neutral identity                 | Foundation package  | `@jayantgoyal/identity`                              |
| Web naming and metadata                  | Web brand package   | `@jayantgoyal/web-brand`                             |
| Canonical application origins            | Web URL package     | `@jayantgoyal/web-urls`                              |
| Shared web sessions                      | Web auth package    | `@jayantgoyal/web-auth`                              |
| Cross-product identity and access target | IAM domain          | `docs/shared-systems/data/schema-ownership.md`       |
| Portfolio CMS contract                   | Portfolio product   | `@jayantgoyal/portfolio-contracts`                   |
| GitHub provider logic                    | Integration package | `@jayantgoyal/github`                                |
| Database current state                   | Supabase directory  | `supabase/migrations` and `supabase/schemas`         |
| Database schema evolution contract       | Shared data docs    | `docs/shared-systems/data/schema-ownership.md`       |
| Web favicon source                       | Root brand assets   | `assets/brand/web`                                   |
| Quality policy                           | Root tooling        | Scripts, package commands, CI, engineering docs      |
| Detailed documentation                   | Central docs tree   | `docs/README.md`                                     |

If ownership is unclear, keep code in the narrowest current consumer and
document the boundary before extracting it. Administrative access to another
product's data does not transfer domain ownership to Admin.
