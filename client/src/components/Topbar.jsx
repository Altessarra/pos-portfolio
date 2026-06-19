import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-slate-200 p-2 lg:hidden">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-bold text-slate-950">Welcome back, {user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role} account</p>
        </div>
      </div>
      <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Store Open
      </div>
    </header>
  );
}
