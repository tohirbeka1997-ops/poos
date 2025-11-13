# Supermarket POS Tizimi - Foydalanish Qo'llanmasi

## Tizim haqida

Supermarket POS (Point of Sale) tizimi - bu supermarketlar uchun to'liq funksional kassa tizimi. Tizim sotuv jarayonlarini avtomatlashtirish, mahsulot va mijozlarni boshqarish, hisobotlar yaratish va kassa operatsiyalarini nazorat qilish imkonini beradi.

## Asosiy Imkoniyatlar

### ✅ Amalga oshirilgan funksiyalar:

1. **Autentifikatsiya va Foydalanuvchi Boshqaruvi**
   - Foydalanuvchi nomi va parol orqali kirish
   - Ro'yxatdan o'tish (birinchi foydalanuvchi avtomatik admin bo'ladi)
   - Rol asosida ruxsatlar (Admin, Manager, Cashier, Accountant)

2. **POS (Sotuv) Interfeysi**
   - Mahsulot qidirish (nom, shtrix-kod, SKU)
   - Savat boshqaruvi
   - Miqdor va chegirma sozlash
   - Mijoz tanlash
   - Turli to'lov turlari:
     - Naqd
     - Karta
     - Mobil
     - Qisman to'lov
     - Qarzga sotish
   - Avtomatik soliq hisoblash
   - Ombor zaxirasini tekshirish

3. **Kassa (Shift) Boshqaruvi**
   - Kassani ochish/yopish
   - Boshlang'ich va yakuniy summa kiritish
   - Farqni avtomatik hisoblash
   - Smenalar tarixi

4. **Ma'lumotlar Bazasi**
   - To'liq relatsion ma'lumotlar bazasi
   - Mahsulotlar va kategoriyalar
   - Mijozlar (balans va bonus ballar bilan)
   - Sotuvlar va sotuv elementlari
   - Qaytarishlar
   - Xaridlar (ta'minotchilardan)
   - Ombor harakatlari
   - Kassa smenalari

### ⚠️ Keyingi bosqichda amalga oshirilishi kerak:

- Mahsulotlar CRUD sahifasi
- Mijozlar CRUD sahifasi
- Qaytarishlar sahifasi
- Xaridlar sahifasi
- Ombor boshqaruvi
- Hisobotlar
- Sozlamalar
- Foydalanuvchilar boshqaruvi (admin uchun)

## Tizimdan Foydalanish

### 1. Birinchi Kirish

1. Tizimga birinchi marta kirganda `/login` sahifasiga o'ting
2. "Ro'yxatdan o'tish" tugmasini bosing
3. Foydalanuvchi nomi va parol kiriting
4. Ro'yxatdan o'ting - siz avtomatik ravishda **Administrator** bo'lasiz

**Muhim:** Birinchi ro'yxatdan o'tgan foydalanuvchi avtomatik ravishda admin huquqlariga ega bo'ladi!

### 2. Kassani Ochish

Sotuvni boshlashdan oldin kassani ochish kerak:

1. "Kassa" sahifasiga o'ting
2. "Kassani ochish" tugmasini bosing
3. Boshlang'ich summani kiriting (masalan: 100000 so'm)
4. "Ochish" tugmasini bosing

### 3. Sotuv Qilish

1. POS sahifasiga o'ting (asosiy sahifa)
2. Mahsulot qidirish maydoniga mahsulot nomi yoki shtrix-kodini kiriting
3. Topilgan mahsulotni bosing - u savatga qo'shiladi
4. Kerak bo'lsa:
   - Miqdorni o'zgartiring
   - Chegirma qo'shing
   - Mijoz tanlang
5. To'lov turini tanlang:
   - **Naqd/Karta/Mobil**: To'liq to'lov
   - **Qisman**: Qisman to'lov (mijoz majburiy)
   - **Qarzga**: To'liq qarzga (mijoz majburiy)
6. Qabul qilingan summani kiriting
7. "Sotuvni yakunlash" tugmasini bosing

### 4. Kassani Yopish

Ish kunini tugatganda:

1. "Kassa" sahifasiga o'ting
2. "Kassani yopish" tugmasini bosing
3. Yakuniy summani kiriting
4. Kerak bo'lsa izoh qoldiring
5. "Yopish" tugmasini bosing

Tizim avtomatik ravishda farqni hisoblab beradi.

## Foydalanuvchi Rollari

### Admin
- Barcha funksiyalarga to'liq ruxsat
- Foydalanuvchilarni boshqarish
- Sozlamalarni o'zgartirish
- Barcha hisobotlarni ko'rish

### Manager
- Mahsulotlar boshqaruvi
- Mijozlar boshqaruvi
- Xaridlar
- Ombor boshqaruvi
- Hisobotlar

### Cashier
- Sotuv qilish
- Qaytarish
- O'z smenasini boshqarish
- Mijozlarni ko'rish

### Accountant
- Moliyaviy hisobotlar
- Sotuvlar tarixi

## Texnik Ma'lumotlar

### Texnologiyalar:
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Autentifikatsiya**: Supabase Auth
- **Til**: O'zbek tili

### Valyuta:
- UZS (O'zbek so'mi)
- Barcha summalar tiyin (1/100 so'm) da saqlanadi
- Interfeyda so'm ko'rinishida ko'rsatiladi

### Ma'lumotlar Bazasi:
- PostgreSQL (Supabase orqali)
- 13 ta asosiy jadval
- Avtomatik ombor harakatlari
- Trigger'lar va funksiyalar

## Xavfsizlik

- Parollar xavfsiz tarzda shifrlangan
- Rol asosida ruxsatlar
- Birinchi foydalanuvchi avtomatik admin
- Har bir operatsiya audit yozuvlari bilan

## Qo'shimcha Ma'lumot

### Mahsulot Qo'shish
Hozircha mahsulotlarni to'g'ridan-to'g'ri ma'lumotlar bazasiga qo'shish kerak. Keyingi versiyada mahsulotlar boshqaruvi interfeysi qo'shiladi.

### Mijoz Qo'shish
Mijozlarni ham to'g'ridan-to'g'ri ma'lumotlar bazasiga qo'shish kerak. Keyingi versiyada mijozlar boshqaruvi interfeysi qo'shiladi.

### Hisobotlar
Hisobotlar funksiyasi keyingi versiyada qo'shiladi. Hozircha ma'lumotlar bazasidan to'g'ridan-to'g'ri so'rovlar orqali hisobotlar olish mumkin.

## Yordam va Qo'llab-quvvatlash

Agar savollaringiz bo'lsa yoki muammoga duch kelsangiz:
1. TODO.md faylini ko'rib chiqing - u yerda amalga oshirilgan va rejalashtirilgan funksiyalar ro'yxati bor
2. Kod ichidagi izohlarni o'qing - ular o'zbek tilida yozilgan
3. Ma'lumotlar bazasi strukturasini ko'rish uchun `supabase/migrations/01_create_pos_schema.sql` faylini oching

## Keyingi Qadamlar

Tizimni to'liq ishga tushirish uchun quyidagi sahifalarni amalga oshirish kerak:
1. Mahsulotlar boshqaruvi (CRUD)
2. Mijozlar boshqaruvi (CRUD)
3. Qaytarishlar sahifasi
4. Xaridlar sahifasi
5. Ombor boshqaruvi
6. Hisobotlar
7. Sozlamalar
8. Foydalanuvchilar boshqaruvi

Har bir sahifa uchun API funksiyalari allaqachon `src/db/api.ts` faylida mavjud!
