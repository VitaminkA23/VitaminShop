import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AdminStats, AdminStatsResponse } from '@vitamin/types';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  loading: boolean;
}

function StatCard({ label, value, icon, accent, loading }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm`}>
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
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent.replace('bg-', 'bg-opacity-10 bg-')} text-gray-600`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const ICONS = {
  orders: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  revenue: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  stock: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
};

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<AdminStatsResponse>;
      })
      .then((data) => setStats(data.stats))
      .catch(() => setStatsError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const STAT_CARDS = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? 0,
      icon: ICONS.orders,
      accent: 'bg-indigo-500',
    },
    {
      label: 'Revenue (paid/shipped/delivered)',
      value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`,
      icon: ICONS.revenue,
      accent: 'bg-emerald-500',
    },
    {
      label: 'Out-of-Stock Products',
      value: stats?.outOfStockCount ?? 0,
      icon: ICONS.stock,
      accent: 'bg-rose-500',
    },
    {
      label: 'Registered Customers',
      value: stats?.totalUsers ?? 0,
      icon: ICONS.users,
      accent: 'bg-amber-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-indigo-600">Vitamin Admin</h1>
            <nav className="flex items-center gap-1">
              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                Dashboard
              </span>
              <a href="/products" className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100">
                Products
              </a>
              <a href="/orders" className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100">
                Orders
              </a>
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back,{' '}
            <span className="font-medium text-gray-700">{user?.name}</span>.
          </p>
        </div>

        {statsError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Failed to load stats — make sure the backend is running.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              accent={card.accent}
              loading={loading}
            />
          ))}
        </div>

        {/* Quick nav cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <a
            href="/products"
            className="group flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-gray-900">Product Catalog</p>
              <p className="mt-0.5 text-sm text-gray-400">Add, edit, and remove products</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 transition-colors group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="/orders"
            className="group flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-gray-900">Order Management</p>
              <p className="mt-0.5 text-sm text-gray-400">Review and update order statuses</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 transition-colors group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}
