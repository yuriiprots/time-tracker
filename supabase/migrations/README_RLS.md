# Enabling Row Level Security (RLS)

## Overview
This migration enables Row Level Security on the `projects` and `time_entries` tables to ensure users can only access their own data.

## How to Apply

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're logged in to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/0001_enable_rls.sql`
4. Paste and run the SQL

## What This Migration Does

1. **Enables RLS** on both `projects` and `time_entries` tables
2. **Creates policies** that ensure:
   - Users can only SELECT their own data
   - Users can only INSERT data with their own user_id
   - Users can only UPDATE their own data
   - Users can only DELETE their own data

## Security Model

With RLS enabled:
- `auth.uid()` automatically gets the authenticated user's ID from the session
- All database queries are automatically filtered by `user_id`
- Users cannot access or modify other users' data
- No changes needed in application code - Supabase handles it automatically

## Testing RLS

After applying the migration:
1. Register a new user account
2. Create some projects and time entries
3. Sign out and register a different user
4. Verify you cannot see the first user's data
5. Create new data and verify it's isolated

## Rollback (if needed)

To disable RLS (not recommended for production):
```sql
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
```
