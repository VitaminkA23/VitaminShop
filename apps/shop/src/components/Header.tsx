'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useDictionary } from '../i18n/DictionaryContext';
import LanguageSwitcher from './LanguageSwitcher';
import type { Locale } from '../i18n/config';

const NAV_CATEGORIES = [
  { label: 'Vitamins', value: 'Vitamins' },
  { label: 'Minerals', value: 'Minerals' },
  { label: 'Supplements', value: 'Supplements' },
  { label: 'Sports Nutrition', value: 'Sports Nutrition' },
];

interface Props {
  locale: Locale;
}

export default function Header({ locale }: Props) {
  const { itemCount } = useCart();
  const dict = useDictionary();
  const t = dict.nav;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep input in sync when navigating back/forward
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  // Close categories panel on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function updateSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      const target = `/${locale}?${params.toString()}`;
      if (pathname === `/${locale}`) {
        router.replace(target);
      } else {
        router.push(target);
      }
    }, 300);
  }

  function navigateToCategory(value: string) {
    setCatOpen(false);
    setMobileOpen(false);
    router.push(`/${locale}?category=${encodeURIComponent(value)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Main row ─────────────────────────────────────────────────────── */}
        <div className="flex h-16 items-center gap-3">

          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="shrink-0 text-xl font-bold tracking-tight text-emerald-600"
          >
            Vitamin Shop
          </Link>

          {/* Categories dropdown — desktop only */}
          <div ref={catRef} className="relative hidden md:block">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                catOpen
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Categories
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {catOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                <div className="p-1.5">
                  {NAV_CATEGORIES.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => navigateToCategory(value)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-50 px-3 py-2.5">
                  <button
                    onClick={() => { setCatOpen(false); router.push(`/${locale}`); }}
                    className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-800"
                  >
                    View all products →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search bar — desktop: flexible center region */}
          <div className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
                />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search vitamins, minerals…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              {query && (
                <button
                  onClick={() => updateSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Desktop right actions */}
          <nav className="hidden shrink-0 items-center gap-1 md:flex">
            <LanguageSwitcher currentLocale={locale} />

            <Link
              href={`/${locale}/profile`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              {t.profile}
            </Link>

            <Link
              href={`/${locale}/cart`}
              className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              <span>{t.cart}</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            <a
              href="/api/auth/logout"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              {t.signOut}
            </a>
          </nav>

          {/* Mobile: cart icon + hamburger */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            <Link
              href={`/${locale}/cart`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
              aria-label={t.cart}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile search row ─────────────────────────────────────────────── */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
            {query && (
              <button
                onClick={() => updateSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile slide-down menu ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">

            {/* Categories grid */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {NAV_CATEGORIES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => navigateToCategory(value)}
                    className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setMobileOpen(false); router.push(`/${locale}`); }}
                className="mt-2 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-800"
              >
                View all products →
              </button>
            </div>

            {/* Nav links */}
            <div className="space-y-1 border-t border-gray-100 pt-4">
              <LanguageSwitcher currentLocale={locale} />
              <Link
                href={`/${locale}/profile`}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                {t.profile}
              </Link>
              <a
                href="/api/auth/logout"
                className="block rounded-lg bg-gray-800 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
              >
                {t.signOut}
              </a>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}