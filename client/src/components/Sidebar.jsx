import {
  BarChart3,
  Boxes,
  ClipboardList,
  Coffee,
  FolderKanban,
  LayoutDashboard,
  Leaf,
  Package,
  ShoppingCart
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'POS', path: '/pos', icon: ShoppingCart },
  { label: 'Sales', path: '/sales', icon: ClipboardList },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: FolderKanban },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Reports', path: '/reports', icon: BarChart3 }
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[238px] shrink-0 overflow-hidden bg-[#2c1b12] text-[#f9f1e8] lg:block">
      <div className="relative flex h-full flex-col px-3 py-7">
        <div className="mb-8 flex items-center gap-3 px-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d7b08c] text-[#362015]">
            <Coffee size={19} strokeWidth={2.1} />
          </div>
          <div>
            <h1 className="font-display text-[27px] leading-none tracking-[-0.04em]">Brim POS</h1>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#cbb7a8]">
              Good coffee, better days
            </p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ' +
                (isActive
                  ? 'bg-[#815235] text-white shadow-[0_10px_25px_rgba(18,8,3,0.22)]'
                  : 'text-[#e0d2c6] hover:bg-white/8 hover:text-white')
              }
            >
              <Icon size={19} strokeWidth={1.8} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div aria-hidden="true" className="pointer-events-none absolute bottom-10 left-[-44px] text-[#b18467]/30">
          <Leaf size={170} strokeWidth={0.55} />
        </div>
      </div>
    </aside>
  );
}
