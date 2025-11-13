/*
# Safe User Delete (Soft-Delete + Auth Sync)

## 1. Overview
Implement safe user deletion with soft-delete pattern:
- Preserve data integrity (FK relationships)
- Maintain audit trail
- Sync with Supabase Auth
- Prevent accidental hard deletes

## 2. Schema Changes

### 2.1 Soft-Delete Fields
- `is_deleted`: Boolean flag for soft-deleted users
- `deleted_at`: Timestamp when user was deleted
- `deleted_by`: Who deleted the user (admin)

### 2.2 Indexes
- Index on active users (is_deleted = false)
- Composite index for username uniqueness among active users

## 3. Constraints

### 3.1 Unique Username (Active Users Only)
- Username must be unique among non-deleted users
- Allows reusing username after soft-delete

### 3.2 Foreign Key Handling
- sales.cashier_id → profiles(id) ON DELETE SET NULL
- cash_shifts.cashier_id → profiles(id) ON DELETE SET NULL
- Preserves historical data

## 4. Functions

### 4.1 soft_delete_user
Safely soft-deletes a user with validation

### 4.2 restore_user
Restores a soft-deleted user

## 5. Security
- Trigger prevents hard delete (raises exception)
- Only soft-delete allowed
- Admin cannot be deleted
- User cannot delete themselves

## 6. Notes
- Hard delete only for developers (manual script)
- UI filters out is_deleted = true by default
- Auth user is blocked/deleted when soft-deleted
*/

-- Add soft-delete columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index on active users (not deleted)
CREATE INDEX IF NOT EXISTS idx_profiles_active 
ON profiles(is_active, is_deleted) 
WHERE is_deleted = false;

-- Create composite index for active username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_active_uidx 
ON profiles (LOWER(TRIM(username))) 
WHERE is_deleted = false;

-- Drop old username unique index (replaced by active-only index)
DROP INDEX IF EXISTS profiles_username_lower_uidx;

-- Update foreign keys to SET NULL on delete (preserve historical data)
-- Note: These are already set in the original schema, but we're documenting them here

-- Function to soft-delete a user
CREATE OR REPLACE FUNCTION soft_delete_user(
  p_user_id uuid,
  p_deleted_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user profiles;
  v_current_user profiles;
  v_result jsonb;
BEGIN
  -- Get user to delete
  SELECT * INTO v_user
  FROM profiles
  WHERE id = p_user_id AND is_deleted = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', '用户不存在或已被删除'
    );
  END IF;
  
  -- Get current user (who is deleting)
  SELECT * INTO v_current_user
  FROM profiles
  WHERE id = p_deleted_by;
  
  -- Guard: Cannot delete yourself
  IF p_user_id = p_deleted_by THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'cannot_delete_self',
      'message', '不能删除自己'
    );
  END IF;
  
  -- Guard: Cannot delete admin
  IF v_user.role = 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'cannot_delete_admin',
      'message', '不能删除管理员'
    );
  END IF;
  
  -- Perform soft delete
  UPDATE profiles
  SET 
    is_deleted = true,
    deleted_at = now(),
    deleted_by = p_deleted_by,
    is_active = false  -- Also block the user
  WHERE id = p_user_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', '用户已删除（登录已被阻止）',
    'user_id', p_user_id,
    'username', v_user.username
  );
END;
$$;

-- Function to restore a soft-deleted user
CREATE OR REPLACE FUNCTION restore_user(
  p_user_id uuid,
  p_restored_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user profiles;
  v_result jsonb;
BEGIN
  -- Get user to restore
  SELECT * INTO v_user
  FROM profiles
  WHERE id = p_user_id AND is_deleted = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', '用户不存在或未被删除'
    );
  END IF;
  
  -- Restore user
  UPDATE profiles
  SET 
    is_deleted = false,
    deleted_at = NULL,
    deleted_by = NULL,
    is_active = true  -- Reactivate the user
  WHERE id = p_user_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', '用户已恢复',
    'user_id', p_user_id,
    'username', v_user.username
  );
END;
$$;

-- Trigger to prevent hard delete (force soft-delete)
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow delete only if already soft-deleted (for cleanup)
  IF OLD.is_deleted = false THEN
    RAISE EXCEPTION 'Hard delete not allowed. Use soft_delete_user() function instead.';
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_prevent_hard_delete ON profiles;
CREATE TRIGGER trigger_prevent_hard_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_hard_delete();

-- Function to check if user can be deleted
CREATE OR REPLACE FUNCTION can_delete_user(
  p_user_id uuid,
  p_current_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user profiles;
  v_sales_count bigint;
  v_shifts_count bigint;
BEGIN
  -- Get user
  SELECT * INTO v_user
  FROM profiles
  WHERE id = p_user_id AND is_deleted = false;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'user_not_found',
      'message', '用户不存在'
    );
  END IF;
  
  -- Check if trying to delete self
  IF p_user_id = p_current_user_id THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'cannot_delete_self',
      'message', '不能删除自己'
    );
  END IF;
  
  -- Check if admin
  IF v_user.role = 'admin' THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'cannot_delete_admin',
      'message', '不能删除管理员'
    );
  END IF;
  
  -- Count related records (for information)
  SELECT COUNT(*) INTO v_sales_count
  FROM sales
  WHERE cashier_id = p_user_id;
  
  SELECT COUNT(*) INTO v_shifts_count
  FROM cash_shifts
  WHERE cashier_id = p_user_id;
  
  -- Can delete (soft-delete will preserve FK relationships)
  RETURN jsonb_build_object(
    'can_delete', true,
    'message', '可以删除',
    'related_sales', v_sales_count,
    'related_shifts', v_shifts_count,
    'note', '删除后，历史记录将被保留'
  );
END;
$$;

-- Add comments
COMMENT ON COLUMN profiles.is_deleted IS 'Soft-delete flag: true = deleted, false = active';
COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when user was soft-deleted';
COMMENT ON COLUMN profiles.deleted_by IS 'Admin who deleted this user';
COMMENT ON FUNCTION soft_delete_user IS 'Safely soft-delete a user with validation';
COMMENT ON FUNCTION restore_user IS 'Restore a soft-deleted user';
COMMENT ON FUNCTION can_delete_user IS 'Check if user can be deleted (validation)';
