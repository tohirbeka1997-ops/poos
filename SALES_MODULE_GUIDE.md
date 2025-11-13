# Sotuvlar Moduli - To'liq Qo'llanma

## 📋 Umumiy Ma'lumot

Sotuvlar moduli POS tizimida amalga oshirilgan barcha sotuvlarni ko'rish, qidirish, filtrlash va batafsil ma'lumotlarni ko'rish imkonini beradi.

## ✅ Amalga Oshirilgan Funksiyalar

### 1. Savdolar Jurnali

**Avtomatik Yozuv:**
- POS sahifasida har bir sotuv yakunlanganda avtomatik ravishda `sales` jadvaliga yoziladi
- Sotuv elementlari `sale_items` jadvaliga yoziladi
- Ombor zaxirasi avtomatik kamaytiriladi
- Chek raqami avtomatik generatsiya qilinadi

**Ko'rsatiladigan Ma'lumotlar:**
- ✅ Chek raqami (Receipt No)
- ✅ Sana / Vaqt
- ✅ Kassir (Foydalanuvchi)
- ✅ Mijoz (agar bor bo'lsa)
- ✅ Jami summa
- ✅ To'lov turi (Naqd, Karta, Mobil, Qisman, Qarzga)
- ✅ To'langan miqdor / Qoldiq (qarz)
- ✅ Status (Yakunlangan, Qaytarilgan, Bekor qilingan)

**Jadval Ko'rinishi:**
- Eng yangi savdolar yuqorida
- Responsive dizayn
- Hover effektlari
- Rangli status ko'rsatkichlari

### 2. Qidiruv va Filtrlar

**Qidiruv:**
- ✅ Chek raqami bo'yicha qidirish
- Real-time qidiruv

**Filtrlar:**
- ✅ **Sana bo'yicha:**
  - Barcha sanalar
  - Bugun
  - Oxirgi hafta
  - Oxirgi oy

- ✅ **To'lov turi bo'yicha:**
  - Barcha to'lovlar
  - Naqd
  - Karta
  - Mobil
  - Qisman
  - Qarzga

- ✅ **Status bo'yicha:**
  - Barcha holatlar
  - Yakunlangan
  - Qaytarilgan
  - Bekor qilingan

### 3. Statistika

**Bugungi Sotuv:**
- Jami summa (so'mda)
- Sotuvlar soni
- Ko'k rang bilan ko'rsatiladi

**Haftalik Sotuv:**
- Oxirgi 7 kunlik jami
- Sotuvlar soni
- Yashil rang bilan ko'rsatiladi

**Oylik Sotuv:**
- Oxirgi 30 kunlik jami
- Sotuvlar soni
- Sariq rang bilan ko'rsatiladi

### 4. Batafsil Ko'rish (Modal)

**"Ko'rish" Tugmasi:**
- Har bir sotuv uchun "Ko'z" ikonkasi
- Bosilganda modal oynasi ochiladi

**Modal Tarkibi:**
- ✅ **Asosiy Ma'lumotlar:**
  - Chek raqami
  - Sana/Vaqt
  - Kassir
  - To'lov turi

- ✅ **Mahsulotlar Ro'yxati:**
  - Mahsulot nomi
  - Miqdor
  - Narx
  - Jami

- ✅ **Hisob-kitob:**
  - Jami (subtotal)
  - Chegirma (agar bor bo'lsa)
  - Soliq (agar bor bo'lsa)
  - Umumiy
  - Qabul qilingan
  - Qaytim (agar bor bo'lsa)
  - Qarz (agar bor bo'lsa)

- ✅ **Amallar:**
  - Yopish tugmasi
  - Chekni chop etish tugmasi (placeholder)

## 🔄 POS bilan Avtomatik Bog'lanish

### Ma'lumotlar Oqimi

```
POS Sahifasi
    ↓
Sotuv Yakunlash
    ↓
Ma'lumotlar Bazasi
    ├─ sales jadvaliga yozish
    ├─ sale_items jadvaliga yozish
    ├─ stock_moves jadvaliga yozish
    └─ Ombor zaxirasini kamaytirish
    ↓
Sotuvlar Sahifasi
    ↓
Avtomatik Yangilanish
```

### Database Schema

**sales jadvali:**
```sql
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  cashier_id UUID REFERENCES profiles(id),
  shift_id INTEGER REFERENCES cash_shifts(id),
  subtotal BIGINT NOT NULL,
  discount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT NOT NULL,
  payment_type TEXT NOT NULL,
  received_amount BIGINT NOT NULL,
  debt_amount BIGINT DEFAULT 0,
  change_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**sale_items jadvali:**
```sql
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id),
  product_id INTEGER REFERENCES products(id),
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price BIGINT NOT NULL,
  discount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  total BIGINT NOT NULL
);
```

## 💻 Texnik Tafsilotlar

### API Funksiyalari

```typescript
// Sotuvlarni olish (pagination bilan)
export const getSales = async (page = 1, limit = 50): Promise<SaleWithDetails[]>

// Bitta sotuvni olish
export const getSale = async (id: number): Promise<SaleWithDetails | null>

// Chek raqami bo'yicha qidirish
export const getSaleByReceiptNo = async (receiptNo: string): Promise<SaleWithDetails | null>

// Sotuv elementlarini olish
export const getSaleItems = async (saleId: number): Promise<SaleItem[]>

// Sotuv yaratish
export const createSale = async (
  saleData: Omit<Sale, 'id' | 'created_at'>,
  items: Omit<SaleItem, 'id' | 'sale_id'>[]
): Promise<Sale>
```

### TypeScript Interfeyslari

```typescript
interface Sale {
  id: number;
  receipt_no: string;
  customer_id: number | null;
  cashier_id: string;
  shift_id: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_type: PaymentType;
  received_amount: number;
  debt_amount: number;
  change_amount: number;
  status: 'completed' | 'refunded' | 'cancelled';
  notes: string | null;
  created_at: string;
}

interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

type PaymentType = 'cash' | 'card' | 'mobile' | 'partial' | 'debt';
```

## 🎨 UI Komponentlari

### Statistika Kartlari
```tsx
<Card>
  <CardHeader>
    <CardTitle>Bugungi sotuv</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">
      {(todayTotal / 100).toLocaleString()} so'm
    </p>
    <p className="text-sm text-muted-foreground">
      {todaySales.length} ta sotuv
    </p>
  </CardContent>
</Card>
```

### Filtr Paneli
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Input placeholder="Chek raqami..." />
  <Select> {/* Sana filtri */} </Select>
  <Select> {/* To'lov turi filtri */} </Select>
  <Select> {/* Status filtri */} </Select>
</div>
```

### Sotuvlar Jadvali
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>Chek №</th>
      <th>Sana/Vaqt</th>
      <th>Kassir</th>
      <th>Jami</th>
      <th>To'lov</th>
      <th>Holat</th>
      <th>Amallar</th>
    </tr>
  </thead>
  <tbody>
    {filteredSales.map(sale => (
      <tr key={sale.id}>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

## 📊 Hisob-kitob Formulalari

### Statistika Hisoblash

```typescript
// Bugungi sotuvlar
const todaySales = sales.filter(sale => {
  const saleDate = new Date(sale.created_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return saleDate >= today && sale.status === 'completed';
});

// Jami summa
const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
```

### Sana Filtrlash

```typescript
const filterSalesByDate = (sale: Sale) => {
  if (dateFilter === 'all') return true;
  
  const saleDate = new Date(sale.created_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateFilter === 'today') {
    return saleDate >= today;
  } else if (dateFilter === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return saleDate >= weekAgo;
  } else if (dateFilter === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return saleDate >= monthAgo;
  }
  return true;
};
```

## 🎯 Foydalanish Misollari

### 1. Bugungi Sotuvlarni Ko'rish
1. Sotuvlar sahifasiga o'ting
2. Sana filtrida "Bugun" ni tanlang
3. Bugungi barcha sotuvlar ko'rsatiladi
4. Yuqorida bugungi jami summa ko'rinadi

### 2. Naqd To'lovlarni Filtrlash
1. To'lov turi filtrida "Naqd" ni tanlang
2. Faqat naqd to'lovlar ko'rsatiladi
3. Boshqa filtrlar bilan birgalikda ishlaydi

### 3. Chek Raqami Bo'yicha Qidirish
1. Qidiruv maydoniga chek raqamini kiriting
2. Real-time natijalar ko'rsatiladi
3. Masalan: "REC-20251113-0001"

### 4. Sotuv Tafsilotlarini Ko'rish
1. Sotuvlar jadvalida "Ko'z" ikonkasini bosing
2. Modal oynasi ochiladi
3. Barcha ma'lumotlar ko'rsatiladi
4. "Yopish" tugmasini bosing

## 🔮 Kelajakda Qo'shilishi Mumkin

### Qaytarish (Refund)
- [ ] "Qaytarish" tugmasi
- [ ] Mahsulotni to'liq/qisman qaytarish
- [ ] Ombor zaxirasini avtomatik yangilash
- [ ] To'lovni qaytarish yoki qarzni kamaytirish

### Chek Chop Etish
- [ ] 80mm/58mm chek formati
- [ ] PDF generatsiya
- [ ] Printer integratsiyasi
- [ ] Chek shabloni sozlamalari

### Export Funksiyalari
- [ ] Excel export
- [ ] PDF export
- [ ] CSV export
- [ ] Kunlik hisobotlar

### Qo'shimcha Filtrlar
- [ ] Kassir bo'yicha filtrlash
- [ ] Mijoz bo'yicha filtrlash
- [ ] Summa oralig'i bo'yicha filtrlash
- [ ] Mahsulot bo'yicha qidirish

### Hisobotlar
- [ ] Top mahsulotlar
- [ ] Eng faol kassirlar
- [ ] To'lov turlari diagrammasi
- [ ] Sotuv tendensiyalari grafigi

### Boshqaruv
- [ ] Sotuvni bekor qilish (Admin ruxsati bilan)
- [ ] Qarzga sotilganlar uchun "to'lovni yopish"
- [ ] Sotuvni tahrirlash (cheklangan)
- [ ] Izohlar qo'shish

## 🔒 Xavfsizlik

### Ruxsatlar
- **Admin:** Barcha sotuvlarni ko'rish va boshqarish
- **Manager:** Barcha sotuvlarni ko'rish
- **Cashier:** Faqat o'z sotuvlarini ko'rish
- **Accountant:** Barcha sotuvlarni ko'rish (faqat o'qish)

### Ma'lumotlar Xavfsizligi
- RLS (Row Level Security) yoqilgan
- Faqat ruxsat etilgan foydalanuvchilar ko'rishi mumkin
- Barcha o'zgarishlar audit log'ga yoziladi

## 📱 Responsive Dizayn

### Desktop (1920px+)
- 4 ustunli filtr paneli
- Keng jadval
- 3 ustunli statistika kartlari

### Tablet (768px - 1919px)
- 2 ustunli filtr paneli
- Scroll qilinadigan jadval
- 2 ustunli statistika kartlari

### Mobile (< 768px)
- 1 ustunli filtr paneli
- Vertikal scroll jadval
- 1 ustunli statistika kartlari

## 🎨 Dizayn Elementlari

### Ranglar
- **Primary (Ko'k):** Asosiy elementlar
- **Success (Yashil):** Muvaffaqiyatli operatsiyalar
- **Warning (Sariq):** Ogohlantirish
- **Destructive (Qizil):** Xatoliklar va qarzlar

### Ikonlar
- **Receipt:** Sotuvlar
- **Calendar:** Bugungi sotuv
- **TrendingUp:** Haftalik sotuv
- **DollarSign:** Oylik sotuv
- **Search:** Qidiruv
- **Eye:** Ko'rish

### Shriftlar
- **Sarlavha:** 3xl, bold
- **Statistika:** 3xl, bold
- **Jadval:** base, medium
- **Kichik matn:** sm, muted

## 🧪 Test Ssenariylari

### Test 1: Sotuvlar Ro'yxatini Ko'rish
1. Sotuvlar sahifasiga o'ting
2. Barcha sotuvlar ko'rsatilishi kerak
3. Eng yangi sotuvlar yuqorida bo'lishi kerak

### Test 2: Bugungi Statistika
1. Bugungi sotuv kartasini tekshiring
2. Jami summa to'g'ri bo'lishi kerak
3. Sotuvlar soni to'g'ri bo'lishi kerak

### Test 3: Qidiruv
1. Chek raqamini kiriting
2. Natijalar real-time ko'rsatilishi kerak
3. Mos keladigan sotuvlar topilishi kerak

### Test 4: Filtrlar
1. Har bir filtrni alohida sinab ko'ring
2. Bir nechta filtrni birgalikda sinab ko'ring
3. Natijalar to'g'ri filtrlangan bo'lishi kerak

### Test 5: Batafsil Ko'rish
1. "Ko'z" ikonkasini bosing
2. Modal ochilishi kerak
3. Barcha ma'lumotlar to'g'ri ko'rsatilishi kerak

## 📝 Xulosa

Sotuvlar moduli to'liq funksional va ishga tayyor:
- ✅ POS bilan avtomatik integratsiya
- ✅ Qidiruv va filtrlar
- ✅ Statistika
- ✅ Batafsil ko'rish
- ✅ Responsive dizayn
- ✅ O'zbek tilida interfeys
- ✅ To'g'ri hisob-kitoblar
- ✅ Xavfsiz ma'lumotlar bazasi

**Tizim tayyor va ishlatish mumkin!**
