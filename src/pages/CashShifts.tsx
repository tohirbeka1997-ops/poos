import { useState, useEffect } from 'react';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, DollarSign, Lock, Unlock } from 'lucide-react';
import type { CashShift } from '@/types/types';
import { getOpenShift, openShift, closeShift, getCashShifts } from '@/db/api';

export default function CashShifts() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const shift = await getOpenShift(user.id);
      setCurrentShift(shift);
      
      const allShifts = await getCashShifts(1, 10);
      setShifts(allShifts);
    } catch (error) {
      console.error('Ma\'lumotlarni yuklashda xato:', error);
    }
  };

  const handleOpenShift = async () => {
    if (!user) return;
    
    const amount = Number(openingCash) * 100;
    if (amount < 0) {
      toast({
        title: 'Xato',
        description: 'Noto\'g\'ri summa',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const shift = await openShift(user.id, amount);
      setCurrentShift(shift);
      setIsOpenDialogOpen(false);
      setOpeningCash('');
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Kassa ochildi',
      });
      
      await loadData();
    } catch (error) {
      console.error('Kassani ochishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Kassani ochishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    
    const amount = Number(closingCash) * 100;
    if (amount < 0) {
      toast({
        title: 'Xato',
        description: 'Noto\'g\'ri summa',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await closeShift(currentShift.id, amount, notes);
      setCurrentShift(null);
      setIsCloseDialogOpen(false);
      setClosingCash('');
      setNotes('');
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Kassa yopildi',
      });
      
      await loadData();
    } catch (error) {
      console.error('Kassani yopishda xato:', error);
      toast({
        title: 'Xato',
        description: 'Kassani yopishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kassa boshqaruvi</h1>
        
        {currentShift ? (
          <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Lock className="w-4 h-4 mr-2" />
                Kassani yopish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kassani yopish</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Boshlang'ich summa</Label>
                  <p className="text-lg font-bold">
                    {(currentShift.opening_cash / 100).toLocaleString()} so'm
                  </p>
                </div>
                <div>
                  <Label htmlFor="closingCash">Yakuniy summa (so'm)</Label>
                  <Input
                    id="closingCash"
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Izoh..."
                  />
                </div>
                {closingCash && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Farq:</p>
                    <p className={`text-lg font-bold ${
                      Number(closingCash) * 100 - currentShift.opening_cash >= 0
                        ? 'text-success'
                        : 'text-destructive'
                    }`}>
                      {((Number(closingCash) * 100 - currentShift.opening_cash) / 100).toLocaleString()} so'm
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCloseShift} disabled={isLoading || !closingCash}>
                  {isLoading ? 'Yuklanmoqda...' : 'Yopish'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Unlock className="w-4 h-4 mr-2" />
                Kassani ochish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kassani ochish</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openingCash">Boshlang'ich summa (so'm)</Label>
                  <Input
                    id="openingCash"
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleOpenShift} disabled={isLoading || !openingCash}>
                  {isLoading ? 'Yuklanmoqda...' : 'Ochish'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Joriy smena */}
      {currentShift && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              Joriy smena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ochilgan vaqt</p>
                <p className="text-lg font-medium">{formatDate(currentShift.opened_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Boshlang'ich summa</p>
                <p className="text-lg font-bold text-primary">
                  {(currentShift.opening_cash / 100).toLocaleString()} so'm
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holat</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-success-foreground">
                  Ochiq
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smenalar tarixi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Smenalar tarixi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Smenalar tarixi bo'sh</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div key={shift.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ochilgan</p>
                      <p className="font-medium">{formatDate(shift.opened_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Yopilgan</p>
                      <p className="font-medium">
                        {shift.closed_at ? formatDate(shift.closed_at) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Summa</p>
                      <p className="font-medium">
                        {(shift.opening_cash / 100).toLocaleString()} so'm
                        {shift.closing_cash && (
                          <> → {(shift.closing_cash / 100).toLocaleString()} so'm</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Holat</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shift.status === 'open'
                          ? 'bg-success text-success-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {shift.status === 'open' ? 'Ochiq' : 'Yopiq'}
                      </span>
                    </div>
                  </div>
                  {shift.difference !== null && shift.difference !== 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">Farq:</p>
                      <p className={`font-bold ${
                        shift.difference >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {(shift.difference / 100).toLocaleString()} so'm
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
