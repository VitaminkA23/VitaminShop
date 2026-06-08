'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../../../contexts/CartContext';
import { useDictionary } from '../../../i18n/DictionaryContext';

export default function CartPage() {
  const { cart, itemCount, addToCart, removeFromCart, isLoading } = useCart();
  const dict = useDictionary();
  const t = dict.cart;

  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/${locale}`} className="text-sm text-gray-400 transition-colors hover:text-gray-700">
          {t.backToShop}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.title}{itemCount > 0 && <span className="ml-2 text-gray-400">({itemCount})</span>}
        </h1>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 text-center shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4 h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
          <p className="text-base font-medium text-gray-600">{t.empty}</p>
          <p className="mt-1 text-sm text-gray-400">{t.emptySubtitle}</p>
          <Link
            href={`/${locale}`}
            className="mt-6 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            {t.browseProducts}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm"
            >
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />

              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  ${item.product.price.toFixed(2)} {t.each}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  aria-label={t.decrease}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => addToCart(item.product)}
                  aria-label={t.increase}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              <span className="w-20 text-right text-sm font-semibold text-gray-900">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">
                {t.subtotal} ({itemCount} {t.items})
              </span>
              <span className="text-lg font-bold text-gray-900">
                ${cart.totalPrice.toFixed(2)}
              </span>
            </div>
            <Link
              href={`/${locale}/checkout`}
              className="mt-5 block w-full rounded-lg bg-emerald-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              {t.checkout}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}