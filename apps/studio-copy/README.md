# Studio

Public product discovery plus account-backed tools, games, and productivity
workspaces.

**Production:** [studio.jayantgoyal.com](https://studio.jayantgoyal.com)
**Package/filter:** `studio`
**Local port:** `3001`

## Product surfaces

| Feature                           | Route               | Access                          |
| --------------------------------- | ------------------- | ------------------------------- |
| Studio home and featured products | `/`                 | Public                          |
| Product catalog                   | `/products`         | Public                          |
| Product details                   | `/products/[slug]`  | Public                          |
| Developer Tools                   | `/tools`            | Public                          |
| Weather                           | `/weather`          | Public                          |
| GitHub Stats                      | `/github-stats`     | Public                          |
| Games                             | `/games`            | Public and account-backed modes |
| Activity Tracker                  | `/activity-tracker` | Account-backed                  |
| Calculator                        | `/calculator`       | Account-backed                  |
| File Manager                      | `/files`            | Account-backed                  |
| Messenger                         | `/messenger`        | Account-backed                  |

Professional content, Blog, Resume, and Contact belong to the independent
Portfolio application. Historical Studio-side paths redirect to the canonical
Portfolio origin.

## Development

```bash
pnpm --filter studio dev
pnpm --filter studio check-types
pnpm --filter studio lint
pnpm --filter studio build
```

See `.env.example` for the required Studio variable names.
