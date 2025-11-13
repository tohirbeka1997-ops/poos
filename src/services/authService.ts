/**
 * Authentication Service
 * 
 * Handles authentication flow with single source of truth (Supabase Auth)
 * Ensures one-to-one mapping between auth.users and profiles
 * Prevents duplicate accounts
 */

import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';

/**
 * Normalize username to lowercase and trim whitespace
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Convert username to email format for Supabase Auth
 * Format: username@miaoda.com
 */
export function usernameToEmail(username: string): string {
  const normalized = normalizeUsername(username);
  return `${normalized}@miaoda.com`;
}

/**
 * Extract username from email
 * Example: admin@miaoda.com -> admin
 */
export function emailToUsername(email: string): string {
  return email.split('@')[0];
}

/**
 * Check if username already exists (case-insensitive)
 * Only checks active (non-deleted) users
 */
export async function usernameExists(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', normalized)
    .eq('is_deleted', false)  // Only check active users
    .limit(1);
  
  if (error) {
    console.error('Error checking username:', error);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Get profile by username (case-insensitive)
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const normalized = normalizeUsername(username);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', normalized)
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Get or create app user profile
 * This ensures one-to-one mapping between auth.users and profiles
 */
export async function getOrCreateProfile(authUserId: string): Promise<Profile | null> {
  // Try to get existing profile by auth user id
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    return null;
  }
  
  // If profile exists, return it
  if (existingProfile) {
    return existingProfile;
  }
  
  // Profile doesn't exist - this shouldn't happen if trigger is working
  // But we'll handle it gracefully by creating one
  const { data: authUser } = await supabase.auth.getUser();
  
  if (!authUser.user || authUser.user.id !== authUserId) {
    console.error('Auth user mismatch');
    return null;
  }
  
  const username = emailToUsername(authUser.user.email || '');
  const fullName = authUser.user.user_metadata?.full_name || username;
  
  // Check if this is the first user (should be admin)
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  const role = (count === 0) ? 'admin' : 'cashier';
  
  // Create new profile
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: authUserId,
      username,
      full_name: fullName,
      role,
      is_active: true,
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Error creating profile:', insertError);
    return null;
  }
  
  return newProfile;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Sign in with username and password
 * 
 * @param username - User's login username
 * @param password - User's password
 * @returns Profile if successful, null otherwise
 * @throws Error with user-friendly message
 */
export async function signIn(username: string, password: string): Promise<Profile> {
  // Validate input
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Normalize username and convert to email
  const email = usernameToEmail(username);
  
  // Attempt authentication with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (authError || !authData.user) {
    throw new Error('Incorrect username or password');
  }
  
  // Get or create profile (ensures one-to-one mapping)
  const profile = await getOrCreateProfile(authData.user.id);
  
  if (!profile) {
    // Sign out if profile creation failed
    await supabase.auth.signOut();
    throw new Error('Failed to load user profile');
  }
  
  // Check if user is active
  if (!profile.is_active) {
    // Sign out blocked user
    await supabase.auth.signOut();
    throw new Error('User is blocked. Contact administrator.');
  }
  
  // Update last login timestamp
  await updateLastLogin(profile.id);
  
  return profile;
}

/**
 * Sign up new user
 * 
 * @param username - Desired username
 * @param password - Password (min 8 characters)
 * @param fullName - User's full name
 * @returns Profile if successful
 * @throws Error with user-friendly message
 */
export async function signUp(
  username: string,
  password: string,
  fullName?: string
): Promise<Profile> {
  // Validate input
  if (!username || !password) {
    throw new Error('Username and password are required');
  }
  
  // Validate username format
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  
  // Validate password length
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Check if username already exists
  const exists = await usernameExists(username);
  if (exists) {
    throw new Error('This username is already taken');
  }
  
  // Convert username to email
  const email = usernameToEmail(username);
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName || username,
      },
    },
  });
  
  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create account');
  }
  
  // Get the created profile (trigger should have created it)
  const profile = await getOrCreateProfile(authData.user.id);
  
  if (!profile) {
    throw new Error('Failed to create user profile');
  }
  
  return profile;
}

/**
 * Create user by admin (through Users page)
 * 
 * @param userData - User data including username, password, role, etc.
 * @returns Profile if successful
 * @throws Error with user-friendly message
 */
export async function createUserByAdmin(userData: {
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'manager' | 'cashier' | 'accountant';
  discount_limit?: number;
  created_by?: string;
}): Promise<Profile> {
  // Validate input
  if (!userData.username || !userData.password) {
    throw new Error('Username and password are required');
  }
  
  // Validate username format
  if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  
  // Validate password length
  if (userData.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Check if username already exists
  const exists = await usernameExists(userData.username);
  if (exists) {
    throw new Error('This username is already taken');
  }
  
  // Convert username to email
  const email = usernameToEmail(userData.username);
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.full_name,
      },
    },
  });
  
  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Failed to create user');
  }
  
  // Update profile with additional fields
  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({
      username: normalizeUsername(userData.username),
      full_name: userData.full_name,
      role: userData.role,
      discount_limit: userData.discount_limit || 0,
      created_by: userData.created_by || null,
      is_active: true,
    })
    .eq('id', authData.user.id)
    .select()
    .single();
  
  if (updateError || !profile) {
    // If update fails, try to get the profile created by trigger
    const fallbackProfile = await getOrCreateProfile(authData.user.id);
    if (!fallbackProfile) {
      throw new Error('Failed to create user profile');
    }
    return fallbackProfile;
  }
  
  return profile;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out');
  }
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  return getOrCreateProfile(user.id);
}

/**
 * Check if user can be deleted
 * 
 * @param userId - User ID to check
 * @param currentUserId - Current user ID (who is trying to delete)
 * @returns Validation result with can_delete flag and reason
 */
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
}> {
  const { data, error } = await supabase.rpc('can_delete_user', {
    p_user_id: userId,
    p_current_user_id: currentUserId,
  });
  
  if (error) {
    console.error('Error checking if user can be deleted:', error);
    return {
      can_delete: false,
      reason: 'error',
      message: '检查失败',
    };
  }
  
  return data;
}

/**
 * Soft-delete a user
 * 
 * @param userId - User ID to delete
 * @param deletedBy - Current user ID (who is deleting)
 * @returns Result with success flag and message
 */
export async function softDeleteUser(
  userId: string,
  deletedBy: string
): Promise<{
  success: boolean;
  error?: string;
  message: string;
  user_id?: string;
  username?: string;
}> {
  // Call soft_delete_user function
  const { data, error } = await supabase.rpc('soft_delete_user', {
    p_user_id: userId,
    p_deleted_by: deletedBy,
  });
  
  if (error) {
    console.error('Error soft-deleting user:', error);
    return {
      success: false,
      error: 'database_error',
      message: '删除失败',
    };
  }
  
  // If soft-delete succeeded, try to block/delete user in Supabase Auth
  if (data.success) {
    try {
      // Note: Supabase Auth admin functions are not available in client SDK
      // This would need to be done via Edge Function or server-side
      // For now, we just soft-delete in the database
      // The user won't be able to sign in because is_active = false
      
      // Optional: Sign out the user if they're currently signed in
      // This is handled by the is_active check in signIn function
    } catch (authError) {
      console.error('Error syncing with Auth:', authError);
      // Continue anyway - soft-delete succeeded
    }
  }
  
  return data;
}

/**
 * Restore a soft-deleted user
 * 
 * @param userId - User ID to restore
 * @param restoredBy - Current user ID (who is restoring)
 * @returns Result with success flag and message
 */
export async function restoreUser(
  userId: string,
  restoredBy: string
): Promise<{
  success: boolean;
  error?: string;
  message: string;
  user_id?: string;
  username?: string;
}> {
  const { data, error } = await supabase.rpc('restore_user', {
    p_user_id: userId,
    p_restored_by: restoredBy,
  });
  
  if (error) {
    console.error('Error restoring user:', error);
    return {
      success: false,
      error: 'database_error',
      message: '恢复失败',
    };
  }
  
  return data;
}
