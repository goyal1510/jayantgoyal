# Technology catalog

This catalog describes the current implementation, not an approved list for
every future client.

| Layer                 | Current technology                                          |
| --------------------- | ----------------------------------------------------------- |
| Monorepo              | pnpm workspaces, Turborepo                                  |
| Web runtime           | Next.js 16, React 19                                        |
| Language              | TypeScript 5.9 in strict mode                               |
| Styling               | Tailwind CSS v4, product CSS, Radix UI, CVA                 |
| State and interaction | React state, Zustand persistence, Framer Motion             |
| Data and identity     | Supabase Auth, Postgres, Realtime, Storage, SSR clients     |
| Content               | Supabase Portfolio/Writing, React Markdown, Remark GFM      |
| Testing               | Vitest, strict type checks, ESLint, structural Node scripts |
| Deployment            | Four independent Vercel projects from one Git repository    |
| Providers             | GitHub, Resend, Google, OpenWeather, Vercel                 |

Client-specific libraries include chess.js, React DnD, Recharts, jsPDF,
syntax highlighting, activity calendars, Sonner, and next-themes. Check the
owning workspace manifest before relying on a library.

Future native or backend clients may use different technologies. Select them
from product requirements and keep their platform assumptions inside the
owning client; do not distort web packages into universal abstractions.
