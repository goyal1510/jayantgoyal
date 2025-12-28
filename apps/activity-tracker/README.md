# Activity Tracker

Supabase-authenticated activity tracking tool for monitoring daily activities with performance KPIs.

## Features
- Create and manage your own custom activities
- Dashboard page showing KPIs and performance metrics
- Checkbox-based tracker for marking daily activity completion
- **Current month by default** - Tracker and dashboard show the current month automatically
- **Month navigation** - Navigate between months to view and track activities across time
- **Activities persist across months** - Once created, activities are available for all months
- Real-time statistics including completion rates and progress bars
- User-specific activity tracking with Supabase authentication
- Delete activities you no longer want to track

## Run locally
From the repo root:
```bash
pnpm dev --filter atrack
```

## Environment
Create `.env.local` in `apps/activity-tracker` (or the repo root) with:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for /api/account/delete
GUEST_EMAIL_LOGIN=...           # optional, powers guest login for demos
GUEST_PASSWORD_LOGIN=...
```

## Supabase setup

### 1. Create Schema
Create a new schema called `activity_tracker` in your Supabase database:

```sql
CREATE SCHEMA IF NOT EXISTS activity_tracker;
```

### 2. Create Tables

#### Activities Table
```sql
CREATE TABLE activity_tracker.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_activities_user_id ON activity_tracker.activities(user_id);
```

#### Activity Entries Table
```sql
CREATE TABLE activity_tracker.activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activity_tracker.activities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, date, user_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_activity_entries_user_id ON activity_tracker.activity_entries(user_id);
CREATE INDEX idx_activity_entries_activity_id ON activity_tracker.activity_entries(activity_id);
CREATE INDEX idx_activity_entries_date ON activity_tracker.activity_entries(date);
CREATE INDEX idx_activity_entries_user_activity_date ON activity_tracker.activity_entries(user_id, activity_id, date);
```

### 3. Enable Row-Level Security (RLS)

#### RLS for Activities Table
```sql
ALTER TABLE activity_tracker.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activities
CREATE POLICY "Users can view their own activities"
  ON activity_tracker.activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert their own activities"
  ON activity_tracker.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activities
CREATE POLICY "Users can update their own activities"
  ON activity_tracker.activities
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON activity_tracker.activities
  FOR DELETE
  USING (auth.uid() = user_id);
```

#### RLS for Activity Entries Table
```sql
ALTER TABLE activity_tracker.activity_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view their own entries"
  ON activity_tracker.activity_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert their own entries"
  ON activity_tracker.activity_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update their own entries"
  ON activity_tracker.activity_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete their own entries"
  ON activity_tracker.activity_entries
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Creating Activities
Users can create their own activities through the UI. No default activities are created automatically. Use the "Add Activity" button on the Tracker page to create new activities.

## Database Schema Summary

### `activity_tracker.activities`
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Activity name (e.g., "a1", "a2")
- `user_id` (UUID, FK → auth.users): Owner of the activity
- `created_at` (TIMESTAMPTZ): Creation timestamp

### `activity_tracker.activity_entries`
- `id` (UUID, PK): Unique identifier
- `activity_id` (UUID, FK → activities): Related activity
- `date` (DATE): Date of the entry (YYYY-MM-DD format)
- `completed` (BOOLEAN): Whether the activity was completed
- `user_id` (UUID, FK → auth.users): Owner of the entry
- `created_at` (TIMESTAMPTZ): Creation timestamp
- Unique constraint on `(activity_id, date, user_id)` to prevent duplicates

## Usage

1. **Login/Signup**: Use the authentication flow to create an account or login
2. **Create Activities**: Click "Add Activity" to create custom activities you want to track
3. **Tracker**: 
   - By default, shows the current month
   - Use the arrow buttons to navigate between months
   - Use checkboxes to mark activities as completed for each day
   - Activities persist across all months - create once, track forever
4. **Dashboard**: 
   - View overall KPIs and individual activity performance metrics
   - Navigate between months to see historical performance
   - Stats automatically update based on the selected month

## How It Works

- **Activities** are user-specific and persist across all months
- **Entries** are month-specific - each month has its own set of completion records
- When you create an activity, it's immediately available for tracking in any month
- Navigate to previous months to see historical data or future months to plan ahead
