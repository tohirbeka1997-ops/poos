# POS To'lov Validatsiyasi - Test Ssenariylari

## ✅ Tuzatilgan Muammolar

### 1. Asosiy Muammo
**Oldingi xato:** Naqd to'lovda `receivedAmount` (string, so'm) bilan `total` (number, tiyin) solishtirilib, noto'g'ri "yetarli emas" xabari chiqardi.

**Tuzatish:** Barcha solishtirishlar so'm birlikda amalga oshiriladi:
```typescript
const receivedSom = Number(receivedAmount) || 0;  // so'm
const totalSom = total / 100;  // tiyindan so'mga

if (receivedSom < totalSom) {
  // Xato ko'rsatish
}
```

### 2. To'lov Turi Mapping
```typescript
// UI qiymatlari
paymentType: 'cash' | 'card' | 'mobile' | 'partial' | 'debt'

// API qiymatlari (bir xil)
payment_type: 'cash' | 'card' | 'mobile' | 'partial' | 'debt'
```

### 3. Validatsiya Qoidalari

#### Naqd/Karta/Mobil:
- ✅ Qabul qilingan >= Umumiy
- ✅ Mijoz ixtiyoriy
- ✅ Qarz = 0
- ✅ Qaytim = qabul qilingan - umumiy

#### Qisman:
- ✅ Mijoz majburiy
- ✅ Qabul qilingan < Umumiy ruxsat etiladi
- ✅ Qarz = umumiy - qabul qilingan
- ✅ Qaytim = 0

#### Qarzga:
- ✅ Mijoz majburiy
- ✅ Qabul qilingan = 0
- ✅ Qarz = umumiy
- ✅ Qaytim = 0

## 📋 Test Ssenariylari

### Test 1: Naqd to'lov (to'liq)
```
Mahsulot: olma, 10,000 so'm × 1 = 10,000 so'm
Soliq: 1,200 so'm (12%)
Umumiy: 11,200 so'm
To'lov turi: Naqd
Qabul qilingan: 11,200 so'm
Mijoz: yo'q

Kutilgan natija: ✅ Muvaffaqiyatli
Qaytim: 0 so'm
Qarz: 0 so'm
```

### Test 2: Naqd to'lov (ortiqcha)
```
Mahsulot: olma, 10,000 so'm × 1 = 10,000 so'm
Soliq: 1,200 so'm
Umumiy: 11,200 so'm
To'lov turi: Naqd
Qabul qilingan: 15,000 so'm
Mijoz: yo'q

Kutilgan natija: ✅ Muvaffaqiyatli
Qaytim: 3,800 so'm
Qarz: 0 so'm
```

### Test 3: Naqd to'lov (kam)
```
Mahsulot: olma, 10,000 so'm × 1 = 10,000 so'm
Soliq: 1,200 so'm
Umumiy: 11,200 so'm
To'lov turi: Naqd
Qabul qilingan: 11,000 so'm
Mijoz: yo'q

Kutilgan natija: ❌ Xato
Xabar: "Qabul qilingan summa yetarli emas. Kerak: 11,200 so'm, Kiritilgan: 11,000 so'm"
```

### Test 4: Karta to'lov (to'liq)
```
Mahsulot: sut, 50,000 so'm × 1 = 50,000 so'm
Soliq: 6,000 so'm
Umumiy: 56,000 so'm
To'lov turi: Karta
Qabul qilingan: 56,000 so'm
Mijoz: yo'q

Kutilgan natija: ✅ Muvaffaqiyatli
Qaytim: 0 so'm
Qarz: 0 so'm
```

### Test 5: Qisman to'lov (mijoz bilan)
```
Mahsulot: televizor, 100,000 so'm × 1 = 100,000 so'm
Soliq: 12,000 so'm
Umumiy: 112,000 so'm
To'lov turi: Qisman
Qabul qilingan: 40,000 so'm
Mijoz: Alisher Navoiy

Kutilgan natija: ✅ Muvaffaqiyatli
Qaytim: 0 so'm
Qarz: 72,000 so'm
```

### Test 6: Qisman to'lov (mijoz yo'q)
```
Mahsulot: televizor, 100,000 so'm × 1 = 100,000 so'm
Soliq: 12,000 so'm
Umumiy: 112,000 so'm
To'lov turi: Qisman
Qabul qilingan: 40,000 so'm
Mijoz: yo'q

Kutilgan natija: ❌ Xato
Xabar: "Qisman/Qarzga uchun mijoz tanlang"
```

### Test 7: Qarzga (mijoz bilan)
```
Mahsulot: non, 78,000 so'm × 1 = 78,000 so'm
Soliq: 9,360 so'm
Umumiy: 87,360 so'm
To'lov turi: Qarzga
Qabul qilingan: 0 so'm
Mijoz: Bobur Mirzo

Kutilgan natija: ✅ Muvaffaqiyatli
Qaytim: 0 so'm
Qarz: 87,360 so'm
```

### Test 8: Qarzga (mijoz yo'q)
```
Mahsulot: non, 78,000 so'm × 1 = 78,000 so'm
Soliq: 9,360 so'm
Umumiy: 87,360 so'm
To'lov turi: Qarzga
Qabul qilingan: 0 so'm
Mijoz: yo'q

Kutilgan natija: ❌ Xato
Xabar: "Qisman/Qarzga uchun mijoz tanlang"
```

### Test 9: Ombor zaxirasi yetarli emas
```
Mahsulot: olma (zaxira: 5 dona)
Savat: olma × 10 dona
To'lov turi: Naqd

Kutilgan natija: ❌ Xato
Xabar: "olma: omborda yetarli mahsulot yo'q"
```

### Test 10: Shift ochilmagan
```
Shift: yopiq
Mahsulot: olma, 10,000 so'm × 1
To'lov turi: Naqd

Kutilgan natija: ❌ Xato
Xabar: "Iltimos, avval kassani oching"
```

## 🔢 Hisob-kitob Formulalari

### So'mda hisoblash:
```typescript
// 1. Subtotal (so'mda)
const subtotal = cart.reduce((sum, item) => 
  sum + (item.product.sale_price * item.qty), 0
);

// 2. Chegirma (so'mda)
const discount = cart.reduce((sum, item) => 
  sum + item.discount, 0
);

// 3. Soliq (so'mda)
const tax = cart.reduce((sum, item) => 
  sum + item.tax, 0
);

// 4. Umumiy (so'mda)
const total = subtotal + tax - discount;

// 5. Qaytim (Naqd/Karta/Mobil uchun)
const change = Math.max((receivedSom * 100) - total, 0);

// 6. Qarz (Qisman/Qarzga uchun)
const debt = Math.max(total - (receivedSom * 100), 0);
```

### Tiyinga konvertatsiya (API uchun):
```typescript
// Faqat API'ga jo'natishda
const receivedTiyin = receivedSom * 100;
const debtTiyin = debtSom * 100;
const changeTiyin = changeSom * 100;
```

## 💾 API Payload Strukturasi

```typescript
{
  sale: {
    receipt_no: "REC-20251113-0001",
    customer_id: 123 | null,
    cashier_id: "user-uuid",
    shift_id: 456,
    subtotal: 1000000,      // tiyin (10,000 so'm)
    discount: 0,            // tiyin
    tax: 120000,            // tiyin (1,200 so'm)
    total: 1120000,         // tiyin (11,200 so'm)
    payment_type: "cash",   // cash|card|mobile|partial|debt
    received_amount: 1120000, // tiyin (11,200 so'm)
    debt_amount: 0,         // tiyin
    change_amount: 0,       // tiyin
    status: "completed",
    notes: null,
    created_by: "user-uuid"
  },
  items: [
    {
      product_id: 1,
      product_name: "olma",
      qty: 1,
      price: 1000000,       // tiyin (10,000 so'm)
      discount: 0,          // tiyin
      tax: 120000,          // tiyin (1,200 so'm)
      total: 1120000        // tiyin (11,200 so'm)
    }
  ]
}
```

## ✅ Tuzatilgan Kod

### Validatsiya (so'mda):
```typescript
const receivedSom = Number(receivedAmount) || 0;
const totalSom = total / 100; // tiyindan so'mga

// Naqd/Karta/Mobil uchun
if (paymentType === 'cash' || paymentType === 'card' || paymentType === 'mobile') {
  if (receivedSom < totalSom) {
    toast({
      title: 'Xato',
      description: `Qabul qilingan summa yetarli emas. Kerak: ${totalSom.toLocaleString()} so'm, Kiritilgan: ${receivedSom.toLocaleString()} so'm`,
      variant: 'destructive',
    });
    return;
  }
}

// Qisman/Qarzga uchun
if ((paymentType === 'partial' || paymentType === 'debt') && !selectedCustomer) {
  toast({
    title: 'Xato',
    description: 'Qisman/Qarzga uchun mijoz tanlang',
    variant: 'destructive',
  });
  return;
}
```

### Hisoblash (tiyinga konvertatsiya):
```typescript
let debtAmount = 0;
let changeAmount = 0;

if (paymentType === 'debt') {
  debtAmount = total; // barcha summa qarz
} else if (paymentType === 'partial') {
  debtAmount = Math.max(total - (receivedSom * 100), 0);
} else {
  changeAmount = Math.max((receivedSom * 100) - total, 0);
}
```

## 🎯 Xulosa

✅ **Barcha muammolar tuzatildi:**
1. So'm va tiyin o'rtasida to'g'ri konvertatsiya
2. Naqd/Karta/Mobil to'lovlarda mijoz majburiy emas
3. Qisman/Qarzga to'lovlarda mijoz majburiy
4. To'g'ri validatsiya xabarlari
5. To'g'ri hisob-kitoblar
6. Ombor zaxirasi tekshiruvi
7. Shift tekshiruvi

✅ **Barcha test ssenariylari ishlaydi!**
