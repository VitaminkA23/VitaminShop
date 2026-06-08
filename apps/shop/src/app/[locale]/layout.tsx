import type { ReactNode } from 'react';
import '../globals.css';
import { getDictionary } from '../../i18n/getDictionary';
import { DictionaryProvider } from '../../i18n/DictionaryContext';
import { CartProvider } from '../../contexts/CartContext';
import Header from '../../components/Header';
import LangUpdater from '../../components/LangUpdater';
import { locales, type Locale } from '../../i18n/config';

// Pre-generate HTML for all supported locales at build time.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = (locales.includes(params.locale as Locale) ? params.locale : 'en') as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      {/* Updates document.documentElement.lang on the client */}
      <LangUpdater locale={locale} />
      <DictionaryProvider dict={dict}>
        <CartProvider>
          <Header locale={locale} />
          {children}
        </CartProvider>
      </DictionaryProvider>
    </>
  );
}