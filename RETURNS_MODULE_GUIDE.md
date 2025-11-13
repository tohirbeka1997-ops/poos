# Qaytarishlar Moduli - To'liq Qo'llanma

## 📋 Umumiy Ma'lumot

Qaytarishlar moduli POS tizimida amalga oshirilgan sotuvlardan mahsulotlarni to'liq yoki qisman qaytarish imkonini beradi. Qaytarish natijasida ombor zaxirasi avtomatik yangilanadi.

## ✅ Amalga Oshirilgan Funksiyalar

### 1. Qaytarishlar Jurnali

**Avtomatik Yozuv:**
- Qaytarish yaratilganda avtomatik ravishda `returns` jadvaliga yoziladi
- Qaytarilgan mahsulotlar `return_items` jadvaliga yoziladi
- Ombor zaxirasi avtomatik oshiriladi
- Qaytarish raqami avtomatik generatsiya qilinadi

**Ko'rsatiladigan Ma'lumotlar:**
- ✅ Qaytarish ID
- ✅ Sana / Vaqt
- ✅ Kassir (Foydalanuvchi)
- ✅ Jami summa (qaytarilgan)
- ✅ Status (Yakunlangan, Qisman, Bekor qilingan)

**Jadval Ko'rinishi:**
- Eng yangi qaytarishlar yuqorida
- Responsive dizayn
- Hover effektlari
- Rangli status ko'rsatkichlari

### 2. Yangi Qaytarish Yaratish

**Qadamlar:**

1. **Chek Qidirish:**
   - "Yangi qaytarish" tugmasini bosing
   - Chek raqamini kiriting
   - "Qidirish" tugmasini bosing yoki Enter tugmasini bosing
   - Tizim sotuvni topadi va ma'lumotlarni ko'rsatadi

2. **Sotuv Ma'lumotlarini Ko'rish:**
   - Chek raqami
   - Sana/Vaqt
   - Jami summa
   - To'lov turi

3. **Mahsulotlarni Tanlash:**
   - Har bir mahsulot uchun checkbox
   - Sotilgan miqdor ko'rsatiladi
   - Qaytarish miqdorini kiriting (default: barcha miqdor)
   - Narx va jami avtomatik hisoblanadi

4. **Qaytarish Sababi:**
   - Dropdown dan sababni tanlang:
     - Noto'g'ri mahsulot
     - Buzilgan
     - Ortiqcha
     - Mijoz fikrini o'zgartirdi
     - Boshqa

5. **Tasdiqlash:**
   - "Qaytarishni tasdiqlash" tugmasini bosing
   - Tizim qaytarishni yaratadi
   - Ombor zaxirasi avtomatik yangilanadi
   - Muvaffaqiyat xabari ko'rsatiladi

**Validatsiya:**
- ✅ Chek raqami majburiy
- ✅ Sotuv topilishi kerak
- ✅ Sotuv allaqachon qaytarilmagan bo'lishi kerak
- ✅ Kamida bitta mahsulot tanlanishi kerak
- ✅ Qaytarish miqdori > 0
- ✅ Qaytarish miqdori <= sotilgan miqdor
- ✅ Qaytarish sababi majburiy

### 3. Qidiruv va Filtrlar

**Filtrlar:**
- ✅ **Sana bo'yicha:**
  - Barcha sanalar
  - Bugun
  - Oxirgi hafta
  - Oxirgi oy

- ✅ **Status bo'yicha:**
  - Barcha holatlar
  - Yakunlangan
  - Qisman
  - Bekor qilingan

### 4. Statistika

**Bugungi Qaytarishlar:**
- Jami summa (so'mda)
- Qaytarishlar soni
- Qizil rang bilan ko'rsatiladi (destructive)

**Jami Qaytarishlar:**
- Barcha vaqt uchun qaytarishlar soni
- Sariq rang bilan ko'rsatiladi (warning)

**Jami Summa:**
- Barcha vaqt uchun qaytarilgan summa
- Ko'k rang bilan ko'rsatiladi (primary)

### 5. Batafsil Ko'rish (Modal)

**"Ko'rish" Tugmasi:**
- Har bir qaytarish uchun "Ko'z" ikonkasi
- Bosilganda modal oynasi ochiladi

**Modal Tarkibi:**
- ✅ **Asosiy Ma'lumotlar:**
  - Qaytarish ID
  - Sana/Vaqt
  - Kassir
  - Sabab

- ✅ **Mahsulotlar Ro'yxati:**
  - Mahsulot nomi
  - Miqdor
  - Narx
  - Jami

- ✅ **Jami Summa:**
  - Qaytarilgan umumiy summa

- ✅ **Amallar:**
  - Yopish tugmasi

## 🔄 Sotuvlar bilan Avtomatik Bog'lanish

### Ma'lumotlar Oqimi

```
Qaytarishlar Sahifasi
    ↓
Chek Qidirish
    ↓
Sotuv Topildi
    ↓
Mahsulotlarni Tanlash
    ↓
Qaytarish Yaratish
    ↓
Ma'lumotlar Bazasi
    ├─ returns jadvaliga yozish
    ├─ return_items jadvaliga yozish
    ├─ stock_moves jadvaliga yozish
    └─ Ombor zaxirasini oshirish
    ↓
Qaytarishlar Jurnali
    ↓
Avtomatik Yangilanish
```

### Database Schema

**returns jadvali:**
```sql
CREATE TABLE returns (
  id SERIAL PRIMARY KEY,
  return_no TEXT UNIQUE NOT NULL,
  sale_id INTEGER REFERENCES sales(id),
  cashier_id UUID REFERENCES profiles(id),
  shift_id INTEGER REFERENCES cash_shifts(id),
  total_amount BIGINT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**return_items jadvali:**
```sql
CREATE TABLE return_items (
  id SERIAL PRIMARY KEY,
  return_id INTEGER REFERENCES returns(id),
  sale_item_id INTEGER REFERENCES sale_items(id),
  product_id INTEGER REFERENCES products(id),
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price BIGINT NOT NULL,
  total BIGINT NOT NULL
);
```

## 💻 Texnik Tafsilotlar

### API Funksiyalari

```typescript
// Qaytarishlarni olish (pagination bilan)
export const getReturns = async (page = 1, limit = 50): Promise<Return[]>

// Qaytarish elementlarini olish
export const getReturnItems = async (returnId: number): Promise<ReturnItem[]>

// Qaytarish raqamini generatsiya qilish
export const generateReturnNo = async (): Promise<string>

// Qaytarish yaratish
export const createReturn = async (
  returnData: Omit<Return, 'id' | 'created_at'>,
  items: Omit<ReturnItem, 'id' | 'return_id'>[]
): Promise<Return | null>

// Sotuvni chek raqami bo'yicha topish
export const getSaleByReceiptNo = async (receiptNo: string): Promise<SaleWithDetails | null>

// Sotuv elementlarini olish
export const getSaleItems = async (saleId: number): Promise<SaleItem[]>

// Mahsulotni olish
export const getProduct = async (id: number): Promise<ProductWithCategory | null>

// Mahsulotni yangilash (stock uchun)
export const updateProduct = async (id: number, updates: Partial<Product>): Promise<void>
```

### TypeScript Interfeyslari

```typescript
interface Return {
  id: number;
  return_no: string;
  sale_id: number | null;
  cashier_id: string | null;
  shift_id: number | null;
  total_amount: number;
  reason: string | null;
  status: string;
  created_at: string;
}

interface ReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number | null;
  product_id: number | null;
  product_name: string;
  qty: number;
  price: number;
  total: number;
}

interface ReturnItemInput {
  saleItemId: number;
  productId: number;
  productName: string;
  soldQty: number;
  returnQty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  selected: boolean;
}
```

## 🎨 UI Komponentlari

### Statistika Kartlari
```tsx
<Card>
  <CardHeader>
    <CardTitle>Bugungi qaytarishlar</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold text-destructive">
      {(todayTotal / 100).toLocaleString()} so'm
    </p>
    <p className="text-sm text-muted-foreground">
      {todayReturns.length} ta qaytarish
    </p>
  </CardContent>
</Card>
```

### Filtr Paneli
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Select> {/* Sana filtri */} </Select>
  <Select> {/* Status filtri */} </Select>
</div>
```

### Qaytarishlar Jadvali
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th>ID</th>
      <th>Sana/Vaqt</th>
      <th>Kassir</th>
      <th>Summa</th>
      <th>Holat</th>
      <th>Amallar</th>
    </tr>
  </thead>
  <tbody>
    {filteredReturns.map(returnRecord => (
      <tr key={returnRecord.id}>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

### Yangi Qaytarish Dialog
```tsx
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent>
    {/* Chek qidirish */}
    {!selectedSale && (
      <div>
        <Input placeholder="Chek raqamini kiriting..." />
        <Button onClick={handleSearchSale}>Qidirish</Button>
      </div>
    )}
    
    {/* Sotuv ma'lumotlari va mahsulotlar */}
    {selectedSale && (
      <div>
        {/* Sotuv ma'lumotlari */}
        {/* Mahsulotlar ro'yxati */}
        {/* Qaytarish sababi */}
        {/* Amallar */}
      </div>
    )}
  </DialogContent>
</Dialog>
```

## 🧮 Hisob-kitob Mantiği

### Qaytarish Summasi

```typescript
const calculateReturnTotal = () => {
  return returnItemsInput
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.total, 0);
};
```

### Miqdor O'zgarganda

```typescript
const handleQtyChange = (index: number, qty: number) => {
  const updated = [...returnItemsInput];
  const maxQty = updated[index].soldQty;
  
  // Validatsiya
  if (qty < 0) qty = 0;
  if (qty > maxQty) qty = maxQty;
  
  updated[index].returnQty = qty;
  
  // Jami summani qayta hisoblash
  const unitPrice = updated[index].price / updated[index].soldQty;
  const unitDiscount = updated[index].discount / updated[index].soldQty;
  const unitTax = updated[index].tax / updated[index].soldQty;
  
  updated[index].total = Math.round((unitPrice - unitDiscount + unitTax) * qty);
  
  setReturnItemsInput(updated);
};
```

### Sana Filtrlash

```typescript
const filterReturnsByDate = (returnRecord: Return) => {
  if (dateFilter === 'all') return true;
  
  const returnDate = new Date(returnRecord.created_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateFilter === 'today') {
    return returnDate >= today;
  } else if (dateFilter === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return returnDate >= weekAgo;
  } else if (dateFilter === 'month') {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return returnDate >= monthAgo;
  }
  return true;
};
```

## 🎯 Foydalanish Misollari

### 1. To'liq Qaytarish
1. "Yangi qaytarish" tugmasini bosing
2. Chek raqamini kiriting (masalan: REC-20251113-0001)
3. "Qidirish" tugmasini bosing
4. Barcha mahsulotlarni belgilang (checkbox)
5. Sababni tanlang (masalan: "Mijoz fikrini o'zgartirdi")
6. "Qaytarishni tasdiqlash" tugmasini bosing

### 2. Qisman Qaytarish
1. "Yangi qaytarish" tugmasini bosing
2. Chek raqamini kiriting
3. "Qidirish" tugmasini bosing
4. Faqat qaytariladigan mahsulotlarni belgilang
5. Har bir mahsulot uchun qaytarish miqdorini kiriting
6. Sababni tanlang
7. "Qaytarishni tasdiqlash" tugmasini bosing

### 3. Bugungi Qaytarishlarni Ko'rish
1. Qaytarishlar sahifasiga o'ting
2. Sana filtrida "Bugun" ni tanlang
3. Bugungi barcha qaytarishlar ko'rsatiladi
4. Yuqorida bugungi jami summa ko'rinadi

### 4. Qaytarish Tafsilotlarini Ko'rish
1. Qaytarishlar jadvalida "Ko'z" ikonkasini bosing
2. Modal oynasi ochiladi
3. Barcha ma'lumotlar ko'rsatiladi
4. "Yopish" tugmasini bosing

## 🔮 Kelajakda Qo'shilishi Mumkin

### Qaytarish Cheki
- [ ] Qaytarish cheki shabloni
- [ ] PDF generatsiya
- [ ] Printer integratsiyasi
- [ ] Chekni chop etish

### To'lovni Qaytarish
- [ ] Naqd to'lovni qaytarish
- [ ] Karta orqali to'lovni qaytarish
- [ ] Qarzni kamaytirish
- [ ] Kassa bilan integratsiya

### Qo'shimcha Funksiyalar
- [ ] Qaytarishni bekor qilish (Admin ruxsati bilan)
- [ ] Qaytarish sabablarini statistik tahlil qilish
- [ ] Eng ko'p qaytariladigan mahsulotlar
- [ ] Qaytarish tendensiyalari grafigi

### Export Funksiyalari
- [ ] Excel export
- [ ] PDF export
- [ ] CSV export
- [ ] Kunlik hisobotlar

### Hisobotlar
- [ ] Qaytarishlar bo'yicha hisobot
- [ ] Kassir bo'yicha qaytarishlar
- [ ] Mahsulot bo'yicha qaytarishlar
- [ ] Sabab bo'yicha statistika

## 🔒 Xavfsizlik

### Ruxsatlar
- **Admin:** Barcha qaytarishlarni ko'rish va boshqarish
- **Manager:** Barcha qaytarishlarni ko'rish
- **Cashier:** Qaytarish yaratish, o'z qaytarishlarini ko'rish
- **Accountant:** Barcha qaytarishlarni ko'rish (faqat o'qish)

### Ma'lumotlar Xavfsizligi
- RLS (Row Level Security) yoqilgan
- Faqat ruxsat etilgan foydalanuvchilar ko'rishi mumkin
- Barcha o'zgarishlar audit log'ga yoziladi
- Ombor zaxirasi transaksion yangilanadi

### Validatsiya
- Chek raqami tekshiriladi
- Sotuv mavjudligi tekshiriladi
- Sotuv allaqachon qaytarilmaganligini tekshirish
- Miqdor validatsiyasi
- Sabab majburiyligi

## 📱 Responsive Dizayn

### Desktop (1920px+)
- 3 ustunli statistika kartlari
- Keng jadval
- 2 ustunli filtr paneli

### Tablet (768px - 1919px)
- 2 ustunli statistika kartlari
- Scroll qilinadigan jadval
- 2 ustunli filtr paneli

### Mobile (< 768px)
- 1 ustunli statistika kartlari
- Vertikal scroll jadval
- 1 ustunli filtr paneli

## 🎨 Dizayn Elementlari

### Ranglar
- **Destructive (Qizil):** Qaytarishlar (manfiy operatsiya)
- **Success (Yashil):** Muvaffaqiyatli operatsiyalar
- **Warning (Sariq):** Ogohlantirish
- **Primary (Ko'k):** Asosiy elementlar

### Ikonlar
- **RotateCcw:** Qaytarishlar
- **Plus:** Yangi qaytarish
- **Search:** Qidirish
- **Eye:** Ko'rish
- **AlertCircle:** Ogohlantirish

### Shriftlar
- **Sarlavha:** 3xl, bold
- **Statistika:** 3xl, bold
- **Jadval:** base, medium
- **Kichik matn:** sm, muted

## 🧪 Test Ssenariylari

### Test 1: To'liq Qaytarish
1. Yangi qaytarish yarating
2. Chek raqamini kiriting
3. Barcha mahsulotlarni belgilang
4. Sababni tanlang
5. Tasdiqlang
6. Ombor zaxirasi oshganligini tekshiring

### Test 2: Qisman Qaytarish
1. Yangi qaytarish yarating
2. Chek raqamini kiriting
3. Faqat ba'zi mahsulotlarni belgilang
4. Miqdorni o'zgartiring
5. Sababni tanlang
6. Tasdiqlang
7. Ombor zaxirasi to'g'ri oshganligini tekshiring

### Test 3: Validatsiya
1. Bo'sh chek raqami bilan qidiring → Xato
2. Noto'g'ri chek raqami bilan qidiring → Topilmadi
3. Allaqachon qaytarilgan sotuvni qidiring → Xato
4. Mahsulot tanlamasdan tasdiqlang → Xato
5. Sabab kiritmay tasdiqlang → Xato
6. Miqdorni sotilgan miqdordan oshiring → Avtomatik cheklash

### Test 4: Filtrlar
1. Sana filtrini sinab ko'ring
2. Status filtrini sinab ko'ring
3. Bir nechta filtrni birgalikda sinab ko'ring
4. Natijalar to'g'ri filtrlangan bo'lishi kerak

### Test 5: Statistika
1. Bugungi qaytarish yarating
2. Statistika kartasini tekshiring
3. Jami summa to'g'ri bo'lishi kerak
4. Qaytarishlar soni to'g'ri bo'lishi kerak

## 📝 Xulosa

Qaytarishlar moduli to'liq funksional va ishga tayyor:
- ✅ Chek qidirish
- ✅ To'liq/qisman qaytarish
- ✅ Ombor zaxirasini avtomatik yangilash
- ✅ Qidiruv va filtrlar
- ✅ Statistika
- ✅ Batafsil ko'rish
- ✅ Responsive dizayn
- ✅ O'zbek tilida interfeys
- ✅ To'g'ri hisob-kitoblar
- ✅ Xavfsiz ma'lumotlar bazasi
- ✅ Sotuvlar bilan integratsiya

**Tizim tayyor va ishlatish mumkin!**
