/**
 * Auth Guard - Autentifikatsiya himoyasi
 * Barcha sahifalar uchun sessiya tekshiruvi
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

// Public yo'llar (login kerak emas)
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

/**
 * Sessiyani tekshirish va himoya qilish
 */
export function useAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();

    // Sessiya o'zgarishlarini kuzatish
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          // Agar public yo'lda bo'lmasa, login'ga yo'naltirish
          if (!PUBLIC_ROUTES.includes(location.pathname)) {
            toast.info('Sessiya tugagan. Iltimos, tizimga qayta kiring.');
            navigate('/login', { replace: true });
          }
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          // Agar login sahifasida bo'lsa, home'ga yo'naltirish
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  async function checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Sessiya tekshirish xatosi:', error);
        throw error;
      }

      const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

      if (!session) {
        // Sessiya yo'q
        setIsAuthenticated(false);
        if (!isPublicRoute) {
          // Private sahifada bo'lsa, login'ga yo'naltirish
          toast.warning('Iltimos, tizimga kiring');
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      } else {
        // Sessiya bor
        setIsAuthenticated(true);
        if (isPublicRoute && location.pathname === '/login') {
          // Login sahifasida bo'lsa, home'ga yo'naltirish
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Sessiya xatosi:', error);
      setIsAuthenticated(false);
      // Xato bo'lsa, sessiyani tozalash
      await supabase.auth.signOut();
      if (!PUBLIC_ROUTES.includes(location.pathname)) {
        toast.error('Sessiya xatosi. Iltimos, qayta kiring.');
        navigate('/login', { replace: true });
      }
    } finally {
      setIsChecking(false);
    }
  }

  return { isChecking, isAuthenticated };
}

/**
 * Protected Route Component
 * Himoyalangan sahifalar uchun wrapper
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isChecking, isAuthenticated } = useAuthGuard();

  // Sessiya tekshirilmoqda
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Sessiya yo'q - login sahifasiga yo'naltiriladi (useAuthGuard ichida)
  if (!isAuthenticated) {
    return null;
  }

  // Sessiya bor - sahifani ko'rsatish
  return <>{children}</>;
}

/**
 * Sessiyani tiklash (app yuklanganda)
 */
export async function restoreSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Sessiyani tiklash xatosi:', error);
      await supabase.auth.signOut();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Sessiya xatosi:', error);
    await supabase.auth.signOut();
    return null;
  }
}

/**
 * Chiqish (logout) - ochiq smena tekshiruvi bilan
 */
export async function logout() {
  try {
    // Ochiq smenani tekshirish
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: openShift } = await supabase
        .from('cash_shifts')
        .select('id')
        .eq('cashier_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (openShift) {
        toast.warning(
          'Diqqat: Smena yopilmagan. Chiqishdan oldin "Kassa → Smena yopish"ni bajaring.',
          { duration: 5000 }
        );
        return false;
      }
    }

    // Chiqish
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Chiqish xatosi:', error);
      toast.error('Chiqishda xatolik yuz berdi');
      return false;
    }

    // LocalStorage'ni tozalash
    localStorage.clear();
    sessionStorage.clear();

    toast.success('Tizimdan chiqdingiz');
    return true;
  } catch (error) {
    console.error('Chiqish xatosi:', error);
    toast.error('Chiqishda xatolik yuz berdi');
    return false;
  }
}

/**
 * Foydalanuvchi rolini olish
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_role')
      .eq('id', user.id)
      .maybeSingle();

    return profile?.active_role || null;
  } catch (error) {
    console.error('Rol olish xatosi:', error);
    return null;
  }
}

/**
 * Ruxsatni tekshirish
 */
export async function checkPermission(allowedRoles: string[]): Promise<boolean> {
  const role = await getUserRole();
  if (!role) return false;
  return allowedRoles.includes(role);
}
