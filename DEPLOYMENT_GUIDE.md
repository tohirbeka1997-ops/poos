# 🚀 User Profile (Shaxsiy Kabinet) - Deployment Guide

**Date:** 2025-11-12  
**Status:** ✅ **READY FOR DEPLOYMENT**

---

## 📋 Overview

Complete User Profile system implementation for Supermarket POS with:
- ✅ 5-tab profile page at `/kabinet`
- ✅ User dropdown menu in navbar
- ✅ Activity logging system
- ✅ Branch management
- ✅ Password change with validation
- ✅ Session management with shift check
- ✅ All UI text in Uzbek

---

## 🗄️ Step 1: Apply Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
cd /workspace/app-7il2wyqiofsx
supabase db push
```

### Option B: Manual SQL Execution

```bash
# Connect to your database
psql -h <your-host> -U <your-user> -d <your-database>

# Run the migration
\i supabase/migrations/08_user_profile_complete.sql
```

### Verify Tables Created

```sql
-- Check user_profiles table
SELECT * FROM public.user_profiles LIMIT 5;

-- Check user_activity table
SELECT * FROM public.user_activity LIMIT 5;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_activity');

-- Check RPC functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'profile%';
```

Expected output:
- ✅ `user_profiles` table with columns: id, user_id, fullname, phone, language, branch_id, created_at, updated_at
- ✅ `user_activity` table with columns: id, user_id, action, payload, created_at
- ✅ RLS policies: profile_read_own, profile_update_own, activity_read_own, activity_insert_own
- ✅ RPC functions: profile_get_current, profile_update, profile_change_password, profile_activity_list, log_activity

---

## 🔐 Step 2: Verify Security

### Test RLS Policies

```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = '<test-user-id>';

-- Should see only own profile
SELECT * FROM public.user_profiles;

-- Should see only own activity
SELECT * FROM public.user_activity;

-- Reset role
RESET ROLE;
```

### Test RPC Functions

```sql
-- Test profile_get_current
SELECT public.profile_get_current();

-- Test profile_activity_list
SELECT * FROM public.profile_activity_list(10);
```

---

## 🎨 Step 3: Frontend Build & Deploy

### Build Application

```bash
cd /workspace/app-7il2wyqiofsx

# Install dependencies (if needed)
pnpm install

# Run lint check
npm run lint

# Build for production
npm run build
```

Expected output:
- ✅ No lint errors
- ✅ Build successful
- ✅ Output in `dist/` directory

### Deploy to Production

Follow your deployment process (Vercel, Netlify, etc.):

```bash
# Example for Vercel
vercel --prod

# Example for Netlify
netlify deploy --prod
```

---

## ✅ Step 4: Post-Deployment Verification

### 1. Test Authentication Flow

```
1. Navigate to your app URL
2. If not logged in → should redirect to /login
3. Login with test credentials
4. Should redirect to / (POS page)
```

### 2. Test Profile Page Access

```
1. Click user icon in top-right navbar
2. Click "Shaxsiy kabinet"
3. Should navigate to /kabinet
4. Should see 5 tabs: Umumiy, Parol, Filial, So'nggi faoliyat, Sessiya
```

### 3. Test Profile Update

```
Tab: Umumiy
1. Update "To'liq ism" field
2. Update "Telefon" field (format: +998901234567)
3. Change "Til" dropdown
4. Click "Saqlash"
5. Should see: ✅ "Profil ma'lumotlari muvaffaqiyatli yangilandi"
6. Refresh page → changes should persist
```

### 4. Test Password Change

```
Tab: Parol
1. Enter current password
2. Enter new password (8+ chars, letters + digits)
3. Confirm new password
4. Click "Parolni almashtirish"
5. Should see: ✅ "Parol muvaffaqiyatli yangilandi"
6. Logout and login with new password → should work
```

### 5. Test Branch Switch

```
Tab: Filial
1. Select different branch from dropdown
2. Click "Filialni almashtirish"
3. Should see: ✅ "Filial muvaffaqiyatli almashtirildi"
4. Check that branch_id updated in database
```

### 6. Test Activity Log

```
Tab: So'nggi faoliyat
1. Should see list of recent actions
2. Each action should have:
   - Badge with action type (in Uzbek)
   - Timestamp (dd.MM.yyyy HH:mm format)
   - Optional payload data
3. Actions should be sorted by most recent first
```

### 7. Test Logout with Shift Check

```
Tab: Sessiya

Test Case A: With Open Shift
1. Open a cash shift (from Kassa page)
2. Go to /kabinet → Sessiya tab
3. Click "Tizimdan chiqish"
4. Should see: ⚠️ "Diqqat: Smena yopilmagan..."
5. Should NOT logout
6. Should stay on /kabinet page

Test Case B: Without Open Shift
1. Close any open shifts
2. Go to /kabinet → Sessiya tab
3. Click "Tizimdan chiqish"
4. Should logout successfully
5. Should redirect to /login
```

### 8. Test User Menu

```
1. Click user icon in navbar
2. Should see dropdown with 4 items:
   - 👤 Shaxsiy kabinet
   - 🔄 Hisobni almashtirish
   - 🌐 Tilni o'zgartirish
   - 🚪 Tizimdan chiqish
3. Click each item and verify functionality
```

---

## 🧪 Test Checklist

### Database Tests
- [ ] ✅ user_profiles table created
- [ ] ✅ user_activity table created
- [ ] ✅ RLS policies active
- [ ] ✅ RPC functions working
- [ ] ✅ Trigger auto-creates profiles

### Frontend Tests
- [ ] ✅ /kabinet route accessible
- [ ] ✅ Redirects to /login if not authenticated
- [ ] ✅ All 5 tabs render correctly
- [ ] ✅ All UI text in Uzbek
- [ ] ✅ User menu in navbar works

### Functionality Tests
- [ ] ✅ Profile update saves correctly
- [ ] ✅ Phone validation works (+998 format)
- [ ] ✅ Password change validates correctly
- [ ] ✅ Password requires 8+ chars, letters + digits
- [ ] ✅ Branch switch works
- [ ] ✅ Activity log displays correctly
- [ ] ✅ Logout checks for open shift
- [ ] ✅ Language change persists

### Security Tests
- [ ] ✅ Users can only see own profile
- [ ] ✅ Users can only see own activity
- [ ] ✅ Password change requires current password
- [ ] ✅ Branch access validated
- [ ] ✅ RLS policies enforced

---

## 🐛 Troubleshooting

### Issue: "Profil ma'lumotlari topilmadi"

**Cause:** Profile not created for user

**Solution:**
```sql
-- Manually create profile
INSERT INTO public.user_profiles (user_id, fullname, language)
VALUES ('<user-id>', 'User Name', 'uz');
```

---

### Issue: "Xatolik: ma'lumotlarni yangilash amalga oshmadi"

**Cause:** RLS policy blocking update

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Verify user_id matches auth.uid()
SELECT user_id FROM public.user_profiles WHERE user_id = auth.uid();
```

---

### Issue: Activity log not showing

**Cause:** No activities logged yet

**Solution:**
```sql
-- Manually log test activity
INSERT INTO public.user_activity (user_id, action, payload)
VALUES ('<user-id>', 'test_action', '{"test": true}'::jsonb);
```

---

### Issue: Branch dropdown empty

**Cause:** No branches in database

**Solution:**
```sql
-- Create test branch
INSERT INTO public.branches (name, address, phone, is_active)
VALUES ('Test Branch', 'Test Address', '+998901234567', TRUE);
```

---

### Issue: Logout not checking shift

**Cause:** cash_shifts table doesn't exist or has different structure

**Solution:**
```sql
-- Check if cash_shifts table exists
SELECT * FROM information_schema.tables WHERE table_name = 'cash_shifts';

-- If exists, verify structure
\d cash_shifts
```

---

## 📊 Monitoring

### Activity Log Queries

```sql
-- Most active users (last 7 days)
SELECT 
  up.fullname,
  COUNT(*) as activity_count
FROM public.user_activity ua
JOIN public.user_profiles up ON ua.user_id = up.user_id
WHERE ua.created_at > NOW() - INTERVAL '7 days'
GROUP BY up.fullname
ORDER BY activity_count DESC
LIMIT 10;

-- Most common actions
SELECT 
  action,
  COUNT(*) as count
FROM public.user_activity
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;

-- Recent password changes
SELECT 
  up.fullname,
  ua.created_at
FROM public.user_activity ua
JOIN public.user_profiles up ON ua.user_id = up.user_id
WHERE ua.action = 'password_change'
ORDER BY ua.created_at DESC
LIMIT 10;
```

### Profile Statistics

```sql
-- Language distribution
SELECT 
  language,
  COUNT(*) as user_count
FROM public.user_profiles
GROUP BY language
ORDER BY user_count DESC;

-- Users by branch
SELECT 
  b.name as branch_name,
  COUNT(up.id) as user_count
FROM public.branches b
LEFT JOIN public.user_profiles up ON b.id = up.branch_id
GROUP BY b.name
ORDER BY user_count DESC;

-- Recent profile updates
SELECT 
  fullname,
  updated_at
FROM public.user_profiles
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🔄 Rollback Plan

If issues occur, rollback using:

```sql
-- Drop new tables
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.profile_get_current();
DROP FUNCTION IF EXISTS public.profile_update(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.profile_change_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.profile_activity_list(INT);
DROP FUNCTION IF EXISTS public.log_activity(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.ensure_profile();

-- Drop trigger
DROP TRIGGER IF EXISTS trg_auth_user_profile ON auth.users;
```

Then redeploy previous version of frontend.

---

## 📝 Post-Deployment Tasks

### 1. Update Documentation

- [ ] Update user manual with profile page instructions
- [ ] Document password requirements
- [ ] Document branch switching process
- [ ] Add screenshots of profile page

### 2. User Training

- [ ] Train staff on profile management
- [ ] Explain password security best practices
- [ ] Show how to view activity log
- [ ] Demonstrate branch switching

### 3. Monitoring Setup

- [ ] Set up alerts for failed password changes
- [ ] Monitor activity log for suspicious actions
- [ ] Track profile update frequency
- [ ] Monitor branch switching patterns

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All database tables created
- ✅ All RLS policies active
- ✅ All RPC functions working
- ✅ Frontend builds without errors
- ✅ /kabinet page accessible
- ✅ All 5 tabs functional
- ✅ Profile updates save correctly
- ✅ Password change works
- ✅ Activity log displays
- ✅ Logout checks shift status
- ✅ All UI text in Uzbek
- ✅ No console errors
- ✅ All tests pass

---

## 📞 Support

### Files Reference

- **Database Schema:** `supabase/migrations/08_user_profile_complete.sql`
- **Profile Page:** `src/pages/ProfileKabinet.tsx`
- **Header Component:** `src/components/common/Header.tsx`
- **Routes:** `src/routes.tsx`
- **Full Documentation:** `USER_PROFILE_IMPLEMENTATION.md`

### Common Commands

```bash
# Check database connection
psql -h <host> -U <user> -d <database> -c "SELECT version();"

# View migration status
supabase db status

# View logs
supabase logs

# Restart services
supabase stop && supabase start
```

---

**Prepared by:** Miaoda AI  
**Date:** 2025-11-12  
**Status:** ✅ **READY FOR DEPLOYMENT**

---

## 🚀 Quick Start

```bash
# 1. Apply database migration
supabase db push

# 2. Build frontend
npm run lint && npm run build

# 3. Deploy
vercel --prod  # or your deployment command

# 4. Test
# Navigate to /kabinet and verify all functionality
```

**That's it! Your User Profile system is now live! 🎉**
