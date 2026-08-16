# Applications, hosts, and ports

| Product   | Workspace               | Path                 | Local origin            | Production origin                |
| --------- | ----------------------- | -------------------- | ----------------------- | -------------------------------- |
| Portfolio | `@jayant/portfolio-web` | `apps/portfolio/web` | `http://localhost:3000` | `https://jayantgoyal.com`        |
| Studio    | `@jayant/studio-web`    | `apps/studio/web`    | `http://localhost:3001` | `https://studio.jayantgoyal.com` |
| Admin     | `@jayant/admin-web`     | `apps/admin/web`     | `http://localhost:3002` | `https://admin.jayantgoyal.com`  |
| Auth      | `@jayant/auth-web`      | `apps/auth/web`      | `http://localhost:3003` | `https://auth.jayantgoyal.com`   |

All are independently deployed Next.js web clients sourced from the same
repository and `main` branch. Their `.env.example`, `turbo.json`, route tree,
proxy, and Vitest configuration are client-owned.

Production origins are constructed through shared brand/URL contracts. Preview
origins may be generated per deployment and must use explicit return-origin
allowlists where authentication crosses hosts.
