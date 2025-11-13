import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSetting } from '@/db/api';
import type { Setting } from '@/types/types';
import { Settings as SettingsIcon, Store, CreditCard, Percent, Users, Bell, Database, Shield } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Sozlamalarni yuklash
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      const settingsMap: Record<string, string> = {};
      data.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting.value || '';
      });
      setSettings(settingsMap);
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Sozlamalarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(true);
      await updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Sozlamalar yangilandi',
      });
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Sozlamalarni saqlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sozlamalar</h1>
          <p className="text-muted-foreground">Tizim sozlamalarini boshqarish</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 2xl:grid-cols-7">
          <TabsTrigger value="general">
            <Store className="w-4 h-4 mr-2" />
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            To'lovlar
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Percent className="w-4 h-4 mr-2" />
            Soliq
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="w-4 h-4 mr-2" />
            Rollar
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Bildirishnomalar
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            Zaxira
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Xavfsizlik
          </TabsTrigger>
        </TabsList>

        {/* Umumiy Sozlamalar */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy Sozlamalar</CardTitle>
              <CardDescription>Do'kon ma'lumotlari va asosiy parametrlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 2xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Do'kon nomi</Label>
                  <Input
                    id="store_name"
                    value={settings.store_name || ''}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    onBlur={(e) => handleSave('store_name', e.target.value)}
                    placeholder="Supermarket"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_phone">Telefon raqami</Label>
                  <Input
                    id="store_phone"
                    value={settings.store_phone || ''}
                    onChange={(e) => handleInputChange('store_phone', e.target.value)}
                    onBlur={(e) => handleSave('store_phone', e.target.value)}
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_address">Manzil</Label>
                  <Input
                    id="store_address"
                    value={settings.store_address || ''}
                    onChange={(e) => handleInputChange('store_address', e.target.value)}
                    onBlur={(e) => handleSave('store_address', e.target.value)}
                    placeholder="Toshkent, O'zbekiston"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_tin">STIR (INN)</Label>
                  <Input
                    id="store_tin"
                    value={settings.store_tin || ''}
                    onChange={(e) => handleInputChange('store_tin', e.target.value)}
                    onBlur={(e) => handleSave('store_tin', e.target.value)}
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Valyuta</Label>
                  <Select
                    value={settings.currency || 'UZS'}
                    onValueChange={(value) => handleSave('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZS">O'zbek so'mi (UZS)</SelectItem>
                      <SelectItem value="USD">Dollar (USD)</SelectItem>
                      <SelectItem value="RUB">Rubl (RUB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock_alert">Minimal zaxira ogohlantirishi</Label>
                  <Input
                    id="min_stock_alert"
                    type="number"
                    value={settings.min_stock_alert || '5'}
                    onChange={(e) => handleInputChange('min_stock_alert', e.target.value)}
                    onBlur={(e) => {
                      const val = Number.parseInt(e.target.value);
                      if (val >= 0) {
                        handleSave('min_stock_alert', e.target.value);
                      } else {
                        toast({
                          title: 'Xatolik',
                          description: 'Qiymat 0 dan katta bo\'lishi kerak',
                          variant: 'destructive',
                        });
                      }
                    }}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_footer">Chek pastki matni</Label>
                <Textarea
                  id="receipt_footer"
                  value={settings.receipt_footer || ''}
                  onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
                  onBlur={(e) => handleSave('receipt_footer', e.target.value)}
                  placeholder="Rahmat! Yana keling!"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* To'lov Turlari */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>To'lov Turlari</CardTitle>
              <CardDescription>To'lov usullari va komissiya sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Naqd pul</h3>
                      <Badge variant="default">Faol</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Naqd to'lov usuli</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Komissiya</p>
                      <p className="font-semibold">0%</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Karta</h3>
                      <Badge variant="default">Faol</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Bank kartasi orqali to'lov</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Komissiya</p>
                      <Input
                        type="number"
                        className="w-20 text-right"
                        value={settings.card_commission || '0'}
                        onChange={(e) => handleInputChange('card_commission', e.target.value)}
                        onBlur={(e) => {
                          const val = Number.parseFloat(e.target.value);
                          if (val >= 0 && val <= 100) {
                            handleSave('card_commission', e.target.value);
                          } else {
                            toast({
                              title: 'Xatolik',
                              description: 'Komissiya 0-100% oralig\'ida bo\'lishi kerak',
                              variant: 'destructive',
                            });
                          }
                        }}
                      />
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Mobil to'lov</h3>
                      <Badge variant="default">Faol</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Click, Payme va boshqalar</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Komissiya</p>
                      <Input
                        type="number"
                        className="w-20 text-right"
                        value={settings.mobile_commission || '0'}
                        onChange={(e) => handleInputChange('mobile_commission', e.target.value)}
                        onBlur={(e) => {
                          const val = Number.parseFloat(e.target.value);
                          if (val >= 0 && val <= 100) {
                            handleSave('mobile_commission', e.target.value);
                          } else {
                            toast({
                              title: 'Xatolik',
                              description: 'Komissiya 0-100% oralig\'ida bo\'lishi kerak',
                              variant: 'destructive',
                            });
                          }
                        }}
                      />
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Qarz</h3>
                      <Badge variant="secondary">Faol</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Nasiya to'lov</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Komissiya</p>
                      <p className="font-semibold">0%</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soliq va Chegirma */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Soliq va Chegirma Sozlamalari</CardTitle>
              <CardDescription>QQS va chegirma parametrlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 2xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Soliq stavkasi (QQS %)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      value={settings.tax_rate || '12'}
                      onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        if (val >= 0 && val <= 100) {
                          handleSave('tax_rate', e.target.value);
                        } else {
                          toast({
                            title: 'Xatolik',
                            description: 'Soliq stavkasi 0-100% oralig\'ida bo\'lishi kerak',
                            variant: 'destructive',
                          });
                        }
                      }}
                      placeholder="12"
                    />
                    <p className="text-sm text-muted-foreground">
                      Joriy: {settings.tax_rate || '12'}%
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Avtomatik soliq qo'llash</h3>
                      <p className="text-sm text-muted-foreground">
                        Barcha mahsulotlarga avtomatik soliq qo'shish
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_tax === 'true'}
                      onCheckedChange={(checked) => handleSave('auto_tax', checked.toString())}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_discount">Maksimal chegirma (%)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      value={settings.max_discount || '20'}
                      onChange={(e) => handleInputChange('max_discount', e.target.value)}
                      onBlur={(e) => {
                        const val = Number.parseFloat(e.target.value);
                        if (val >= 0 && val <= 100) {
                          handleSave('max_discount', e.target.value);
                        } else {
                          toast({
                            title: 'Xatolik',
                            description: 'Chegirma 0-100% oralig\'ida bo\'lishi kerak',
                            variant: 'destructive',
                          });
                        }
                      }}
                      placeholder="20"
                    />
                    <p className="text-sm text-muted-foreground">
                      Joriy: {settings.max_discount || '20'}%
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Faqat administrator uchun</h3>
                      <p className="text-sm text-muted-foreground">
                        Chegirmani faqat admin berishi mumkin
                      </p>
                    </div>
                    <Switch
                      checked={settings.discount_admin_only === 'true'}
                      onCheckedChange={(checked) => handleSave('discount_admin_only', checked.toString())}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Foyda hisoblash usuli</h4>
                <Select
                  value={settings.profit_calculation || 'gross'}
                  onValueChange={(value) => handleSave('profit_calculation', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gross">Yalpi foyda (Gross Profit)</SelectItem>
                    <SelectItem value="net">Sof foyda (Net Profit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Foydalanuvchi Rollari */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Foydalanuvchi Rollari</CardTitle>
              <CardDescription>Tizim rollari va ularning huquqlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Administrator</h3>
                    <Badge>Barcha huquqlar</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tizimning barcha bo'limlariga to'liq kirish va boshqarish huquqi
                  </p>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>POS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Mahsulotlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Sotuvlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Qaytarishlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Xaridlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Ombor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Hisobotlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Sozlamalar</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Menejer</h3>
                    <Badge variant="secondary">Kengaytirilgan</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mahsulot, xarid va hisobotlarni boshqarish
                  </p>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>POS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Mahsulotlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Sotuvlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Qaytarishlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Xaridlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Ombor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Hisobotlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Sozlamalar</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Kassir</h3>
                    <Badge variant="outline">Asosiy</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Faqat POS va sotuv bo'limlariga kirish
                  </p>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>POS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Mijozlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Sotuvlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Kassa</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Hisobchi</h3>
                    <Badge variant="outline">Hisobotlar</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Hisobot va balansga kirish
                  </p>
                  <div className="grid grid-cols-2 2xl:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Hisobotlar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Kassa</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bildirishnomalar */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirishnomalar</CardTitle>
              <CardDescription>Avtomatik xabarlar va ogohlantirishlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Past zaxira ogohlantirishi</h3>
                  <p className="text-sm text-muted-foreground">
                    Mahsulot zaxirasi minimal darajadan pastga tushganda xabar berish
                  </p>
                </div>
                <Switch
                  checked={settings.notify_low_stock === 'true'}
                  onCheckedChange={(checked) => handleSave('notify_low_stock', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Smena yopilmagan ogohlantirish</h3>
                  <p className="text-sm text-muted-foreground">
                    Kassir smenani yopmagan holatda xabar berish
                  </p>
                </div>
                <Switch
                  checked={settings.notify_open_shift === 'true'}
                  onCheckedChange={(checked) => handleSave('notify_open_shift', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Kunlik hisobot</h3>
                  <p className="text-sm text-muted-foreground">
                    Har kuni soat 22:00 da avtomatik hisobot yuborish
                  </p>
                </div>
                <Switch
                  checked={settings.daily_report === 'true'}
                  onCheckedChange={(checked) => handleSave('daily_report', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Qarz to'lov eslatmasi</h3>
                  <p className="text-sm text-muted-foreground">
                    Mijozlarga qarz to'lov muddati yaqinlashganda eslatma yuborish
                  </p>
                </div>
                <Switch
                  checked={settings.notify_debt === 'true'}
                  onCheckedChange={(checked) => handleSave('notify_debt', checked.toString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zaxira va Ma'lumotlar */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Zaxira va Ma'lumotlar</CardTitle>
              <CardDescription>Ma'lumotlarni zaxiralash va eksport qilish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Avtomatik zaxira</h3>
                    <p className="text-sm text-muted-foreground">
                      Ma'lumotlarni avtomatik ravishda zaxiralash
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_backup === 'true'}
                    onCheckedChange={(checked) => handleSave('auto_backup', checked.toString())}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zaxira chastotasi</Label>
                  <Select
                    value={settings.backup_frequency || 'daily'}
                    onValueChange={(value) => handleSave('backup_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Har soatda</SelectItem>
                      <SelectItem value="daily">Har kuni</SelectItem>
                      <SelectItem value="weekly">Har hafta</SelectItem>
                      <SelectItem value="monthly">Har oy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Ma'lumotlarni eksport qilish</h3>
                <div className="grid gap-3 2xl:grid-cols-2">
                  <Button variant="outline" className="justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Mahsulotlar (CSV)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Sotuvlar (Excel)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Mijozlar (CSV)
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Hisobotlar (PDF)
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-destructive">Xavfli amallar</h3>
                <Button variant="destructive" disabled>
                  Barcha ma'lumotlarni o'chirish
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Bu funksiya faqat developer uchun
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Xavfsizlik */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Xavfsizlik</CardTitle>
              <CardDescription>Tizim xavfsizligi va kirish nazorati</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Ikki faktorli autentifikatsiya</h3>
                  <p className="text-sm text-muted-foreground">
                    Qo'shimcha xavfsizlik qatlami
                  </p>
                </div>
                <Switch
                  checked={settings.two_factor_auth === 'true'}
                  onCheckedChange={(checked) => handleSave('two_factor_auth', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Sessiya muddati</h3>
                  <p className="text-sm text-muted-foreground">
                    Foydalanuvchi sessiyasi avtomatik tugash vaqti
                  </p>
                </div>
                <Select
                  value={settings.session_timeout || '8'}
                  onValueChange={(value) => handleSave('session_timeout', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 soat</SelectItem>
                    <SelectItem value="4">4 soat</SelectItem>
                    <SelectItem value="8">8 soat</SelectItem>
                    <SelectItem value="24">24 soat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Parol murakkabligi</h3>
                  <p className="text-sm text-muted-foreground">
                    Kuchli parol talabi
                  </p>
                </div>
                <Switch
                  checked={settings.strong_password === 'true'}
                  onCheckedChange={(checked) => handleSave('strong_password', checked.toString())}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold">Audit log</h3>
                  <p className="text-sm text-muted-foreground">
                    Barcha amallarni yozib borish
                  </p>
                </div>
                <Switch
                  checked={settings.audit_log === 'true'}
                  onCheckedChange={(checked) => handleSave('audit_log', checked.toString())}
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Oxirgi o'zgarish</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleString('uz-UZ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
