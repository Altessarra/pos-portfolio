import { Minus, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import ReceiptModal from '../components/ReceiptModal.jsx';
import { useCashier } from '../context/CashierContext.jsx';
import api from '../services/api.js';
import { money } from '../utils/format.js';

export default function POS() {
  const { cashierName } = useCashier();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [productRes, categoryRes] = await Promise.all([
      api.get('/products', { params: filters }),
      api.get('/categories')
    ]);

    setProducts(productRes.data);
    setCategories(categoryRes.data);
  };

  useEffect(() => {
    load();
  }, [filters.category]);

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(current => {
      const existing = current.find(item => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return current;
        return current.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, change) => {
    setCart(current => current
      .map(item => {
        if (item.id !== id) return item;
        const quantity = Math.max(1, Math.min(item.stock, item.quantity + change));
        return { ...item, quantity };
      })
    );
  };

  const removeItem = (id) => {
    setCart(current => current.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }, [cart]);

  const safeDiscount = Math.min(Number(discount || 0), subtotal);
  const total = subtotal - safeDiscount;
  const change = paymentMethod === 'cash' ? Math.max(Number(amountReceived || 0) - total, 0) : 0;

  const checkout = async () => {
    setError('');
    setReceipt(null);

    try {
      const payload = {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        discount: safeDiscount,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'cash' ? Number(amountReceived || 0) : total,
        cashier_name: cashierName
      };

      const { data } = await api.post('/sales/checkout', payload);

      setReceipt(data);
      setCart([]);
      setDiscount(0);
      setAmountReceived(0);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Checkout failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Point of Sale"
        subtitle="Search products, build cart, accept payment, and print receipt details."
      />

      {error && <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {receipt && <div role="status" className="checkout-success mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Checkout successful. Receipt: {receipt.receipt_no}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="motion-card card p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                className="input pl-10"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All Categories</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <button onClick={load} className="btn-secondary">Search</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="motion-card rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-50"
              >
                <div className="mb-4 h-28 overflow-hidden rounded-2xl bg-slate-100">
                  <ProductImage src={product.image_url} alt={product.name} />
                </div>
                <h3 className="font-black text-slate-950">{product.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{product.category_name || 'Uncategorized'}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-black text-slate-950">{money(product.price)}</p>
                  <p className="text-xs font-bold text-slate-500">Stock: {product.stock}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="motion-card card flex max-h-[calc(100vh-150px)] flex-col overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-slate-950">Cart & Payment</h3>
            <p className="text-sm text-slate-500">{cart.length} item type(s)</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {cart.map(item => (
              <div key={item.id} className="motion-row rounded-2xl border border-slate-200 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-950">{item.name}</h4>
                    <p className="text-sm text-slate-500">{money(item.price)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-rose-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="rounded-xl border p-2"><Minus size={14} /></button>
                    <span className="w-8 text-center font-black">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="rounded-xl border p-2"><Plus size={14} /></button>
                  </div>
                  <p className="font-black">{money(Number(item.price) * item.quantity)}</p>
                </div>
              </div>
            ))}
            {!cart.length && <p className="rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-500">Cart is empty.</p>}
          </div>

          <div className="border-t border-slate-200 p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span><strong>{money(subtotal)}</strong>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Discount</label>
                <input className="input" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Payment Method</label>
                <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              {paymentMethod === 'cash' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">Amount Received</label>
                    <input className="input" type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change</span><strong>{money(change)}</strong>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-xl">
                <span className="font-black">Total</span><strong>{money(total)}</strong>
              </div>
              <button onClick={checkout} disabled={!cart.length} className="btn-primary w-full">Checkout</button>
            </div>
          </div>
        </aside>
      </div>

      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
