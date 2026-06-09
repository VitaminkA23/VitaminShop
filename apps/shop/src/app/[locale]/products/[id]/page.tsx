'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';
import { useCart } from '../../../../contexts/CartContext';
import { useDictionary } from '../../../../i18n/DictionaryContext';
import type { ProductWithLike, ToggleLikeResponse } from '@vitamin/types';

interface ProductDetailResponse {
  product: ProductWithLike;
}

// Build a 4-image gallery from the single imageUrl the backend provides.
// Labels simulate the "angle views" a real multi-image upload would supply.
// When the backend is extended to return string[], replace this with product.images.
function buildGallery(imageUrl: string, name: string): string[] {
  const initials = encodeURIComponent(name.slice(0, 2).toUpperCase());
  return [
    imageUrl,
    `https://placehold.co/600x600/ecfdf5/059669?text=${initials}+%E2%80%A2+Side`,
    `https://placehold.co/600x600/d1fae5/065f46?text=${initials}+%E2%80%A2+Back`,
    `https://placehold.co/600x600/a7f3d0/064e3b?text=${initials}+%E2%80%A2+Detail`,
  ];
}

export default function ProductDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';
  const id = params.id as string;

  const { product: t } = useDictionary();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductWithLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [imgVisible, setImgVisible] = useState(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<ProductDetailResponse>(`/api/products/${id}`)
      .then((data) => {
        setProduct(data.product);
        setLiked(data.product.liked);
        const imgs = buildGallery(data.product.imageUrl, data.product.name);
        setGalleryImages(imgs);
        setSelectedImage(imgs[0]);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load product'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const toggleLike = useCallback(async () => {
    if (!product || likeLoading) return;
    setLikeLoading(true);
    const snapshot = liked;
    setLiked(!snapshot);
    try {
      const res = await apiFetch<ToggleLikeResponse>(
        `/api/products/${product.id}/like`,
        { method: 'POST' },
      );
      setLiked(res.liked);
    } catch {
      setLiked(snapshot);
    } finally {
      setLikeLoading(false);
    }
  }, [product, liked, likeLoading]);

  const handleAddToCart = useCallback(() => {
    if (!product || cartState !== 'idle' || product.stock === 0) return;
    setCartState('adding');
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock,
    });
    setCartState('added');
    setTimeout(() => setCartState('idle'), 2000);
  }, [product, cartState, addToCart]);

  function selectImage(url: string) {
    if (url === selectedImage) return;
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    setImgVisible(false);
    fadeTimer.current = setTimeout(() => {
      setSelectedImage(url);
      setImgVisible(true);
    }, 160);
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-red-600">{error ?? 'Product not found.'}</p>
        <Link
          href={`/${locale}`}
          className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          ← Back to shop
        </Link>
      </main>
    );
  }

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const btnLabel =
    outOfStock
      ? t.outOfStock
      : cartState === 'added'
        ? t.added
        : cartState === 'adding'
          ? t.adding
          : t.addToCart;

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-6">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href={`/${locale}`} className="transition-colors hover:text-emerald-600">
            Home
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-400">{product.category}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="max-w-[200px] truncate font-medium text-gray-700">{product.name}</span>
        </nav>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Image panel */}
            <div className="flex flex-col">

              {/* Main image */}
              <div className="relative flex min-h-[380px] flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50/50 p-10">
                {outOfStock && (
                  <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px]" />
                )}
                {outOfStock && (
                  <span className="absolute left-4 top-4 z-20 rounded-full bg-gray-500/90 px-3 py-1 text-sm font-bold text-white shadow">
                    {t.outOfStock}
                  </span>
                )}
                {lowStock && !outOfStock && (
                  <span className="absolute left-4 top-4 z-20 rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-white shadow">
                    Only {product.stock} left!
                  </span>
                )}

                {/* Like button */}
                <button
                  onClick={toggleLike}
                  disabled={likeLoading}
                  aria-label={liked ? t.likeRemove : t.likeAdd}
                  className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md transition-all duration-150 hover:scale-110 hover:shadow-lg disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    className={`h-5 w-5 transition-colors duration-200 ${
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

                <img
                  src={selectedImage}
                  alt={product.name}
                  className={`relative z-0 max-h-[460px] w-full object-contain drop-shadow-lg transition-all duration-300 ${
                    imgVisible ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
                  }`}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://placehold.co/600x600/ecfdf5/059669?text=${encodeURIComponent(
                      product.name.slice(0, 2).toUpperCase(),
                    )}`;
                  }}
                />
              </div>

              {/* Thumbnail strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 border-t border-gray-100 bg-white px-6 py-4">
                  {galleryImages.map((url, idx) => {
                    const isActive = url === selectedImage;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectImage(url)}
                        aria-label={`View image ${idx + 1}`}
                        className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                          isActive
                            ? 'border-emerald-500 shadow-md shadow-emerald-100/60'
                            : 'border-transparent hover:border-emerald-300 hover:shadow-sm'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`${product.name} view ${idx + 1}`}
                          className={`h-full w-full object-cover transition-all duration-200 ${
                            isActive
                              ? 'opacity-100'
                              : 'opacity-70 group-hover:opacity-100'
                          }`}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = `https://placehold.co/120x120/ecfdf5/059669?text=${idx + 1}`;
                          }}
                        />
                        {isActive && (
                          <span className="absolute inset-0 rounded-[10px] ring-2 ring-inset ring-emerald-500/30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <span className="mb-4 inline-block w-fit rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                {product.category}
              </span>

              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {product.name}
              </h1>

              <p className="mt-4 text-4xl font-bold text-emerald-600">
                ${product.price.toFixed(2)}
              </p>

              <p className="mt-6 leading-relaxed text-gray-600">{product.description}</p>

              {/* Stock indicator */}
              <div className="mt-6 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    outOfStock
                      ? 'bg-gray-400'
                      : lowStock
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {outOfStock
                    ? 'Out of stock'
                    : lowStock
                      ? `Only ${product.stock} units remaining`
                      : `In stock — ${product.stock} units available`}
                </span>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || cartState === 'adding'}
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold shadow-sm transition-all duration-150 sm:w-auto sm:px-10 ${
                  outOfStock
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : cartState === 'added'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                }`}
              >
                {cartState === 'added' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : !outOfStock ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                ) : null}
                {btnLabel}
              </button>

              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { icon: '🧪', label: 'Lab Tested' },
                  { icon: '⭐', label: 'Premium Quality' },
                  { icon: '🚚', label: 'Free Ship $50+' },
                ].map(({ icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 px-3 py-3 text-center ring-1 ring-gray-100"
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-[11px] font-semibold text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-emerald-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to all products
          </Link>
        </div>
      </div>
    </main>
  );
}
