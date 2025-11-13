# Supermarket POS Tizimi - Amalga Oshirilgan Funksiyalar

## ✅ To'liq Amalga Oshirilgan Modullar

### 1. Autentifikatsiya va Foydalanuvchi Boshqaruvi
- ✅ Foydalanuvchi nomi va parol orqali kirish
- ✅ Ro'yxatdan o'tish
- ✅ Birinchi foydalanuvchi avtomatik admin bo'ladi
- ✅ Rol asosida ruxsatlar (Admin, Manager, Cashier, Accountant)
- ✅ Profil boshqaruvi
- ✅ Chiqish funksiyasi

### 2. POS (Sotuv) Interfeysi - TO'LIQ FUNKSIONAL
**Mahsulot Qidirish:**
- ✅ Nom bo'yicha qidirish
- ✅ Shtrix-kod bo'yicha qidirish
- ✅ SKU bo'yicha qidirish
- ✅ Real-time qidiruv

**Savat Boshqaruvi:**
- ✅ Mahsulot qo'shish
- ✅ Miqdorni o'zgartirish (+/- tugmalar)
- ✅ Chegirma qo'shish (har bir mahsulotga)
- ✅ Mahsulotni o'chirish
- ✅ Savat tozalash

**To'lov Turlari:**
- ✅ Naqd to'lov
- ✅ Karta to'lov
- ✅ Mobil to'lov
- ✅ Qisman to'lov (mijoz majburiy)
- ✅ Qarzga sotish (mijoz majburiy)

**Validatsiya:**
- ✅ Savat bo'sh bo'lmasligi
- ✅ Har bir mahsulot miqdori >= 1
- ✅ Miqdor <= ombor zaxirasi
- ✅ Naqd/Karta/Mobil: qabul qilingan >= jami
- ✅ Qisman/Qarzga: mijoz majburiy
- ✅ Barcha summalar to'g'ri formatda

**Hisob-kitoblar:**
- ✅ Subtotal (jami)
- ✅ Chegirma
- ✅ Soliq (avtomatik hisoblash)
- ✅ Umumiy summa
- ✅ Qaytim (change)
- ✅ Qarz (debt)

**Mijoz Tanlash:**
- ✅ Mijoz qidirish
- ✅ Mijoz tanlash
- ✅ Mijoz ma'lumotlarini ko'rsatish

**Ma'lumotlar Bazasi Integratsiyasi:**
- ✅ Sotuv yaratish
- ✅ Sotuv elementlarini saqlash
- ✅ To'lovlarni qayd qilish
- ✅ Ombor zaxirasini avtomatik kamaytirish
- ✅ Chek raqami generatsiyasi

### 3. Mahsulotlar Boshqaruvi - TO'LIQ FUNKSIONAL
**CRUD Operatsiyalar:**
- ✅ Mahsulotlar ro'yxati
- ✅ Yangi mahsulot qo'shish
- ✅ Mahsulotni tahrirlash
- ✅ Mahsulotni o'chirish

**Mahsulot Ma'lumotlari:**
- ✅ Nom
- ✅ SKU kodi
- ✅ Shtrix-kod
- ✅ Kategoriya
- ✅ O'lchov birligi (dona, kg, litr, quti, paket, metr)
- ✅ Sotuv narxi
- ✅ Tannarx (cost price)
- ✅ Soliq foizi
- ✅ Zaxira (stock)
- ✅ Minimal zaxira
- ✅ Holat (faol/nofaol)

**Qidiruv va Filtrlar:**
- ✅ Nom bo'yicha qidirish
- ✅ SKU bo'yicha qidirish
- ✅ Shtrix-kod bo'yicha qidirish
- ✅ Kategoriya bo'yicha filtrlash

**Kategoriya Boshqaruvi:**
- ✅ Kategoriya yaratish
- ✅ Kategoriya nomi va tavsifi
- ✅ Mahsulotlarni kategoriyaga biriktirish

**Vizual Ko'rsatkichlar:**
- ✅ Kam zaxira ogohlantirishlari (AlertTriangle icon)
- ✅ Faol/Nofaol holat ko'rsatkichlari
- ✅ Narx va tannarx ko'rsatish
- ✅ Jadval ko'rinishi

### 4. Mijozlar Boshqaruvi - TO'LIQ FUNKSIONAL
**CRUD Operatsiyalar:**
- ✅ Mijozlar ro'yxati
- ✅ Yangi mijoz qo'shish
- ✅ Mijozni tahrirlash
- ✅ Mijozni o'chirish

**Mijoz Ma'lumotlari:**
- ✅ Ism
- ✅ Telefon raqami
- ✅ Mijoz kodi
- ✅ Balans (qarz/avans)
- ✅ Bonus ballar

**Qidiruv:**
- ✅ Nom bo'yicha qidirish
- ✅ Telefon bo'yicha qidirish
- ✅ Kod bo'yicha qidirish

**Statistika:**
- ✅ Jami mijozlar soni
- ✅ Qarzdorlar soni
- ✅ Jami qarz summasi

**Vizual Ko'rsatkichlar:**
- ✅ Qarz (qizil rang)
- ✅ Avans (yashil rang)
- ✅ Bonus ballar (sariq rang)

### 5. Kassa (Shift) Boshqaruvi - TO'LIQ FUNKSIONAL
**Shift Operatsiyalari:**
- ✅ Kassani ochish
- ✅ Kassani yopish
- ✅ Boshlang'ich summa kiritish
- ✅ Yakuniy summa kiritish
- ✅ Farqni avtomatik hisoblash
- ✅ Izoh qoldirish

**Shift Validatsiyasi:**
- ✅ Shift ochilmagan bo'lsa sotuvga ruxsat bermaslik
- ✅ Har bir kassir o'z shiftini boshqaradi
- ✅ Bir vaqtda faqat bitta ochiq shift

**Shift Tarixi:**
- ✅ Barcha shiftlar ro'yxati
- ✅ Ochilgan va yopilgan vaqt
- ✅ Boshlang'ich va yakuniy summa
- ✅ Farq ko'rsatkichi
- ✅ Holat (ochiq/yopiq)

### 6. Ma'lumotlar Bazasi
**Jadvallar:**
- ✅ profiles (foydalanuvchilar)
- ✅ products (mahsulotlar)
- ✅ categories (kategoriyalar)
- ✅ customers (mijozlar)
- ✅ sales (sotuvlar)
- ✅ sale_items (sotuv elementlari)
- ✅ payments (to'lovlar)
- ✅ returns (qaytarishlar)
- ✅ purchases (xaridlar)
- ✅ purchase_items (xarid elementlari)
- ✅ stock_moves (ombor harakatlari)
- ✅ cash_shifts (kassa smenalari)

**Trigger'lar va Funksiyalar:**
- ✅ Yangi foydalanuvchi uchun profil yaratish
- ✅ Birinchi foydalanuvchini admin qilish
- ✅ Chek raqami generatsiyasi
- ✅ Ombor harakatlari avtomatik yozilishi

**RLS (Row Level Security):**
- ✅ Foydalanuvchilar o'z profillarini ko'rishi
- ✅ Adminlar barcha ma'lumotlarni ko'rishi
- ✅ Xavfsiz ma'lumotlar bazasi

## ⚠️ Qisman Amalga Oshirilgan

### 7. Boshqa Sahifalar (Placeholder)
- ⚠️ Sotuvlar tarixi (Sales)
- ⚠️ Qaytarishlar (Returns)
- ⚠️ Xaridlar (Purchases)
- ⚠️ Ombor (Inventory)
- ⚠️ Hisobotlar (Reports)
- ⚠️ Sozlamalar (Settings)
- ⚠️ Foydalanuvchilar (Users)

**Eslatma:** Bu sahifalar uchun barcha API funksiyalari `src/db/api.ts` faylida mavjud!

## 🎨 Dizayn va UI/UX

### Dizayn Tizimi
- ✅ Zamonaviy ko'k rang sxemasi (#2563eb)
- ✅ shadcn/ui komponentlari
- ✅ Tailwind CSS
- ✅ Responsive dizayn
- ✅ Dark mode qo'llab-quvvatlash

### Komponentlar
- ✅ Header (navigatsiya, foydalanuvchi menyusi)
- ✅ Card komponentlari
- ✅ Dialog (modal) komponentlari
- ✅ Input va Form komponentlari
- ✅ Button komponentlari
- ✅ Select (dropdown) komponentlari
- ✅ Toast (xabar) komponentlari

### Ikonlar
- ✅ Lucide React ikonlari
- ✅ Har bir modul uchun mos ikonlar
- ✅ Holat ko'rsatkichlari

## 🔒 Xavfsizlik

- ✅ Parollar xavfsiz shifrlangan
- ✅ Rol asosida ruxsatlar
- ✅ JWT token autentifikatsiyasi
- ✅ RLS (Row Level Security)
- ✅ Xavfsiz API so'rovlari

## 💰 Valyuta va Formatlar

- ✅ UZS (O'zbek so'mi)
- ✅ Barcha summalar tiyin (1/100 so'm) da saqlanadi
- ✅ Interfeyda so'm ko'rinishida ko'rsatiladi
- ✅ Formatlangan raqamlar (1,000 so'm)
- ✅ To'g'ri hisob-kitoblar

## 📝 Validatsiya

### POS Validatsiyasi
```typescript
// Savat bo'sh bo'lmasligi
if (cart.length === 0) {
  toast({ title: 'Xato', description: 'Savat bo\'sh' });
  return;
}

// Ombor zaxirasini tekshirish
if (qty > product.stock) {
  toast({ title: 'Xato', description: 'Omborda yetarli mahsulot yo\'q' });
  return;
}

// To'lov validatsiyasi
if ((paymentType === 'cash' || paymentType === 'card' || paymentType === 'mobile') && received < total) {
  toast({ title: 'Xato', description: 'Qabul qilingan summa yetarli emas' });
  return;
}

// Mijoz validatsiyasi
if ((paymentType === 'partial' || paymentType === 'debt') && !selectedCustomer) {
  toast({ title: 'Xato', description: 'Qisman to\'lov yoki qarzga sotish uchun mijozni tanlang' });
  return;
}
```

### Mahsulot Validatsiyasi
```typescript
// Nom majburiy
if (!formData.name.trim()) {
  toast({ title: 'Xato', description: 'Mahsulot nomini kiriting' });
  return;
}

// Narx majburiy va musbat
if (!formData.sale_price || Number(formData.sale_price) <= 0) {
  toast({ title: 'Xato', description: 'Sotuv narxini kiriting' });
  return;
}
```

## 🚀 Texnologiyalar

- **Frontend:** React 18 + TypeScript
- **UI Library:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Autentifikatsiya:** Supabase Auth
- **State Management:** React Hooks
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Build Tool:** Vite

## 📊 Hisob-kitob Formulalari

### POS Hisob-kitoblari
```typescript
// Subtotal
const subtotal = cart.reduce((sum, item) => sum + (item.product.sale_price * item.qty), 0);

// Chegirma
const discount = cart.reduce((sum, item) => sum + item.discount, 0);

// Soliq
const tax = cart.reduce((sum, item) => sum + item.tax, 0);

// Umumiy
const total = subtotal + tax - discount;

// Qaytim (Naqd/Karta/Mobil uchun)
const change = received - total;

// Qarz (Qisman/Qarzga uchun)
const debt = total - received;
```

### Mahsulot Soliq Hisoblash
```typescript
const tax = Math.round((product.sale_price * product.tax_rate * qty) / 100);
```

## 📁 Fayl Strukturasi

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx          ✅ To'liq
│   │   └── Footer.tsx          ✅ Mavjud
│   └── ui/                     ✅ shadcn/ui komponentlari
├── pages/
│   ├── Login.tsx               ✅ To'liq
│   ├── POS.tsx                 ✅ To'liq
│   ├── Products.tsx            ✅ To'liq
│   ├── Customers.tsx           ✅ To'liq
│   ├── CashShifts.tsx          ✅ To'liq
│   ├── Sales.tsx               ⚠️ Placeholder
│   ├── Returns.tsx             ⚠️ Placeholder
│   ├── Purchases.tsx           ⚠️ Placeholder
│   ├── Inventory.tsx           ⚠️ Placeholder
│   ├── Reports.tsx             ⚠️ Placeholder
│   ├── Settings.tsx            ⚠️ Placeholder
│   └── Users.tsx               ⚠️ Placeholder
├── db/
│   ├── supabase.ts             ✅ Supabase client
│   └── api.ts                  ✅ Barcha API funksiyalari
├── types/
│   └── types.ts                ✅ TypeScript interfeyslari
├── routes.tsx                  ✅ Routing konfiguratsiyasi
└── App.tsx                     ✅ Asosiy komponent
```

## 🎯 Keyingi Qadamlar

1. **Qaytarishlar (Returns) sahifasi:**
   - Chek qidirish
   - Mahsulotlarni tanlash
   - To'liq/qisman qaytarish
   - Ombor zaxirasini qayta oshirish

2. **Hisobotlar (Reports) sahifasi:**
   - Kunlik savdo hisoboti
   - Kassir bo'yicha hisobot
   - Mahsulot bo'yicha hisobot
   - Qarzdorlik hisoboti
   - Export (CSV/Excel)

3. **Sozlamalar (Settings) sahifasi:**
   - Do'kon ma'lumotlari
   - Soliq konfiguratsiyasi
   - Chek shabloni
   - Printer sozlamalari

4. **Foydalanuvchilar (Users) sahifasi:**
   - Foydalanuvchilar ro'yxati
   - Rol o'zgartirish
   - Yangi foydalanuvchi qo'shish

5. **Chek Chop Etish:**
   - 80mm/58mm chek formati
   - PDF generatsiya
   - Printer integratsiyasi

## 📞 Qo'llab-quvvatlash

Agar savollaringiz bo'lsa:
1. `SETUP_GUIDE.md` faylini o'qing
2. `TODO.md` faylida rejani ko'ring
3. Kod ichidagi izohlarni o'qing (o'zbek tilida)

## 🎉 Xulosa

**Asosiy POS funksiyalari to'liq ishlamoqda:**
- ✅ Login/Register
- ✅ POS (Sotuv)
- ✅ Mahsulotlar CRUD
- ✅ Mijozlar CRUD
- ✅ Kassa (Shift) boshqaruvi
- ✅ To'liq validatsiya
- ✅ Ma'lumotlar bazasi integratsiyasi

**Tizim tayyor va ishlatish mumkin!**
