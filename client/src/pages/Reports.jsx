import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import PageHeader from '../components/PageHeader.jsx';
import api from '../services/api.js';
import { money } from '../utils/format.js';

export default function Reports() {
  const [reports, setReports] = useState({
    dailySales: [],
    monthlySales: [],
    topProducts: [],
    paymentSummary: []
  });

  useEffect(() => {
    api.get('/reports').then(res => setReports(res.data));
  }, []);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Daily sales, monthly sales, top products, and payment method summary." />

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Daily Sales">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reports.dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => money(value)} />
              <Line dataKey="total" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Sales">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => money(value)} />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Products">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reports.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Method Summary">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie dataKey="total" data={reports.paymentSummary} nameKey="payment_method" outerRadius={105} label>
                  {reports.paymentSummary.map((entry, index) => <Cell key={index} />)}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {reports.paymentSummary.map(item => (
                <div key={item.payment_method} className="rounded-2xl bg-slate-100 p-3">
                  <p className="text-sm font-black capitalize">{item.payment_method.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500">{item.orders} orders</p>
                  <p className="font-bold">{money(item.total)}</p>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-black text-slate-950">{title}</h3>
      {children}
    </div>
  );
}
