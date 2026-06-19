import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import api from '../services/api.js';
import { dateTime } from '../utils/format.js';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/inventory'), api.get('/inventory/logs')])
      .then(([inventoryRes, logsRes]) => {
        setProducts(inventoryRes.data);
        setLogs(logsRes.data);
      });
  }, []);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Monitor product stock and inventory movement logs." />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="font-black text-slate-950">Current Stock</h3>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">Category</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Low At</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td className="table-td font-semibold">{product.name}</td>
                  <td className="table-td">{product.category_name}</td>
                  <td className="table-td">{product.stock}</td>
                  <td className="table-td">{product.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="font-black text-slate-950">Inventory Logs</h3>
          </div>
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Product</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Qty</th>
                  <th className="table-th">Stock</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="table-td">{dateTime(log.created_at)}</td>
                    <td className="table-td font-semibold">{log.product_name}</td>
                    <td className="table-td">{log.type}</td>
                    <td className="table-td">{log.quantity}</td>
                    <td className="table-td">{log.previous_stock} → {log.new_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
