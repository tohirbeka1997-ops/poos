# 🗑️ Safe User Delete (Soft-Delete + Auth Sync) Implementation

**Date:** 2025-11-12  
**System:** Supermarket POS Management System  
**Status:** ✅ **IMPLEMENTED & TESTED**

---

## 📋 Overview

This document describes the implementation of a safe user deletion system with soft-delete pattern that:
- Prevents data loss and maintains data integrity
- Preserves historical records (sales, shifts, etc.)
- Syncs with Supabase Auth
- Implements multiple validation guards
- Provides user-friendly error messages
- Allows username reuse after deletion

---

## 🏗️ Architecture

### Soft-Delete Pattern

Instead of permanently deleting users (hard delete), we mark them as deleted:

```
Hard Delete (❌ NOT USED):
DELETE FROM profiles WHERE id = 'xxx';
→ User gone forever, FK constraints broken, data loss

Soft Delete (✅ USED):
UPDATE profiles SET is_deleted = true, deleted_at = now() WHERE id = 'xxx';
→ User hidden, FK intact, data preserved, reversible
```

### Database Schema Changes

```sql
ALTER TABLE profiles ADD COLUMN:
- is_deleted boolean DEFAULT false
- deleted_at timestamptz
- deleted_by uuid REFERENCES profiles(id)
```

---

## 🛡️ Validation Guards

### 1. Cannot Delete Yourself

**Rule:** User cannot delete their own account

**Reason:** Prevents accidental self-lockout

**Error Message:** "不能删除自己" (Cannot delete yourself)

**Implementation:**
```typescript
if (userId === currentUserId) {
  return { success: false, message: '不能删除自己' };
}
```

### 2. Cannot Delete Admin

**Rule:** Admin users cannot be deleted

**Reason:** Protects system administrators

**Error Message:** "不能删除管理员" (Cannot delete administrator)

**Implementation:**
```typescript
if (user.role === 'admin') {
  return { success: false, message: '不能删除管理员' };
}
```

### 3. User Must Exist

**Rule:** User must exist and not already deleted

**Error Message:** "用户不存在或已被删除" (User not found or already deleted)

**Implementation:**
```sql
SELECT * FROM profiles 
WHERE id = p_user_id AND is_deleted = false;
```

### 4. Auth User ID Required

**Rule:** User must have valid auth_user_id for Auth sync

**Reason:** Ensures proper sync with Supabase Auth

---

## 🗄️ Database Implementation

### Soft-Delete Columns

```sql
CREATE TABLE profiles (
  ...existing columns...
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);
```

### Indexes

```sql
-- Index on active users (performance optimization)
CREATE INDEX idx_profiles_active 
ON profiles(is_active, is_deleted) 
WHERE is_deleted = false;

-- Unique username for active users only (allows reuse)
CREATE UNIQUE INDEX profiles_username_active_uidx 
ON profiles (LOWER(TRIM(username))) 
WHERE is_deleted = false;
```

### Foreign Key Handling

All foreign keys use `ON DELETE SET NULL` to preserve historical data:

```sql
-- sales table
cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL

-- cash_shifts table
cashier_id uuid REFERENCES profiles(id) ON DELETE SET NULL

-- audit_logs table (if exists)
actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL
```

**Result:** When user is deleted, their ID remains in historical records but is set to NULL, preserving data integrity.

---

## 🔧 Database Functions

### 1. soft_delete_user

Safely soft-deletes a user with validation.

**Signature:**
```sql
soft_delete_user(
  p_user_id uuid,
  p_deleted_by uuid
) RETURNS jsonb
```

**Validation:**
1. User exists and not already deleted
2. Not deleting yourself
3. Not deleting admin

**Actions:**
1. Set `is_deleted = true`
2. Set `deleted_at = now()`
3. Set `deleted_by = current_user_id`
4. Set `is_active = false` (block login)

**Returns:**
```json
{
  "success": true,
  "message": "用户已删除（登录已被阻止）",
  "user_id": "xxx",
  "username": "xxx"
}
```

### 2. restore_user

Restores a soft-deleted user.

**Signature:**
```sql
restore_user(
  p_user_id uuid,
  p_restored_by uuid
) RETURNS jsonb
```

**Actions:**
1. Set `is_deleted = false`
2. Set `deleted_at = NULL`
3. Set `deleted_by = NULL`
4. Set `is_active = true` (allow login)

**Returns:**
```json
{
  "success": true,
  "message": "用户已恢复",
  "user_id": "xxx",
  "username": "xxx"
}
```

### 3. can_delete_user

Checks if user can be deleted (pre-validation).

**Signature:**
```sql
can_delete_user(
  p_user_id uuid,
  p_current_user_id uuid
) RETURNS jsonb
```

**Returns:**
```json
{
  "can_delete": true,
  "message": "可以删除",
  "related_sales": 123,
  "related_shifts": 45,
  "note": "删除后，历史记录将被保留"
}
```

### 4. prevent_hard_delete (Trigger)

Prevents accidental hard delete.

**Trigger:**
```sql
CREATE TRIGGER trigger_prevent_hard_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_hard_delete();
```

**Behavior:**
- If `is_deleted = false` → Raises exception: "Hard delete not allowed. Use soft_delete_user() function instead."
- If `is_deleted = true` → Allows delete (for cleanup)

---

## 💻 Frontend Implementation

### AuthService Functions

#### canDeleteUser

```typescript
export async function canDeleteUser(
  userId: string,
  currentUserId: string
): Promise<{
  can_delete: boolean;
  reason?: string;
  message: string;
  related_sales?: number;
  related_shifts?: number;
  note?: string;
}>
```

**Usage:**
```typescript
const validation = await canDeleteUser(selectedUser.id, currentUser.id);
if (!validation.can_delete) {
  toast({ title: '错误', description: validation.message });
  return;
}
```

#### softDeleteUser

```typescript
export async function softDeleteUser(
  userId: string,
  deletedBy: string
): Promise<{
  success: boolean;
  error?: string;
  message: string;
  user_id?: string;
  username?: string;
}>
```

**Usage:**
```typescript
const result = await softDeleteUser(selectedUser.id, currentUser.id);
if (result.success) {
  toast({ title: '成功', description: result.message });
  loadUsers(); // Refresh list
}
```

#### restoreUser

```typescript
export async function restoreUser(
  userId: string,
  restoredBy: string
): Promise<{
  success: boolean;
  error?: string;
  message: string;
  user_id?: string;
  username?: string;
}>
```

### Users Page Implementation

#### Delete Handler

```typescript
const handleDeleteUser = async () => {
  if (!selectedUser) return;

  try {
    // Get current user
    const currentUser = await getCurrentProfile();
    if (!currentUser) {
      toast({ title: '错误', description: '无法获取当前用户信息' });
      return;
    }

    // Validate
    const validation = await canDeleteUser(selectedUser.id, currentUser.id);
    if (!validation.can_delete) {
      toast({ title: '错误', description: validation.message });
      return;
    }

    // Soft delete
    const result = await softDeleteUser(selectedUser.id, currentUser.id);
    if (result.success) {
      toast({ title: '成功', description: result.message });
      setIsDeleteDialogOpen(false);
      loadUsers();
    }
  } catch (error) {
    toast({ title: '错误', description: '删除用户时出错' });
  }
};
```

#### Delete Confirmation Dialog

```tsx
<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>删除用户</AlertDialogTitle>
      <AlertDialogDescription>
        删除用户后，该用户的登录将被阻止。您确定要继续吗？
        {selectedUser && (
          <div className="mt-2 text-sm">
            <p className="font-medium">用户名: {selectedUser.username}</p>
            <p className="text-muted-foreground">注意：历史记录将被保留</p>
          </div>
        )}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteUser}>删除</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 🔄 User Deletion Flow

```
1. Admin clicks "Delete" button on user
   ↓
2. Delete confirmation dialog appears
   - Shows username
   - Shows warning about login block
   - Shows note about preserving history
   ↓
3. Admin confirms deletion
   ↓
4. Get current user profile
   ↓
5. Call canDeleteUser() for validation
   ↓
6. If validation fails → Show error toast → Stop
   ↓
7. If validation passes → Call softDeleteUser()
   ↓
8. Database function performs soft delete:
   - Set is_deleted = true
   - Set deleted_at = now()
   - Set deleted_by = current_user_id
   - Set is_active = false
   ↓
9. Success toast: "用户已删除（登录已被阻止）"
   ↓
10. Refresh users list (deleted user no longer visible)
   ↓
11. User cannot sign in (is_active = false check)
```

---

## 🔍 Data Filtering

### API Level

```typescript
export const getProfiles = async (includeDeleted = false): Promise<Profile[]> => {
  let query = supabase.from('profiles').select('*');
  
  // Filter out deleted users by default
  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};
```

### Username Uniqueness

```typescript
export async function usernameExists(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', normalized)
    .eq('is_deleted', false)  // Only check active users
    .limit(1);
  
  return data && data.length > 0;
}
```

**Result:** Deleted usernames can be reused for new users.

---

## 🔐 Supabase Auth Sync

### Current Implementation

When user is soft-deleted:
1. `is_active` is set to `false`
2. User cannot sign in (checked in `signIn()` function)
3. If user tries to sign in → Error: "User is blocked. Contact administrator."

### Future Enhancement (Optional)

For complete Auth sync, implement Edge Function:

```typescript
// Edge Function: delete-user-auth
import { createClient } from '@supabase/supabase-js';

export async function deleteUserAuth(userId: string) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  // Option 1: Ban user
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    banned: true,
  });
  
  // Option 2: Delete auth user (more aggressive)
  // await supabaseAdmin.auth.admin.deleteUser(userId);
}
```

**Note:** Current implementation is sufficient as `is_active` check prevents sign-in.

---

## ✅ Testing Checklist

### Basic Tests

- [x] ✅ Delete cashier user → Success, user hidden from list
- [x] ✅ Try to delete admin → Error: "不能删除管理员"
- [x] ✅ Try to delete yourself → Error: "不能删除自己"
- [x] ✅ Deleted user cannot sign in → Error: "User is blocked"
- [x] ✅ Deleted user's sales records preserved
- [x] ✅ Deleted user's shift records preserved

### Username Reuse Tests

- [x] ✅ Delete user "cashier1"
- [x] ✅ Create new user "cashier1" → Success (username available)
- [x] ✅ New user can sign in

### Foreign Key Tests

- [x] ✅ User with sales → Soft delete works, sales.cashier_id preserved
- [x] ✅ User with shifts → Soft delete works, cash_shifts.cashier_id preserved
- [x] ✅ Historical reports still show deleted user's data

### Hard Delete Prevention

- [x] ✅ Try `DELETE FROM profiles WHERE id = 'xxx'` → Error: "Hard delete not allowed"
- [x] ✅ Soft delete first, then hard delete → Success (cleanup allowed)

### UI/UX Tests

- [x] ✅ Delete button shows confirmation dialog
- [x] ✅ Dialog shows username and warning
- [x] ✅ Cancel button closes dialog without deleting
- [x] ✅ Delete button performs soft delete
- [x] ✅ Success toast appears: "用户已删除（登录已被阻止）"
- [x] ✅ User list refreshes, deleted user not visible

---

## 📊 Database Queries

### View All Users (Including Deleted)

```sql
SELECT 
  id,
  username,
  full_name,
  role,
  is_active,
  is_deleted,
  deleted_at,
  deleted_by,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### View Only Active Users

```sql
SELECT * FROM profiles 
WHERE is_deleted = false
ORDER BY created_at DESC;
```

### View Only Deleted Users

```sql
SELECT * FROM profiles 
WHERE is_deleted = true
ORDER BY deleted_at DESC;
```

### Soft Delete a User (Manual)

```sql
SELECT soft_delete_user(
  'user-id-to-delete',
  'current-admin-id'
);
```

### Restore a User (Manual)

```sql
SELECT restore_user(
  'user-id-to-restore',
  'current-admin-id'
);
```

### Check if User Can Be Deleted

```sql
SELECT can_delete_user(
  'user-id-to-check',
  'current-user-id'
);
```

### Find Users with Related Records

```sql
SELECT 
  p.id,
  p.username,
  p.full_name,
  COUNT(DISTINCT s.id) as sales_count,
  COUNT(DISTINCT cs.id) as shifts_count
FROM profiles p
LEFT JOIN sales s ON s.cashier_id = p.id
LEFT JOIN cash_shifts cs ON cs.cashier_id = p.id
WHERE p.is_deleted = false
GROUP BY p.id, p.username, p.full_name
HAVING COUNT(DISTINCT s.id) > 0 OR COUNT(DISTINCT cs.id) > 0
ORDER BY sales_count DESC;
```

---

## 🔧 Hard Delete (Developer Only)

**⚠️ WARNING:** Hard delete is irreversible and should only be used for cleanup.

### Prerequisites

1. User must be soft-deleted first (`is_deleted = true`)
2. Understand that all FK references will be set to NULL
3. Have database backup

### Steps

```sql
-- 1. Verify user is soft-deleted
SELECT id, username, is_deleted FROM profiles WHERE id = 'xxx';

-- 2. Check related records (will be set to NULL)
SELECT COUNT(*) FROM sales WHERE cashier_id = 'xxx';
SELECT COUNT(*) FROM cash_shifts WHERE cashier_id = 'xxx';

-- 3. Hard delete (FK will be set to NULL automatically)
DELETE FROM profiles WHERE id = 'xxx' AND is_deleted = true;

-- 4. Optional: Delete from Auth (requires service role key)
-- This must be done via Edge Function or server-side
```

### Cleanup Script (Optional)

```sql
-- Delete all soft-deleted users older than 90 days
DELETE FROM profiles 
WHERE is_deleted = true 
AND deleted_at < NOW() - INTERVAL '90 days';
```

---

## 🎯 Summary

### ✅ Implemented Features

1. **Soft-Delete Pattern:** Users marked as deleted, not removed
2. **Validation Guards:** Cannot delete self, cannot delete admin
3. **Data Preservation:** Historical records (sales, shifts) preserved
4. **Username Reuse:** Deleted usernames can be reused
5. **Auth Sync:** Deleted users cannot sign in (`is_active = false`)
6. **Hard Delete Prevention:** Trigger prevents accidental hard delete
7. **User-Friendly UI:** Confirmation dialog with clear warnings
8. **Chinese Error Messages:** All UI text in Chinese as per requirements
9. **Restore Function:** Ability to restore deleted users
10. **Audit Trail:** Track who deleted whom and when

### 🔒 Security Features

1. **Role-Based Protection:** Admin users cannot be deleted
2. **Self-Protection:** Users cannot delete themselves
3. **Validation Functions:** Pre-check before deletion
4. **Trigger Protection:** Prevents hard delete at database level
5. **FK Preservation:** Historical data integrity maintained

### 📈 Performance Optimizations

1. **Indexes:** On `is_deleted` and `is_active` for fast filtering
2. **Partial Unique Index:** Username uniqueness only for active users
3. **Efficient Queries:** Filter deleted users at database level

---

**Implementation Completed by:** Miaoda AI  
**Date:** 2025-11-12  
**Status:** ✅ **PRODUCTION READY**
