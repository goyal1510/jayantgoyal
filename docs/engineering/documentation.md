# Documentation governance

The `docs/` tree is the only maintained detailed documentation system. Root
`README.md` is the concise repository entry point and root `AGENTS.md` is the
working contract. Detailed app-local READMEs are intentionally not maintained.

## Information architecture

| Area             | Question answered                                           |
| ---------------- | ----------------------------------------------------------- |
| `overview`       | What is the product suite and how does it fit together?     |
| `architecture`   | Where does code/data belong and how may it depend?          |
| `products`       | What does each product own and expose?                      |
| `clients`        | Which delivery platforms exist and what does a client own?  |
| `shared-systems` | How do cross-product responsibilities behave?               |
| `engineering`    | How is the repository developed, tested, and maintained?    |
| `operations`     | How is the system secured, deployed, and operated?          |
| `reference`      | What are the exact commands, hosts, packages, and mappings? |

Use product subdirectories under `docs/products`, not READMEs inside
`apps/*`. If a product grows, add focused pages beside its central README.

## Depth standard

Centralized does not mean compressed. Documentation is deep enough when a
maintainer can answer, without reading the entire codebase:

- what the product/capability owns and explicitly does not own;
- every current page/API surface and its access class;
- the request path from client through auth/data/provider and back;
- current tables, buckets, contracts, packages, and environment inputs;
- security, failure, cache, and degraded behavior;
- where a new change belongs and which synchronized sources must change;
- how to build, deploy, verify, troubleshoot, and safely roll back it.

Use overview pages for orientation, focused pages for runtime behavior, and
reference pages for exhaustive catalogs. Do not repeat exact inventories in
multiple summaries; link to one detailed owner and keep it verifiable against
the repository.

## Update contract

Update documentation in the same change when modifying product ownership,
routes or major surfaces, packages, data schemas, auth/security policy,
environment contracts, deployment, operational commands, or quality gates.
Link to canonical code instead of copying rapidly changing inventories.

Documentation must describe current behavior. Future guidance is allowed only
when clearly labeled as an extension rule and must not claim placeholder code
exists. Do not create session entries, progress reports, completed plan files,
architecture history, decision ledgers, or test-evidence archives.

`pnpm check:docs` verifies the required central structure, required semantic
sections, relative links, index reachability, prohibited historical-log paths,
absence of detailed web-client READMEs, and coverage of every current web
route, workspace, environment variable, and canonical schema table.

## What documentation must not become

Do not paste implementation line by line, duplicate secrets/configuration
values, claim generated counts without a canonical inventory, or preserve
chronology. Comments and types remain closer to low-level code behavior. Git
stores history. Docs explain the current system and its operating contract.
