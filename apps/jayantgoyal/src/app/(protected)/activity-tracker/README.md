# Activity Tracker

Daily activity tracking with analytics and progress visualization.

**Live**: [jayantgoyal.com/activity-tracker](https://jayantgoyal.com/activity-tracker)

## Features

- Create custom activity categories
- Log daily entries with notes
- Monthly calendar view
- Streak tracking
- Analytics dashboard with charts
- Progress statistics

## Tech Stack

- **Supabase Database** - Activity and entry storage
- **Recharts** - Data visualization
- **Zustand** - Local state management
- **Date utilities** - Custom date helpers

## How It Works

1. Users create activity categories (Exercise, Reading, etc.)
2. Daily entries logged against activities
3. Calendar displays activity completion per day
4. Dashboard aggregates data into charts and stats

## Files

```
src/
├── app/(protected)/activity-tracker/
│   ├── page.tsx              # Landing/dashboard
│   └── tracker/
│       ├── page.tsx          # Tracker view
│       └── client.tsx        # Tracking UI
├── lib/activity-tracker/
│   ├── database.ts           # DB operations
│   └── date.ts               # Date utilities
└── app/api/activity-tracker/
    ├── route.ts              # CRUD activities
    ├── [id]/route.ts         # Single activity
    ├── entries/route.ts      # Log entries
    └── stats/route.ts        # Analytics data
```

## Database Schema

```sql
create table activities (
  id uuid primary key,
  user_id uuid references auth.users(id),
  name text not null,
  color text,
  created_at timestamptz
);

create table activity_entries (
  id uuid primary key,
  activity_id uuid references activities(id),
  date date not null,
  notes text,
  created_at timestamptz
);
```
