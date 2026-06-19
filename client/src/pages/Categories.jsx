import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import api from '../services/api.js';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = async () => {
    const { data } = await api.get('/categories');
    setCategories(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description || '' });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (editing) {
      await api.put(`/categories/${editing.id}`, form);
    } else {
      await api.post('/categories', form);
    }

    setModalOpen(false);
    load();
  };

  const archive = async (id) => {
    if (!confirm('Archive this category?')) return;
    await api.delete(`/categories/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize products by category."
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add Category</button>}
      />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Description</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td className="table-td font-semibold">{category.name}</td>
                <td className="table-td">{category.description || '-'}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(category)} className="btn-secondary !px-3 !py-2"><Edit size={16} /></button>
                    <button onClick={() => archive(category.id)} className="btn-danger !px-3 !py-2"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!categories.length && <tr><td colSpan="3" className="table-td text-center">No categories found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <input className="input" placeholder="Category name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <textarea className="input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save Category</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
