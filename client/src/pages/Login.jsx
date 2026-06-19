import { Coffee } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@pos.com', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'cashier' ? '/pos' : '/dashboard'} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(form.email, form.password);
      navigate(loggedUser.role === 'cashier' ? '/pos' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-slate-950 text-white">
            <Coffee size={30} />
          </div>
          <h1 className="text-3xl font-black text-slate-950">CafePOS</h1>
          <p className="mt-2 text-sm text-slate-500">Login to manage sales and inventory</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-xs text-slate-600">
          <p><strong>Admin:</strong> admin@pos.com / admin123</p>
          <p><strong>Manager:</strong> manager@pos.com / admin123</p>
          <p><strong>Cashier:</strong> cashier@pos.com / admin123</p>
        </div>
      </div>
    </main>
  );
}
