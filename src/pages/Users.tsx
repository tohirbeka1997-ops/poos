import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getProfiles, updateProfile, deleteProfile } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { Profile, UserRole } from '@/types/types';
import { Users as UsersIcon, UserPlus, Edit, Trash2, Lock, Unlock, Search, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createUserByAdmin, usernameExists, canDeleteUser, softDeleteUser, getCurrentProfile } from '@/services/authService';

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'cashier' as UserRole,
    discount_limit: 0,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getProfiles();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Foydalanuvchilarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (!formData.username || !formData.full_name || !formData.password) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Check if username already exists
      const exists = await usernameExists(formData.username);
      if (exists) {
        toast({
          title: 'Error',
          description: 'This username is already taken',
          variant: 'destructive',
        });
        return;
      }

      // Get current user for created_by field
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Create user using auth service
      await createUserByAdmin({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role as UserRole,
        discount_limit: formData.discount_limit,
        created_by: currentUser?.id,
      });

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Error',
        description: err.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await updateProfile(selectedUser.id, {
        full_name: formData.full_name,
        username: formData.username,
        role: formData.role,
        discount_limit: formData.discount_limit,
      } as Partial<Profile>);

      toast({
        title: 'Muvaffaqiyatli',
        description: 'Foydalanuvchi ma\'lumotlari yangilandi',
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Foydalanuvchini tahrirlashda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Get current user
      const currentUser = await getCurrentProfile();
      if (!currentUser) {
        toast({
          title: '错误',
          description: '无法获取当前用户信息',
          variant: 'destructive',
        });
        return;
      }

      // Check if user can be deleted (validation)
      const validation = await canDeleteUser(selectedUser.id, currentUser.id);
      
      if (!validation.can_delete) {
        toast({
          title: '错误',
          description: validation.message,
          variant: 'destructive',
        });
        return;
      }

      // Perform soft delete
      const result = await softDeleteUser(selectedUser.id, currentUser.id);
      
      if (result.success) {
        toast({
          title: '成功',
          description: result.message,
        });

        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast({
          title: '错误',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '删除用户时出错',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (user: Profile) => {
    try {
      await updateProfile(user.id, {
        is_active: !user.is_active,
      } as Partial<Profile>);

      toast({
        title: 'Muvaffaqiyatli',
        description: user.is_active ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi',
      });

      loadUsers();
    } catch (error) {
      toast({
        title: 'Xatolik',
        description: 'Holatni o\'zgartirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: '',
      password: '',
      role: user.role,
      discount_limit: user.discount_limit || 0,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: Profile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'cashier',
      discount_limit: 0,
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'cashier':
        return 'outline';
      case 'accountant':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Menejer';
      case 'cashier':
        return 'Kassir';
      case 'accountant':
        return 'Hisobchi';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hech qachon';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Eksport',
      description: 'Foydalanuvchilar ro\'yxati yuklab olinmoqda...',
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Foydalanuvchilar</h1>
            <p className="text-muted-foreground">Tizim foydalanuvchilarini boshqarish</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Eksport
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Yangi foydalanuvchi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yangi foydalanuvchi qo'shish</DialogTitle>
                <DialogDescription>
                  Tizimga yangi foydalanuvchi qo'shish uchun quyidagi ma'lumotlarni kiriting
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">To'liq ism *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Ism Familiya"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Login</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Parol *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Kamida 8 ta belgi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Menejer</SelectItem>
                        <SelectItem value="cashier">Kassir</SelectItem>
                        <SelectItem value="accountant">Hisobchi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_limit">Chegirma limiti (%)</Label>
                    <Input
                      id="discount_limit"
                      type="number"
                      value={formData.discount_limit}
                      onChange={(e) => setFormData({ ...formData, discount_limit: Number.parseFloat(e.target.value) })}
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCreateUser}>
                  Qo'shish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 2xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Qidirish</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-10"
                  placeholder="Ism yoki login bo'yicha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_filter">Rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role_filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Menejer</SelectItem>
                  <SelectItem value="cashier">Kassir</SelectItem>
                  <SelectItem value="accountant">Hisobchi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_filter">Holat</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status_filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="blocked">Bloklangan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Tozalash
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar ro'yxati</CardTitle>
          <CardDescription>
            Jami: {filteredUsers.length} ta foydalanuvchi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To'liq ism</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>So'nggi kirish</TableHead>
                  <TableHead>Yaratilgan</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Foydalanuvchilar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell>{user.username || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="default" className="bg-green-500">Faol</Badge>
                        ) : (
                          <Badge variant="destructive">Bloklangan</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.last_login)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
            <DialogDescription>
              Foydalanuvchi ma'lumotlarini yangilash
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">To'liq ism</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_username">Login</Label>
                <Input
                  id="edit_username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_role">Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="edit_role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Menejer</SelectItem>
                    <SelectItem value="cashier">Kassir</SelectItem>
                    <SelectItem value="accountant">Hisobchi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_discount_limit">Chegirma limiti (%)</Label>
                <Input
                  id="edit_discount_limit"
                  type="number"
                  value={formData.discount_limit}
                  onChange={(e) => setFormData({ ...formData, discount_limit: Number.parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEditUser}>
              Saqlash
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              删除用户后，该用户的登录将被阻止。您确定要继续吗？
              {selectedUser && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">用户名: {selectedUser.username}</p>
                  <p className="text-muted-foreground">注意：历史记录将被保留</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
