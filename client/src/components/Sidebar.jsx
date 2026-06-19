import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coffee,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
  { label: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
  { label: 'Sales', path: '/sales', icon: ClipboardList, roles: ['admin', 'manager', 'cashier'] },
  { label: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager'] },
  { label: 'Categories', path: '/categories', icon: FolderKanban, roles: ['admin', 'manager'] },
  { label: 'Inventory', path: '/inventory', icon: Boxes, roles: ['admin', 'manager'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['admin'] }
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const allowed = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sticky top-0 hidden h-screen w-72 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
          <Coffee size={24} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-950">CafePOS</h1>
          <p className="text-xs text-slate-500">Retail & café system</p>
        </div>
      </div>

      <nav className="space-y-1">
        {allowed.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-5 left-5 right-5">
        <div className="mb-3 rounded-2xl bg-slate-100 p-4">
          <p className="text-sm font-bold text-slate-900">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
        <button onClick={logout} className="btn-secondary w-full">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
