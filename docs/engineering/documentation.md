# Documentation governance

The `docs/` tree is the only maintained detailed documentation system. Root
`README.md` is the concise repository entry point and root `AGENTS.md` is the
working contract. Detailed app-local READMEs are intentionally not maintained.

## Information architecture

| Area             | Question answered                                           |
| ---------------- | ----------------------------------------------------------- |
| `overview`       | What is the ecosystem and how does it fit together?         |
| `architecture`   | Where does code/data belong and how may it depend?          |
| `products`       | What does each product own and expose?                      |
| `clients`        | Which delivery platforms exist and what does a client own?  |
| `shared-systems` | How do cross-product responsibilities behave?               |
| `engineering`    | How is the repository developed, tested, and maintained?    |
| `operations`     | How is the system secured, deployed, and operated?          |
| `reference`      | What are the exact commands, hosts, packages, and mappings? |

Use product subdirectories under `docs/products`, not READMEs inside
`apps/*`. If a product grows, add focused pages beside its central README.

## Update contract

Update documentation in the same change when modifying product ownership,
routes or major surfaces, packages, data schemas, auth/security policy,
environment contracts, deployment, operational commands, or quality gates.
Link to canonical code instead of copying rapidly changing inventories.

Documentation must describe current behavior. Future guidance is allowed only
when clearly labeled as an extension rule and must not claim placeholder code
exists. Do not create session entries, progress reports, completed plan files,
architecture history, decision ledgers, or test-evidence archives.

`pnpm check:docs` verifies the required central structure, relative links,
index reachability, prohibited historical-log paths, and absence of detailed
web-client READMEs.
