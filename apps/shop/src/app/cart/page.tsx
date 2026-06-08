'use client';

import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';

export default function CartPage() {
  const { cart, itemCount, addToCart, removeFromCart, isLoading } = useCart();

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
        <Link href="/" className="text-sm text-gray-400 transition-colors hover:text-gray-700">
          ← Back to shop
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">
          Your Cart{itemCount > 0 && <span className="ml-2 text-gray-400">({itemCount})</span>}
        </h1>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 text-center shadow-sm">
          <p className="text-base font-medium text-gray-600">Your cart is empty</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Browse products
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
                <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                >−</button>
                <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => addToCart(item.product)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                >+</button>
              </div>
              <span className="w-20 text-right text-sm font-semibold text-gray-900">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">Subtotal ({itemCount} items)</span>
              <span className="text-lg font-bold text-gray-900">${cart.totalPrice.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-5 block w-full rounded-lg bg-emerald-600 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}