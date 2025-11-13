/*
# Complete User Profile System

## Purpose
Implement complete user profile management system with activity tracking,
branch management, and multi-language support.

## Changes
1. user_profiles table - User profile data
2. user_activity table - Activity audit log
3. Auto-create profile trigger
4. RLS policies for security
5. RPC functions for profile operations

## Notes
- All UI text in Uzbek
- Language options: uz (Uzbek), ru (Russian), en (English)
- Activity log is append-only for audit purposes
*/

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL DEFAULT '',
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'uz',
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON public.user_profiles(user_id);

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.user_profiles(user_id, fullname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'fullname', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auth_user_profile ON auth.users;
CREATE TRIGGER trg_auth_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.ensure_profile();

-- 3. RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Read own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_profiles' AND policyname='profile_read_own'
  ) THEN
    CREATE POLICY profile_read_own ON public.user_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Update own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_profiles' AND policyname='profile_update_own'
  ) THEN
    CREATE POLICY profile_update_own ON public.user_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Admins can read all profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_profiles' AND policyname='profile_admin_read_all'
  ) THEN
    CREATE POLICY profile_admin_read_all ON public.user_profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND 'admin' = ANY(user_roles)
        )
      );
  END IF;
END $$;

-- 4. Activity Log Table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON public.user_activity(created_at DESC);

-- 5. RLS for user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Read own activity
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_activity' AND policyname='activity_read_own'
  ) THEN
    CREATE POLICY activity_read_own ON public.user_activity
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Insert own activity
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_activity' AND policyname='activity_insert_own'
  ) THEN
    CREATE POLICY activity_insert_own ON public.user_activity
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Admins can read all activity
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_activity' AND policyname='activity_admin_read_all'
  ) THEN
    CREATE POLICY activity_admin_read_all ON public.user_activity
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND 'admin' = ANY(user_roles)
        )
      );
  END IF;
END $$;

-- 6. RPC Functions

-- Get current user profile
CREATE OR REPLACE FUNCTION public.profile_get_current()
RETURNS JSON LANGUAGE sql SECURITY DEFINER AS $$
  SELECT to_jsonb(p) FROM public.user_profiles p WHERE p.user_id = auth.uid();
$$;

-- Update profile
CREATE OR REPLACE FUNCTION public.profile_update(
  _fullname TEXT,
  _phone TEXT,
  _language TEXT,
  _branch UUID
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  rec public.user_profiles;
BEGIN
  UPDATE public.user_profiles
  SET fullname = COALESCE(_fullname, fullname),
      phone    = COALESCE(_phone, phone),
      language = COALESCE(_language, language),
      branch_id= COALESCE(_branch, branch_id),
      updated_at = NOW()
  WHERE user_id = auth.uid()
  RETURNING * INTO rec;
  
  RETURN to_json(rec);
END $$;

-- Change password (placeholder - actual implementation in app layer)
CREATE OR REPLACE FUNCTION public.profile_change_password(
  old_pass TEXT,
  new_pass TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Use Supabase GoTrue admin API: bind to server-side function in app layer
  -- Here, only contract placeholder.
  RAISE NOTICE 'Change password in app layer for user %', auth.uid();
END $$;

-- Get activity list
CREATE OR REPLACE FUNCTION public.profile_activity_list(
  limit_rows INT DEFAULT 20
)
RETURNS SETOF public.user_activity LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM public.user_activity 
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC 
  LIMIT limit_rows;
$$;

-- Helper function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  _action TEXT,
  _payload JSONB DEFAULT NULL
)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  activity_id BIGINT;
BEGIN
  INSERT INTO public.user_activity (user_id, action, payload)
  VALUES (auth.uid(), _action, _payload)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END $$;

-- 7. Sync existing profiles from auth.users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN SELECT id FROM auth.users LOOP
    INSERT INTO public.user_profiles (user_id, fullname)
    VALUES (auth_user.id, '')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- 8. Grant permissions
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT ON public.user_activity TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_activity_id_seq TO authenticated;

-- 9. Comments
COMMENT ON TABLE public.user_profiles IS 'User profile data with language and branch preferences';
COMMENT ON TABLE public.user_activity IS 'User activity audit log (append-only)';
COMMENT ON FUNCTION public.profile_get_current() IS 'Get current authenticated user profile';
COMMENT ON FUNCTION public.profile_update(TEXT, TEXT, TEXT, UUID) IS 'Update current user profile';
COMMENT ON FUNCTION public.profile_activity_list(INT) IS 'Get user activity log (last N records)';
COMMENT ON FUNCTION public.log_activity(TEXT, JSONB) IS 'Log user activity';
