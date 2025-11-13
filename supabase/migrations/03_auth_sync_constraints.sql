/*
# Auth Sync & No-Duplicate Accounts

## 1. Overview
Harden the authentication system to ensure:
- Single source of truth (Supabase Auth)
- One-to-one mapping between auth.users and profiles
- No duplicate accounts
- Proper constraints and indexes

## 2. Schema Changes

### 2.1 Unique Constraints
- UNIQUE constraint on username (case-insensitive)
- Already exists: profiles.id = auth.users.id (one-to-one)

### 2.2 Indexes
- Case-insensitive index on username for fast lookups
- Index on is_active for filtering

## 3. Helper Functions

### 3.1 normalize_username
Normalizes username to lowercase and trims whitespace

### 3.2 get_or_create_profile
Gets existing profile or creates new one (used during auth trigger)
- Prevents duplicate profiles
- Links auth.users to profiles automatically

## 4. Security
- Profiles table already has proper CASCADE delete
- No RLS needed (application-level control)
- Unique constraints prevent duplicates

## 5. Notes
- profiles.id IS the auth.users.id (direct reference)
- No separate auth_user_id needed (already one-to-one)
- username is the login identifier
- Email format: username@miaoda.com
*/

-- Drop existing unique constraint if it exists (to recreate as case-insensitive)
DROP INDEX IF EXISTS profiles_username_key;

-- Create case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx 
ON profiles (LOWER(TRIM(username)));

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
ON profiles(is_active) 
WHERE is_active = true;

-- Function to normalize username
CREATE OR REPLACE FUNCTION normalize_username(input_username text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN LOWER(TRIM(input_username));
END;
$$;

-- Function to check if username exists (case-insensitive)
CREATE OR REPLACE FUNCTION username_exists(input_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(input_username))
  );
END;
$$;

-- Function to get profile by username (case-insensitive)
CREATE OR REPLACE FUNCTION get_profile_by_username(input_username text)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  role user_role,
  is_active boolean,
  last_login timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.is_active,
    p.last_login,
    p.created_at
  FROM profiles p
  WHERE LOWER(TRIM(p.username)) = LOWER(TRIM(input_username))
  LIMIT 1;
END;
$$;

-- Update the handle_new_user function to prevent duplicates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
  extracted_username text;
  existing_profile_id uuid;
BEGIN
  -- Only proceed if user is confirmed (email verified or auto-confirmed)
  IF NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL THEN
    -- Extract username from email (part before @)
    extracted_username := split_part(NEW.email, '@', 1);
    
    -- Check if profile already exists for this auth user
    SELECT id INTO existing_profile_id
    FROM profiles
    WHERE id = NEW.id;
    
    -- Only create profile if it doesn't exist
    IF existing_profile_id IS NULL THEN
      -- Count existing users to determine role
      SELECT COUNT(*) INTO user_count FROM profiles;
      
      -- Check if username already exists (case-insensitive)
      IF username_exists(extracted_username) THEN
        -- Append random suffix to make it unique
        extracted_username := extracted_username || '_' || substr(md5(random()::text), 1, 6);
      END IF;
      
      -- Insert new profile
      INSERT INTO profiles (id, username, full_name, role, is_active)
      VALUES (
        NEW.id,
        extracted_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', extracted_username),
        CASE WHEN user_count = 0 THEN 'admin'::user_role ELSE 'cashier'::user_role END,
        true
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger (in case function was updated)
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to safely create or link profile
-- Used when admin creates a user through Users page
CREATE OR REPLACE FUNCTION upsert_profile(
  p_auth_user_id uuid,
  p_username text,
  p_full_name text,
  p_role user_role,
  p_is_active boolean DEFAULT true,
  p_discount_limit numeric DEFAULT 0,
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id uuid;
  normalized_username text;
BEGIN
  -- Normalize username
  normalized_username := normalize_username(p_username);
  
  -- Check if profile exists for this auth user
  SELECT id INTO profile_id
  FROM profiles
  WHERE id = p_auth_user_id;
  
  IF profile_id IS NOT NULL THEN
    -- Update existing profile
    UPDATE profiles
    SET 
      username = normalized_username,
      full_name = p_full_name,
      role = p_role,
      is_active = p_is_active,
      discount_limit = p_discount_limit
    WHERE id = p_auth_user_id;
    
    RETURN profile_id;
  ELSE
    -- Insert new profile
    INSERT INTO profiles (
      id, 
      username, 
      full_name, 
      role, 
      is_active, 
      discount_limit, 
      created_by
    )
    VALUES (
      p_auth_user_id,
      normalized_username,
      p_full_name,
      p_role,
      p_is_active,
      p_discount_limit,
      p_created_by
    )
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
  END IF;
END;
$$;

-- Add comment to profiles table
COMMENT ON TABLE profiles IS 'User profiles linked one-to-one with auth.users. profiles.id = auth.users.id';
COMMENT ON COLUMN profiles.id IS 'Primary key, references auth.users(id) - one-to-one mapping';
COMMENT ON COLUMN profiles.username IS 'Login identifier, unique (case-insensitive)';
COMMENT ON COLUMN profiles.is_active IS 'User status: true = active, false = blocked';
COMMENT ON COLUMN profiles.last_login IS 'Timestamp of last successful login';
