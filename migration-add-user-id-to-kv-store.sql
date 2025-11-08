-- Migration: Add user_id column to kv_store_11f03654 table
-- This migration adds the user_id column and sets up Row Level Security policies

-- Step 1: Add user_id column
ALTER TABLE kv_store_11f03654
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_kv_store_user_id ON kv_store_11f03654(user_id);
CREATE INDEX IF NOT EXISTS idx_kv_store_user_key ON kv_store_11f03654(user_id, key);

-- Step 3: Enable Row Level Security
ALTER TABLE kv_store_11f03654 ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can manage their own KV data" ON kv_store_11f03654;
DROP POLICY IF EXISTS "Users can insert their own KV data" ON kv_store_11f03654;
DROP POLICY IF EXISTS "Users can read their own KV data" ON kv_store_11f03654;
DROP POLICY IF EXISTS "Users can update their own KV data" ON kv_store_11f03654;
DROP POLICY IF EXISTS "Users can delete their own KV data" ON kv_store_11f03654;

-- Step 5: Create RLS policies
CREATE POLICY "Users can insert their own KV data"
ON kv_store_11f03654
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own KV data"
ON kv_store_11f03654
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own KV data"
ON kv_store_11f03654
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own KV data"
ON kv_store_11f03654
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Optional - If you have existing data and want to delete it (uncomment if needed)
-- DELETE FROM kv_store_11f03654 WHERE user_id IS NULL;

-- Step 7: Optional - Make user_id NOT NULL after ensuring all rows have a user_id
-- ALTER TABLE kv_store_11f03654 ALTER COLUMN user_id SET NOT NULL;
