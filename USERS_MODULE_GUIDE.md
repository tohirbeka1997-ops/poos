# 👥 Foydalanuvchilar Moduli - To'liq Qo'llanma

## 📋 Umumiy Ma'lumot

**Modul nomi:** Foydalanuvchilar (Users)  
**Maqsad:** Supermarket POS tizimidagi barcha foydalanuvchilarni, ularning rollarini va kirish huquqlarini boshqarish  
**Versiya:** 1.0.0  
**Til:** O'zbek

---

## 🎯 Asosiy Funksiyalar

### 1. Foydalanuvchilarni Ko'rish
- Barcha foydalanuvchilar ro'yxati
- Jadval formatida ko'rsatish
- Real-time ma'lumotlar yangilanishi

### 2. Foydalanuvchi Qo'shish (CRUD - Create)
- Yangi foydalanuvchi yaratish
- Email va parol bilan ro'yxatdan o'tkazish
- Rol va huquqlarni belgilash
- Chegirma limitini sozlash

### 3. Foydalanuvchini Tahrirlash (CRUD - Update)
- Foydalanuvchi ma'lumotlarini yangilash
- Rolni o'zgartirish
- Chegirma limitini o'zgartirish

### 4. Foydalanuvchini O'chirish (CRUD - Delete)
- Foydalanuvchini tizimdan o'chirish
- Admin foydalanuvchini o'chirishni bloklash
- Tasdiqlash dialogi

### 5. Foydalanuvchini Bloklash/Faollashtirish
- Foydalanuvchi holatini o'zgartirish
- Bloklangan foydalanuvchi tizimga kira olmaydi
- Faollashtirilgan foydalanuvchi tizimga kirishi mumkin

### 6. Qidirish va Filtrlash
- Ism bo'yicha qidirish
- Login bo'yicha qidirish
- Rol bo'yicha filtrlash
- Holat bo'yicha filtrlash (Faol/Bloklangan)

### 7. Eksport
- Foydalanuvchilar ro'yxatini eksport qilish
- Excel/PDF formatlarida

---

## 🗂️ Jadval Tuzilmasi

### Ustunlar

| Ustun | Tavsif | Turi | Majburiy |
|-------|--------|------|----------|
| To'liq ism | Foydalanuvchining to'liq ismi | Text | Ha |
| Login | Foydalanuvchi login nomi | Text | Yo'q |
| Rol | Foydalanuvchi roli | Enum | Ha |
| Holat | Faol yoki Bloklangan | Boolean | Ha |
| So'nggi kirish | Oxirgi tizimga kirish vaqti | Timestamp | Yo'q |
| Yaratilgan | Foydalanuvchi yaratilgan sana | Timestamp | Ha |
| Amallar | Tahrirlash, Bloklash, O'chirish | Actions | - |

---

## 👤 Rollar va Huquqlar (RBAC)

### 1. Administrator (admin)
**Imkoniyatlar:**
- ✅ Barcha bo'limlarni tahrirlay oladi
- ✅ Barcha foydalanuvchilarni boshqaradi
- ✅ Tizim sozlamalarini o'zgartiradi
- ✅ Hisobotlarni ko'radi va eksport qiladi
- ✅ Mahsulotlar va ombor boshqaruvi
- ✅ Mijozlar boshqaruvi
- ✅ Kassa va shift boshqaruvi
- ✅ To'liq huquq

**Badge rangi:** Default (ko'k)

### 2. Menejer (manager)
**Imkoniyatlar:**
- ✅ Mahsulot va ombor boshqaruvi
- ✅ Xarid (purchase) boshqaruvi
- ✅ Mijozlar boshqaruvi
- ✅ Hisobotlarni ko'rish
- ✅ Kassirlarni nazorat qilish
- ❌ Tizim sozlamalarini o'zgartira olmaydi
- ❌ Foydalanuvchilarni boshqara olmaydi

**Badge rangi:** Secondary (kulrang)

### 3. Kassir (cashier)
**Imkoniyatlar:**
- ✅ POS (sotuv) moduli
- ✅ Qaytarish (refund) moduli
- ✅ O'z shiftini boshqarish
- ✅ Mijozlarni ko'rish
- ❌ Mahsulot qo'sha olmaydi
- ❌ Hisobotlarni ko'ra olmaydi
- ❌ Sozlamalarni o'zgartira olmaydi

**Badge rangi:** Outline (oq)

**Chegirma limiti:** Maksimal chegirma foizi (masalan: 10%)

### 4. Hisobchi (accountant)
**Imkoniyatlar:**
- ✅ Hisobotlarni ko'rish
- ✅ Moliyaviy ma'lumotlarni ko'rish
- ❌ Sotuv qila olmaydi
- ❌ Mahsulot qo'sha olmaydi
- ❌ Sozlamalarni o'zgartira olmaydi

**Badge rangi:** Outline (oq)

---

## 📝 Foydalanuvchi Qo'shish

### Forma Maydonlari

#### 1. To'liq ism * (Majburiy)
- **Turi:** Text input
- **Placeholder:** "Ism Familiya"
- **Validatsiya:** Bo'sh bo'lmasligi kerak
- **Misol:** "Alisher Navoiy"

#### 2. Login (Ixtiyoriy)
- **Turi:** Text input
- **Placeholder:** "username"
- **Validatsiya:** Unikal bo'lishi kerak
- **Misol:** "alisher_n"

#### 3. Email * (Majburiy)
- **Turi:** Email input
- **Placeholder:** "email@example.com"
- **Validatsiya:** 
  - Bo'sh bo'lmasligi kerak
  - Email formatida bo'lishi kerak
  - Unikal bo'lishi kerak
- **Misol:** "alisher@example.com"

#### 4. Parol * (Majburiy)
- **Turi:** Password input
- **Placeholder:** "Kamida 8 ta belgi"
- **Validatsiya:** 
  - Bo'sh bo'lmasligi kerak
  - Kamida 8 ta belgidan iborat bo'lishi kerak
- **Misol:** "SecurePass123"

#### 5. Rol * (Majburiy)
- **Turi:** Select dropdown
- **Variantlar:**
  - Administrator
  - Menejer
  - Kassir
  - Hisobchi
- **Default:** Kassir

#### 6. Chegirma limiti (Ixtiyoriy)
- **Turi:** Number input
- **Placeholder:** "0"
- **Validatsiya:** 
  - 0 dan 100 gacha
  - Faqat kassirlar uchun
- **Default:** 0
- **Misol:** 10 (10% chegirma)

### Validatsiya Qoidalari

1. **Email unikalligi:**
   - Bir xil email bilan ikki foydalanuvchi bo'lishi mumkin emas
   - Xato: "Bu email allaqachon ro'yxatdan o'tgan"

2. **Parol uzunligi:**
   - Kamida 8 ta belgi
   - Xato: "Parol kamida 8 ta belgidan iborat bo'lishi kerak"

3. **Majburiy maydonlar:**
   - To'liq ism, Email, Parol
   - Xato: "Barcha majburiy maydonlarni to'ldiring"

4. **Chegirma limiti:**
   - 0 dan 100 gacha
   - Xato: "Chegirma limiti 0-100% oralig'ida bo'lishi kerak"

---

## ✏️ Foydalanuvchini Tahrirlash

### Tahrirlash Mumkin Bo'lgan Maydonlar

1. **To'liq ism** - O'zgartirilishi mumkin
2. **Login** - O'zgartirilishi mumkin
3. **Rol** - O'zgartirilishi mumkin
4. **Chegirma limiti** - O'zgartirilishi mumkin

### Tahrirlash Mumkin Bo'lmagan Maydonlar

1. **Email** - O'zgartirilmaydi (Supabase Auth cheklovi)
2. **Parol** - Alohida parol tiklash funksiyasi orqali

### Tahrirlash Jarayoni

1. Foydalanuvchi qatorida "Tahrirlash" tugmasini bosing
2. Dialog oynasi ochiladi
3. Kerakli maydonlarni o'zgartiring
4. "Saqlash" tugmasini bosing
5. Toast xabari ko'rsatiladi: "Foydalanuvchi ma'lumotlari yangilandi"

---

## 🗑️ Foydalanuvchini O'chirish

### O'chirish Qoidalari

1. **Admin foydalanuvchini o'chirib bo'lmaydi**
   - Xato: "Administrator foydalanuvchini o'chirib bo'lmaydi"

2. **Tasdiqlash dialogi**
   - "Haqiqatan ham bu foydalanuvchini o'chirmoqchimisiz?"
   - "Bu amalni qaytarib bo'lmaydi"

3. **O'chirish jarayoni**
   - Supabase Auth dan o'chiriladi
   - Profiles jadvalidan avtomatik o'chiriladi (CASCADE)
   - Barcha bog'liq ma'lumotlar saqlanadi (created_by null ga o'zgaradi)

### O'chirish Jarayoni

1. Foydalanuvchi qatorida "O'chirish" tugmasini bosing
2. Tasdiqlash dialogi ochiladi
3. "O'chirish" tugmasini bosing
4. Toast xabari ko'rsatiladi: "Foydalanuvchi o'chirildi"

---

## 🔒 Bloklash va Faollashtirish

### Bloklash

**Maqsad:** Foydalanuvchini vaqtincha tizimdan chiqarish

**Jarayon:**
1. Foydalanuvchi qatorida "Bloklash" tugmasini bosing
2. `is_active` false ga o'zgaradi
3. Toast xabari: "Foydalanuvchi bloklandi"

**Natija:**
- Foydalanuvchi tizimga kira olmaydi
- Barcha ma'lumotlar saqlanadi
- Keyinchalik faollashtirilishi mumkin

### Faollashtirish

**Maqsad:** Bloklangan foydalanuvchini qayta faollashtirish

**Jarayon:**
1. Bloklangan foydalanuvchi qatorida "Faollashtirish" tugmasini bosing
2. `is_active` true ga o'zgaradi
3. Toast xabari: "Foydalanuvchi faollashtirildi"

**Natija:**
- Foydalanuvchi tizimga kirishi mumkin
- Barcha huquqlar qayta tiklanadi

---

## 🔍 Qidirish va Filtrlash

### Qidirish

**Maydon:** Qidirish input
**Placeholder:** "Ism yoki login bo'yicha..."

**Qidirish bo'yicha:**
- To'liq ism
- Login

**Misol:**
- "Alisher" - barcha Alisher ismli foydalanuvchilar
- "admin" - login "admin" bo'lgan foydalanuvchilar

### Filtrlash

#### 1. Rol bo'yicha filtrlash

**Variantlar:**
- Barchasi (default)
- Administrator
- Menejer
- Kassir
- Hisobchi

#### 2. Holat bo'yicha filtrlash

**Variantlar:**
- Barchasi (default)
- Faol
- Bloklangan

### Filtrlarni Tozalash

**Tugma:** "Tozalash"

**Amal:**
- Qidirish maydonini tozalaydi
- Barcha filtrlarni "Barchasi" ga o'rnatadi
- Barcha foydalanuvchilarni ko'rsatadi

---

## 📊 Eksport

### Eksport Funksiyasi

**Tugma:** "Eksport"
**Icon:** Download

**Formatlar:**
- Excel (.xlsx)
- PDF (.pdf)

**Eksport qilinadigan ma'lumotlar:**
- To'liq ism
- Login
- Email
- Rol
- Holat
- So'nggi kirish
- Yaratilgan sana

**Fayl nomi formati:**
- `foydalanuvchilar_YYYY-MM-DD.xlsx`
- `foydalanuvchilar_YYYY-MM-DD.pdf`

---

## 🔐 Xavfsizlik

### Parol Xavfsizligi

1. **Parol shifrlash:**
   - Supabase Auth orqali avtomatik shifrlash
   - bcrypt algoritmi
   - Parollar hech qachon ochiq ko'rinishda saqlanmaydi

2. **Parol talablari:**
   - Kamida 8 ta belgi
   - Katta va kichik harflar (tavsiya etiladi)
   - Raqamlar (tavsiya etiladi)
   - Maxsus belgilar (tavsiya etiladi)

### Kirish Nazorati

1. **Rol-based access control (RBAC):**
   - Har bir rol uchun aniq huquqlar
   - Foydalanuvchi faqat o'z huquqlari doirasida ishlaydi

2. **Sessiya boshqaruvi:**
   - Avtomatik logout (sozlamalarda belgilanadi)
   - Faol sessiyalar nazorati
   - Bir vaqtda bir qurilmada kirish (opsional)

### Audit Log

1. **Kuzatuv:**
   - Foydalanuvchi yaratildi
   - Foydalanuvchi tahrirlandi
   - Foydalanuvchi o'chirildi
   - Foydalanuvchi bloklandi/faollashtirildi

2. **Ma'lumotlar:**
   - Kim amalga oshirdi (created_by)
   - Qachon amalga oshirildi (created_at, updated_at)
   - Qanday o'zgarishlar bo'ldi

---

## 🗄️ Database Tuzilmasi

### profiles jadval

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  role user_role DEFAULT 'cashier'::user_role NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  discount_limit numeric(5,2) DEFAULT 0
);
```

### Maydonlar Tavsifi

| Maydon | Turi | Tavsif | Default |
|--------|------|--------|---------|
| id | uuid | Foydalanuvchi ID (auth.users ga bog'langan) | - |
| username | text | Login nomi | null |
| full_name | text | To'liq ism | null |
| role | user_role | Foydalanuvchi roli | cashier |
| is_active | boolean | Faol/Bloklangan holat | true |
| created_at | timestamptz | Yaratilgan sana | now() |
| last_login | timestamptz | So'nggi kirish vaqti | null |
| created_by | uuid | Kim yaratdi | null |
| discount_limit | numeric(5,2) | Chegirma limiti (%) | 0 |

### Indexlar

```sql
CREATE INDEX idx_profiles_last_login ON profiles(last_login);
CREATE INDEX idx_profiles_created_by ON profiles(created_by);
```

### RPC Funksiyalar

```sql
CREATE OR REPLACE FUNCTION update_last_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET last_login = now()
  WHERE id = user_id;
END;
$$;
```

---

## 🔌 API Funksiyalar

### 1. getProfiles()

**Maqsad:** Barcha foydalanuvchilarni olish

**Parametrlar:** Yo'q

**Qaytaradi:** `Promise<Profile[]>`

**Misol:**
```typescript
const users = await getProfiles();
```

### 2. getProfile(id)

**Maqsad:** Bitta foydalanuvchini olish

**Parametrlar:**
- `id: string` - Foydalanuvchi ID

**Qaytaradi:** `Promise<Profile | null>`

**Misol:**
```typescript
const user = await getProfile('uuid-here');
```

### 3. updateProfile(id, updates)

**Maqsad:** Foydalanuvchini yangilash

**Parametrlar:**
- `id: string` - Foydalanuvchi ID
- `updates: Partial<Profile>` - Yangilanish ma'lumotlari

**Qaytaradi:** `Promise<Profile | null>`

**Misol:**
```typescript
await updateProfile('uuid-here', {
  full_name: 'Yangi Ism',
  role: 'manager',
});
```

### 4. deleteProfile(id)

**Maqsad:** Foydalanuvchini o'chirish

**Parametrlar:**
- `id: string` - Foydalanuvchi ID

**Qaytaradi:** `Promise<void>`

**Misol:**
```typescript
await deleteProfile('uuid-here');
```

### 5. updateLastLogin(userId)

**Maqsad:** So'nggi kirish vaqtini yangilash

**Parametrlar:**
- `userId: string` - Foydalanuvchi ID

**Qaytaradi:** `Promise<void>`

**Misol:**
```typescript
await updateLastLogin('uuid-here');
```

---

## 🎨 UI Komponentlar

### Ishlatilgan shadcn/ui Komponentlar

1. **Card** - Asosiy konteyner
2. **Table** - Foydalanuvchilar jadvali
3. **Dialog** - Qo'shish/Tahrirlash oynalari
4. **AlertDialog** - O'chirish tasdiqlash
5. **Button** - Barcha tugmalar
6. **Input** - Matn kiritish
7. **Select** - Dropdown tanlov
8. **Badge** - Rol va holat ko'rsatkichlari
9. **Label** - Forma yorliqlari

### Lucide React Icons

- **UsersIcon** - Asosiy icon
- **UserPlus** - Qo'shish tugmasi
- **Edit** - Tahrirlash tugmasi
- **Trash2** - O'chirish tugmasi
- **Lock** - Bloklash tugmasi
- **Unlock** - Faollashtirish tugmasi
- **Search** - Qidirish icon
- **Download** - Eksport tugmasi

---

## 📱 Responsive Dizayn

### Mobile (< 768px)
- Jadval gorizontal scroll
- Filtrlar vertikal joylashgan
- Tugmalar to'liq kenglikda

### Tablet (768px - 1280px)
- 2 ustunli filtrlar
- Jadval to'liq ko'rinadi
- Optimal spacing

### Desktop (> 1280px)
- 4 ustunli filtrlar (2xl:grid-cols-4)
- Keng jadval
- Barcha elementlar bir ekranda

---

## ⚠️ Xato Xabarlari

### Validatsiya Xatolari

1. **"Barcha majburiy maydonlarni to'ldiring"**
   - Sabab: To'liq ism, Email yoki Parol kiritilmagan
   - Yechim: Barcha * belgili maydonlarni to'ldiring

2. **"Parol kamida 8 ta belgidan iborat bo'lishi kerak"**
   - Sabab: Parol juda qisqa
   - Yechim: Kamida 8 ta belgidan iborat parol kiriting

3. **"Administrator foydalanuvchini o'chirib bo'lmaydi"**
   - Sabab: Admin rolini o'chirishga urinish
   - Yechim: Faqat admin bo'lmagan foydalanuvchilarni o'chiring

### API Xatolari

1. **"Foydalanuvchilarni yuklashda xatolik yuz berdi"**
   - Sabab: Database ulanish xatosi
   - Yechim: Internet aloqasini tekshiring

2. **"Foydalanuvchi qo'shishda xatolik yuz berdi"**
   - Sabab: Email allaqachon mavjud yoki boshqa xato
   - Yechim: Boshqa email kiriting

3. **"Foydalanuvchini tahrirlashda xatolik yuz berdi"**
   - Sabab: Database yangilash xatosi
   - Yechim: Qayta urinib ko'ring

4. **"Foydalanuvchini o'chirishda xatolik yuz berdi"**
   - Sabab: Supabase Auth xatosi
   - Yechim: Admin huquqlaringizni tekshiring

5. **"Holatni o'zgartirishda xatolik yuz berdi"**
   - Sabab: Database yangilash xatosi
   - Yechim: Qayta urinib ko'ring

---

## ✅ Muvaffaqiyat Xabarlari

1. **"Foydalanuvchi muvaffaqiyatli qo'shildi"**
   - Yangi foydalanuvchi yaratildi

2. **"Foydalanuvchi ma'lumotlari yangilandi"**
   - Foydalanuvchi tahrirlandi

3. **"Foydalanuvchi o'chirildi"**
   - Foydalanuvchi tizimdan o'chirildi

4. **"Foydalanuvchi bloklandi"**
   - Foydalanuvchi bloklandi

5. **"Foydalanuvchi faollashtirildi"**
   - Foydalanuvchi faollashtirildi

6. **"Foydalanuvchilar ro'yxati yuklab olinmoqda..."**
   - Eksport jarayoni boshlandi

---

## 🧪 Test Ssenariylar

### 1. Foydalanuvchi Qo'shish Testi

**Qadamlar:**
1. "Yangi foydalanuvchi" tugmasini bosing
2. Barcha majburiy maydonlarni to'ldiring
3. "Qo'shish" tugmasini bosing

**Kutilgan natija:**
- ✅ Foydalanuvchi yaratildi
- ✅ Toast xabari ko'rsatildi
- ✅ Jadvalda yangi foydalanuvchi ko'rinadi

### 2. Foydalanuvchini Tahrirlash Testi

**Qadamlar:**
1. Foydalanuvchi qatorida "Tahrirlash" tugmasini bosing
2. Ismni o'zgartiring
3. "Saqlash" tugmasini bosing

**Kutilgan natija:**
- ✅ Foydalanuvchi yangilandi
- ✅ Toast xabari ko'rsatildi
- ✅ Jadvalda yangi ism ko'rinadi

### 3. Foydalanuvchini O'chirish Testi

**Qadamlar:**
1. Admin bo'lmagan foydalanuvchi qatorida "O'chirish" tugmasini bosing
2. Tasdiqlash dialogida "O'chirish" tugmasini bosing

**Kutilgan natija:**
- ✅ Foydalanuvchi o'chirildi
- ✅ Toast xabari ko'rsatildi
- ✅ Jadvalda foydalanuvchi ko'rinmaydi

### 4. Admin O'chirish Testi

**Qadamlar:**
1. Admin foydalanuvchi qatorida "O'chirish" tugmasini bosing
2. Tasdiqlash dialogida "O'chirish" tugmasini bosing

**Kutilgan natija:**
- ❌ Xato xabari ko'rsatildi
- ❌ Admin o'chirilmadi

### 5. Bloklash/Faollashtirish Testi

**Qadamlar:**
1. Faol foydalanuvchi qatorida "Bloklash" tugmasini bosing
2. Bloklangan foydalanuvchi qatorida "Faollashtirish" tugmasini bosing

**Kutilgan natija:**
- ✅ Holat o'zgartirildi
- ✅ Toast xabari ko'rsatildi
- ✅ Badge rangi o'zgartirildi

### 6. Qidirish Testi

**Qadamlar:**
1. Qidirish maydoniga "Alisher" kiriting

**Kutilgan natija:**
- ✅ Faqat "Alisher" ismli foydalanuvchilar ko'rsatiladi

### 7. Filtrlash Testi

**Qadamlar:**
1. Rol filtriga "Kassir" tanlang
2. Holat filtriga "Faol" tanlang

**Kutilgan natija:**
- ✅ Faqat faol kassirlar ko'rsatiladi

---

## 📚 Qo'shimcha Resurslar

### Dokumentatsiya
- Supabase Auth: https://supabase.com/docs/guides/auth
- shadcn/ui: https://ui.shadcn.com
- React: https://react.dev

### Muammolarni Hal Qilish
- Agar foydalanuvchi qo'shilmasa, email unikal ekanligini tekshiring
- Agar parol qabul qilinmasa, kamida 8 ta belgi ekanligini tekshiring
- Agar admin o'chirilmasa, bu normal - adminni o'chirib bo'lmaydi

---

**Oxirgi yangilanish:** 2025-11-12  
**Versiya:** 1.0.0  
**Muallif:** Miaoda AI
