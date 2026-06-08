'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { apiFetch } from '../../lib/api';

interface OrderResponse {
  order: { id: string };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading: cartLoading, clearCart } = useCart();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeOrder() {
    setError(null);
    if (!street.trim() || !city.trim()) {
      setError('Street and city are required.');
      return;
    }
    setPlacing(true);
    try {
      const data = await apiFetch<OrderResponse>('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          shippingAddress: { street: street.trim(), city: city.trim(), postalCode: postalCode.trim() || 'N/A', country: country.trim() || 'N/A' },
        }),
      });
      clearCart();
      router.push(`/order-success/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setPlacing(false);
    }
  }

  if (cartLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-lg font-medium text-gray-600">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Browse products</Link>
      </main>
    );
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/cart" className="text-sm text-gray-400 hover:text-gray-700">← Back to cart</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Shipping address</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Street <span className="text-red-500">*</span></label>
                <input className={inputCls} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                  <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Postal code</label>
                  <input className={inputCls} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10001" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
              </div>
            </div>
          </section>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Order Summary</h2>
            <ul className="mb-4 divide-y">
              {cart.items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3 py-3">
                  <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t pt-4 text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold">${cart.totalPrice.toFixed(2)}</span>
            </div>
            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              onClick={placeOrder}
              disabled={placing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {placing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Placing…</> : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}