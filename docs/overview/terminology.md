# Terminology

Consistent vocabulary prevents product, platform, and domain ownership from
drifting.

| Term        | Meaning                                                               |
| ----------- | --------------------------------------------------------------------- |
| Jayant      | The ecosystem and monorepo identity                                   |
| Product     | A user-facing responsibility such as Portfolio, Studio, Admin, Auth   |
| Client      | An implemented delivery surface owned by a product                    |
| Platform    | A delivery technology such as web, iOS, Android, desktop, or CLI      |
| Application | A deployable client workspace; currently synonymous with a web client |
| Package     | A reusable, non-deployable workspace with a stable contract           |
| Contract    | Types, validation, protocol, or behavior shared across a boundary     |
| Integration | An adapter for an external provider                                   |
| Capability  | A business or technical responsibility, whether current or future     |
| Surface     | A route, workflow, or interface exposed by a client                   |

`jayantgoyal.com` and its subdomains are hosts. They do not rename the
ecosystem or create a product called “JayantGoyal Platform.” Existing runtime
values using `platform` are compatibility vocabulary for the shared web
session and should not spread into product naming.

Use `current` only for implemented and operable behavior. Use `future` or
`extension rule` for ownership guidance that intentionally has no code yet.
Never create placeholder directories merely to make a possible capability
look implemented.
