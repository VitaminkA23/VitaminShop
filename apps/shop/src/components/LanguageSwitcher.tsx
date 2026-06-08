'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '../i18n/config';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
};

interface Props {
  currentLocale: Locale;
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    if (locale === currentLocale) return;

    // Replace the locale segment while preserving the rest of the path.
    const segments = pathname.split('/');
    segments[1] = locale;
    const newPath = segments.join('/') || '/';

    // Persist the preference in a cookie so the middleware picks it up on
    // hard refreshes or when navigating to the root ("/").
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    router.push(newPath);
  }

  return (
    <div
      className="flex items-center rounded-lg bg-gray-100 p-0.5"
      role="group"
      aria-label="Language selector"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          aria-pressed={locale === currentLocale}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
            locale === currentLocale
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}