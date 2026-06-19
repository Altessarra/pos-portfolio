import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ProductImage from '../components/ProductImage.jsx';
import api from '../services/api.js';
import { money } from '../utils/format.js';

const emptyProduct = {
  name: '',
  sku: '',
  category_id: '',
  description: '',
  price: 0,
  cost: 0,
  stock: 0,
  low_stock_threshold: 5,
  image_url: ''
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id || '',
      description: product.description || '',
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold,
      image_url: product.image_url || ''
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (editing) {
      await api.put(`/products/${editing.id}`, form);
    } else {
      await api.post('/products', form);
    }

    setModalOpen(false);
    load();
  };

  const archive = async (id) => {
    if (!confirm('Archive this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage products, pricing, stock, and categories."
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Product</button>}
      />

      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Search by product or SKU..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <select
          className="input"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button onClick={load} className="btn-secondary">Search</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">SKU</th>
              <th className="table-th">Category</th>
              <th className="table-th">Price</th>
              <th className="table-th">Stock</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                      <ProductImage src={product.image_url} alt={product.name} iconSize={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{product.name}</p>
                      {product.description && (
                        <p className="truncate text-xs text-slate-500">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="table-td">{product.sku}</td>
                <td className="table-td">{product.category_name || 'Uncategorized'}</td>
                <td className="table-td">{money(product.price)}</td>
                <td className="table-td">{product.stock}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(product)} className="btn-secondary !px-3 !py-2">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => archive(product.id)} className="btn-danger !px-3 !py-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!products.length && (
              <tr><td colSpan="6" className="table-td text-center">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
            <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input className="input" type="number" step="0.01" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            <input className="input" type="number" step="0.01" placeholder="Cost" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
            <input className="input" type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
            <input className="input" type="number" placeholder="Low stock threshold" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-600">Image URL (optional)</label>
              <input className="input" placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
                <ProductImage src={form.image_url} alt="Preview" iconSize={22} />
              </div>
              <p className="text-xs text-slate-500">Live preview of the product image. Leave empty to use the default icon.</p>
            </div>
            <textarea className="input md:col-span-2" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save Product</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
