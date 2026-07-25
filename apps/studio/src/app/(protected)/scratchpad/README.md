# Sync Scratchpad

Real-time chat application with instant entry synchronization.

**Live**: [studio.jayantgoyal.com/scratchpad](https://studio.jayantgoyal.com/scratchpad)

## Features

- Real-time messaging with Supabase Realtime subscriptions
- Instant sync across multiple tabs/devices
- Entry history persistence
- Optimistic UI updates
- Auto-scroll to latest entries

## Tech Stack

- **Supabase Realtime** - WebSocket subscriptions for live updates
- **Supabase Database** - Entry storage and retrieval
- **React 19** - UI rendering
- **Zustand** - Local state management

## How It Works

1. Entries are stored in Supabase `entries` table
2. Client subscribes to `INSERT` events on the table
3. New entries trigger instant UI updates via subscription callback
4. Optimistic updates show entry immediately before server confirms

## Files

```
src/
├── app/(protected)/scratchpad/
│   ├── page.tsx          # Server component entry
│   └── client.tsx        # Client component with chat UI
├── components/scratchpad/
│   └── entry-list.tsx  # Entry rendering
├── lib/scratchpad/
│   └── database.types.ts # TypeScript types
└── app/api/scratchpad/    # API routes
```

## Database Schema

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);
```
