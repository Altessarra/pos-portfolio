import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ReceiptModal from '../components/ReceiptModal.jsx';
import api from '../services/api.js';
import { dateTime, money } from '../utils/format.js';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  const load = async () => {
    const { data } = await api.get('/sales', { params: { search } });
    setSales(data);
  };

  useEffect(() => {
    load();
  }, []);

  const viewSale = async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    setSelectedSale(data);
  };

  return (
    <div>
      <PageHeader title="Sales History" subtitle="View past orders and receipt details." />

      <div className="motion-card card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Search receipt number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>
        <button onClick={load} className="btn-secondary">Search</button>
      </div>

      <div className="motion-card card overflow-hidden">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Receipt</th>
              <th className="table-th">Cashier</th>
              <th className="table-th">Payment</th>
              <th className="table-th">Total</th>
              <th className="table-th">Date</th>
              <th className="table-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => (
              <tr key={sale.id} className="motion-row">
                <td className="table-td font-semibold">{sale.receipt_no}</td>
                <td className="table-td">{sale.cashier_name}</td>
                <td className="table-td capitalize">{sale.payment_method.replace('_', ' ')}</td>
                <td className="table-td font-bold">{money(sale.total)}</td>
                <td className="table-td">{dateTime(sale.created_at)}</td>
                <td className="table-td">
                  <button aria-label="View receipt" onClick={() => viewSale(sale.id)} className="btn-secondary !px-3 !py-2">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!sales.length && <tr><td colSpan="6" className="table-td text-center">No sales found.</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <ReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}
