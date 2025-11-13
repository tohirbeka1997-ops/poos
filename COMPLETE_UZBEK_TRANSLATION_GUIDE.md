# 🇺🇿 To'liq O'zbek Tiliga O'tkazish Qo'llanmasi

**Sana:** 2025-11-12  
**Tizim:** Supermarket POS Boshqaruv Tizimi  
**Holat:** ✅ **TARJIMA FAYLI TAYYOR - INTEGRATSIYA KUTILMOQDA**

---

## 📋 Umumiy Ma'lumot

Ushbu hujjat Supermarket POS tizimini **100% o'zbek tiliga** o'tkazish bo'yicha to'liq qo'llanma. Barcha xitoycha, ruscha va inglizcha matnlar o'zbek tiliga almashtiriladi.

### Amalga Oshirilgan

- ✅ **To'liq Tarjima Fayli:** 450+ tarjima kaliti
- ✅ **Barcha Modullar:** Login, POS, Mahsulotlar, Mijozlar, Sotuvlar, va boshqalar
- ✅ **Foydalanuvchi Menyusi:** Hisobni almashtirish, Chiqish
- ✅ **Xabarlar:** Toast, Modal, Validation
- ✅ **Ma'lumotlar Bazasi:** RBAC, Filiallar, Til sozlamalari

---

## 🎯 Tarjima Qamrovi

### Almashtirilishi Kerak Bo'lgan Matnlar

| Kategoriya | Misollar | Holat |
|------------|----------|-------|
| **Modal Dialoglar** | 删除用户, 确认, 取消 | ✅ Tarjima qilindi |
| **Toast Xabarlari** | 成功, 出错了, 加载中 | ✅ Tarjima qilindi |
| **Tugmalar** | 保存, 删除, 取消, 确认 | ✅ Tarjima qilindi |
| **Validation** | 用户名或密码错误 | ✅ Tarjima qilindi |
| **Tooltips** | 提示, 警告 | ✅ Tarjima qilindi |
| **Placeholder** | 请输入..., 搜索... | ✅ Tarjima qilindi |
| **Jadval Sarlavhalari** | 用户名, 角色, 状态 | ✅ Tarjima qilindi |
| **Sahifa Nomlari** | 产品, 客户, 销售 | ✅ Tarjima qilindi |

---

## 📖 Tarjima Lug'ati

### Asosiy Atamalar

| Asl Matn (Xitoycha/Inglizcha) | O'zbekcha Tarjima |
|--------------------------------|-------------------|
| 删除用户 / Delete User | Foydalanuvchini o'chirish |
| 删除后，该用户的登录将被阻止 | Foydalanuvchi o'chirildi. U endi tizimga kira olmaydi |
| 您确定要继续吗？ / Are you sure? | Davom etishni xohlaysizmi? |
| 用户名 / Username | Foydalanuvchi nomi / Login |
| 注: 历史记录将被保留 | Eslatma: Tarixiy ma'lumotlar saqlanib qoladi |
| 成功 / Success | Muvaffaqiyatli |
| 用户已删除（登录已阻止） | Foydalanuvchi o'chirildi (kirish bloklandi) |
| 确认 / Confirm | Tasdiqlash |
| 取消 / Cancel | Bekor qilish |
| 删除 / Delete | O'chirish |
| 保存 / Save | Saqlash |
| 更新成功 / Update Success | Yangilash muvaffaqiyatli bajarildi |
| 出错了 / Error Occurred | Xatolik yuz berdi |
| 登录失败 / Login Failed | Login amalga oshmadi |
| 用户名或密码错误 / Invalid Credentials | Login yoki parol noto'g'ri |
| 请稍后再试 / Try Later | Iltimos, keyinroq urinib ko'ring |
| 提示 / Info | Ogohlantirish |
| 操作成功 / Operation Success | Amal muvaffaqiyatli bajarildi |
| 加载中... / Loading... | Yuklanmoqda... |
| 完成 / Done | Tugallandi |
| 错误 / Error | Xatolik |
| 确定 / OK | OK |
| 警告 / Warning | Diqqat |

---

## 🔧 Foydalanuvchi Menyusi

### Menyu Bandlari

```
┌─────────────────────────────────┐
│ 👤 [Avatar]                     │
├─────────────────────────────────┤
│ 📋 Profilim                     │
│ 🔄 Hisobni almashtirish         │
│ 🎭 Rolni tanlash                │
│ 🏢 Filialni tanlash             │
│ 🌐 Til                          │
│ 🔑 Parolni almashtirish         │
│ 🔒 Qulflash                     │
│ 🚪 Chiqish                      │
└─────────────────────────────────┘
```

### Hisobni Almashtirish Modal

**Sarlavha:** Hisobni almashtirish  
**Tavsif:** Quyidagi hisoblardan birini tanlang

**Tugmalar:**
- Bekor qilish
- Davom etish

**Toast Xabarlari:**
- ✅ "Hisob almashdi"
- ❌ "Sizda bu hisobga o'tish huquqi yo'q"

### Chiqish Tasdiqlash

**Sarlavha:** Chiqish  
**Matn:** Tizimdan chiqishni tasdiqlaysizmi?

**Tugmalar:**
- Bekor qilish
- Chiqish

**Ochiq Smena Ogohlantirishi:**
```
⚠️ Diqqat!
Smena yopilmagan. Chiqishdan oldin 'Kassa → Smena yopish'ni bajaring.
```

**Toast Xabarlari:**
- ✅ "Tizimdan chiqdingiz"

---

## 📝 Tarjima Kalitlari

### Umumiy (Common)

```json
{
  "common.add": "Qo'shish",
  "common.edit": "Tahrirlash",
  "common.delete": "O'chirish",
  "common.cancel": "Bekor qilish",
  "common.confirm": "Tasdiqlash",
  "common.save": "Saqlash",
  "common.close": "Yopish",
  "common.open": "Ochish",
  "common.search": "Qidirish",
  "common.loading": "Yuklanmoqda...",
  "common.success": "Muvaffaqiyatli",
  "common.error": "Xatolik",
  "common.warning": "Ogohlantirish",
  "common.done": "Tugallandi",
  "common.ok": "OK",
  "common.continue": "Davom etish"
}
```

### Foydalanuvchi Menyusi (User Menu)

```json
{
  "userMenu.profile": "Profilim",
  "userMenu.switchAccount": "Hisobni almashtirish",
  "userMenu.switchRole": "Rolni tanlash",
  "userMenu.switchBranch": "Filialni tanlash",
  "userMenu.language": "Til",
  "userMenu.changePassword": "Parolni almashtirish",
  "userMenu.lockScreen": "Qulflash",
  "userMenu.logout": "Chiqish",
  "userMenu.switchAccountTitle": "Hisobni almashtirish",
  "userMenu.switchAccountDesc": "Quyidagi hisoblardan birini tanlang",
  "userMenu.accountSwitched": "Hisob almashdi",
  "userMenu.noPermissionToSwitch": "Sizda bu hisobga o'tish huquqi yo'q",
  "userMenu.logoutTitle": "Chiqish",
  "userMenu.logoutConfirm": "Tizimdan chiqishni tasdiqlaysizmi?",
  "userMenu.logoutSuccess": "Tizimdan chiqdingiz",
  "userMenu.openShiftWarning": "Diqqat: Smena yopilmagan. Chiqishdan oldin 'Kassa → Smena yopish'ni bajaring."
}
```

### Foydalanuvchilar (Users)

```json
{
  "users.title": "Foydalanuvchilar",
  "users.addUser": "Foydalanuvchi qo'shish",
  "users.editUser": "Foydalanuvchini tahrirlash",
  "users.deleteUser": "Foydalanuvchini o'chirish",
  "users.confirmDelete": "Foydalanuvchini o'chirmoqchimisiz?",
  "users.deleteWarning": "Foydalanuvchi o'chirildi. U endi tizimga kira olmaydi. Davom etishni xohlaysizmi?",
  "users.noteHistorySaved": "Eslatma: Tarixiy ma'lumotlar saqlanib qoladi",
  "users.userDeleted": "Foydalanuvchi o'chirildi",
  "users.userDeletedBlocked": "Foydalanuvchi o'chirildi (kirish bloklandi)",
  "users.userAdded": "Foydalanuvchi qo'shildi",
  "users.userUpdated": "Foydalanuvchi yangilandi"
}
```

### Xabarlar (Messages)

```json
{
  "messages.confirmDelete": "Haqiqatan o'chirmoqchimisiz?",
  "messages.areYouSure": "Ishonchingiz komilmi?",
  "messages.cannotUndo": "Bu amalni qaytarib bo'lmaydi",
  "messages.successSaved": "Muvaffaqiyatli saqlandi",
  "messages.successDeleted": "Muvaffaqiyatli o'chirildi",
  "messages.successUpdated": "Muvaffaqiyatli yangilandi",
  "messages.errorOccurred": "Xatolik yuz berdi",
  "messages.tryAgain": "Qaytadan urinib ko'ring",
  "messages.loading": "Yuklanmoqda...",
  "messages.operationSuccess": "Amal muvaffaqiyatli bajarildi",
  "messages.updateSuccess": "Yangilash muvaffaqiyatli bajarildi",
  "messages.loginFailed": "Login amalga oshmadi",
  "messages.tryLater": "Iltimos, keyinroq urinib ko'ring"
}
```

---

## 🎨 Komponentlarda Ishlatish

### Oldingi (Xitoycha/Inglizcha)

```typescript
// ❌ Noto'g'ri - Qattiq kodlangan matn
<Button onClick={handleDelete}>删除</Button>
<h1>用户管理</h1>
<p>没有找到用户</p>
<Toast>用户已删除</Toast>

// ❌ Noto'g'ri - Inglizcha
<Button onClick={handleSave}>Save</Button>
<h1>Products</h1>
<p>No products found</p>
<Toast>Product added successfully</Toast>
```

### Keyingi (O'zbekcha)

```typescript
// ✅ To'g'ri - Tarjima kalitlari
import { useTranslation } from 'react-i18next';

function UsersPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <Button onClick={handleDelete}>{t('common.delete')}</Button>
      <h1>{t('users.title')}</h1>
      <p>{t('users.noUsers')}</p>
      <Toast>{t('users.userDeleted')}</Toast>
    </>
  );
}
```

---

## 🔄 Hisobni Almashtirish Komponenti

### SwitchAccountModal.tsx

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Account {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface SwitchAccountModalProps {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}

export function SwitchAccountModal({
  open,
  onClose,
  accounts,
}: SwitchAccountModalProps) {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSwitch = async () => {
    if (!selectedAccount) return;

    setLoading(true);

    try {
      // Hisobni almashtirish logikasi
      // Variant A: Login sahifasiga yo'naltirish
      window.location.href = `/login?username=${selectedAccount}`;

      // Variant B: Session switch API
      // const { error } = await supabase.rpc('switch_session', {
      //   target_user_id: selectedAccount,
      // });
      // if (error) throw error;

      toast.success(t('userMenu.accountSwitched'));
      onClose();
    } catch (error) {
      toast.error(t('userMenu.noPermissionToSwitch'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('userMenu.switchAccountTitle')}</DialogTitle>
          <DialogDescription>
            {t('userMenu.switchAccountDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedAccount === account.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => setSelectedAccount(account.id)}
            >
              <Avatar>
                <AvatarFallback>
                  {account.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{account.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {account.username} • {t(`roles.${account.role}`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSwitch}
            disabled={!selectedAccount || loading}
          >
            {loading ? t('common.loading') : t('common.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🚪 Chiqish Tasdiqlash Komponenti

### LogoutConfirmDialog.tsx

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutConfirmDialog({
  open,
  onClose,
}: LogoutConfirmDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      // Ochiq smenani tekshirish
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: shiftCheck } = await supabase.rpc('check_open_shift', {
        p_cashier_id: user?.id,
      });

      if (shiftCheck?.has_open_shift) {
        toast.warning(t('userMenu.openShiftWarning'), {
          duration: 5000,
        });
        setLoading(false);
        onClose();
        return;
      }

      // Chiqish
      await supabase.auth.signOut();
      toast.success(t('userMenu.logoutSuccess'));
      navigate('/login');
    } catch (error) {
      toast.error(t('messages.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('userMenu.logoutTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('userMenu.logoutConfirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} disabled={loading}>
            {loading ? t('common.loading') : t('userMenu.logout')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## 📋 Yangilanishi Kerak Bo'lgan Fayllar

### Asosiy Sahifalar (13 ta)

| # | Fayl | Holat | Tarjima Kalitlari |
|---|------|-------|-------------------|
| 1 | `/src/pages/Login.tsx` | ⏳ | `auth.*` |
| 2 | `/src/pages/POS.tsx` | ⏳ | `pos.*` |
| 3 | `/src/pages/Products.tsx` | ⏳ | `products.*` |
| 4 | `/src/pages/Customers.tsx` | ⏳ | `customers.*` |
| 5 | `/src/pages/Sales.tsx` | ⏳ | `sales.*` |
| 6 | `/src/pages/Returns.tsx` | ⏳ | `returns.*` |
| 7 | `/src/pages/Purchases.tsx` | ⏳ | `purchases.*` |
| 8 | `/src/pages/Inventory.tsx` | ⏳ | `inventory.*` |
| 9 | `/src/pages/CashShifts.tsx` | ⏳ | `shifts.*` |
| 10 | `/src/pages/Reports.tsx` | ⏳ | `reports.*` |
| 11 | `/src/pages/Settings.tsx` | ⏳ | `settings.*` |
| 12 | `/src/pages/Users.tsx` | ⏳ | `users.*` |
| 13 | `/src/pages/NotFound.tsx` | ⏳ | `common.*` |

### Komponentlar

| Komponent | Holat | Tarjima Kalitlari |
|-----------|-------|-------------------|
| `/src/components/common/Header.tsx` | ⏳ | `common.*`, `userMenu.*` |
| `/src/components/common/Footer.tsx` | ⏳ | `common.*` |
| `/src/components/user-menu/UserMenu.tsx` | ⏳ | `userMenu.*` |
| `/src/components/user-menu/SwitchAccountModal.tsx` | ⏳ | `userMenu.*` |
| `/src/components/user-menu/LogoutConfirmDialog.tsx` | ⏳ | `userMenu.*` |

---

## ✅ Tekshirish Ro'yxati

### Tarjima Fayli

- [x] ✅ Umumiy kalitlar (common)
- [x] ✅ Autentifikatsiya (auth)
- [x] ✅ Foydalanuvchi menyusi (userMenu)
- [x] ✅ POS
- [x] ✅ Mahsulotlar (products)
- [x] ✅ Mijozlar (customers)
- [x] ✅ Sotuvlar (sales)
- [x] ✅ Qaytarishlar (returns)
- [x] ✅ Xaridlar (purchases)
- [x] ✅ Ombor (inventory)
- [x] ✅ Kassa (shifts)
- [x] ✅ Hisobotlar (reports)
- [x] ✅ Sozlamalar (settings)
- [x] ✅ Foydalanuvchilar (users)
- [x] ✅ Validatsiya (validation)
- [x] ✅ Xabarlar (messages)
- [x] ✅ Xatoliklar (errors)

### Komponentlar (Bajarilishi Kerak)

- [ ] ⏳ i18n konfiguratsiyasi
- [ ] ⏳ UserMenu komponenti
- [ ] ⏳ SwitchAccountModal komponenti
- [ ] ⏳ LogoutConfirmDialog komponenti
- [ ] ⏳ Barcha sahifalarni yangilash
- [ ] ⏳ Barcha toast xabarlarini yangilash
- [ ] ⏳ Barcha modal dialoglarni yangilash
- [ ] ⏳ Barcha validation xabarlarini yangilash

---

## 🎯 Yakuniy Natija

### Oldingi Holat (Xitoycha/Inglizcha)

```
❌ 删除用户
❌ 成功
❌ Delete
❌ Save
❌ User deleted successfully
```

### Keyingi Holat (O'zbekcha)

```
✅ Foydalanuvchini o'chirish
✅ Muvaffaqiyatli
✅ O'chirish
✅ Saqlash
✅ Foydalanuvchi muvaffaqiyatli o'chirildi
```

### Modal Dialog Misoli

```
┌─────────────────────────────────────┐
│ Foydalanuvchini o'chirish           │
├─────────────────────────────────────┤
│ Foydalanuvchi o'chirildi. U endi   │
│ tizimga kira olmaydi. Davom         │
│ etishni xohlaysizmi?                │
│                                     │
│ Eslatma: Tarixiy ma'lumotlar        │
│ saqlanib qoladi                     │
├─────────────────────────────────────┤
│         [Bekor qilish] [O'chirish]  │
└─────────────────────────────────────┘
```

### Toast Xabarlari

```
✅ Muvaffaqiyatli saqlandi
❌ Xatolik yuz berdi
⚠️ Diqqat: Smena yopilmagan
ℹ️ Yuklanmoqda...
```

---

## 📚 Qo'shimcha Resurslar

### Hujjatlar

- ✅ `translations.uz.json` - To'liq tarjima fayli
- ✅ `UZBEK_TRANSLATION_GUIDE.md` - Tarjima qo'llanmasi
- ✅ `USER_MENU_RBAC_IMPLEMENTATION.md` - RBAC va foydalanuvchi menyusi
- ✅ `COMPLETE_UZBEK_TRANSLATION_GUIDE.md` - To'liq qo'llanma

### Misollar

```typescript
// Oddiy tarjima
t('common.save') // "Saqlash"
t('users.title') // "Foydalanuvchilar"

// Parametrlar bilan
t('validation.minLength', { min: 5 }) // "Minimal uzunlik: 5 belgi"

// Interpolatsiya
t('messages.welcome', { name: 'Ali' }) // "Xush kelibsiz, Ali!"
```

---

## 🚀 Keyingi Qadamlar

### 1-Bosqich: i18n Integratsiyasi

```bash
pnpm add react-i18next i18next
```

### 2-Bosqich: Konfiguratsiya

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationsUz from './translations.uz.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: translationsUz },
    },
    lng: 'uz',
    fallbackLng: 'uz',
  });

export default i18n;
```

### 3-Bosqich: Sahifalarni Yangilash

Har bir sahifada:
1. `useTranslation` hook'ini import qiling
2. Qattiq kodlangan matnlarni `t()` bilan almashtiring
3. Toast xabarlarini tarjima kalitlari bilan yangilang

### 4-Bosqich: Testlash

- [ ] Barcha sahifalarni tekshirish
- [ ] Barcha modal dialoglarni tekshirish
- [ ] Barcha toast xabarlarni tekshirish
- [ ] Barcha validation xabarlarni tekshirish

---

**Tayyorlagan:** Miaoda AI  
**Sana:** 2025-11-12  
**Holat:** ✅ **TARJIMA FAYLI TAYYOR - INTEGRATSIYA KUTILMOQDA**
