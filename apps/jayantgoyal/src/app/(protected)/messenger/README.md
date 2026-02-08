# Messenger

Real-time chat application with instant message synchronization.

**Live**: [jayantgoyal.com/messenger](https://jayantgoyal.com/messenger)

## Features

- Real-time messaging with Supabase Realtime subscriptions
- Instant sync across multiple tabs/devices
- Message history persistence
- Optimistic UI updates
- Auto-scroll to latest messages

## Tech Stack

- **Supabase Realtime** - WebSocket subscriptions for live updates
- **Supabase Database** - Message storage and retrieval
- **React 19** - UI rendering
- **Zustand** - Local state management

## How It Works

1. Messages are stored in Supabase `messages` table
2. Client subscribes to `INSERT` events on the table
3. New messages trigger instant UI updates via subscription callback
4. Optimistic updates show message immediately before server confirms

## Files

```
src/
├── app/(protected)/messenger/
│   ├── page.tsx          # Server component entry
│   └── client.tsx        # Client component with chat UI
├── components/messenger/
│   └── message-list.tsx  # Message rendering
├── lib/messenger/
│   └── database.types.ts # TypeScript types
└── app/api/messenger/    # API routes
```

## Database Schema

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);
```
