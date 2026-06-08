import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  FormEvent,
} from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: { id: string; name: string; imageUrl: string; price: number };
}

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingAddress: { street: string; city: string; postalCode: string; country: string };
  createdAt: string;
  items: OrderItem[];
  user?: { id: string; name: string; email: string };
}

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  outOfStockCount: number;
  totalUsers: number;
}

// ─── Auth context ─────────────────────────────────────────────────────────────

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('vitamin_admin_token');
    const u = localStorage.getItem('vitamin_admin_user');
    if (t && u) {
      setToken(t);
      try { setUser(JSON.parse(u)); } catch { /* corrupt storage */ }
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Login failed');
    if (data.user.role !== 'ADMIN') throw new Error('Admin access required');
    localStorage.setItem('vitamin_admin_token', data.token);
    localStorage.setItem('vitamin_admin_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('vitamin_admin_token');
    localStorage.removeItem('vitamin_admin_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function api<T>(path: string, token: string | null, opts?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Request failed ${res.status}`);
  return data as T;
}

// ─── Shared nav layout ────────────────────────────────────────────────────────

function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/orders', label: 'Orders' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-indigo-600">Vitamin Admin</span>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-gray-800 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────

function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">Vitamin Admin</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your admin account</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-8 shadow-sm space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  loading,
  icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  loading: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
      <div className={`absolute right-0 top-0 h-full w-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <div className="mt-2 h-9 w-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    api<{ stats: AdminStats }>('/api/admin/stats', token)
      .then((d) => setStats(d.stats))
      .catch(() => setStatsError(true))
      .finally(() => setLoading(false));
  }, [token]);

  const cards = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      accent: 'bg-indigo-500',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>,
    },
    {
      label: 'Revenue (paid+)',
      value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      accent: 'bg-emerald-500',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    },
    {
      label: 'Out-of-Stock',
      value: stats?.outOfStockCount ?? 0,
      accent: 'bg-rose-500',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>,
    },
    {
      label: 'Customers',
      value: stats?.totalUsers ?? 0,
      accent: 'bg-amber-500',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
      </div>

      {statsError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load stats — make sure the backend is running.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} accent={c.accent} loading={loading} icon={c.icon} />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          { to: '/products', title: 'Product Catalog', sub: 'Add, edit, and remove products' },
          { to: '/orders', title: 'Order Management', sub: 'Review and update order statuses' },
        ].map(({ to, title, sub }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="mt-0.5 text-sm text-gray-400">{sub}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 transition-colors group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Products page ────────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: '',
  stock: '0',
};

type Mode = 'create' | 'edit';

function DeleteConfirmModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Delete product?</h3>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-medium text-gray-800">{product.name}</span> will be permanently
          deleted. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsPage() {
  const { token } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await api<{ products: Product[] }>('/api/products', token);
      setProducts(data.products);
    } catch {
      setListError('Failed to load products.');
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function field(k: keyof ProductForm, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function startCreate() {
    setMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function startEdit(p: Product) {
    setMode('edit');
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl,
      category: p.category,
      stock: String(p.stock),
    });
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !form.description.trim() || !form.imageUrl.trim() || !form.category.trim()) {
      setFormError('All fields are required.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Price must be greater than 0.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Stock must be 0 or more.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        imageUrl: form.imageUrl.trim(),
        category: form.category.trim(),
        stock,
      };

      if (mode === 'create') {
        await api('/api/products', token, { method: 'POST', body: JSON.stringify(body) });
      } else {
        await api(`/api/products/${editingId}`, token, { method: 'PUT', body: JSON.stringify(body) });
      }

      setForm(EMPTY_FORM);
      setMode('create');
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/products/${deleteTarget.id}`, token, { method: 'DELETE' });
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      setDeleteTarget(null);
      setListError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <div>
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
        <button
          onClick={startCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          + Add product
        </button>
      </div>

      {/* Form */}
      <div ref={formRef} className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {mode === 'create' ? 'New product' : 'Edit product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input className={inputCls} value={form.name} onChange={(e) => field('name', e.target.value)} placeholder="Vitamin C 500mg" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <input className={inputCls} value={form.category} onChange={(e) => field('category', e.target.value)} placeholder="Vitamins" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="Product description…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price ($)</label>
              <input className={inputCls} type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => field('price', e.target.value)} placeholder="9.99" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stock</label>
              <input className={inputCls} type="number" min="0" step="1" value={form.stock} onChange={(e) => field('stock', e.target.value)} />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
              <input className={inputCls} value={form.imageUrl} onChange={(e) => field('imageUrl', e.target.value)} placeholder="https://…" />
            </div>
          </div>

          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {mode === 'create' ? 'Create product' : 'Save changes'}
            </button>
            {mode === 'edit' && (
              <button type="button" onClick={startCreate} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      {listError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {listError}
        </div>
      )}

      {listLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border bg-white py-16 text-center text-gray-400">
          No products yet. Add one above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`transition-colors hover:bg-gray-50 ${editingId === p.id ? 'bg-indigo-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="max-w-xs truncate text-xs text-gray-400">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="rounded-lg border px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Orders page ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>('/api/admin/orders', token)
      .then((d) => setOrders(d.orders))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      const data = await api<{ order: Order }>(`/api/admin/orders/${orderId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-white py-16 text-center text-gray-400">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  {order.user && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {order.user.name} — {order.user.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {updatingId === order.id && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="mt-4 flex flex-wrap gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-8 w-8 rounded-md object-cover"
                    />
                    <div>
                      <p className="text-xs font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        ×{item.quantity} @ ${item.priceAtPurchase.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping */}
              {order.shippingAddress && (
                <p className="mt-3 text-xs text-gray-400">
                  Ship to:{' '}
                  {[
                    order.shippingAddress.street,
                    order.shippingAddress.city,
                    order.shippingAddress.postalCode,
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Protected route ──────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}