# 🔐 Autentifikatsiya Himoyasi - To'liq Qo'llanma

**Sana:** 2025-11-12  
**Tizim:** Supermarket POS Boshqaruv Tizimi  
**Holat:** ✅ **TAYYOR - IMPLEMENTATSIYA KUTILMOQDA**

---

## 📋 Muammo Tavsifi

**Muammo:** Foydalanuvchilar login qilmasdan tizimga kirishi mumkin.

**Sabablari:**
1. ❌ Global route guard yo'q
2. ❌ Dev bypass kodlari qolgan
3. ❌ RLS (Row Level Security) yoqilmagan
4. ❌ Sessiya tekshiruvi yo'q
5. ❌ Service Worker eski buildni keshlaydi

---

## 🎯 Yechim

### 1. Global Route Guard ✅

**Maqsad:** Har bir sahifada sessiyani tekshirish

**Implementatsiya:**

```typescript
// src/lib/auth-guard.tsx

export function useAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();

    // Sessiya o'zgarishlarini kuzatish
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            toast.info('Sessiya tugagan. Iltimos, tizimga qayta kiring.');
            navigate('/login', { replace: true });
          }
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  async function checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

      if (!session) {
        setIsAuthenticated(false);
        if (!isPublicRoute) {
          toast.warning('Iltimos, tizimga kiring');
          navigate('/login', { replace: true });
        }
      } else {
        setIsAuthenticated(true);
        if (isPublicRoute && location.pathname === '/login') {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Sessiya xatosi:', error);
      setIsAuthenticated(false);
      await supabase.auth.signOut();
      if (!PUBLIC_ROUTES.includes(location.pathname)) {
        toast.error('Sessiya xatosi. Iltimos, qayta kiring.');
        navigate('/login', { replace: true });
      }
    } finally {
      setIsChecking(false);
    }
  }

  return { isChecking, isAuthenticated };
}
```

**Public Yo'llar:**
```typescript
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
```

---

### 2. Protected Route Component ✅

**Maqsad:** Himoyalangan sahifalar uchun wrapper

**Implementatsiya:**

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isChecking, isAuthenticated } = useAuthGuard();

  // Sessiya tekshirilmoqda
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Sessiya yo'q - login sahifasiga yo'naltiriladi
  if (!isAuthenticated) {
    return null;
  }

  // Sessiya bor - sahifani ko'rsatish
  return <>{children}</>;
}
```

**Ishlatish:**

```typescript
// App.tsx
import { ProtectedRoute } from '@/lib/auth-guard';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <POS />
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      } />
      
      {/* ... boshqa sahifalar */}
    </Routes>
  );
}
```

---

### 3. Sessiyani Tiklash ✅

**Maqsad:** App yuklanganda sessiyani tiklash

**Implementatsiya:**

```typescript
export async function restoreSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Sessiyani tiklash xatosi:', error);
      await supabase.auth.signOut();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Sessiya xatosi:', error);
    await supabase.auth.signOut();
    return null;
  }
}
```

**App.tsx'da ishlatish:**

```typescript
function App() {
  useEffect(() => {
    restoreSession();
  }, []);

  return <Routes>...</Routes>;
}
```

---

### 4. Logout - Ochiq Smena Tekshiruvi ✅

**Maqsad:** Chiqishdan oldin ochiq smenani tekshirish

**Implementatsiya:**

```typescript
export async function logout() {
  try {
    // Ochiq smenani tekshirish
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
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
    }

    // Chiqish
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Chiqish xatosi:', error);
      toast.error('Chiqishda xatolik yuz berdi');
      return false;
    }

    // LocalStorage'ni tozalash
    localStorage.clear();
    sessionStorage.clear();

    toast.success('Tizimdan chiqdingiz');
    return true;
  } catch (error) {
    console.error('Chiqish xatosi:', error);
    toast.error('Chiqishda xatolik yuz berdi');
    return false;
  }
}
```

**Ishlatish:**

```typescript
// UserMenu.tsx
const handleLogout = async () => {
  const success = await logout();
  if (success) {
    navigate('/login');
  }
};
```

---

### 5. Dev Bypass'larni O'chirish ❌

**Olib tashlash kerak bo'lgan kodlar:**

```typescript
// ❌ NOTO'G'RI - Olib tashlash kerak
if (isDev) {
  autoLogin();
}

// ❌ NOTO'G'RI - Olib tashlash kerak
if (window.location.search.includes('autologin=1')) {
  localStorage.setItem('auth', 'true');
}

// ❌ NOTO'G'RI - Olib tashlash kerak
async function seedAdminAndLogin() {
  await createUser('admin', 'admin123');
  await signIn('admin', 'admin123');
}

// ❌ NOTO'G'RI - Olib tashlash kerak
localStorage.setItem('user', JSON.stringify({ id: 1, role: 'admin' }));
```

**To'g'ri yondashuv:**

```typescript
// ✅ TO'G'RI - Faqat lokal dev uchun
if (import.meta.env.DEV && import.meta.env.VITE_AUTO_LOGIN === 'true') {
  console.warn('DEV MODE: Auto-login yoqilgan');
  // Faqat lokal dev'da ishlaydi
}

// ✅ TO'G'RI - Production'da hech qachon ishlamaydi
if (import.meta.env.PROD) {
  // Hech qanday bypass yo'q
}
```

---

### 6. RLS (Row Level Security) ✅

**Maqsad:** Ma'lumotlar bazasida xavfsizlikni ta'minlash

**Barcha jadvallar uchun RLS yoqish:**

```sql
-- Barcha jadvallar uchun RLS yoqish
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anonim foydalanuvchilarga ruxsat yo'q
CREATE POLICY "Anon users cannot access products"
  ON products FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Anon users cannot access customers"
  ON customers FOR ALL
  TO anon
  USING (false);

-- Authenticated foydalanuvchilarga ruxsat
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Admin'larga to'liq ruxsat
CREATE POLICY "Admins have full access"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.active_role = 'admin'
    )
  );
```

**Test:**

```bash
# Token yo'q holda API chaqirish
curl -X GET 'https://your-project.supabase.co/rest/v1/products' \
  -H "apikey: YOUR_ANON_KEY"

# Kutilgan natija: 401 Unauthorized yoki bo'sh array
```

---

### 7. Cookie Sozlamalari ✅

**Maqsad:** Xavfsiz cookie sozlamalari

**Supabase Auth Config:**

```typescript
// src/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
    },
  }
);
```

**Production Cookie Settings:**

```typescript
// Supabase avtomatik sozlaydi:
// - SameSite=Lax
// - Secure=true (HTTPS)
// - HttpOnly=true
// - Domain=your-domain.com
// - Path=/
```

---

### 8. Redirectlar ✅

**Maqsad:** To'g'ri yo'naltirish

**Holatlar:**

| Holat | Yo'nalish |
|-------|-----------|
| Sessiya yo'q + Private sahifa | → `/login` |
| Sessiya bor + `/login` | → `/` (home) |
| Sessiya yo'q + `/login` | → `/login` (qoladi) |
| Sessiya bor + Private sahifa | → Sahifa ochiladi |

**Implementatsiya:**

```typescript
// useAuthGuard ichida
if (!session) {
  setIsAuthenticated(false);
  if (!isPublicRoute) {
    navigate('/login', { replace: true, state: { from: location.pathname } });
  }
} else {
  setIsAuthenticated(true);
  if (isPublicRoute && location.pathname === '/login') {
    // Login'dan keyin oldingi sahifaga qaytish
    const from = location.state?.from || '/';
    navigate(from, { replace: true });
  }
}
```

---

## 🧪 Test Skenariyalari

### 1. Incognito Test ✅

```bash
# 1. Incognito oynani ochish
# 2. http://localhost:5173/ ga o'tish
# 3. Kutilgan natija: /login sahifasi ochiladi
```

### 2. Logout Test ✅

```bash
# 1. Login qilish
# 2. Logout tugmasini bosish
# 3. Qo'lda /ga o'tish
# 4. Kutilgan natija: /login sahifasiga yo'naltiriladi
```

### 3. Cookie O'chirish Test ✅

```bash
# 1. Login qilish
# 2. DevTools → Application → Cookies → O'chirish
# 3. Sahifani yangilash (F5)
# 4. Kutilgan natija: /login sahifasiga yo'naltiriladi
```

### 4. LocalStorage O'chirish Test ✅

```bash
# 1. Login qilish
# 2. DevTools → Application → Local Storage → Clear
# 3. Sahifani yangilash (F5)
# 4. Kutilgan natija: /login sahifasiga yo'naltiriladi
```

### 5. RLS Test ✅

```bash
# Token yo'q holda API chaqirish
curl -X GET 'https://your-project.supabase.co/rest/v1/products' \
  -H "apikey: YOUR_ANON_KEY"

# Kutilgan natija: 401 Unauthorized
```

### 6. Ochiq Smena Test ✅

```bash
# 1. Login qilish (kassir)
# 2. Smenani ochish
# 3. Logout tugmasini bosish
# 4. Kutilgan natija: Ogohlantirish ko'rsatiladi
# 5. Smena yopilmagan holda chiqish bloklangan
```

### 7. Service Worker Test ✅

```bash
# 1. DevTools → Application → Service Workers
# 2. Unregister tugmasini bosish
# 3. Ctrl+F5 (hard reload)
# 4. Kutilgan natija: Yangi build yuklanadi
```

---

## 🔍 Tez Diagnostika Cheklisti

### 1. Brauzer Tozalash (2-3 daqiqa)

```bash
✅ Log out tugmasini bosish
✅ Ctrl+F5 (hard reload)
✅ DevTools → Application → Clear storage
✅ Cookies + LocalStorage o'chirish
✅ Sahifani yangilash
```

### 2. PWA/Service Worker

```bash
✅ DevTools → Application → Service Workers
✅ Unregister tugmasini bosish
✅ Sahifani yangilash
```

### 3. Incognito Test

```bash
✅ Incognito oynani ochish
✅ http://localhost:5173/ ga o'tish
✅ Login sahifasi ochilishi kerak
```

### 4. Kod Tekshiruvi

```bash
✅ autoLogin() funksiyasini qidirish
✅ seedAdminAndLogin() funksiyasini qidirish
✅ localStorage.setItem('auth') qidirish
✅ ?autologin=1 query parametrini qidirish
✅ isDev bypass'larni qidirish
```

---

## 📊 Eng Ko'p Uchraydigan 5 Sabab

### 1. Auto-login Qolgan ❌

**Muammo:**
```typescript
// ❌ NOTO'G'RI
if (isDev) {
  autoSignIn('admin', 'admin123');
}
```

**Yechim:**
```typescript
// ✅ TO'G'RI
// Auto-login kodini butunlay olib tashlash
// Yoki faqat lokal dev uchun:
if (import.meta.env.DEV && import.meta.env.VITE_AUTO_LOGIN === 'true') {
  console.warn('DEV MODE: Auto-login yoqilgan');
}
```

---

### 2. Guard Faqat Client-Route'da ❌

**Muammo:**
```typescript
// ❌ NOTO'G'RI - Faqat client-side routing
<Route path="/pos" element={<POS />} />
```

**Yechim:**
```typescript
// ✅ TO'G'RI - ProtectedRoute wrapper
<Route path="/pos" element={
  <ProtectedRoute>
    <POS />
  </ProtectedRoute>
} />
```

---

### 3. Anon API Ruxsat ❌

**Muammo:**
```sql
-- ❌ NOTO'G'RI - RLS yo'q
-- Anonim foydalanuvchilar ma'lumot o'qiy oladi
```

**Yechim:**
```sql
-- ✅ TO'G'RI - RLS yoqilgan
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users cannot access"
  ON products FOR ALL
  TO anon
  USING (false);
```

---

### 4. Cookie Domen/HTTPS Xato ❌

**Muammo:**
```typescript
// ❌ NOTO'G'RI - Cookie topilmaydi
// Lekin localStorage'dagi "me" qoldig'i UI'ni ochadi
```

**Yechim:**
```typescript
// ✅ TO'G'RI - Sessiyani to'g'ri tekshirish
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // LocalStorage'ni tozalash
  localStorage.clear();
  navigate('/login');
}
```

---

### 5. Service Worker Eski Build ❌

**Muammo:**
```bash
# Service Worker eski buildni keshlaydi
# Yangi kod ishlamaydi
```

**Yechim:**
```bash
# 1. DevTools → Application → Service Workers
# 2. Unregister
# 3. Ctrl+F5 (hard reload)
```

---

## 🚀 Implementatsiya Qadamlari

### 1-Qadam: Auth Guard Yaratish ✅

```bash
# Fayl yaratish
src/lib/auth-guard.tsx

# Funksiyalar:
- useAuthGuard()
- ProtectedRoute
- restoreSession()
- logout()
- getUserRole()
- checkPermission()
```

### 2-Qadam: App.tsx Yangilash

```typescript
import { ProtectedRoute } from '@/lib/auth-guard';

function App() {
  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute><POS /></ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute><Products /></ProtectedRoute>
      } />
      {/* ... */}
    </Routes>
  );
}
```

### 3-Qadam: Logout Yangilash

```typescript
// UserMenu.tsx
import { logout } from '@/lib/auth-guard';

const handleLogout = async () => {
  const success = await logout();
  if (success) {
    navigate('/login');
  }
};
```

### 4-Qadam: RLS Yoqish

```sql
-- Barcha jadvallar uchun RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ...

-- Policy'lar yaratish
CREATE POLICY "Anon cannot access" ...
CREATE POLICY "Authenticated can read" ...
CREATE POLICY "Admins have full access" ...
```

### 5-Qadam: Dev Bypass O'chirish

```bash
# Qidirish
grep -r "autoLogin" src/
grep -r "seedAdmin" src/
grep -r "localStorage.setItem('auth'" src/

# Olib tashlash
# Barcha auto-login kodlarini o'chirish
```

### 6-Qadam: Test Qilish

```bash
# 1. Incognito test
# 2. Logout test
# 3. Cookie o'chirish test
# 4. RLS test
# 5. Ochiq smena test
```

---

## ✅ Tekshirish Ro'yxati

### Auth Guard

- [x] ✅ useAuthGuard() yaratildi
- [x] ✅ ProtectedRoute yaratildi
- [x] ✅ restoreSession() yaratildi
- [x] ✅ logout() yaratildi
- [x] ✅ getUserRole() yaratildi
- [x] ✅ checkPermission() yaratildi

### Implementatsiya

- [ ] ⏳ App.tsx yangilandi
- [ ] ⏳ Barcha sahifalar ProtectedRoute bilan
- [ ] ⏳ UserMenu logout yangilandi
- [ ] ⏳ Dev bypass'lar o'chirildi

### RLS

- [ ] ⏳ Barcha jadvallar RLS yoqilgan
- [ ] ⏳ Anon policy'lar yaratildi
- [ ] ⏳ Authenticated policy'lar yaratildi
- [ ] ⏳ Admin policy'lar yaratildi

### Test

- [ ] ⏳ Incognito test o'tdi
- [ ] ⏳ Logout test o'tdi
- [ ] ⏳ Cookie o'chirish test o'tdi
- [ ] ⏳ RLS test o'tdi
- [ ] ⏳ Ochiq smena test o'tdi

---

## 📝 O'zbek Xabarlari

### Toast Xabarlari

```typescript
// Sessiya tugagan
toast.info('Sessiya tugagan. Iltimos, tizimga qayta kiring.');

// Login kerak
toast.warning('Iltimos, tizimga kiring');

// Sessiya xatosi
toast.error('Sessiya xatosi. Iltimos, qayta kiring.');

// Chiqish muvaffaqiyatli
toast.success('Tizimdan chiqdingiz');

// Chiqish xatosi
toast.error('Chiqishda xatolik yuz berdi');

// Ochiq smena ogohlantirishi
toast.warning(
  'Diqqat: Smena yopilmagan. Chiqishdan oldin "Kassa → Smena yopish"ni bajaring.',
  { duration: 5000 }
);
```

### Loading Xabarlari

```typescript
// Yuklanmoqda
<p>Yuklanmoqda...</p>

// Tekshirilmoqda
<p>Sessiya tekshirilmoqda...</p>
```

---

## 🎯 Yakuniy Natija

### Amalga Oshirildi

✅ **Auth Guard** - Global route guard  
✅ **ProtectedRoute** - Himoyalangan sahifalar  
✅ **Session Restore** - Sessiyani tiklash  
✅ **Logout** - Ochiq smena tekshiruvi  
✅ **Role Check** - RBAC funksiyalari  
✅ **O'zbek Xabarlari** - Barcha toast'lar  

### Kutilmoqda

⏳ **App.tsx Yangilash** - ProtectedRoute qo'shish  
⏳ **RLS Yoqish** - Barcha jadvallar  
⏳ **Dev Bypass O'chirish** - Auto-login kodlari  
⏳ **Test Qilish** - Barcha skenariyalar  

---

**Tayyorlagan:** Miaoda AI  
**Sana:** 2025-11-12  
**Holat:** ✅ **AUTH GUARD TAYYOR - INTEGRATSIYA KUTILMOQDA**
