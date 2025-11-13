import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Search, Edit, Trash2, DollarSign, Award } from 'lucide-react';
import type { Customer } from '@/types/types';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/db/api';

export default function Customers() {
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    code: '',
    balance: '0',
    points: '0',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(1, 100);
      setCustomers(data);
    } catch (error) {
      console.error('Mijozlarni yuklashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Mijozlarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Xato',
        description: 'Mijoz nomini kiriting',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: 'Xato',
        description: 'Telefon raqamini kiriting',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        code: formData.code || null,
        balance: Math.round(Number(formData.balance) * 100),
        points: Number(formData.points),
        address: null,
        is_active: true,
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Mijoz yangilandi',
        });
      } else {
        await createCustomer(customerData);
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Mijoz qo\'shildi',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadCustomers();
    } catch (error) {
      console.error('Mijozni saqlashda xato:', error);
      toast({
        title: 'Xato',
        description: 'Mijozni saqlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      code: customer.code || '',
      balance: (customer.balance / 100).toString(),
      points: customer.points.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Mijozni o\'chirmoqchimisiz?')) return;

    try {
      await deleteCustomer(id);
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Mijoz o\'chirildi',
      });
      await loadCustomers();
    } catch (error) {
      console.error('Mijozni o\'chirishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Mijozni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      code: '',
      balance: '0',
      points: '0',
    });
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          Mijozlar
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yangi mijoz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Mijozni tahrirlash' : 'Yangi mijoz qo\'shish'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Mijoz nomi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Alisher Navoiy"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon raqami *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998901234567"
                />
              </div>

              <div>
                <Label htmlFor="code">Mijoz kodi</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="C-0001"
                />
              </div>

              <div>
                <Label htmlFor="balance">Balans (so'm)</Label>
                <Input
                  id="balance"
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Manfiy qiymat - qarz, musbat qiymat - avans
                </p>
              </div>

              <div>
                <Label htmlFor="points">Bonus ballar</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}>
                Bekor qilish
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Yuklanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Qidiruv */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Mijoz nomi, telefon yoki kod..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami mijozlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qarzdorlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {customers.filter(c => c.balance < 0).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami qarz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              {(customers.reduce((sum, c) => sum + (c.balance < 0 ? c.balance : 0), 0) / 100).toLocaleString()} so'm
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mijozlar ro'yxati */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mijozlar ro'yxati ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Mijozlar topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Nomi</th>
                    <th className="text-left p-3 font-medium">Telefon</th>
                    <th className="text-left p-3 font-medium">Kod</th>
                    <th className="text-right p-3 font-medium">Balans</th>
                    <th className="text-right p-3 font-medium">Bonus</th>
                    <th className="text-center p-3 font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-accent">
                      <td className="p-3">
                        <p className="font-medium">{customer.name}</p>
                      </td>
                      <td className="p-3 text-sm">{customer.phone}</td>
                      <td className="p-3 text-sm">{customer.code || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign className={`w-4 h-4 ${
                            customer.balance < 0 ? 'text-destructive' : 'text-success'
                          }`} />
                          <span className={`font-medium ${
                            customer.balance < 0 ? 'text-destructive' : 'text-success'
                          }`}>
                            {(customer.balance / 100).toLocaleString()} so'm
                          </span>
                        </div>
                        {customer.balance < 0 && (
                          <p className="text-xs text-muted-foreground text-right">Qarz</p>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Award className="w-4 h-4 text-warning" />
                          <span className="font-medium">{customer.points}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
