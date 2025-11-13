# 👤 Foydalanuvchi Menyusi va RBAC Tizimi

**Sana:** 2025-11-12  
**Tizim:** Supermarket POS Boshqaruv Tizimi  
**Holat:** ✅ **MA'LUMOTLAR BAZASI TAYYOR - UI INTEGRATSIYASI KUTILMOQDA**

---

## 📋 Umumiy Ma'lumot

Ushbu hujjat foydalanuvchi menyusi, rol-asoslangan ruxsatlar (RBAC), til va filial tanlash tizimini to'liq tavsiflaydi.

### Amalga Oshirilgan

- ✅ **Ma'lumotlar Bazasi:** Filiallar, rollar, til sozlamalari
- ✅ **Funksiyalar:** Rol, til, filial almashtirish
- ✅ **Qulflash Tizimi:** Ekranni qulflash/ochish
- ✅ **Audit:** Barcha o'zgarishlar loglanadi
- ✅ **Tekshiruvlar:** Ochiq smena, rol ruxsatlari

### Keyingi Qadamlar

- ⏳ **UserMenu Komponenti:** Avatar tugmasi va menyu
- ⏳ **Modal Oynalar:** Parol almashtirish, qulflash
- ⏳ **RBAC Guards:** Yo'nalishlar va komponentlar uchun
- ⏳ **Til Almashtirish:** i18n integratsiyasi

---

## 🗄️ Ma'lumotlar Bazasi Tuzilmasi

### 1. Filiallar Jadvali

```sql
CREATE TABLE branches (
  id BIGSERIAL PRIMARY KEY,
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Standart Ma'lumot:**
```sql
INSERT INTO branches (name, address, is_active) 
VALUES ('Asosiy filial', 'Toshkent', true);
```

### 2. Profiles Jadvali (Yangilangan)

**Yangi Ustunlar:**

| Ustun | Tur | Tavsif |
|-------|-----|--------|
| `user_roles` | text[] | Foydalanuvchining barcha rollari |
| `active_role` | text | Joriy faol rol |
| `branch_id` | BIGINT | Joriy filial |
| `user_language` | text | Interfeys tili (uz/ru/en) |
| `is_locked` | boolean | Ekran qulflangan holati |
| `last_activity` | timestamptz | Oxirgi faollik vaqti |

**CHECK Constraint:**
```sql
ALTER TABLE profiles 
ADD CONSTRAINT profiles_active_role_check 
CHECK (active_role = ANY(user_roles));
```

Bu constraint `active_role` ning `user_roles` massivida bo'lishini ta'minlaydi.

---

## 🔐 RBAC (Role-Based Access Control)

### Rollar va Ruxsatlar

| Rol | O'zbekcha | Ruxsatlar |
|-----|-----------|-----------|
| `admin` | Administrator | Barcha funksiyalar |
| `manager` | Menejer | Sotuvlar, Hisobotlar, Mahsulotlar, Mijozlar, Ombor |
| `accountant` | Hisobchi | Hisobotlar, Kassa, Qaytarishlar (ko'rish), Eksport |
| `cashier` | Kassir | POS, Mijoz tanlash, Qisman/Qarzga sotuv, Chek chop etish |

### Rol Bo'yicha Menyu Bandlari

#### Administrator

```typescript
const adminMenu = [
  { path: '/', label: 'POS' },
  { path: '/products', label: 'Mahsulotlar' },
  { path: '/customers', label: 'Mijozlar' },
  { path: '/sales', label: 'Sotuvlar' },
  { path: '/returns', label: 'Qaytarishlar' },
  { path: '/purchases', label: 'Xaridlar' },
  { path: '/inventory', label: 'Ombor' },
  { path: '/shifts', label: 'Kassa' },
  { path: '/reports', label: 'Hisobotlar' },
  { path: '/settings', label: 'Sozlamalar' },
  { path: '/users', label: 'Foydalanuvchilar' },
];
```

#### Menejer

```typescript
const managerMenu = [
  { path: '/', label: 'POS' },
  { path: '/products', label: 'Mahsulotlar' },
  { path: '/customers', label: 'Mijozlar' },
  { path: '/sales', label: 'Sotuvlar' },
  { path: '/returns', label: 'Qaytarishlar' },
  { path: '/purchases', label: 'Xaridlar' },
  { path: '/inventory', label: 'Ombor' },
  { path: '/shifts', label: 'Kassa' },
  { path: '/reports', label: 'Hisobotlar' },
];
```

#### Hisobchi

```typescript
const accountantMenu = [
  { path: '/sales', label: 'Sotuvlar' },
  { path: '/returns', label: 'Qaytarishlar' },
  { path: '/shifts', label: 'Kassa' },
  { path: '/reports', label: 'Hisobotlar' },
];
```

#### Kassir

```typescript
const cashierMenu = [
  { path: '/', label: 'POS' },
  { path: '/customers', label: 'Mijozlar' },
  { path: '/sales', label: 'Sotuvlar' },
  { path: '/shifts', label: 'Kassa' },
];
```

---

## 🎨 Foydalanuvchi Menyusi (UI)

### Menyu Tuzilmasi

```
┌─────────────────────────────────┐
│ 👤 [Avatar]                     │
├─────────────────────────────────┤
│ 📋 Profilim                     │
│ 🔄 Rolni tanlash ▶              │ (faqat bir nechta rol bo'lsa)
│    ├─ Administrator             │
│    ├─ Menejer                   │
│    ├─ Hisobchi                  │
│    └─ Kassir                    │
│ 🏢 Filialni tanlash ▶           │
│    ├─ Asosiy filial             │
│    └─ Filial 2                  │
│ 🌐 Til ▶                        │
│    ├─ ✓ O'zbek (UZ)             │
│    ├─   Rus (RU)                │
│    └─   Ingliz (EN)             │
│ 🔑 Parolni almashtirish         │
│ 🔒 Qulflash                     │
│ 🚪 Chiqish                      │
└─────────────────────────────────┘
```

### Komponent Tuzilmasi

```
src/
  components/
    user-menu/
      UserMenu.tsx           ← Asosiy menyu komponenti
      RoleSelector.tsx       ← Rol tanlash
      BranchSelector.tsx     ← Filial tanlash
      LanguageSelector.tsx   ← Til tanlash
      ChangePasswordModal.tsx ← Parol almashtirish
      LockScreenModal.tsx    ← Qulflash ekrani
```

---

## 🔧 Funksiyalar va API

### 1. Rolni O'zgartirish

**Funksiya:** `switch_user_role(p_user_id, p_new_role)`

**Frontend Chaqiruv:**
```typescript
const switchRole = async (newRole: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('switch_user_role', {
    p_user_id: user?.id,
    p_new_role: newRole,
  });
  
  if (error) {
    toast.error('Xatolik yuz berdi');
    return;
  }
  
  if (!data.success) {
    toast.error(data.message); // "Sizda bu rolga o'tish huquqi yo'q"
    return;
  }
  
  toast.success(data.message); // "Rol muvaffaqiyatli o'zgartirildi"
  
  // Sahifani yangilash yoki sessiyani yangilash
  window.location.reload();
};
```

**Javob:**
```json
{
  "success": true,
  "message": "Rol muvaffaqiyatli o'zgartirildi",
  "active_role": "manager"
}
```

### 2. Tilni O'zgartirish

**Funksiya:** `switch_user_language(p_user_id, p_language)`

**Frontend Chaqiruv:**
```typescript
const switchLanguage = async (language: 'uz' | 'ru' | 'en') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('switch_user_language', {
    p_user_id: user?.id,
    p_language: language,
  });
  
  if (error) {
    toast.error('Xatolik yuz berdi');
    return;
  }
  
  // i18n tilini o'zgartirish
  i18n.changeLanguage(language);
  
  // Local storage ga saqlash
  localStorage.setItem('language', language);
  
  const languageNames = {
    uz: "O'zbek",
    ru: 'Rus',
    en: 'Ingliz',
  };
  
  toast.success(`Til o'zgartirildi: ${languageNames[language]}`);
};
```

**Javob:**
```json
{
  "success": true,
  "message": "Til o'zgartirildi",
  "language": "uz"
}
```

### 3. Filialni O'zgartirish

**Funksiya:** `switch_user_branch(p_user_id, p_branch_id)`

**Frontend Chaqiruv:**
```typescript
const switchBranch = async (branchId: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('switch_user_branch', {
    p_user_id: user?.id,
    p_branch_id: branchId,
  });
  
  if (error) {
    toast.error('Xatolik yuz berdi');
    return;
  }
  
  if (!data.success) {
    toast.error(data.message); // "Filial topilmadi yoki nofaol"
    return;
  }
  
  toast.success(data.message); // "Filial o'zgartirildi"
  
  // Kontekstni yangilash
  window.location.reload();
};
```

**Javob:**
```json
{
  "success": true,
  "message": "Filial o'zgartirildi",
  "branch_id": 1
}
```

### 4. Ekranni Qulflash

**Funksiya:** `lock_user_screen(p_user_id)`

**Frontend Chaqiruv:**
```typescript
const lockScreen = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.rpc('lock_user_screen', {
    p_user_id: user?.id,
  });
  
  if (error) {
    toast.error('Xatolik yuz berdi');
    return;
  }
  
  // Qulflash modalini ko'rsatish
  setShowLockModal(true);
  
  toast.info(data.message); // "Tizim qulflandi"
};
```

### 5. Ekranni Ochish

**Funksiya:** `unlock_user_screen(p_user_id)`

**Frontend Chaqiruv:**
```typescript
const unlockScreen = async (password: string) => {
  // Parolni tekshirish (Supabase Auth)
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });
  
  if (authError) {
    toast.error('Parol noto\'g\'ri');
    return;
  }
  
  // Qulfni ochish
  const { data, error } = await supabase.rpc('unlock_user_screen', {
    p_user_id: user?.id,
  });
  
  if (error) {
    toast.error('Xatolik yuz berdi');
    return;
  }
  
  setShowLockModal(false);
  toast.success(data.message); // "Tizim ochildi"
};
```

### 6. Ochiq Smenani Tekshirish

**Funksiya:** `check_open_shift(p_cashier_id)`

**Frontend Chaqiruv:**
```typescript
const handleLogout = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Ochiq smenani tekshirish
  const { data: shiftCheck } = await supabase.rpc('check_open_shift', {
    p_cashier_id: user?.id,
  });
  
  if (shiftCheck?.has_open_shift) {
    // Ogohlantirish ko'rsatish
    const confirmed = await confirm({
      title: 'Diqqat!',
      description: shiftCheck.message,
      confirmText: 'Baribir chiqish',
      cancelText: 'Bekor qilish',
    });
    
    if (!confirmed) return;
  }
  
  // Chiqish
  await supabase.auth.signOut();
  toast.success('Tizimdan chiqdingiz');
  navigate('/login');
};
```

---

## 📝 Parol Almashtirish

### Modal Tuzilmasi

```typescript
interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async () => {
    // Validatsiya
    if (newPassword !== confirmPassword) {
      toast.error('Parollar mos kelmaydi');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }
    
    // Supabase Auth API
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      toast.error('Parolni o\'zgartirishda xatolik');
      return;
    }
    
    // Audit log
    await supabase.rpc('change_user_password', {
      p_user_id: user?.id,
    });
    
    toast.success('Parol muvaffaqiyatli yangilandi');
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parolni almashtirish</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Joriy parol</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Yangi parol</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Parolni tasdiqlang</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔒 Qulflash Ekrani

### Modal Tuzilmasi

```typescript
interface LockScreenModalProps {
  open: boolean;
  user: any;
}

function LockScreenModal({ open, user }: LockScreenModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleUnlock = async () => {
    setLoading(true);
    
    // Parolni tekshirish
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });
    
    if (authError) {
      toast.error('Parol noto\'g\'ri');
      setLoading(false);
      return;
    }
    
    // Qulfni ochish
    const { data, error } = await supabase.rpc('unlock_user_screen', {
      p_user_id: user.id,
    });
    
    if (error) {
      toast.error('Xatolik yuz berdi');
      setLoading(false);
      return;
    }
    
    toast.success(data.message);
    setPassword('');
    setLoading(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose>
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tizim qulflandi</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Davom etish uchun parolingizni kiriting
            </p>
          </div>
          <div className="space-y-2">
            <Label>Parol</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
          </div>
          <Button
            onClick={handleUnlock}
            disabled={loading || !password}
            className="w-full"
          >
            {loading ? 'Tekshirilmoqda...' : 'Ochish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🛡️ RBAC Guards

### Route Guard

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!allowedRoles.includes(profile?.active_role)) {
      toast.error('Sizda bu sahifaga kirish huquqi yo\'q');
      navigate('/');
    }
  }, [user, profile, allowedRoles]);
  
  if (!user || !allowedRoles.includes(profile?.active_role)) {
    return null;
  }
  
  return <>{children}</>;
}

// Ishlatish
<Route
  path="/settings"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <Settings />
    </ProtectedRoute>
  }
/>
```

### Component Guard

```typescript
interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { profile } = useAuth();
  
  if (!allowedRoles.includes(profile?.active_role)) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

// Ishlatish
<RoleGuard allowedRoles={['admin', 'manager']}>
  <Button onClick={handleDelete}>O'chirish</Button>
</RoleGuard>
```

---

## 🌐 Til Almashtirish

### i18n Konfiguratsiyasi

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationsUz from './translations.uz.json';
import translationsRu from './translations.ru.json';
import translationsEn from './translations.en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: translationsUz },
      ru: { translation: translationsRu },
      en: { translation: translationsEn },
    },
    lng: localStorage.getItem('language') || 'uz',
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Til Tanlash Komponenti

```typescript
function LanguageSelector() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  
  const languages = [
    { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];
  
  const handleLanguageChange = async (langCode: string) => {
    await switchLanguage(langCode);
    setCurrentLang(langCode);
  };
  
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Globe className="mr-2 h-4 w-4" />
        <span>Til</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLang === lang.code && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
```

---

## ✅ Tekshirish Ro'yxati

### Ma'lumotlar Bazasi

- [x] ✅ Filiallar jadvali yaratildi
- [x] ✅ Profiles jadvaliga yangi ustunlar qo'shildi
- [x] ✅ CHECK constraint qo'shildi
- [x] ✅ Rol almashtirish funksiyasi yaratildi
- [x] ✅ Til almashtirish funksiyasi yaratildi
- [x] ✅ Filial almashtirish funksiyasi yaratildi
- [x] ✅ Qulflash funksiyalari yaratildi
- [x] ✅ Ochiq smena tekshirish funksiyasi yaratildi
- [x] ✅ Indekslar qo'shildi

### Frontend (Bajarilishi Kerak)

- [ ] ⏳ UserMenu komponenti yaratish
- [ ] ⏳ RoleSelector komponenti yaratish
- [ ] ⏳ BranchSelector komponenti yaratish
- [ ] ⏳ LanguageSelector komponenti yaratish
- [ ] ⏳ ChangePasswordModal yaratish
- [ ] ⏳ LockScreenModal yaratish
- [ ] ⏳ ProtectedRoute guard yaratish
- [ ] ⏳ RoleGuard komponenti yaratish
- [ ] ⏳ Header komponentiga UserMenu qo'shish
- [ ] ⏳ Routes'ga RBAC qo'shish
- [ ] ⏳ i18n til almashtirish integratsiyasi

---

## 📊 Xabarlar (Toast Messages)

### Muvaffaqiyatli Xabarlar

```typescript
const successMessages = {
  roleChanged: 'Rol muvaffaqiyatli o\'zgartirildi',
  languageChanged: 'Til o\'zgartirildi',
  branchChanged: 'Filial o\'zgartirildi',
  passwordChanged: 'Parol muvaffaqiyatli yangilandi',
  screenLocked: 'Tizim qulflandi',
  screenUnlocked: 'Tizim ochildi',
  loggedOut: 'Tizimdan chiqdingiz',
};
```

### Xatolik Xabarlari

```typescript
const errorMessages = {
  noPermission: 'Sizda bu rolga o\'tish huquqi yo\'q',
  invalidLanguage: 'Noto\'g\'ri til kodi',
  branchNotFound: 'Filial topilmadi yoki nofaol',
  wrongPassword: 'Parol noto\'g\'ri',
  passwordMismatch: 'Parollar mos kelmaydi',
  passwordTooShort: 'Parol kamida 6 belgidan iborat bo\'lishi kerak',
  unknownError: 'Xatolik yuz berdi',
};
```

### Ogohlantirish Xabarlari

```typescript
const warningMessages = {
  openShift: 'Diqqat: Smena yopilmagan. Chiqishdan oldin \'Kassa → Smena yopish\'ni bajaring.',
  confirmLock: 'Haqiqatan tizimni qulflamoqchimisiz?',
  confirmLogout: 'Tizimdan chiqmoqchimisiz?',
};
```

---

## 🎯 Yakuniy Holat

### Maqsad

To'liq funksional foydalanuvchi menyusi:
- ✅ Rol almashtirish (bir nechta rol bo'lsa)
- ✅ Filial tanlash
- ✅ Til almashtirish (uz/ru/en)
- ✅ Parol almashtirish
- ✅ Ekranni qulflash
- ✅ Xavfsiz chiqish (ochiq smena tekshiruvi)

### Natija

```
┌─────────────────────────────────┐
│ 👤 Ali Valiyev (Kassir)         │
├─────────────────────────────────┤
│ ✅ Rol: Kassir                  │
│ ✅ Filial: Asosiy filial        │
│ ✅ Til: O'zbek                  │
│ ✅ Barcha funksiyalar ishlaydi  │
└─────────────────────────────────┘
```

---

**Tayyorlagan:** Miaoda AI  
**Sana:** 2025-11-12  
**Holat:** ✅ **MA'LUMOTLAR BAZASI TAYYOR - UI INTEGRATSIYASI KUTILMOQDA**
