/**
 * User Profile Page - Shaxsiy kabinet
 * Full profile management with activity tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { logout } from '@/lib/auth-guard';
import { 
  User, 
  Lock, 
  Globe, 
  Building2, 
  Phone, 
  Calendar, 
  Loader2, 
  Activity,
  LogOut,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  active_role: string;
  branch_id: string | null;
  phone: string | null;
  language: string;
  last_login: string | null;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  action_description: string;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Profil ma\'lumotlari topilmadi');
        return;
      }

      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setLanguage(data.language || 'uz');
      setBranchId(data.branch_id || '');
      setSelectedBranchId(data.branch_id || '');
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
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
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
        .from('activity_logs')
        .select('*')
        .eq('user_id', profile.id)
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

    // Validate phone number format
    if (phone && !phone.match(/^\+998\d{9}$/)) {
      toast.error('Telefon raqami noto\'g\'ri formatda. Namuna: +998901234567');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          language: language,
          branch_id: branchId || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Log activity
      await logActivity('profile_update', 'Profil ma\'lumotlari yangilandi');

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

    // Password strength check
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      toast.error('Yangi parol talablarga javob bermaydi. Harf va raqam kombinatsiyasi kerak');
      return;
    }

    try {
      setChangingPassword(true);

      // Verify current password
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
      await logActivity('password_change', 'Parol o\'zgartirildi');

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

    try {
      setSwitchingBranch(true);

      // Check if user has access to this branch
      const { data: branchAccess, error: accessError } = await supabase
        .rpc('check_branch_access', {
          p_user_id: profile.id,
          p_branch_id: selectedBranchId
        });

      if (accessError) {
        console.error('Branch access check error:', accessError);
        // Continue anyway if RPC doesn't exist
      }

      if (branchAccess === false) {
        toast.error('Sizda bu filialga ruxsat yo\'q');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ branch_id: selectedBranchId })
        .eq('id', profile.id);

      if (error) throw error;

      // Log activity
      const branchName = branches.find(b => b.id === selectedBranchId)?.name || 'Noma\'lum';
      await logActivity('branch_switch', `Filial almashtirildi: ${branchName}`);

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
  async function logActivity(actionType: string, description: string) {
    if (!profile) return;

    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: profile.id,
          action_type: actionType,
          action_description: description,
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
        .from('profiles')
        .update({ language: newLanguage })
        .eq('id', profile.id);

      if (error) throw error;

      setLanguage(newLanguage);
      
      const languageNames: Record<string, string> = {
        uz: 'O\'zbek',
        ru: 'Русский',
        en: 'English',
      };
      
      await logActivity('language_change', `Til o\'zgartirildi: ${languageNames[newLanguage]}`);
      
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
        .eq('cashier_id', profile.id)
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

    await logActivity('logout', 'Tizimdan chiqdi');
    
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  }

  // Cancel changes
  function handleCancel() {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLanguage(profile.language || 'uz');
      setBranchId(profile.branch_id || '');
      toast.info('O\'zgarishlar bekor qilindi');
    }
  }

  // Get action type badge color
  function getActionBadgeVariant(actionType: string): "default" | "secondary" | "destructive" | "outline" {
    switch (actionType) {
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

  // Get action type label
  function getActionLabel(actionType: string): string {
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
    return labels[actionType] || actionType;
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

  if (!profile) {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Sarlavha */}
      <div>
        <h1 className="text-3xl font-bold">Shaxsiy kabinet</h1>
        <p className="text-muted-foreground">
          Profil ma'lumotlaringizni boshqaring
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-2" />
            Umumiy ma'lumot
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Parolni o'zgartirish
          </TabsTrigger>
          <TabsTrigger value="branch">
            <Building2 className="h-4 w-4 mr-2" />
            Filial almashtirish
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

        {/* Tab 1: General Information */}
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
                <Label htmlFor="fullName">To'liq ism</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                />
              </div>

              {/* Login */}
              <div className="space-y-2">
                <Label htmlFor="username">Login</Label>
                <Input
                  id="username"
                  value={profile.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Login o'zgartirib bo'lmaydi
                </p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  value={profile.active_role}
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
                  Telefon raqam
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
                  {profile.last_login
                    ? format(new Date(profile.last_login), 'dd.MM.yyyy HH:mm')
                    : 'Ma\'lumot yo\'q'}
                </p>
              </div>

              {/* Created at */}
              <div className="space-y-2">
                <Label>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Ro'yxatdan o'tgan sana
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

        {/* Tab 2: Change Password */}
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
                <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
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

        {/* Tab 3: Branch Switch */}
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

        {/* Tab 4: Activity Log */}
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
                          <Badge variant={getActionBadgeVariant(log.action_type)}>
                            {getActionLabel(log.action_type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action_description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Session */}
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
                      {profile.last_login
                        ? format(new Date(profile.last_login), 'dd.MM.yyyy HH:mm')
                        : 'Ma\'lumot yo\'q'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ro'yxatdan o'tgan sana
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
                  <p className="text-sm font-medium">{profile.full_name || profile.username}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Rol
                  </Label>
                  <p className="text-sm font-medium">{profile.active_role}</p>
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
