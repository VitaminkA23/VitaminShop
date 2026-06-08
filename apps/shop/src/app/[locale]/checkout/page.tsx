'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../contexts/CartContext';
import { apiFetch } from '../../../lib/api';
import { useDictionary } from '../../../i18n/DictionaryContext';

interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderResponse {
  order: { id: string };
}

export default function CheckoutPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';
  const dict = useDictionary();
  const t = dict.checkout;

  const { cart, isLoading: cartLoading, clearCart } = useCart();

  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddr(field: keyof ShippingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function placeOrder() {
    setError(null);

    if (!address.street.trim() || !address.city.trim()) {
      setError('Street and city are required.');
      return;
    }
    if (cart.items.length === 0) {
      setError(dict.cart.empty);
      return;
    }

    setPlacing(true);
    try {
      const data = await apiFetch<OrderResponse>('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          shippingAddress: {
            street: address.street.trim(),
            city: address.city.trim(),
            postalCode: address.postalCode.trim() || 'N/A',
            country: address.country.trim() || 'N/A',
          },
        }),
      });
      clearCart();
      router.push(`/${locale}/order-success/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
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
        <p className="text-lg font-medium text-gray-600">{dict.cart.empty}</p>
        <Link
          href={`/${locale}`}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {dict.cart.browseProducts}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link href={`/${locale}/cart`} className="text-sm text-gray-400 hover:text-gray-700">
          {t.backToCart}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

        {/* ── Left column ── */}
        <div className="space-y-6 lg:col-span-3">

          {/* Shipping address */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">{t.shippingAddress}</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Street address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => handleAddr('street', e.target.value)}
                  placeholder="123 Main St, Apt 4B"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleAddr('city', e.target.value)}
                    placeholder="New York"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Postal code</label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => handleAddr('postalCode', e.target.value)}
                    placeholder="10001"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => handleAddr('country', e.target.value)}
                  placeholder="United States"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </section>

          {/* Payment — mock card form */}
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">{t.paymentMethod}</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Card number</label>
                <input
                  type="text"
                  defaultValue="4242 4242 4242 4242"
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Expiry</label>
                  <input
                    type="text"
                    defaultValue="12 / 28"
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">CVC</label>
                  <input
                    type="text"
                    defaultValue="•••"
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                This is a demo store — no real payment is processed.
              </p>
            </div>
          </section>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">{t.orderSummary}</h2>

            <ul className="mb-4 divide-y">
              {cart.items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-3 py-3">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{t.qty} {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-gray-600">{t.shipping}</span>
              <span className="font-medium text-emerald-600">{t.free}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base">
              <span className="font-semibold text-gray-900">{t.total}</span>
              <span className="text-lg font-bold text-gray-900">${cart.totalPrice.toFixed(2)}</span>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={placing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {placing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.placing}
                </>
              ) : t.placeOrder}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}