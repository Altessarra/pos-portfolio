import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import MainLayout from '../components/MainLayout.jsx';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Products from '../pages/Products.jsx';
import Categories from '../pages/Categories.jsx';
import POS from '../pages/POS.jsx';
import Inventory from '../pages/Inventory.jsx';
import SalesHistory from '../pages/SalesHistory.jsx';
import Reports from '../pages/Reports.jsx';
import Users from '../pages/Users.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoleHome />} />

          <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'manager', 'cashier']} />}>
            <Route path="/pos" element={<POS />} />
            <Route path="/sales" element={<SalesHistory />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleHome() {
  const raw = localStorage.getItem('pos_user');
  const user = raw ? JSON.parse(raw) : null;

  if (user?.role === 'cashier') {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
