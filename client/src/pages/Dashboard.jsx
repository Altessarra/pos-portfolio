import { AlertTriangle, Package, Receipt, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import api from '../services/api.js';
import { money } from '../utils/format.js';

export default function Dashboard() {
  const [data, setData] = useState({
    todaySales: 0,
    totalOrders: 0,
    lowStockProducts: [],
    topSellingProducts: []
  });

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Today’s sales performance and inventory alerts."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Today's Sales" value={money(data.todaySales)} icon={Wallet} />
        <StatCard title="Today's Orders" value={data.totalOrders} icon={Receipt} />
        <StatCard title="Low Stock Items" value={data.lowStockProducts.length} icon={AlertTriangle} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package size={20} />
            <h3 className="font-black text-slate-950">Top Selling Products Today</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="font-black text-slate-950">Low Stock Products</h3>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockProducts.map(product => (
                <tr key={product.id}>
                  <td className="table-td font-semibold">{product.name}</td>
                  <td className="table-td">{product.category_name}</td>
                  <td className="table-td">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      {product.stock}
                    </span>
                  </td>
                </tr>
              ))}
              {!data.lowStockProducts.length && (
                <tr>
                  <td colSpan="3" className="table-td text-center">No low stock products.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
