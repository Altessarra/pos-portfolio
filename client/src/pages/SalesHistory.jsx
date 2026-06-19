import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
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

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_auto]">
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

      <div className="card overflow-hidden">
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
              <tr key={sale.id}>
                <td className="table-td font-semibold">{sale.receipt_no}</td>
                <td className="table-td">{sale.cashier_name}</td>
                <td className="table-td capitalize">{sale.payment_method.replace('_', ' ')}</td>
                <td className="table-td font-bold">{money(sale.total)}</td>
                <td className="table-td">{dateTime(sale.created_at)}</td>
                <td className="table-td">
                  <button onClick={() => viewSale(sale.id)} className="btn-secondary !px-3 !py-2">
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
        <Modal title={`Receipt ${selectedSale.receipt_no}`} onClose={() => setSelectedSale(null)}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-100 p-4 text-sm">
              <p><strong>Cashier:</strong> {selectedSale.cashier_name}</p>
              <p><strong>Date:</strong> {dateTime(selectedSale.created_at)}</p>
              <p><strong>Payment:</strong> {selectedSale.payment_method.replace('_', ' ')}</p>
            </div>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Item</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map(item => (
                  <tr key={item.id}>
                    <td className="table-td">{item.product_name}</td>
                    <td className="table-td">{item.quantity}</td>
                    <td className="table-td">{money(item.price)}</td>
                    <td className="table-td">{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="flex justify-between"><span>Subtotal</span><strong>{money(selectedSale.subtotal)}</strong></p>
              <p className="flex justify-between"><span>Discount</span><strong>{money(selectedSale.discount)}</strong></p>
              <p className="flex justify-between text-lg"><span>Total</span><strong>{money(selectedSale.total)}</strong></p>
              <p className="flex justify-between"><span>Amount Received</span><strong>{money(selectedSale.amount_received)}</strong></p>
              <p className="flex justify-between"><span>Change</span><strong>{money(selectedSale.change_amount)}</strong></p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
