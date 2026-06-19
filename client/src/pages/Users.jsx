import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import api from '../services/api.js';

const emptyUser = {
  name: '',
  email: '',
  password: '',
  role: 'cashier',
  is_active: true
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUser);

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUser);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    const payload = { ...form };
    if (editing && !payload.password) delete payload.password;

    if (editing) {
      await api.put(`/users/${editing.id}`, payload);
    } else {
      await api.post('/users', payload);
    }

    setModalOpen(false);
    load();
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Admin-only account and role management."
        action={<button onClick={openCreate} className="btn-primary"><Plus size={18} /> Add User</button>}
      />

      <div className="card overflow-hidden">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="table-th">Name</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="table-td font-semibold">{user.name}</td>
                <td className="table-td">{user.email}</td>
                <td className="table-td capitalize">{user.role}</td>
                <td className="table-td">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(user)} className="btn-secondary !px-3 !py-2"><Edit size={16} /></button>
                    <button onClick={() => deactivate(user.id)} className="btn-danger !px-3 !py-2"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setModalOpen(false)}>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="input" type="password" placeholder={editing ? 'New password optional' : 'Password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
            {editing && (
              <select className="input" value={String(form.is_active)} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            )}
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button className="btn-primary">Save User</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
