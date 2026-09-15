import { Outlet } from 'react-router-dom';
import { CashierProvider } from '../context/CashierContext.jsx';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f8f5ef] lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
        <CashierProvider>
          <Topbar />
          <div className="mx-auto max-w-[1580px] pt-5 sm:pt-6">
            <Outlet />
          </div>
        </CashierProvider>
      </main>
    </div>
  );
}
