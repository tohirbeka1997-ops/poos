/*
# Add User Management Fields

## 1. Overview
Add additional fields to profiles table for user management:
- last_login: Track when user last logged in
- created_by: Track who created this user
- discount_limit: Maximum discount percentage for cashiers

## 2. Changes
- Add last_login column (timestamptz)
- Add created_by column (uuid, references profiles)
- Add discount_limit column (numeric, default 0)

## 3. Security
- No RLS changes needed (already managed at application level)
- Fields are nullable for backward compatibility
*/

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_limit numeric(5,2) DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON profiles(created_by);

-- Create function to update last_login
CREATE OR REPLACE FUNCTION update_last_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_login = now()
  WHERE id = user_id;
END;
$$;
