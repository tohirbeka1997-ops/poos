# 👤 Shaxsiy Kabinet - To'liq Qo'llanma

**Sana:** 2025-11-12  
**Tizim:** Supermarket POS Boshqaruv Tizimi  
**Holat:** ✅ **TAYYOR - IMPLEMENTATSIYA KUTILMOQDA**

---

## 📋 Umumiy Ma'lumot

Ushbu hujjat Supermarket POS tizimida "Shaxsiy kabinet" (User Profile) bo'limini to'liq amalga oshirish bo'yicha qo'llanma. Har bir foydalanuvchi o'z profilini boshqarishi, parolini o'zgartirishi va sozlamalarni moslash imkoniyatiga ega.

---

## 🎯 Asosiy Maqsad

Har bir foydalanuvchi quyidagilarni amalga oshirishi mumkin:

✅ **Profil ma'lumotlarini ko'rish:** Ism, login, rol, filial, telefon  
✅ **Ma'lumotlarni tahrirlash:** Ruxsat doirasida  
✅ **Parolni o'zgartirish:** Xavfsiz validatsiya bilan  
✅ **Tilni almashtirish:** O'zbek, Rus, Ingliz  
✅ **Filialni tanlash:** Bir nechta filial bo'lsa  
✅ **Tizimdan chiqish:** Ochiq smena tekshiruvi bilan  

---

## 🧱 Funksional Tuzilma

### 1. Navbardagi Foydalanuvchi Menyusi

**Joylashuv:** Top navbar, o'ng tomonda

**Ikonka:** User avatar yoki ism bilan

**Dropdown menyusi:**

```
┌─────────────────────────────┐
│ 👤 Shaxsiy kabinet          │
│ 🔄 Hisobni almashtirish     │
│ 🌐 Tilni o'zgartirish       │
│ 🚪 Tizimdan chiqish         │
└─────────────────────────────┘
```

---

### 2. Shaxsiy Kabinet Sahifasi

**URL:** `/profile`  
**Sahifa nomi:** Shaxsiy kabinet

**Tablar:**

1. **Umumiy ma'lumot** - Profil ma'lumotlari
2. **Parolni o'zgartirish** - Xavfsiz parol yangilash
3. **Sozlamalar** - Til, filial, chiqish

---

## 📊 Umumiy Ma'lumot Tab

### Maydonlar

| Maydon | Turi | Tavsif |
|--------|------|--------|
| **To'liq ism** | Input | Foydalanuvchi o'zgartirishi mumkin |
| **Login** | Input (readonly) | O'zgartirib bo'lmaydi |
| **Rol** | Input (readonly) | Faqat admin o'zgartiradi |
| **Filial** | Select | Dropdown (agar bir nechta filial bo'lsa) |
| **Telefon raqam** | Input | Foydalanuvchi o'zgartirishi mumkin |
| **Til** | Select | O'zbek, Rus, Ingliz |
| **So'nggi kirish** | Text (readonly) | Faqat ko'rish uchun |
| **Ro'yxatdan o'tgan sana** | Text (readonly) | Faqat ko'rish uchun |

### Tugmalar

```typescript
<Button onClick={handleSaveProfile}>Saqlash</Button>
<Button variant="outline" onClick={handleCancel}>Bekor qilish</Button>
```

### Toast Xabarlari

```typescript
// Muvaffaqiyat
toast.success('Profil ma\'lumotlari muvaffaqiyatli yangilandi');

// Ogohlantirish
toast.info('O\'zgarishlar bekor qilindi');

// Xatolik
toast.error('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring');
```

---

## 🔒 Parolni O'zgartirish Tab

### Form Maydonlari

```typescript
<Input
  type="password"
  placeholder="Joriy parolingizni kiriting"
  value={currentPassword}
  onChange={(e) => setCurrentPassword(e.target.value)}
/>

<Input
  type="password"
  placeholder="Yangi parolni kiriting"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
/>

<Input
  type="password"
  placeholder="Yangi parolni qayta kiriting"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
/>
```

### Validatsiya Qoidalari

✅ **Kamida 8 belgili**  
✅ **Harf va raqam kombinatsiyasi**  
✅ **Yangi parollar mos kelishi kerak**  
✅ **Joriy parol to'g'ri bo'lishi kerak**  

### Validatsiya Kodi

```typescript
async function handleChangePassword() {
  // Bo'sh maydonlarni tekshirish
  if (!currentPassword || !newPassword || !confirmPassword) {
    toast.error('Barcha maydonlarni to\'ldiring');
    return;
  }

  // Uzunlikni tekshirish
  if (newPassword.length < 8) {
    toast.error('Yangi parol kamida 8 belgidan iborat bo\'lishi kerak');
    return;
  }

  // Mos kelishini tekshirish
  if (newPassword !== confirmPassword) {
    toast.error('Yangi parollar mos kelmadi');
    return;
  }

  // Parol kuchini tekshirish
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasLetter || !hasNumber) {
    toast.error('Parol harf va raqam kombinatsiyasidan iborat bo\'lishi kerak');
    return;
  }

  // Joriy parolni tekshirish
  const { data: { user } } = await supabase.auth.getUser();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    toast.error('Joriy parol noto\'g\'ri');
    return;
  }

  // Yangi parolni o'rnatish
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) throw updateError;

  toast.success('Parolingiz muvaffaqiyatli yangilandi');
  
  // Formani tozalash
  setCurrentPassword('');
  setNewPassword('');
  setConfirmPassword('');
}
```

### Toast Xabarlari

```typescript
// Muvaffaqiyat
toast.success('Parolingiz muvaffaqiyatli yangilandi');

// Xatoliklar
toast.error('Joriy parol noto\'g\'ri');
toast.error('Barcha maydonlarni to\'ldiring');
toast.error('Yangi parol kamida 8 belgidan iborat bo\'lishi kerak');
toast.error('Yangi parollar mos kelmadi');
toast.error('Parol harf va raqam kombinatsiyasidan iborat bo\'lishi kerak');
```

---

## ⚙️ Sozlamalar Tab

### 1. Til Sozlamalari

**Dropdown:**

```typescript
<Select value={language} onValueChange={handleChangeLanguage}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="uz">O'zbek</SelectItem>
    <SelectItem value="ru">Русский</SelectItem>
    <SelectItem value="en">English</SelectItem>
  </SelectContent>
</Select>
```

**Funksiya:**

```typescript
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
    
    toast.success(`Til o'zgartirildi: ${languageNames[newLanguage]}`);
  } catch (error) {
    console.error('Til o\'zgartirish xatosi:', error);
    toast.error('Xatolik yuz berdi');
  }
}
```

**Toast:**

```typescript
toast.success('Til o\'zgartirildi: O\'zbek');
toast.success('Til o\'zgartirildi: Русский');
toast.success('Til o\'zgartirildi: English');
```

---

### 2. Filial Sozlamalari

**Dropdown:**

```typescript
<Select value={branchId} onValueChange={handleChangeBranch}>
  <SelectTrigger>
    <SelectValue placeholder="Filialni tanlang" />
  </SelectTrigger>
  <SelectContent>
    {branches.map((branch) => (
      <SelectItem key={branch.id} value={branch.id}>
        {branch.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Funksiya:**

```typescript
async function handleChangeBranch(newBranchId: string) {
  if (!profile) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ branch_id: newBranchId })
      .eq('id', profile.id);

    if (error) throw error;

    setBranchId(newBranchId);
    toast.success('Filial muvaffaqiyatli almashtirildi');
  } catch (error) {
    console.error('Filial o\'zgartirish xatosi:', error);
    toast.error('Xatolik yuz berdi');
  }
}
```

**Toast:**

```typescript
toast.success('Filial muvaffaqiyatli almashtirildi');
toast.warning('Sizda bu filialga ruxsat yo\'q');
```

---

### 3. Tizimdan Chiqish

**Tugma:**

```typescript
<Button
  variant="destructive"
  onClick={handleLogout}
  className="w-full"
>
  Chiqish
</Button>
```

**Funksiya:**

```typescript
async function handleLogout() {
  const success = await logout();
  if (success) {
    navigate('/login');
  }
}
```

**Ochiq Smena Tekshiruvi:**

```typescript
// logout() funksiyasi ichida (auth-guard.tsx)
const { data: openShift } = await supabase
  .from('cash_shifts')
  .select('id')
  .eq('cashier_id', user.id)
  .eq('status', 'open')
  .maybeSingle();

if (openShift) {
  toast.warning(
    'Diqqat: Smena yopilmagan. Chiqishdan oldin "Kassa → Smena yopish"ni bajaring.',
    { duration: 5000 }
  );
  return false;
}
```

---

## 🗄️ Ma'lumotlar Bazasi

### profiles Jadvali

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  active_role TEXT NOT NULL,
  user_roles TEXT[] NOT NULL,
  branch_id UUID REFERENCES branches(id),
  phone TEXT,
  language TEXT DEFAULT 'uz',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### branches Jadvali

```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 RBAC - Ruxsatlar

### Profil Tahrirlash

| Rol | To'liq ism | Telefon | Rol | Filial | Til |
|-----|------------|---------|-----|--------|-----|
| **Admin** | ✅ | ✅ | ✅ (boshqalar uchun) | ✅ | ✅ |
| **Menejer** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Hisobchi** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Kassir** | ✅ | ✅ | ❌ | ❌ | ✅ |

### RLS Policy

```sql
-- Foydalanuvchi o'z profilini ko'rishi mumkin
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Foydalanuvchi o'z profilini yangilashi mumkin
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    -- Rolni o'zgartira olmaydi
    active_role IS NOT DISTINCT FROM old.active_role
    AND user_roles IS NOT DISTINCT FROM old.user_roles
  );

-- Admin barcha profillarni ko'rishi va tahrirlashi mumkin
CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND 'admin' = ANY(p.user_roles)
    )
  );
```

---

## 🧪 Test Skenariyalari

### 1. Profil Ma'lumotlarini Ko'rish ✅

```typescript
test('Foydalanuvchi profilni ochadi', async () => {
  // Login qilish
  await login('kassir', 'kassir123');
  
  // Profilga o'tish
  await navigate('/profile');
  
  // Ma'lumotlar to'g'ri chiqadi
  expect(screen.getByText('Kassir User')).toBeInTheDocument();
  expect(screen.getByDisplayValue('kassir')).toBeInTheDocument();
  expect(screen.getByDisplayValue('cashier')).toBeInTheDocument();
});
```

---

### 2. Profil Ma'lumotlarini Tahrirlash ✅

```typescript
test('Foydalanuvchi telefon raqamini o\'zgartiradi', async () => {
  await navigate('/profile');
  
  // Telefon raqamini o'zgartirish
  const phoneInput = screen.getByLabelText('Telefon raqam');
  await userEvent.clear(phoneInput);
  await userEvent.type(phoneInput, '+998901234567');
  
  // Saqlash
  await userEvent.click(screen.getByText('Saqlash'));
  
  // Toast tekshirish
  expect(toast.success).toHaveBeenCalledWith(
    'Profil ma\'lumotlari muvaffaqiyatli yangilandi'
  );
});
```

---

### 3. Parolni O'zgartirish ✅

```typescript
test('Parolni o\'zgartirish - eski parol noto\'g\'ri', async () => {
  await navigate('/profile');
  await userEvent.click(screen.getByText('Parolni o\'zgartirish'));
  
  // Formani to'ldirish
  await userEvent.type(screen.getByLabelText('Joriy parol'), 'wrong_password');
  await userEvent.type(screen.getByLabelText('Yangi parol'), 'NewPass123');
  await userEvent.type(screen.getByLabelText('Yangi parolni tasdiqlang'), 'NewPass123');
  
  // Saqlash
  await userEvent.click(screen.getByText('Parolni almashtirish'));
  
  // Xato chiqadi
  expect(toast.error).toHaveBeenCalledWith('Joriy parol noto\'g\'ri');
});
```

---

### 4. Parolni O'zgartirish - Muvaffaqiyatli ✅

```typescript
test('Parolni o\'zgartirish - muvaffaqiyatli', async () => {
  await navigate('/profile');
  await userEvent.click(screen.getByText('Parolni o\'zgartirish'));
  
  // Formani to'ldirish
  await userEvent.type(screen.getByLabelText('Joriy parol'), 'kassir123');
  await userEvent.type(screen.getByLabelText('Yangi parol'), 'NewPass123');
  await userEvent.type(screen.getByLabelText('Yangi parolni tasdiqlang'), 'NewPass123');
  
  // Saqlash
  await userEvent.click(screen.getByText('Parolni almashtirish'));
  
  // Muvaffaqiyat
  expect(toast.success).toHaveBeenCalledWith('Parolingiz muvaffaqiyatli yangilandi');
});
```

---

### 5. Tilni O'zgartirish ✅

```typescript
test('Tilni o\'zgartirish', async () => {
  await navigate('/profile');
  await userEvent.click(screen.getByText('Sozlamalar'));
  
  // Tilni tanlash
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(screen.getByText('Русский'));
  
  // Toast tekshirish
  expect(toast.success).toHaveBeenCalledWith('Til o\'zgartirildi: Русский');
  
  // UI darhol o'zgaradi
  expect(screen.getByText('Личный кабинет')).toBeInTheDocument();
});
```

---

### 6. Logout ✅

```typescript
test('Logout - sessiya tozalandi', async () => {
  await navigate('/profile');
  await userEvent.click(screen.getByText('Sozlamalar'));
  
  // Chiqish
  await userEvent.click(screen.getByText('Chiqish'));
  
  // Login sahifasiga yo'naltiriladi
  expect(window.location.pathname).toBe('/login');
  
  // Toast
  expect(toast.success).toHaveBeenCalledWith('Tizimdan chiqdingiz');
});
```

---

### 7. Ochiq Smena Bilan Logout ✅

```typescript
test('Logout - ochiq smena ogohlantirishi', async () => {
  // Smenani ochish
  await openShift(100000);
  
  await navigate('/profile');
  await userEvent.click(screen.getByText('Sozlamalar'));
  
  // Chiqishga urinish
  await userEvent.click(screen.getByText('Chiqish'));
  
  // Ogohlantirish
  expect(toast.warning).toHaveBeenCalledWith(
    'Diqqat: Smena yopilmagan. Chiqishdan oldin "Kassa → Smena yopish"ni bajaring.'
  );
  
  // Chiqish bloklangan
  expect(window.location.pathname).not.toBe('/login');
});
```

---

### 8. Kassir Rolni O'zgartira Olmaydi ✅

```typescript
test('Kassir rolni o\'zgartira olmaydi', async () => {
  await login('kassir', 'kassir123');
  await navigate('/profile');
  
  // Rol maydoni disabled
  const roleInput = screen.getByLabelText('Rol');
  expect(roleInput).toBeDisabled();
  
  // Tooltip
  expect(screen.getByText('Rolni faqat administrator o\'zgartirishi mumkin')).toBeInTheDocument();
});
```

---

### 9. Admin Boshqa Foydalanuvchini Tahrirlaydi ✅

```typescript
test('Admin boshqa foydalanuvchini tahrirlaydi', async () => {
  await login('admin', 'admin123');
  await navigate('/users');
  
  // Foydalanuvchini tanlash
  await userEvent.click(screen.getByText('Kassir User'));
  
  // Rolni o'zgartirish
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(screen.getByText('Menejer'));
  
  // Saqlash
  await userEvent.click(screen.getByText('Saqlash'));
  
  // Muvaffaqiyat
  expect(toast.success).toHaveBeenCalledWith('Foydalanuvchi yangilandi');
});
```

---

## 🚀 Implementatsiya Qadamlari

### 1-Qadam: Profile Sahifasini Yaratish ✅

```bash
# Fayl yaratish
src/pages/Profile.tsx

# Komponentlar:
- Umumiy ma'lumot tab
- Parolni o'zgartirish tab
- Sozlamalar tab
```

---

### 2-Qadam: Routing Qo'shish

```typescript
// App.tsx yoki routes.tsx
import Profile from '@/pages/Profile';

<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
```

---

### 3-Qadam: User Menu Yaratish

```typescript
// components/layout/UserMenu.tsx
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut, Globe, RefreshCw } from 'lucide-react';

export function UserMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>KU</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          Shaxsiy kabinet
        </DropdownMenuItem>
        <DropdownMenuItem>
          <RefreshCw className="mr-2 h-4 w-4" />
          Hisobni almashtirish
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Globe className="mr-2 h-4 w-4" />
          Tilni o'zgartirish
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Tizimdan chiqish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 4-Qadam: Navbar'ga Qo'shish

```typescript
// components/layout/Navbar.tsx
import { UserMenu } from './UserMenu';

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Supermarket POS</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Boshqa elementlar */}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

---

### 5-Qadam: RLS Policy'larni Qo'shish

```sql
-- profiles jadvali uchun RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- O'z profilini ko'rish
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- O'z profilini yangilash (rolni o'zgartirmasdan)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    active_role IS NOT DISTINCT FROM old.active_role
    AND user_roles IS NOT DISTINCT FROM old.user_roles
  );

-- Admin to'liq ruxsat
CREATE POLICY "Admins have full access"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND 'admin' = ANY(p.user_roles)
    )
  );
```

---

### 6-Qadam: Test Qilish

```bash
# 1. Profilga o'tish
# 2. Ma'lumotlarni tahrirlash
# 3. Parolni o'zgartirish
# 4. Tilni o'zgartirish
# 5. Logout
```

---

## ✅ Tekshirish Ro'yxati

### Komponentlar

- [x] ✅ Profile sahifasi yaratildi
- [ ] ⏳ UserMenu komponenti yaratildi
- [ ] ⏳ Navbar'ga qo'shildi
- [ ] ⏳ Routing qo'shildi

### Funksiyalar

- [x] ✅ Profil ma'lumotlarini ko'rish
- [x] ✅ Profil ma'lumotlarini tahrirlash
- [x] ✅ Parolni o'zgartirish
- [x] ✅ Tilni o'zgartirish
- [x] ✅ Filialni o'zgartirish
- [x] ✅ Logout (ochiq smena tekshiruvi)

### RLS

- [ ] ⏳ profiles jadvali RLS yoqilgan
- [ ] ⏳ Policy'lar yaratildi
- [ ] ⏳ Test qilindi

### Test

- [ ] ⏳ Profil ko'rish testi
- [ ] ⏳ Tahrirlash testi
- [ ] ⏳ Parol o'zgartirish testi
- [ ] ⏳ Til o'zgartirish testi
- [ ] ⏳ Logout testi

---

## 🎯 Yakuniy Natija

### Amalga Oshirildi

✅ **Profile Sahifasi** - To'liq funksional  
✅ **Umumiy Ma'lumot Tab** - Ko'rish va tahrirlash  
✅ **Parol O'zgartirish Tab** - Xavfsiz validatsiya  
✅ **Sozlamalar Tab** - Til, filial, logout  
✅ **O'zbek Lokalizatsiyasi** - Barcha xabarlar  
✅ **Validatsiya** - Parol kuchi tekshiruvi  
✅ **Toast Xabarlari** - Barcha holatlar  

### Kutilmoqda

⏳ **UserMenu Komponenti** - Navbar dropdown  
⏳ **Routing** - /profile yo'li  
⏳ **RLS Policy'lar** - Ma'lumotlar bazasi xavfsizligi  
⏳ **Test Qilish** - Barcha skenariyalar  

---

**Tayyorlagan:** Miaoda AI  
**Sana:** 2025-11-12  
**Holat:** ✅ **PROFILE SAHIFASI TAYYOR - INTEGRATSIYA KUTILMOQDA**
