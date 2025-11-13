import type { ReactNode } from 'react';
import Login from './pages/Login';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Returns from './pages/Returns';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import CashShifts from './pages/CashShifts';
import Reports from './pages/Reports';
import ReportsOptimized from './pages/ReportsOptimized';
import SystemStatus from './pages/SystemStatus';
import Settings from './pages/Settings';
import Users from './pages/Users';
import ProfileKabinet from './pages/ProfileKabinet';
import NotFound from './pages/NotFound';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  roles?: string[];
}

const routes: RouteConfig[] = [
  {
    name: 'POS',
    path: '/',
    element: <POS />,
    visible: true,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    name: 'Mahsulotlar',
    path: '/products',
    element: <Products />,
    visible: true,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Mijozlar',
    path: '/customers',
    element: <Customers />,
    visible: true,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    name: 'Sotuvlar',
    path: '/sales',
    element: <Sales />,
    visible: true,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    name: 'Qaytarishlar',
    path: '/returns',
    element: <Returns />,
    visible: true,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Xaridlar',
    path: '/purchases',
    element: <Purchases />,
    visible: true,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Ombor',
    path: '/inventory',
    element: <Inventory />,
    visible: true,
    roles: ['admin', 'manager'],
  },
  {
    name: 'Kassa',
    path: '/shifts',
    element: <CashShifts />,
    visible: true,
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    name: 'Hisobotlar',
    path: '/reports',
    element: <Reports />,
    visible: true,
    roles: ['admin', 'manager', 'accountant'],
  },
  {
    name: 'Reports (Optimized)',
    path: '/reports-optimized',
    element: <ReportsOptimized />,
    visible: true,
    roles: ['admin', 'manager', 'accountant'],
  },
  {
    name: 'System Status',
    path: '/system-status',
    element: <SystemStatus />,
    visible: true,
    roles: ['admin'],
  },
  {
    name: 'Sozlamalar',
    path: '/settings',
    element: <Settings />,
    visible: true,
    roles: ['admin'],
  },
  {
    name: 'Foydalanuvchilar',
    path: '/users',
    element: <Users />,
    visible: true,
    roles: ['admin'],
  },
  {
    name: 'Shaxsiy kabinet',
    path: '/kabinet',
    element: <ProfileKabinet />,
    visible: false, // Not shown in main nav, accessed via user menu
    roles: ['admin', 'manager', 'cashier', 'accountant'],
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false,
  },
  {
    name: 'Not Found',
    path: '/404',
    element: <NotFound />,
    visible: false,
  },
];

export default routes;