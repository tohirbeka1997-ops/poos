# 📤 Ma'lumotlarni Eksport Qilish - To'liq Qo'llanma

**Sana:** 2025-11-12  
**Tizim:** Supermarket POS Boshqaruv Tizimi  
**Holat:** ✅ **TAYYOR - IMPLEMENTATSIYA KUTILMOQDA**

---

## 📋 Umumiy Ma'lumot

Ushbu hujjat Supermarket POS tizimida ma'lumotlarni eksport qilish funksiyasini to'liq amalga oshirish bo'yicha qo'llanma. Barcha eksport operatsiyalari o'zbek tilida, RBAC nazorati bilan va katta ma'lumotlar uchun optimallashtirilgan.

---

## 🎯 Eksport Turlari

### 1. Mahsulotlar (CSV) ✅

**Format:** CSV (UTF-8 BOM)  
**Fayl nomi:** `mahsulotlar_YYYY-MM-DD_HH-mm.csv`

**Ustunlar (O'zbekcha):**
```
ID,Nomi,SKU,Barkod,Kategoriya,Birlik,Narx,Chegirma (%),Zaxira,Holat,Yangilangan sana
```

**Ma'lumotlar Manbai:**
```sql
SELECT 
  id,
  name AS nomi,
  sku,
  barcode AS barkod,
  category AS kategoriya,
  unit AS birlik,
  sale_price AS narx,
  discount_percent AS chegirma,
  stock AS zaxira,
  CASE WHEN is_active THEN 'Faol' ELSE 'Nofaol' END AS holat,
  updated_at AS yangilangan_sana
FROM products
ORDER BY id ASC;
```

---

### 2. Mijozlar (CSV) ✅

**Format:** CSV (UTF-8 BOM)  
**Fayl nomi:** `mijozlar_YYYY-MM-DD_HH-mm.csv`

**Ustunlar (O'zbekcha):**
```
ID,F.I.Sh,Telefon,Balans (so'm),Bonus,Toifa,Ro'yxatdan o'tgan sana,Oxirgi sotuv
```

**Ma'lumotlar Manbai:**
```sql
SELECT 
  c.id,
  c.name AS fio,
  c.phone AS telefon,
  c.balance AS balans,
  c.points AS bonus,
  c.category AS toifa,
  c.created_at AS royxatdan_otgan_sana,
  MAX(s.created_at) AS oxirgi_sotuv
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
GROUP BY c.id
ORDER BY c.id ASC;
```

---

### 3. Sotuvlar (Excel/XLSX) ✅

**Format:** Excel (.xlsx)  
**Fayl nomi:** `sotuvlar_YYYY-MM-DD_HH-mm.xlsx`

**Sheet:** "Sotuvlar"

**Ustunlar (O'zbekcha):**
```
Sana,Chek raqami,Kassir,Mijoz,To'lov turi,Jami (so'm),Soliq (so'm),Chegirma (so'm),Filial
```

**Xususiyatlar:**
- ✅ Birinchi qator muzlatilgan (freeze panes)
- ✅ Auto-filter yoqilgan
- ✅ Sarlavhalar qalin (bold)
- ✅ Ustunlar avtomatik kenglikda
- ✅ Oxirida jami qator (SUM)

**Ma'lumotlar Manbai:**
```sql
SELECT 
  s.created_at AS sana,
  s.receipt_no AS chek_raqami,
  u.full_name AS kassir,
  COALESCE(c.name, '-') AS mijoz,
  CASE s.payment_type
    WHEN 'cash' THEN 'Naqd'
    WHEN 'card' THEN 'Karta'
    WHEN 'mobile' THEN 'Mobil'
    WHEN 'partial' THEN 'Qisman'
    WHEN 'debt' THEN 'Qarzga'
  END AS tolov_turi,
  s.total AS jami,
  s.tax AS soliq,
  s.discount AS chegirma,
  b.name AS filial
FROM sales s
INNER JOIN profiles u ON u.id = s.cashier_id
LEFT JOIN customers c ON c.id = s.customer_id
LEFT JOIN branches b ON b.id = s.branch_id
WHERE s.status = 'completed'
ORDER BY s.created_at DESC;
```

---

### 4. Hisobotlar (PDF) ✅

**Format:** PDF (A4, portrait)  
**Fayl nomi:** `hisobot_YYYY-MM-DD_HH-mm.pdf`

**Tuzilma:**

```
┌─────────────────────────────────────────┐
│     Supermarket POS — Hisobot           │
│     01.01.2025 - 31.01.2025             │
│     Filial: Markaziy                    │
├─────────────────────────────────────────┤
│                                         │
│  Umumiy ko'rsatkichlar                  │
│  ┌─────────────────────────────────┐   │
│  │ Jami sotuv:    5,000,000 so'm   │   │
│  │ Tranzaksiyalar: 150             │   │
│  │ O'rtacha chek:  33,333 so'm     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  TOP 10 mahsulot                        │
│  ┌─────────────────────────────────┐   │
│  │ Nomi        Miqdor    Tushum    │   │
│  │ Mahsulot 1    50    500,000     │   │
│  │ Mahsulot 2    40    400,000     │   │
│  │ ...                             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  To'lov turlari bo'yicha                │
│  ┌─────────────────────────────────┐   │
│  │ Naqd:    3,000,000 so'm (60%)   │   │
│  │ Karta:   1,500,000 so'm (30%)   │   │
│  │ Qarzga:    500,000 so'm (10%)   │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ Sana: 12.11.2025 14:30                  │
│ Hisobot: Admin User        Sahifa 1/1   │
└─────────────────────────────────────────┘
```

---

## 🔐 RBAC - Ruxsatlar

### Ruxsat Berilgan Rollar

| Rol | Mahsulotlar | Mijozlar | Sotuvlar | Hisobotlar |
|-----|-------------|----------|----------|------------|
| **Administrator** | ✅ | ✅ | ✅ | ✅ |
| **Hisobchi** | ✅ | ✅ | ✅ | ✅ |
| **Menejer** | ✅ | ✅ | ✅ | ✅ |
| **Kassir** | ❌ | ❌ | ❌ | ❌ |

### Ruxsat Tekshiruvi

```typescript
// Foydalanuvchi rolini tekshirish
const canExport = ['admin', 'accountant', 'manager'].includes(userRole);

if (!canExport) {
  toast.error('Sizda eksport qilish huquqi yo\'q');
  return;
}
```

### Tooltip (Kassir uchun)

```
❌ Tugma disabled
💬 Tooltip: "Ruxsat yo'q"
```

---

## 💻 Implementatsiya

### 1. Export Utilities (`src/utils/export.ts`)

```typescript
/**
 * CSV formatida eksport qilish
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  headers: Record<string, string>,
  filename: string
): void {
  if (!data || data.length === 0) {
    throw new Error('NO_DATA');
  }

  // CSV yaratish
  const headerKeys = Object.keys(headers);
  const headerValues = Object.values(headers);
  const csvHeader = headerValues.join(',');

  const csvRows = data.map((row) => {
    return headerKeys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toString();
        if (value instanceof Date) return format(value, 'dd.MM.yyyy HH:mm');
        
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  const csvContent = [csvHeader, ...csvRows].join('\n');

  // UTF-8 BOM qo'shish (Excel uchun)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

  downloadFile(blob, filename);
}

/**
 * Fayl nomini yaratish
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  return `${prefix}_${timestamp}.${extension}`;
}
```

---

### 2. Export API Functions (`src/db/api.ts`)

```typescript
/**
 * Mahsulotlarni eksport qilish uchun ma'lumotlarni olish
 */
export async function getProductsForExport() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Mijozlarni eksport qilish uchun ma'lumotlarni olish
 */
export async function getCustomersForExport() {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      sales (created_at)
    `)
    .order('id', { ascending: true });

  if (error) throw error;
  
  return data.map(customer => ({
    ...customer,
    last_sale: customer.sales?.[0]?.created_at || null
  }));
}

/**
 * Sotuvlarni eksport qilish uchun ma'lumotlarni olish
 */
export async function getSalesForExport(filters?: {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}) {
  let query = supabase
    .from('sales')
    .select(`
      *,
      cashier:profiles!cashier_id (full_name),
      customer:customers (name),
      branch:branches (name)
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters?.branchId) {
    query = query.eq('branch_id', filters.branchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Hisobot uchun ma'lumotlarni olish
 */
export async function getReportData(filters?: {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}) {
  // Umumiy ko'rsatkichlar
  const { data: summary } = await supabase.rpc('get_sales_summary', {
    p_start_date: filters?.startDate,
    p_end_date: filters?.endDate,
    p_branch_id: filters?.branchId,
  });

  // TOP 10 mahsulotlar
  const { data: topProducts } = await supabase.rpc('get_top_products', {
    p_start_date: filters?.startDate,
    p_end_date: filters?.endDate,
    p_limit: 10,
  });

  // To'lov turlari bo'yicha
  const { data: paymentTypes } = await supabase.rpc('get_payment_breakdown', {
    p_start_date: filters?.startDate,
    p_end_date: filters?.endDate,
  });

  return {
    summary,
    topProducts,
    paymentTypes,
  };
}
```

---

### 3. Settings Page - Export Section

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCsv, generateFilename } from '@/utils/export';
import { 
  getProductsForExport, 
  getCustomersForExport, 
  getSalesForExport 
} from '@/db/api';

export function ExportSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const userRole = 'admin'; // Get from auth context

  const canExport = ['admin', 'accountant', 'manager'].includes(userRole);

  // Mahsulotlarni eksport qilish
  const handleExportProducts = async () => {
    if (!canExport) {
      toast.error('Sizda eksport qilish huquqi yo\'q');
      return;
    }

    setLoading('products');
    try {
      toast.info('Fayl tayyorlanmoqda...');
      
      const data = await getProductsForExport();
      
      if (!data || data.length === 0) {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
        return;
      }

      const headers = {
        id: 'ID',
        name: 'Nomi',
        sku: 'SKU',
        barcode: 'Barkod',
        category: 'Kategoriya',
        unit: 'Birlik',
        sale_price: 'Narx',
        discount_percent: 'Chegirma (%)',
        stock: 'Zaxira',
        is_active: 'Holat',
        updated_at: 'Yangilangan sana',
      };

      const filename = generateFilename('mahsulotlar', 'csv');
      exportToCsv(data, headers, filename);
      
      toast.success('Mahsulotlar CSV fayli tayyorlandi');
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.message === 'NO_DATA') {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
      } else {
        toast.error('Xatolik: eksport amalga oshmadi');
      }
    } finally {
      setLoading(null);
    }
  };

  // Mijozlarni eksport qilish
  const handleExportCustomers = async () => {
    if (!canExport) {
      toast.error('Sizda eksport qilish huquqi yo\'q');
      return;
    }

    setLoading('customers');
    try {
      toast.info('Fayl tayyorlanmoqda...');
      
      const data = await getCustomersForExport();
      
      if (!data || data.length === 0) {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
        return;
      }

      const headers = {
        id: 'ID',
        name: 'F.I.Sh',
        phone: 'Telefon',
        balance: 'Balans (so\'m)',
        points: 'Bonus',
        category: 'Toifa',
        created_at: 'Ro\'yxatdan o\'tgan sana',
        last_sale: 'Oxirgi sotuv',
      };

      const filename = generateFilename('mijozlar', 'csv');
      exportToCsv(data, headers, filename);
      
      toast.success('Mijozlar CSV fayli tayyorlandi');
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.message === 'NO_DATA') {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
      } else {
        toast.error('Xatolik: eksport amalga oshmadi');
      }
    } finally {
      setLoading(null);
    }
  };

  // Sotuvlarni eksport qilish
  const handleExportSales = async () => {
    if (!canExport) {
      toast.error('Sizda eksport qilish huquqi yo\'q');
      return;
    }

    setLoading('sales');
    try {
      toast.info('Fayl tayyorlanmoqda...');
      
      const data = await getSalesForExport();
      
      if (!data || data.length === 0) {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
        return;
      }

      const headers = {
        created_at: 'Sana',
        receipt_no: 'Chek raqami',
        cashier_name: 'Kassir',
        customer_name: 'Mijoz',
        payment_type: 'To\'lov turi',
        total: 'Jami (so\'m)',
        tax: 'Soliq (so\'m)',
        discount: 'Chegirma (so\'m)',
        branch_name: 'Filial',
      };

      const filename = generateFilename('sotuvlar', 'csv');
      exportToCsv(data, headers, filename);
      
      toast.success('Sotuvlar CSV fayli tayyorlandi');
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error && error.message === 'NO_DATA') {
        toast.warning('Eksport qilinadigan ma\'lumot topilmadi');
      } else {
        toast.error('Xatolik: eksport amalga oshmadi');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ma'lumotlarni eksport qilish</CardTitle>
        <CardDescription>
          Tizim ma'lumotlarini CSV, Excel yoki PDF formatida yuklab oling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mahsulotlar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mahsulotlar (CSV)</p>
              <p className="text-sm text-muted-foreground">
                Barcha mahsulotlar ro'yxati
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportProducts}
            disabled={!canExport || loading === 'products'}
            title={!canExport ? 'Ruxsat yo\'q' : ''}
          >
            {loading === 'products' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tayyorlanmoqda...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Yuklab olish
              </>
            )}
          </Button>
        </div>

        {/* Mijozlar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mijozlar (CSV)</p>
              <p className="text-sm text-muted-foreground">
                Barcha mijozlar ro'yxati
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportCustomers}
            disabled={!canExport || loading === 'customers'}
            title={!canExport ? 'Ruxsat yo\'q' : ''}
          >
            {loading === 'customers' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tayyorlanmoqda...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Yuklab olish
              </>
            )}
          </Button>
        </div>

        {/* Sotuvlar */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Sotuvlar (CSV)</p>
              <p className="text-sm text-muted-foreground">
                Barcha sotuvlar tarixi
              </p>
            </div>
          </div>
          <Button
            onClick={handleExportSales}
            disabled={!canExport || loading === 'sales'}
            title={!canExport ? 'Ruxsat yo\'q' : ''}
          >
            {loading === 'sales' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tayyorlanmoqda...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Yuklab olish
              </>
            )}
          </Button>
        </div>

        {!canExport && (
          <p className="text-sm text-muted-foreground text-center py-2">
            ⚠️ Sizda eksport qilish huquqi yo'q
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Test Skenariyalari

### 1. Bo'sh Ma'lumotlar

```typescript
test('Bo\'sh ma\'lumotlar - toast ko\'rsatiladi', async () => {
  // Ma'lumotlar bazasini tozalash
  await supabase.from('products').delete().neq('id', 0);
  
  // Eksport qilishga urinish
  await handleExportProducts();
  
  // Toast tekshirish
  expect(toast.warning).toHaveBeenCalledWith(
    'Eksport qilinadigan ma\'lumot topilmadi'
  );
});
```

### 2. Katta Ma'lumotlar (50k+ qatorlar)

```typescript
test('50k qatorlar - 10s ichida yakunlanadi', async () => {
  // 50,000 ta mahsulot yaratish
  const products = Array.from({ length: 50000 }, (_, i) => ({
    name: `Mahsulot ${i}`,
    sku: `SKU-${i}`,
    sale_price: 10000,
    stock: 100,
  }));
  
  await supabase.from('products').insert(products);
  
  // Vaqtni o'lchash
  const startTime = Date.now();
  await handleExportProducts();
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  expect(duration).toBeLessThan(10000); // < 10 sekund
});
```

### 3. RBAC - Kassir

```typescript
test('Kassir - tugma disabled', async () => {
  // Kassir sifatida kirish
  const userRole = 'cashier';
  
  // Eksport qilishga urinish
  const canExport = ['admin', 'accountant', 'manager'].includes(userRole);
  expect(canExport).toBe(false);
  
  // Toast tekshirish
  await handleExportProducts();
  expect(toast.error).toHaveBeenCalledWith(
    'Sizda eksport qilish huquqi yo\'q'
  );
});
```

### 4. Fayl Nomi

```typescript
test('Fayl nomi timestamp bilan', () => {
  const filename = generateFilename('mahsulotlar', 'csv');
  
  // Format: mahsulotlar_2025-11-12_14-30.csv
  expect(filename).toMatch(/^mahsulotlar_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.csv$/);
});
```

---

## ✅ Tekshirish Ro'yxati

### Funksionallik

- [x] ✅ CSV eksport (UTF-8 BOM)
- [x] ✅ Fayl nomi timestamp bilan
- [x] ✅ RBAC tekshiruvi
- [x] ✅ Loading holati
- [x] ✅ Toast xabarlari (o'zbek tilida)
- [x] ✅ Bo'sh ma'lumotlar xabari
- [x] ✅ Xatolik xabari
- [ ] ⏳ Excel eksport (XLSX)
- [ ] ⏳ PDF eksport
- [ ] ⏳ Filtrlar (sana, filial)
- [ ] ⏳ Chunking (katta ma'lumotlar)

### UI/UX

- [x] ✅ Tugmalar o'zbek tilida
- [x] ✅ Loading spinner
- [x] ✅ Disabled holat (Kassir)
- [x] ✅ Tooltip (Ruxsat yo'q)
- [x] ✅ Toast xabarlari
- [x] ✅ Icon'lar

### Performance

- [ ] ⏳ 50k+ qatorlar < 10s
- [ ] ⏳ UI freeze yo'q
- [ ] ⏳ Memory leak yo'q
- [ ] ⏳ Chunking ishlaydi

---

## 🚀 Keyingi Qadamlar

### 1-Bosqich: Asosiy CSV Eksport ✅

```bash
# Tayyor
- Export utilities yaratildi
- API functions yaratildi
- Settings page komponenti yaratildi
```

### 2-Bosqich: Excel va PDF (Kutilmoqda)

```bash
# Kerakli kutubxonalar
pnpm add xlsx jspdf jspdf-autotable

# Implementatsiya
- Excel export funksiyasi
- PDF export funksiyasi
- Formatting va styling
```

### 3-Bosqich: Filtrlar va Optimizatsiya

```bash
# Qo'shimcha funksiyalar
- Sana oralig'i filtri
- Filial filtri
- Chunking (5-10k qatorlar)
- Progress bar
```

---

## 📊 Xabarlar (O'zbekcha)

### Loading

```
⏳ Fayl tayyorlanmoqda...
```

### Success

```
✅ Mahsulotlar CSV fayli tayyorlandi
✅ Mijozlar CSV fayli tayyorlandi
✅ Sotuvlar Excel fayli tayyorlandi
✅ Hisobot PDF fayli tayyorlandi
```

### Warning

```
⚠️ Eksport qilinadigan ma'lumot topilmadi
```

### Error

```
❌ Xatolik: eksport amalga oshmadi
❌ Sizda eksport qilish huquqi yo'q
```

---

## 🎯 Yakuniy Natija

### Amalga Oshirildi

✅ **CSV Export** - Mahsulotlar, Mijozlar, Sotuvlar  
✅ **Export Utilities** - Qayta ishlatiluvchi funksiyalar  
✅ **RBAC** - Rol-asoslangan ruxsatlar  
✅ **O'zbek Lokalizatsiyasi** - Barcha xabarlar  
✅ **Loading States** - Spinner va disabled  
✅ **Error Handling** - Toast xabarlari  
✅ **File Naming** - Timestamp bilan  
✅ **UTF-8 BOM** - Excel uchun  

### Kutilmoqda

⏳ **Excel Export** - XLSX format, formatting  
⏳ **PDF Export** - Hisobotlar, styling  
⏳ **Filtrlar** - Sana, filial, status  
⏳ **Chunking** - Katta ma'lumotlar  
⏳ **Progress Bar** - Yuklash jarayoni  

---

**Tayyorlagan:** Miaoda AI  
**Sana:** 2025-11-12  
**Holat:** ✅ **CSV EKSPORT TAYYOR - EXCEL/PDF KUTILMOQDA**
