'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../contexts/CartContext';
import { useDictionary } from '../../i18n/DictionaryContext';
import { apiFetch } from '../../lib/api';
import type { ProductWithLike, ToggleLikeResponse, ProductsResponse } from '@vitamin/types';

const LOW_STOCK_THRESHOLD = 5;

// ─── Loading skeleton card ────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse">
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-3/5 rounded bg-gray-200" />
          <div className="h-4 w-1/5 rounded bg-gray-200" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-4/5 rounded bg-gray-200" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-20 rounded-full bg-gray-200" />
          <div className="h-9 w-28 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductWithLike }) {
  const { product: t } = useDictionary();
  const { addToCart } = useCart();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';

  const [liked, setLiked] = useState(product.liked);
  const [likeLoading, setLikeLoading] = useState(false);
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

  const toggleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const snapshot = liked;
    setLiked(!snapshot);
    try {
      const res = await apiFetch<ToggleLikeResponse>(`/api/products/${product.id}/like`, {
        method: 'POST',
      });
      setLiked(res.liked);
    } catch {
      setLiked(snapshot);
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, product.id]);

  const handleAddToCart = useCallback(async () => {
    if (cartState !== 'idle' || outOfStock) return;
    setCartState('adding');
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock,
    });
    apiFetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    }).catch(() => {});
    setCartState('added');
    setTimeout(() => setCartState('idle'), 2000);
  }, [cartState, outOfStock, addToCart, product]);

  const btnLabel =
    outOfStock
      ? t.outOfStock
      : cartState === 'added'
        ? t.added
        : cartState === 'adding'
          ? t.adding
          : t.addToCart;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-emerald-50/40">
        {outOfStock && (
          <div className="absolute inset-0 z-10 bg-white/55 backdrop-blur-[2px]" />
        )}

        <Link href={`/${locale}/products/${product.id}`} className="block h-full w-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = `https://placehold.co/400x400/ecfdf5/059669?text=${encodeURIComponent(
                product.name.slice(0, 2).toUpperCase(),
              )}`;
            }}
          />
        </Link>

        {/* Stock badge — top-left */}
        {lowStock && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
            Only {product.stock} left!
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-gray-500/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
            {t.outOfStock}
          </span>
        )}

        {/* Like button — top-right */}
        <button
          onClick={toggleLike}
          disabled={likeLoading}
          aria-label={liked ? t.likeRemove : t.likeAdd}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-150 hover:scale-110 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth={2}
            className={`h-5 w-5 transition-all duration-200 ${
              liked ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-gray-400'
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

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Name + price row */}
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <Link
            href={`/${locale}/products/${product.id}`}
            className="line-clamp-1 font-semibold leading-snug text-gray-900 transition-colors hover:text-emerald-700"
          >
            {product.name}
          </Link>
          <span className="shrink-0 text-base font-extrabold text-emerald-600">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-2">
          {product.description}
        </p>

        {/* Category + CTA row */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100/80">
            {product.category}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || cartState === 'adding'}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-150 ${
              outOfStock
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : cartState === 'added'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
            }`}
          >
            {cartState === 'added' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : !outOfStock ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            ) : null}
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { home: t } = useDictionary();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get('category') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';
  const locale = pathname.split('/')[1] ?? 'en';

  const [products, setProducts] = useState<ProductWithLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(urlCategory);

  // Sync category selection when URL changes (e.g. header dropdown)
  useEffect(() => {
    setActiveCategory(urlCategory);
  }, [urlCategory]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch<ProductsResponse>('/api/products')
      .then((data) => setProducts(data.products))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load products'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    router.replace(`/${locale}?${params.toString()}`);
  }

  const categories = [
    'all',
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];

  const visible = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-16 text-white">
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-white/[0.05]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Free shipping on orders over $50
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-xl text-lg text-emerald-100">{t.subtitle}</p>

          {/* Feature pills */}
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                  clipRule="evenodd"
                />
              </svg>
              Premium Quality
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-emerald-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.704-3.08z"
                  clipRule="evenodd"
                />
              </svg>
              Lab Tested
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-blue-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15Z" />
                <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0ZM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75Z" />
                <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0Z" />
              </svg>
              Fast Delivery
            </span>
          </div>
        </div>
      </section>

      {/* ── Catalog section ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Category filter bar */}
        {!loading && !error && categories.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-gray-400">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all duration-150 ${
                  cat === activeCategory
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-emerald-700 hover:ring-emerald-300'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Result count / search indicator */}
        {!loading && !error && visible.length > 0 && (
          <p className="mb-6 text-sm text-gray-400">
            Showing {visible.length} {visible.length === 1 ? 'product' : 'products'}
            {searchQuery && (
              <> for <span className="font-semibold text-gray-600">&ldquo;{searchQuery}&rdquo;</span></>
            )}
          </p>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-red-700">{error}</p>
            <button
              onClick={loadProducts}
              className="mt-4 rounded-lg bg-red-100 px-5 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {/* Product grid */}
        {!error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : visible.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-emerald-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{t.noProducts}</h3>
            <p className="mt-1.5 text-sm text-gray-500">{t.noProductsSubtitle}</p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => handleCategoryChange('all')}
                className="mt-5 rounded-xl bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Show all products
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}