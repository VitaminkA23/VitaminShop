import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { OrderWithUser, OrderStatus } from '@vitamin/types';
import { OrderStatus as OS } from '@vitamin/types';

const ALL_STATUSES: OrderStatus[] = [OS.PENDING, OS.PAID, OS.SHIPPED, OS.DELIVERED, OS.CANCELLED];

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OS.PENDING]: 'bg-yellow-100 text-yellow-700',
  [OS.PAID]: 'bg-blue-100 text-blue-700',
  [OS.SHIPPED]: 'bg-purple-100 text-purple-700',
  [OS.DELIVERED]: 'bg-emerald-100 text-emerald-700',
  [OS.CANCELLED]: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update status');
      }
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-indigo-600">Vitamin Admin</h1>
            <nav className="flex items-center gap-1">
              <a
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              >
                Dashboard
              </a>
              <a
                href="/products"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              >
                Products
              </a>
              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                Orders
              </span>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-gray-800 px-4 py-1.5 text-sm text-white transition-colors hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
          <button
            onClick={fetchOrders}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl border bg-white py-16 text-center shadow-sm">
            <p className="text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.user.name}</p>
                      <p className="text-xs text-gray-400">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {updatingId === order.id && (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}