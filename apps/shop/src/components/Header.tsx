'use client';

import Link from 'next/link';
import { useCart } from '../contexts/CartContext';
import { useDictionary } from '../i18n/DictionaryContext';
import LanguageSwitcher from './LanguageSwitcher';
import type { Locale } from '../i18n/config';

interface Props {
  locale: Locale;
}

export default function Header({ locale }: Props) {
  const { itemCount } = useCart();
  const dict = useDictionary();
  const t = dict.nav;

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="text-xl font-bold text-emerald-600 tracking-tight">
          Vitamin Shop
        </Link>

        <nav className="flex items-center gap-2">
          {/* Language switcher */}
          <LanguageSwitcher currentLocale={locale} />

          <Link
            href={`/${locale}/profile`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            {t.profile}
          </Link>

          {/* Cart icon with badge */}
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
      </div>
    </header>
  );
}