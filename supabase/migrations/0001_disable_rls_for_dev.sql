-- TEMPORARY: Disable RLS for development verification
-- Run this in Supabase SQL Editor to allow public access

-- Disable RLS on projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on time_entries table
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;

-- note: In production, you MUST re-enable RLS and implement proper Auth!
