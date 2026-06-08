'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { useDictionary } from '../../../../i18n/DictionaryContext';
import type { Order, OrderResponse } from '@vitamin/types';

export default function OrderSuccessPage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';
  const orderId = params.orderId as string;
  const dict = useDictionary();
  const t = dict.orderSuccess;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    apiFetch<OrderResponse>(`/api/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-base font-medium text-red-600">{error ?? t.notFound}</p>
        <Link href={`/${locale}`} className="mt-4 inline-block text-sm text-emerald-600 underline">
          {t.continueShopping}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {/* Success banner */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {t.orderId}:{' '}
          <span className="font-mono text-gray-700">{order.id.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>

      {/* Order card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          {t.itemsOrdered}
        </h2>
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              {item.product?.imageUrl && (
                <img
                  src={item.product.imageUrl}
                  alt={item.product?.name ?? 'Product'}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {item.product?.name ?? `Product ${item.productId.slice(0, 6)}`}
                </p>
                <p className="text-xs text-gray-500">{t.qty} {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ${(item.priceAtPurchase * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
          <span className="text-gray-500">{t.shipping}</span>
          <span className="font-medium text-emerald-600">{t.free}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-base">
          <span className="font-semibold text-gray-900">{t.totalPaid}</span>
          <span className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</span>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t.shipsTo}
          </p>
          <p className="text-sm text-gray-700">{order.shippingAddress.street}</p>
          <p className="text-sm text-gray-500">
            {order.shippingAddress.city}, {order.shippingAddress.postalCode},{' '}
            {order.shippingAddress.country}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium capitalize text-gray-700">
            {order.status.toLowerCase()}
          </span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href={`/${locale}`}
          className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          {t.continueShopping}
        </Link>
      </div>
    </main>
  );
}