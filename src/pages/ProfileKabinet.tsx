/**
 * Shaxsiy Kabinet - User Profile Page
 * Complete profile management with activity tracking
 * All UI text in Uzbek as per requirements
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { 
  User, 
  Lock, 
  Building2, 
  Phone, 
  Calendar, 
  Loader2, 
  Activity,
  LogOut,
  AlertTriangle,
  Clock,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  fullname: string;
  phone: string | null;
  language: string;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface ActivityLog {
  id: number;
  user_id: string;
  action: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
  };
  created_at?: string;
  last_sign_in_at?: string;
}

export default function ProfileKabinet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Form state
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('uz');
  const [branchId, setBranchId] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Branch switch state
  const [switchingBranch, setSwitchingBranch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Default tab from URL params
  const defaultTab = searchParams.get('tab') || 'general';

  useEffect(() => {
    loadProfile();
    loadBranches();
  }, []);

  // Load user profile
  async function loadProfile() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Foydalanuvchi topilmadi');
        navigate('/login');
        return;
      }

      setAuthUser(user);

      // Get profile from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create profile if doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            fullname: user.user_metadata?.full_name || user.email || '',
            language: 'uz'
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setFullname(newProfile.fullname || '');
        setPhone(newProfile.phone || '');
        setLanguage(newProfile.language || 'uz');
        setBranchId(newProfile.branch_id || '');
        setSelectedBranchId(newProfile.branch_id || '');
      } else {
        setProfile(data);
        setFullname(data.fullname || '');
        setPhone(data.phone || '');
        setLanguage(data.language || 'uz');
        setBranchId(data.branch_id || '');
        setSelectedBranchId(data.branch_id || '');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      toast.error('Profil yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  // Load branches
  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Branches load error:', error);
        return;
      }
      setBranches(data || []);
    } catch (error) {
      console.error('Branches load error:', error);
    }
  }

  // Load activity logs
  async function loadActivityLogs() {
    if (!profile) return;

    try {
      setLoadingActivity(true);

      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Activity logs load error:', error);
      toast.error('Faoliyat jurnalini yuklashda xatolik');
    } finally {
      setLoadingActivity(false);
    }
  }

  // Save profile
  async function handleSaveProfile() {
    if (!profile) return;

    // Check if any changes were made
    if (
      fullname === profile.fullname &&
      phone === (profile.phone || '') &&
      language === profile.language &&
      branchId === (profile.branch_id || '')
    ) {
      toast.info('O\'zgartirish kiritilmadi');
      return;
    }

    // Validate phone number format if provided
    if (phone && !phone.match(/^\+998\d{9}$/)) {
      toast.error('Telefon raqami noto\'g\'ri formatda. Namuna: +998901234567');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          fullname: fullname,
          phone: phone || null,
          language: language,
          branch_id: branchId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Log activity
      await logActivity('profile_update', { 
        changes: { fullname, phone, language, branch_id: branchId }
      });

      toast.success('Profil ma\'lumotlari muvaffaqiyatli yangilandi');
      await loadProfile();
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('Xatolik: ma\'lumotlarni yangilash amalga oshmadi');
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handleChangePassword() {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Barcha maydonlarni to\'ldiring');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Yangi parol kamida 8 belgidan iborat bo\'lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yangi parollar mos kelmadi');
      return;
    }

    // Password strength check - must have letters AND digits
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      toast.error('Yangi parol talablarga javob bermaydi. Harf va raqam kombinatsiyasi kerak');
      return;
    }

    try {
      setChangingPassword(true);

      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Foydalanuvchi topilmadi');
        return;
      }

      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('Joriy parol noto\'g\'ri');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Log activity
      await logActivity('password_change', { timestamp: new Date().toISOString() });

      toast.success('Parol muvaffaqiyatli yangilandi');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Xatolik: amal bajarilmadi. Iltimos, qayta urinib ko\'ring');
    } finally {
      setChangingPassword(false);
    }
  }

  // Switch branch
  async function handleSwitchBranch() {
    if (!profile || !selectedBranchId) return;

    if (selectedBranchId === branchId) {
      toast.info('Siz allaqachon ushbu filialdasiz');
      return;
    }

    try {
      setSwitchingBranch(true);

      // Check if branch exists and is active
      const selectedBranch = branches.find(b => b.id === selectedBranchId);
      if (!selectedBranch) {
        toast.error('Filial topilmadi');
        return;
      }

      if (!selectedBranch.is_active) {
        toast.error('Sizda bu filialga ruxsat yo\'q');
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          branch_id: selectedBranchId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Log activity
      await logActivity('branch_switch', { 
        branch_id: selectedBranchId,
        branch_name: selectedBranch.name
      });

      setBranchId(selectedBranchId);
      toast.success('Filial muvaffaqiyatli almashtirildi');
      await loadProfile();
    } catch (error) {
      console.error('Branch switch error:', error);
      toast.error('Xatolik: amal bajarilmadi. Iltimos, qayta urinib ko\'ring');
    } finally {
      setSwitchingBranch(false);
    }
  }

  // Log activity
  async function logActivity(action: string, payload: Record<string, unknown> | null = null) {
    if (!profile) return;

    try {
      await supabase
        .from('user_activity')
        .insert({
          user_id: profile.user_id,
          action: action,
          payload: payload,
        });
    } catch (error) {
      console.error('Activity log error:', error);
    }
  }

  // Change language
  async function handleChangeLanguage(newLanguage: string) {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          language: newLanguage,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setLanguage(newLanguage);
      
      const languageNames: Record<string, string> = {
        uz: 'O\'zbek',
        ru: 'Русский',
        en: 'English',
      };
      
      await logActivity('language_change', { language: newLanguage });
      
      toast.success(`Til o'zgartirildi: ${languageNames[newLanguage]}`);
    } catch (error) {
      console.error('Language change error:', error);
      toast.error('Xatolik yuz berdi');
    }
  }

  // Logout
  async function handleLogout() {
    // Check for open shift
    if (profile) {
      const { data: openShift } = await supabase
        .from('cash_shifts')
        .select('id')
        .eq('cashier_id', profile.user_id)
        .eq('status', 'open')
        .maybeSingle();

      if (openShift) {
        toast.warning(
          'Diqqat: Smena yopilmagan. Iltimos, chiqishdan oldin kassani yoping.',
          { duration: 5000 }
        );
        return;
      }
    }

    await logActivity('logout', { timestamp: new Date().toISOString() });
    
    await supabase.auth.signOut();
    navigate('/login');
  }

  // Cancel changes
  function handleCancel() {
    if (profile) {
      setFullname(profile.fullname || '');
      setPhone(profile.phone || '');
      setLanguage(profile.language || 'uz');
      setBranchId(profile.branch_id || '');
      toast.info('O\'zgarishlar bekor qilindi');
    }
  }

  // Get action badge variant
  function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
    switch (action) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'password_change':
        return 'destructive';
      case 'profile_update':
      case 'branch_switch':
      case 'language_change':
        return 'outline';
      default:
        return 'secondary';
    }
  }

  // Get action label in Uzbek
  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      login: 'Kirish',
      logout: 'Chiqish',
      password_change: 'Parol o\'zgartirish',
      profile_update: 'Profil yangilash',
      branch_switch: 'Filial almashtirish',
      language_change: 'Til o\'zgartirish',
      sale_create: 'Sotuv',
      shift_open: 'Smena ochish',
      shift_close: 'Smena yopish',
      export: 'Eksport',
    };
    return labels[action] || action;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!profile || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Xatolik</CardTitle>
            <CardDescription>Profil ma'lumotlari topilmadi</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Bosh sahifaga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get username from auth user
  const username = authUser.email || authUser.user_metadata?.username || 'Foydalanuvchi';
  
  // Get role from profiles table if exists
  const [userRole, setUserRole] = useState<string>('');
  useEffect(() => {
    async function loadRole() {
      const { data } = await supabase
        .from('profiles')
        .select('active_role')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (data) {
        setUserRole(data.active_role);
      }
    }
    loadRole();
  }, [authUser.id]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Shaxsiy kabinet</h1>
        <p className="text-muted-foreground">
          Profil ma'lumotlaringizni boshqaring
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Parol
          </TabsTrigger>
          <TabsTrigger value="branch">
            <Building2 className="h-4 w-4 mr-2" />
            Filial
          </TabsTrigger>
          <TabsTrigger value="activity" onClick={() => loadActivityLogs()}>
            <Activity className="h-4 w-4 mr-2" />
            So'nggi faoliyat
          </TabsTrigger>
          <TabsTrigger value="session">
            <Clock className="h-4 w-4 mr-2" />
            Sessiya
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Umumiy (General Information) */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy ma'lumot</CardTitle>
              <CardDescription>
                Shaxsiy ma'lumotlaringizni ko'ring va tahrirlang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full name */}
              <div className="space-y-2">
                <Label htmlFor="fullname">To'liq ism</Label>
                <Input
                  id="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Ismingizni kiriting"
                />
              </div>

              {/* Login (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="username">Login</Label>
                <Input
                  id="username"
                  value={username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Login o'zgartirib bo'lmaydi
                </p>
              </div>

              {/* Role (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  value={userRole || 'Foydalanuvchi'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Rolni faqat administrator o'zgartirishi mumkin
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
                <p className="text-xs text-muted-foreground">
                  Namuna: +998901234567
                </p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Til
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">O'zbek</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Last login */}
              <div className="space-y-2">
                <Label>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  So'nggi kirish
                </Label>
                <p className="text-sm text-muted-foreground">
                  {authUser.last_sign_in_at
                    ? format(new Date(authUser.last_sign_in_at), 'dd.MM.yyyy HH:mm')
                    : 'Ma\'lumot yo\'q'}
                </p>
              </div>

              {/* Created at */}
              <div className="space-y-2">
                <Label>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Yaratilgan sana
                </Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(profile.created_at), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>

              <Separator />

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    'Saqlash'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Parol (Password Change) */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Parolni o'zgartirish</CardTitle>
              <CardDescription>
                Xavfsizlik uchun parolingizni muntazam yangilang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Parol kamida 8 belgidan iborat bo'lishi va harf hamda raqam kombinatsiyasini o'z ichiga olishi kerak.
                </AlertDescription>
              </Alert>

              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Joriy parol</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Joriy parolingizni kiriting"
                />
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yangi parol</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yangi parolni kiriting"
                />
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Tasdiqlash</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                />
              </div>

              <Separator />

              {/* Button */}
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    O'zgartirilmoqda...
                  </>
                ) : (
                  'Parolni almashtirish'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Filial (Branch Switch) */}
        <TabsContent value="branch">
          <Card>
            <CardHeader>
              <CardTitle>
                <Building2 className="h-5 w-5 inline mr-2" />
                Filial almashtirish
              </CardTitle>
              <CardDescription>
                Ishlayotgan filialingizni tanlang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {branches.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Hozircha filiallar mavjud emas
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="branchSelect">Filial</Label>
                    <Select 
                      value={selectedBranchId} 
                      onValueChange={setSelectedBranchId}
                    >
                      <SelectTrigger id="branchSelect">
                        <SelectValue placeholder="Filialni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                            {branch.id === branchId && ' (Joriy)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBranchId && selectedBranchId !== branchId && (
                    <Alert>
                      <AlertDescription>
                        Filial almashtirilgandan so'ng, tizim yangi filial ma'lumotlarini yuklaydi.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSwitchBranch}
                    disabled={switchingBranch || !selectedBranchId || selectedBranchId === branchId}
                    className="w-full"
                  >
                    {switchingBranch ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Almashtirilmoqda...
                      </>
                    ) : (
                      'Filialni almashtirish'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: So'nggi faoliyat (Activity Log) */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>
                <Activity className="h-5 w-5 inline mr-2" />
                So'nggi faoliyat
              </CardTitle>
              <CardDescription>
                Oxirgi 20 ta amalingiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activityLogs.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Hozircha faoliyat jurnali bo'sh
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                        {log.payload && (
                          <p className="text-sm text-muted-foreground">
                            {JSON.stringify(log.payload)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Sessiya (Session) */}
        <TabsContent value="session">
          <div className="space-y-6">
            {/* Session info */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Clock className="h-5 w-5 inline mr-2" />
                  Sessiya ma'lumotlari
                </CardTitle>
                <CardDescription>
                  Joriy sessiya va hisob ma'lumotlari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      So'nggi kirish
                    </Label>
                    <p className="text-sm font-medium">
                      {authUser.last_sign_in_at
                        ? format(new Date(authUser.last_sign_in_at), 'dd.MM.yyyy HH:mm')
                        : 'Ma\'lumot yo\'q'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Yaratilgan sana
                    </Label>
                    <p className="text-sm font-medium">
                      {format(new Date(profile.created_at), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Foydalanuvchi nomi
                  </Label>
                  <p className="text-sm font-medium">{profile.fullname || username}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Rol
                  </Label>
                  <p className="text-sm font-medium">{userRole || 'Foydalanuvchi'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <LogOut className="h-5 w-5 inline mr-2" />
                  Tizimdan chiqish
                </CardTitle>
                <CardDescription>
                  Sessiyangizni tugatish va tizimdan chiqish
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Agar kassa smenasi ochiq bo'lsa, chiqishdan oldin uni yopishingiz kerak.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Tizimdan chiqish
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
