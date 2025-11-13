# ⚙️ Sozlamalar (Settings) Moduli - To'liq Qo'llanma

## 📋 Umumiy Ma'lumot

Sozlamalar moduli Supermarket POS tizimidagi barcha global parametrlar, foydalanuvchi huquqlari va interfeys sozlamalarini markaziy boshqarish uchun mo'ljallangan.

## 🎯 Asosiy Xususiyatlar

### ✅ Amalga Oshirilgan Funksiyalar

1. **Umumiy Sozlamalar (General Settings)**
   - Do'kon nomi, telefon, manzil, STIR
   - Valyuta tanlash (UZS, USD, RUB)
   - Minimal zaxira ogohlantirish darajasi
   - Chek pastki matni (receipt footer)

2. **To'lov Turlari (Payment Methods)**
   - Naqd pul (0% komissiya)
   - Karta (sozlanuvchi komissiya)
   - Mobil to'lov (sozlanuvchi komissiya)
   - Qarz/Nasiya (0% komissiya)
   - Har bir to'lov turi uchun faol/nofaol status

3. **Soliq va Chegirma (Tax & Discount)**
   - Soliq stavkasi (QQS %) - 0-100% oralig'ida
   - Avtomatik soliq qo'llash (yoqish/o'chirish)
   - Maksimal chegirma foizi - 0-100% oralig'ida
   - Chegirmani faqat admin berishi (yoqish/o'chirish)
   - Foyda hisoblash usuli (Gross/Net)

4. **Foydalanuvchi Rollari (User Roles)**
   - Administrator - barcha huquqlar
   - Menejer - kengaytirilgan huquqlar
   - Kassir - asosiy POS huquqlari
   - Hisobchi - hisobotlar va balans
   - Har bir rol uchun kirish huquqlari ko'rsatilgan

5. **Bildirishnomalar (Notifications)**
   - Past zaxira ogohlantirishi
   - Smena yopilmagan ogohlantirish
   - Kunlik hisobot (soat 22:00)
   - Qarz to'lov eslatmasi

6. **Zaxira va Ma'lumotlar (Backup & Data)**
   - Avtomatik zaxiralash (yoqish/o'chirish)
   - Zaxira chastotasi (har soatda, kunlik, haftalik, oylik)
   - Ma'lumotlarni eksport qilish (CSV, Excel, PDF)
   - Xavfli amallar (ma'lumotlarni o'chirish)

7. **Xavfsizlik (Security)**
   - Ikki faktorli autentifikatsiya
   - Sessiya muddati (1, 4, 8, 24 soat)
   - Parol murakkabligi talabi
   - Audit log (barcha amallarni yozib borish)

## 🏗️ Texnik Arxitektura

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS settings (
  id bigserial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);
```

### Default Settings

Tizim quyidagi standart sozlamalar bilan ishga tushadi:

```sql
INSERT INTO settings (key, value) VALUES
  ('store_name', 'Supermarket'),
  ('store_address', 'Toshkent, O''zbekiston'),
  ('store_phone', '+998 90 123 45 67'),
  ('store_tin', '123456789'),
  ('tax_rate', '12'),
  ('currency', 'UZS'),
  ('receipt_footer', 'Rahmat! Yana keling!');
```

### API Functions

```typescript
// Barcha sozlamalarni olish
export const getSettings = async (): Promise<Setting[]>

// Bitta sozlamani olish
export const getSetting = async (key: string): Promise<Setting | null>

// Sozlamani yangilash yoki yaratish
export const updateSetting = async (key: string, value: string): Promise<Setting | null>
```

## 🎨 Foydalanuvchi Interfeysi

### Tab Navigation

Sozlamalar 7 ta asosiy bo'limga bo'lingan:

1. **Umumiy** (Store icon) - Do'kon ma'lumotlari
2. **To'lovlar** (CreditCard icon) - To'lov usullari
3. **Soliq** (Percent icon) - Soliq va chegirma
4. **Rollar** (Users icon) - Foydalanuvchi rollari
5. **Bildirishnomalar** (Bell icon) - Xabarlar
6. **Zaxira** (Database icon) - Backup va eksport
7. **Xavfsizlik** (Shield icon) - Xavfsizlik sozlamalari

### Real-time Updates

- Barcha o'zgarishlar avtomatik saqlanadi (onBlur event)
- Muvaffaqiyatli saqlanganda toast xabari ko'rsatiladi
- Xatolik yuz berganda qizil toast xabari ko'rsatiladi

## ✅ Validatsiya Qoidalari

### Raqamli Maydonlar

1. **Soliq stavkasi (tax_rate)**
   - Minimal: 0%
   - Maksimal: 100%
   - Xato xabari: "Soliq stavkasi 0-100% oralig'ida bo'lishi kerak"

2. **Maksimal chegirma (max_discount)**
   - Minimal: 0%
   - Maksimal: 100%
   - Xato xabari: "Chegirma 0-100% oralig'ida bo'lishi kerak"

3. **Komissiya (card_commission, mobile_commission)**
   - Minimal: 0%
   - Maksimal: 100%
   - Xato xabari: "Komissiya 0-100% oralig'ida bo'lishi kerak"

4. **Minimal zaxira ogohlantirishi (min_stock_alert)**
   - Minimal: 0
   - Xato xabari: "Qiymat 0 dan katta bo'lishi kerak"

### Matnli Maydonlar

- Barcha matnli maydonlar ixtiyoriy
- Bo'sh qiymatlar qabul qilinadi
- Maksimal uzunlik cheklanmagan

## 🔐 Xavfsizlik

### Kirish Huquqlari

- Faqat **admin** roli sozlamalarga kirish huquqiga ega
- Boshqa rollar (manager, cashier, accountant) sozlamalarni ko'ra olmaydi
- Route-level protection orqali himoyalangan

### Ma'lumotlar Xavfsizligi

- Barcha o'zgarishlar `updated_at` timestamp bilan saqlanadi
- Xavfli amallar (ma'lumotlarni o'chirish) disabled holatda
- Audit log orqali barcha amallar kuzatiladi (agar yoqilgan bo'lsa)

## 📊 Integratsiya

### Boshqa Modullar Bilan Bog'lanish

1. **POS Module**
   - Soliq stavkasi avtomatik qo'llanadi
   - Maksimal chegirma cheklovi tekshiriladi
   - To'lov usullari va komissiyalar

2. **Inventory Module**
   - Minimal zaxira ogohlantirish darajasi
   - Past zaxira bildirishnomasi

3. **Reports Module**
   - Foyda hisoblash usuli (Gross/Net)
   - Valyuta formati

4. **Cash Shifts Module**
   - Smena yopilmagan ogohlantirish
   - Kunlik hisobot vaqti

## 🚀 Foydalanish Bo'yicha Ko'rsatmalar

### Administrator Uchun

1. **Dastlabki Sozlash**
   - Tizimga admin sifatida kiring
   - Sozlamalar sahifasiga o'ting
   - Do'kon ma'lumotlarini to'ldiring
   - Soliq stavkasini o'rnating
   - To'lov usullarini sozlang

2. **Kundalik Boshqaruv**
   - Bildirishnomalarni tekshiring
   - Zaxira holatini monitoring qiling
   - Foydalanuvchi huquqlarini boshqaring

3. **Xavfsizlik**
   - Ikki faktorli autentifikatsiyani yoqing
   - Sessiya muddatini sozlang
   - Audit log-ni faollashtiring

### Texnik Xodimlar Uchun

1. **Database Backup**
   - Avtomatik zaxiralashni yoqing
   - Zaxira chastotasini tanlang
   - Eksport funksiyalaridan foydalaning

2. **Monitoring**
   - Audit log-ni tekshiring
   - Xatoliklar logini ko'ring
   - Tizim holatini kuzating

## 🐛 Muammolarni Hal Qilish

### Umumiy Muammolar

1. **Sozlamalar yuklanmayapti**
   - Internet aloqasini tekshiring
   - Supabase ulanishini tekshiring
   - Browser console-ni tekshiring

2. **O'zgarishlar saqlanmayapti**
   - Admin huquqiga ega ekanligingizni tekshiring
   - Validatsiya xatolarini tekshiring
   - Network tab-da xatolarni ko'ring

3. **Toast xabarlari ko'rinmayapti**
   - Toaster component App.tsx-da mavjudligini tekshiring
   - Browser notification ruxsatlarini tekshiring

## 📈 Kelajakdagi Rivojlanish

### Rejalashtirilgan Xususiyatlar

1. **Multi-store Support**
   - Har bir filial uchun alohida sozlamalar
   - Markazlashtirilgan boshqaruv

2. **Chek Shabloni Tahrirlash**
   - Logo yuklash
   - Shrift va rang sozlamalari
   - Custom footer matn

3. **Email/SMS Integratsiya**
   - Bildirishnomalarni email orqali yuborish
   - SMS xabarlari yuborish
   - Mijozlarga avtomatik xabarlar

4. **Advanced Permissions**
   - Custom rollar yaratish
   - Granular huquqlar boshqaruvi
   - Role-based field-level security

## 📝 Xulosa

Sozlamalar moduli to'liq ishlaydigan, validatsiya qilingan va foydalanuvchiga qulay interfeys bilan jihozlangan. Barcha asosiy funksiyalar amalga oshirilgan va tizimning boshqa modullari bilan integratsiya qilingan.

### Asosiy Yutuqlar

✅ 7 ta to'liq funksional bo'lim
✅ Real-time saqlash va validatsiya
✅ Uzbek tilida to'liq interfeys
✅ Toast bildirishnomalar
✅ Responsive dizayn
✅ Role-based access control
✅ Database integratsiyasi
✅ Xavfsizlik choralari

---

**Oxirgi yangilanish:** 2025-11-12
**Versiya:** 1.0.0
**Status:** ✅ To'liq amalga oshirilgan
