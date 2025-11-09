# Database Migration Instructions

## Issue
The `kv_store_11f03654` table is missing the `user_id` column required for Row Level Security policies.

## Solution
Run the migration SQL to add the `user_id` column and set up proper RLS policies.

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/dkzacgniepkqnzeqgqwo
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `migration-add-user-id-to-kv-store.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (If installed)

```bash
# If you have Supabase CLI installed
supabase db execute -f migration-add-user-id-to-kv-store.sql
```

## What This Migration Does

1. ✅ Adds `user_id` column to `kv_store_11f03654` table
2. ✅ Creates indexes for better query performance
3. ✅ Enables Row Level Security on the table
4. ✅ Creates RLS policies that ensure users can only access their own data:
   - Users can INSERT rows with their own user_id
   - Users can SELECT only their own rows
   - Users can UPDATE only their own rows
   - Users can DELETE only their own rows

## After Migration

Once the migration is complete:
1. The dev server will automatically pick up the changes
2. You should be able to create portfolios without RLS errors
3. Each user's data will be isolated from other users

## Verification

After running the migration, you can verify it worked by:
1. Refreshing your browser at http://localhost:3000
2. Trying to create a new portfolio
3. The RLS error should be gone!
