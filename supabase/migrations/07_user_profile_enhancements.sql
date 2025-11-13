/*
# User Profile Enhancements

## Purpose
Add support for user profile management with activity logging and branch management.

## Changes

### 1. New Tables

#### branches
- `id` (uuid, primary key)
- `name` (text, not null) - Branch name
- `address` (text) - Branch address
- `phone` (text) - Branch contact phone
- `is_active` (boolean, default true) - Active status
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

#### activity_logs
- `id` (uuid, primary key)
- `user_id` (uuid, references profiles.id) - User who performed the action
- `action_type` (text, not null) - Type of action (login, logout, password_change, etc.)
- `action_description` (text) - Human-readable description
- `created_at` (timestamptz, default now())

### 2. Profile Enhancements
- Add `branch_id` (uuid, references branches.id) - User's assigned branch
- Add `language` (text, default 'uz') - User's preferred language

### 3. Security
- Enable RLS on branches table
- Enable RLS on activity_logs table
- Users can view their own activity logs
- All users can view active branches
- Only admins can manage branches

### 4. Helper Functions
- `check_branch_access` - Check if user has access to a branch
- `log_user_activity` - Helper function to log user activities

## Notes
- Activity logs are append-only for audit purposes
- Branches can be soft-deleted by setting is_active = false
- Language options: 'uz' (Uzbek), 'ru' (Russian), 'en' (English)
*/

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add branch_id and language to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'uz' NOT NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches

-- All authenticated users can view active branches
CREATE POLICY "Users can view active branches"
  ON branches FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Only admins can insert branches
CREATE POLICY "Admins can insert branches"
  ON branches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(user_roles)
    )
  );

-- Only admins can update branches
CREATE POLICY "Admins can update branches"
  ON branches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(user_roles)
    )
  );

-- Only admins can delete branches
CREATE POLICY "Admins can delete branches"
  ON branches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(user_roles)
    )
  );

-- RLS Policies for activity_logs

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND 'admin' = ANY(user_roles)
    )
  );

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Helper function to check branch access
CREATE OR REPLACE FUNCTION check_branch_access(
  p_user_id UUID,
  p_branch_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_roles TEXT[];
  v_branch_active BOOLEAN;
BEGIN
  -- Get user roles
  SELECT user_roles INTO v_user_roles
  FROM profiles
  WHERE id = p_user_id;

  -- Check if branch is active
  SELECT is_active INTO v_branch_active
  FROM branches
  WHERE id = p_branch_id;

  -- Admins have access to all branches
  IF 'admin' = ANY(v_user_roles) THEN
    RETURN TRUE;
  END IF;

  -- Branch must be active
  IF NOT v_branch_active THEN
    RETURN FALSE;
  END IF;

  -- For now, all users have access to active branches
  -- This can be extended with branch-specific permissions
  RETURN TRUE;
END;
$$;

-- Helper function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action_type, action_description)
  VALUES (p_user_id, p_action_type, p_action_description)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Insert default branch if none exists
INSERT INTO branches (name, address, phone, is_active)
SELECT 'Asosiy filial', 'Toshkent, O''zbekiston', '+998901234567', TRUE
WHERE NOT EXISTS (SELECT 1 FROM branches LIMIT 1);

-- Add trigger to update updated_at on branches
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON branches TO authenticated;
GRANT SELECT, INSERT ON activity_logs TO authenticated;

-- Comment on tables
COMMENT ON TABLE branches IS 'Store branches/locations for multi-branch support';
COMMENT ON TABLE activity_logs IS 'User activity audit log for security and tracking';
COMMENT ON COLUMN profiles.branch_id IS 'User assigned branch/location';
COMMENT ON COLUMN profiles.language IS 'User preferred interface language (uz, ru, en)';
