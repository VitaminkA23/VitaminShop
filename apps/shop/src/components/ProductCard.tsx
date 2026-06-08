'use client';

import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useDictionary } from '../i18n/DictionaryContext';
import { apiFetch } from '../lib/api';
import type { ProductWithLike, ToggleLikeResponse } from '@vitamin/types';

interface Props {
  product: ProductWithLike;
}

export default function ProductCard({ product }: Props) {
  const dict = useDictionary();
  const t = dict.product;

  const [liked, setLiked] = useState(product.liked);
  const [likeLoading, setLikeLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const data = await apiFetch<ToggleLikeResponse>(`/api/products/${product.id}/like`, {
        method: 'POST',
      });
      setLiked(data.liked);
    } catch {
      // silent
    } finally {
      setLikeLoading(false);
    }
  }

  function handleAddToCart() {
    if (addingToCart || product.stock === 0) return;
    setAddingToCart(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    setAddingToCart(false);
  }

  const buttonLabel =
    product.stock === 0
      ? t.outOfStock
      : justAdded
        ? t.added
        : addingToCart
          ? t.adding
          : t.addToCart;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          aria-label={liked ? t.likeRemove : t.likeAdd}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={2}
            className={`h-5 w-5 transition-colors ${
              liked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-gray-500'
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug text-gray-900">{product.name}</h3>
          <span className="shrink-0 text-sm font-bold text-emerald-600">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <p className="mb-3 flex-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {product.category}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || product.stock === 0}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}