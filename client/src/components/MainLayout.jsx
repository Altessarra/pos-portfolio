import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Topbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
