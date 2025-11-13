# Supermarket POS tizimi talablari hujjati (Yangilangan versiya)

## 1. Tizim umumiy tavsifi

### 1.1 Tizim nomi
Supermarket POS (Point of Sale) tizimi

### 1.2 Tizim tavsifi
Supermarketlar uchun uzoq muddatli barqarorlik va yuqori samaradorlik bilan ishlaydigan to'liq POS tizimi. Tizim 5+ yillik ma'lumotlar bilan ham qotmasdan ishlaydi, kunlik so'rovlar <500ms p95 ko'rsatkichini ta'minlaydi va millionlab tranzaksiyalarni samarali boshqaradi.

### 1.3 Asosiy funksiyalar
- **Sotuv (POS)** - idempotent tranzaksiyalar, dublikat himoyasi
- **Sotuvlar boshqaruvi** - optimallashtirilgan filtrlash va paginatsiya
- **Qaytarishlar (Returns)** - to'liq qaytarish moduli, audit trail
- **Mijozlar boshqaruvi** - tezkor qidiruv va balans nazorati
- **Mahsulotlar boshqaruvi** - real-time zaxira nazorati
- **Ombor boshqaruvi** - optimallashtirilgan stock harakatlari
- **Xaridlar (Purchases)** - ta'minotchilar va narx yangilash
- **Hisobotlar** - materialized views, asinxron eksport, keshlangan ma'lumotlar
- **Kassa (Shift)** - rekonsilyatsiya, snapshot, zaxira\n- **Sozlamalar** - to'liq tizim konfiguratsiyasi
- **Foydalanuvchilar** - chuqurlashtirilgan ruxsatlar va audit\n- **Monitoring** - real-time tizim sog'ligi nazorati
- **Shaxsiy kabinet** - foydalanuvchi profili boshqaruvi
- **Foydalanuvchi menyusi** - hisob almashtirish, rol almashtirish, til tanlash, profil boshqaruvi
- **Ma'lumotlarni eksport qilish** - to'liq eksport tizimi barcha formatlar bilan
\n## 2. Ma'lumotlar modeli (Yangilangan)\n
### 2.1 User Profiles jadvali

```sql
-- 1. Profiles
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,\n  fullname text not null default '',
  phone text,
  language text not null default 'uz',
  branch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_user on public.user_profiles(user_id);
\n-- 2. Auto-create profile on signup
create or replace function public.ensure_profile()
returns trigger language plpgsql as $$
begin
  insert into public.user_profiles(user_id, fullname)
  values (new.id, coalesce(new.raw_user_meta_data->>'fullname',''));
  return new;
end $$;

drop trigger if exists trg_auth_user_profile on auth.users;
create trigger trg_auth_user_profile
after insert on auth.users
for each row execute procedure public.ensure_profile();

-- 3. RLS
alter table public.user_profiles enable row level security;\ndo $$ begin
  -- read own profile
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='profile_read_own'
  ) then\n    create policy profile_read_own on public.user_profiles\n      for select using (auth.uid() = user_id);\n  end if;
  -- update own profile
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_profiles' and policyname='profile_update_own'
  ) then
    create policy profile_update_own on public.user_profiles
      for update using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Activity log
create table if not exists public.user_activity (
  id bigserial primary key,\n  user_id uuid not null,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_activity_user on public.user_activity(user_id);
alter table public.user_activity enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_activity'
  ) then
    create policy activity_read_own on public.user_activity
      for select using (auth.uid() = user_id);
    create policy activity_insert_own on public.user_activity
      for insert with check (auth.uid() = user_id);
  end if;
end $$;
```

### 2.2 RPC funksiyalari

```sql\n-- 5. RPCs
create or replace function public.profile_get_current()
returns json language sql security definer as $$
  select to_jsonb(p) from public.user_profiles p where p.user_id = auth.uid();
$$;

create or replace function public.profile_update(_fullname text, _phone text, _language text, _branch uuid)
returns json language plpgsql security definer as $$\ndeclare rec public.user_profiles;
begin
  update public.user_profiles
  set fullname = coalesce(_fullname, fullname),\n      phone    = coalesce(_phone, phone),
      language = coalesce(_language, language),
      branch_id= coalesce(_branch, branch_id),
      updated_at = now()
  where user_id = auth.uid()
  returning * into rec;\n  return to_json(rec);
end $$;

create or replace function public.profile_change_password(old_pass text, new_pass text)
returns void language plpgsql security definer as $$
begin
  -- use Supabase GOTrue admin API: bind to server-side function in app layer
  -- Here, only contract placeholder.
  raise notice 'change password in app layer for user %', auth.uid();
end $$;

create or replace function public.profile_activity_list(limit_rows int default 20)
returns setof public.user_activity language sql security definer as $$
  select * from public.user_activity where user_id = auth.uid()
  order by created_at desc limit limit_rows;
$$;
```

## 3. Shaxsiy kabinet tizimi (/kabinet)

### 3.1 Umumiy tavsif
Har bir foydalanuvchi o'z profilini boshqara olish imkoniyati: shaxsiy ma'lumotlarni ko'rish va tahrirlash, parolni o'zgartirish, til va filial sozlamalarini boshqarish.\n
### 3.2 Sahifa tuzilmasi

**URL**: /kabinet
**Sahifa nomi**: Shaxsiy kabinet
**Kirish huquqi**: Faqat tizimga kirgan foydalanuvchilar (sessiya yo'q bo'lsa /login ga yo'naltirish)

### 3.3 Tab 1 - Umumiy ma'lumot

#### 3.3.1 Form maydonlari
\n| Maydon | Tavsif | Tahrirlash huquqi |
|--------|--------|-------------------|
| To'liq ism | Foydalanuvchi F.I.Sh | Foydalanuvchi o'zgartira oladi |
| Login | Foydalanuvchi nomi | Readonly |
| Rol | Joriy rol | Readonly |
| Filial | Joriy filial | Dropdown (ruxsat bo'yicha) |
| Telefon raqam | Aloqa raqami | Foydalanuvchi o'zgartira oladi |
| Til | Interfeys tili | Dropdown (uz/ru/en) |
| So'nggi kirish | Oxirgi login vaqti | Readonly |
| Yaralgan sana | Ro'yxatdan o'tgan sana | Readonly |
\n#### 3.3.2 Tugmalar va amallar
- **Saqlash** - o'zgarishlar mavjud bo'lsa faol
- **Bekor qilish** - o'zgarishlarni bekor qilish

#### 3.3.3 Toast xabarlari
- ✅ 'Profil ma'lumotlari muvaffaqiyatli yangilandi.'
- ⚠️ 'O'zgartirish kiritilmadi.'
- ❌ 'Xatolik: ma'lumotlarni yangilash amalga oshmadi.'

### 3.4 Tab 2 - Parolni o'zgartirish\n
#### 3.4.1 Form maydonlari
1. **Joriy parol** - hozirgi parolni tasdiqlash
2. **Yangi parol** - yangi parol kiritish
3. **Tasdiqlash** - parolni takrorlash

#### 3.4.2 Validatsiya qoidalari
- Kamida 8 belgili
- Harf va raqam kombinatsiyasi
- Katta va kichik harflar
\n#### 3.4.3 Toast xabarlari
- ✅ 'Parol muvaffaqiyatli yangilandi.'
- ❌ 'Joriy parol noto'g'ri.'
- ⚠️ 'Yangi parol talablarga javob bermaydi.'

### 3.5 Tab 3 - Filialni o'zgartirish
\n#### 3.5.1 Filial tanlash
- Dropdown ro'yxat barcha mavjud filiallar bilan
- Faqat ruxsat berilgan filiallarga o'tish mumkin
- Tanlangan filial darhol saqlanadi

#### 3.5.2 Toast xabarlari
- ✅ 'Filial muvaffaqiyatli almashtirildi.'
- ❌ 'Sizda bu filialga ruxsat yo'q.'
\n### 3.6 Tab 4 - So'nggi faoliyat

#### 3.6.1 Faoliyat jurnali
- **Sarlavha**: 'So'nggi faoliyat'\n- **Ko'rsatiladigan ma'lumotlar**: Oxirgi 20 ta foydalanuvchi amali
- **Amallar ro'yxati**: Login, sotuvlar, kassa ochish/yopish, eksportlar va boshqalar
- **Format**: Sana, vaqt, amal tavsifi

### 3.7 Tab 5 - Sessiya
\n#### 3.7.1 Sessiya ma'lumotlari
- **So'nggi kirish vaqti**: Oxirgi login sanasi va vaqti
- **Hisob yaratilgan sana**: Ro'yxatdan o'tgan sana
\n#### 3.7.2 Tizimdan chiqish
1. **Tugma**: 'Tizimdan chiqish'
2. **Smena tekshiruvi**: Agar smena ochiq bo'lsa\n3. **Ogohlantirish**: ⚠️ 'Diqqat: Smena yopilmagan. Iltimos, chiqishdan oldin kassani yoping.'
4. **Foydalanuvchi tanlov**: 'Baribir chiqish' yoki 'Bekor qilish'
\n## 4. Navbar foydalanuvchi menyusi

### 4.1 Menyu joylashuvi va dizayni
- **Joylashuv**: Sahifaning o'ng yuqori qismida avatar tugmasi
- **Ochilish**: Avatar tugmasini bosish orqali dropdown menyu
- **Dizayn**: Zamonaviy dropdown, soya effekti bilan

### 4.2 Menyu bandlari
\n#### 4.2.1 Asosiy bandlar
1. **👤 Shaxsiy kabinet** - navigate(/kabinet)
2. **🔄 Hisobni almashtirish** - hisob almashtirish modali (ruxsat bo'yicha)
3. **🌐 Tilni o'zgartirish** - {uz, ru, en} darhol qo'llash va profile.language ga saqlash
4. **🚪 Tizimdan chiqish** - himoyalangan chiqish (kassa smenasi ochiq bo'lsa bloklanadi)

### 4.3 Xabarlar va holatlar

#### 4.3.1 Muvaffaqiyatli amallar
- 'Til o'zgartirildi: O'zbek.'
- 'Filial o'zgartirildi.'
- 'Parol muvaffaqiyatli yangilandi.'
- 'Hisob almashdi.'
- 'Tizimdan chiqdingiz.'

#### 4.3.2 Xatolik xabarlari
- 'Sizda bu hisobga o'tish huquqi yo'q.'
- 'Xatolik yuz berdi'
- 'Sizda bu amal uchun ruxsat yo'q.'
\n#### 4.3.3 Ogohlantirish xabarlari
- 'Diqqat: Smena yopilmagan. Chiqishdan oldin \"Kassa → Smena yopish\"ni bajaring.'
- 'Tizimdan chiqishni tasdiqlaysizmi?'
\n## 5. Autentifikatsiya himoyasi

### 5.1 Global himoya
- Sessiya yo'q bo'lsa → /login ga yo'naltirish
- Ochiq marshrutlar: /login, /register (agar mavjud bo'lsa)
- /login da sessiya mavjud bo'lsa → / (asosiy/POS) ga yo'naltirish

### 5.2 Marshrutlar himoyasi
- /kabinet - faqat autentifikatsiya qilingan foydalanuvchilar
- Sessiya tekshiruvi har bir sahifa yuklanishida
- Token muddati tugaganda avtomatik chiqarish

## 6. Xalqarolashtirish (i18n)

### 6.1 Til variantlari
- **O'zbek (uz)** - Lotin yozuvi (asosiy)
- **Русский (ru)** - Rus tili\n- **English (en)** - Ingliz tili
\n### 6.2 Til o'zgarishi
- Tanlanganda interfeys darhol o'zgaradi
- user_profiles.language ga saqlanadi
- Barcha sahifa elementlari yangi tilda ko'rsatiladi
- Toast xabarlari tanlangan tilda

### 6.3 O'zbek tilidagi barcha elementlar
- Barcha yorliqlar, tooltip'lar, placeholder'lar o'zbek tilida
- Form validatsiya xabarlari\n- Toast bildirishnomalar
- Tugma matnlari\n
## 7. Ma'lumotlarni eksport qilish tizimi

### 7.1 Eksport funksiyalari talablari

#### 7.1.1 Umumiy talablar
- **Loading holati**: tugmalarda spinner + disabled holatini ko'rsatish
- **Muvaffaqiyat**: avtomatik fayl yuklab olish va o'zbekcha toast xabari
- **Bo'sh ma'lumotlar**: \"Eksport qilinadigan ma'lumot topilmadi.\" xabari
- **Xatolik**: \"Xatolik: eksport amalga oshmadi.\" xabari va stack log
- **RBAC nazorati**: faqat Administrator, Hisobchi, Menejer eksport qila oladi
- **Filtrlarni hurmat qilish**: sana oralig'i, filial, holat filtrlari
- **Fayl nomlari**: mahsulotlar_YYYY-MM-DD_HH-mm.csv formatida

#### 7.1.2 Mahsulotlar (CSV)
**CSV sarlavhalari (O'zbek)**:
```
ID,Nomi,SKU,Barkod,Kategoriya,Birlik,Narx,Chegirma (%),Zaxira,Holat,Yangilangan sana
```

#### 7.1.3 Mijozlar (CSV)
**CSV sarlavhalari (O'zbek)**:
```
ID,F.I.Sh,Telefon,Balans (so'm),Bonus,Toifa,Ro'yxatdan o'tgan sana,Oxirgi sotuv\n```

#### 7.1.4 Sotuvlar (Excel .xlsx)
**O'zbek sarlavhalari**:
```
Sana,Chek raqami,Kassir,Mijoz,To'lov turi,Jami (so'm),Soliq (so'm),Chegirma (so'm),Filial\n```

### 7.2 UX matnlari (O'zbek)

#### 7.2.1 Holat xabarlari
- **Loading**: \"Fayl tayyorlanmoqda…\"
- **Muvaffaqiyat (CSV)**: \"Mahsulotlar CSV fayli tayyorlandi.\" / \"Mijozlar CSV fayli tayyorlandi.\"
- **Muvaffaqiyat (XLSX)**: \"Sotuvlar Excel fayli tayyorlandi.\"
- **Bo'sh**: \"Eksport qilinadigan ma'lumot topilmadi.\"
- **Xatolik**: \"Xatolik: eksport amalga oshmadi.\"\n
## 8. Test talablari

### 8.1 Funksional testlar
- /kabinet sessiyasiz → /login\n- Profilni yangilash → muvaffaqiyat toast + ma'lumotlar saqlandi
- Noto'g'ri joriy parol → xatolik toast
- Filial almashtirish ruxsatsiz → \"Sizda bu filialga ruxsat yo'q.\"
- Smena ochiq paytida chiqish → ogohlantirish + bloklangan
- Smena yopgandan keyin chiqish → /login ga yo'naltirildi

### 8.2 Yetkazib beriladigan natijalar
- **Ishlaydigan tugmalar** bog'langan actionlar bilan
- **Qayta foydalaniladigan yordamchilar**: exportCsv(), exportXlsx(), exportPdf()
- **Aniq toastlar** va o'zbek tilidagi xatolar

## 9. Dizayn uslubi

### 9.1 Ranglar sxemasi
- **Asosiy rang**: ko'k (#2563eb)
- **Muvaffaqiyat**: yashil (#16a34a)
- **Ogohlantirish**: sariq (#f59e0b)
- **Xatolik**: qizil (#dc2626)
- **Kulrang**: (#6b7280)

### 9.2 Profil sahifasi layouti
- **Tab-based interfeys**: 5 ta tab (Umumiy, Parol, Filial, Faoliyat, Sessiya)\n- **Grid layout** form maydonlari uchun
- **Responsive dizayn** barcha qurilmalar uchun
- **Zamonaviy input maydonlari** focus va validation holatlari bilan

### 9.3 Foydalanuvchi menyusi dizayni
- **Avatar tugmasi**: dumaloq avatar rasmi va foydalanuvchi nomi
- **Dropdown menyu**: soya effekti va yumshoq animatsiya
- **Ikonkalar** har bir element uchun
- **Hover effektlari** barcha interaktiv elementlarda
\n### 9.4 Toast xabarlar dizayni
- **Joylashuv**: O'ng yuqori burchak
- **Animatsiya**: Slide-in effekti
- **Avtomatik yopilish**: 4 soniya
- **Ranglar**: Holat bo'yicha (yashil, qizil, sariq)\n
### 9.5 Responsive dizayn
- **Desktop (1200px+)**: To'liq layout, yon-yonaki form maydonlari
- **Tablet (768px-1199px)**: Ixcham layout, 2 ustunli grid
- **Mobile (767px va kam)**: Vertikal layout, bitta ustunli form

## 10. Texnik implementatsiya

### 10.1 Ma'lumotlar bazasi o'zgarishlari
- SQL skriptlarni idempotent tarzda ishga tushirish
- RLS (Row Level Security) sozlash
- Trigger'lar va funksiyalarni yaratish
- Indekslarni optimallash

### 10.2 Frontend komponentlar
- ProfilePage komponenti 5 ta tab bilan
- UserMenu dropdown komponenti
- Auth guard middleware
- i18n integratsiyasi

### 10.3 Backend servislar
- Supabase RPC funksiyalari
- Parol o'zgartirish API integratsiyasi
- Faoliyat jurnali yozish
- Eksport funksiyalari

## 11. Ishga tushirish

### 11.1 Ma'lumotlar bazasini qo'llash
1. SQL skriptlarni ishga tushirish
2. RLS siyosatlarini faollashtirish
3. Test ma'lumotlarini yaratish

### 11.2 Frontend o'zgarishlari
1. Komponentlarni yaratish va integratsiya qilish
2. Marshrutlarni sozlash
3. i18n konfiguratsiyasi
\n### 11.3 Test va nashr
1. Edit → Update → Publish
2. Service Worker cache'ini tozalash
3. Incognito rejimida test qilish
4. Barcha funksional testlarni o'tkazish

## 12. Xulosa

Yangilangan Supermarket POS tizimi to'liq Shaxsiy kabinet funksiyasi bilan quyidagi imkoniyatlarni taqdim etadi:
\n- **To'liq profil boshqaruvi** - foydalanuvchi ma'lumotlari, parol, til va filial sozlamalari
- **Xavfsiz autentifikatsiya** - sessiya himoyasi va kassa smena nazorati
- **Ko'p tilli interfeys** - O'zbek, Rus va Ingliz tillari qo'llab-quvvatlash
- **Responsive dizayn** - barcha qurilmalarda moslashuvchan interfeys
- **Keng qamrovli testlar** - barcha funksiyalar uchun avtomatlashtirilgan testlar
- **Ma'lumotlar eksporti** - CSV, Excel va PDF formatlarida\n- **Real-time yangilanishlar** - darhol qo'llaniladigan o'zgarishlar
\nTizim real supermarket muhitida millionlab foydalanuvchi bilan ishlay oladi va barcha interfeys elementlari to'liq o'zbek tilida (Lotin yozuvi) taqdim etiladi.