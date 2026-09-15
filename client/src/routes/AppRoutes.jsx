import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/MainLayout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Products from '../pages/Products.jsx';
import Categories from '../pages/Categories.jsx';
import POS from '../pages/POS.jsx';
import Inventory from '../pages/Inventory.jsx';
import SalesHistory from '../pages/SalesHistory.jsx';
import Reports from '../pages/Reports.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/sales" element={<SalesHistory />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
