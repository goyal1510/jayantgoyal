# FairShare

Collaborative expense splitting platform with real-time sync.

**Status**: In Development

## Vision

A modern Splitwise alternative - group expense splitting with real-time updates, smart settlements, and spending analytics.

## Core Features (Planned)

- **Groups** - Create/join expense groups with roommates, couples, travel buddies
- **Expenses** - Add expenses with flexible split methods (equal, exact, percentage)
- **Real-time** - Instant balance updates when anyone adds an expense
- **Settlements** - Smart suggestions to minimize transactions needed
- **Analytics** - Personal and group spending insights

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Radix UI |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Real-time | Supabase Realtime WebSockets |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

## Planned Routes

```
/                     → Landing page
/dashboard            → Overview of groups & balances
/groups               → User's groups
/groups/[id]          → Group expenses & balances
/groups/[id]/add      → Add expense
/groups/[id]/settle   → Settlement suggestions
/analytics            → Spending analytics
/budgets              → Personal budgets
```

## Development Phases

1. **Foundation** - Auth, groups, basic expense tracking
2. **Real-time** - Live updates, settlements, notifications
3. **Analytics** - Dashboards, charts, budgeting
4. **Advanced** - Receipt OCR, multi-currency, templates
5. **Growth** - Bank linking (Plaid), in-app payments (Stripe)

## Development

```bash
# Run (from monorepo root)
pnpm dev --filter fairshare
```

## Documentation

See [PLAN.md](./PLAN.md) for full project specification including:
- Database schema
- Feature breakdown by phase
- Key algorithms (balance calculation, settlement minimization)
- Real-time implementation details
