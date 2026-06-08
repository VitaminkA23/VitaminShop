import { ReactNode } from 'react';
import { CartProvider } from "@/contexts/CartContext";
import { DictionaryProvider } from "@/i18n/DictionaryContext";
import Header from "@/components/Header";
import {Locale, locales} from "@/i18n/config";
import {getDictionary} from "@/i18n/getDictionary";
import LangUpdater from "@/components/LangUpdater";

interface LocaleLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;
  const currentLocale = locales.includes(locale as Locale) ? (locale as Locale) : 'en';
  const dict = await getDictionary(currentLocale);

  return (
      <>
        <LangUpdater locale={currentLocale} />
        <DictionaryProvider dict={dict}>
          <CartProvider>
            <Header locale={"en"} />
            <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
              {children}
            </div>
          </CartProvider>
        </DictionaryProvider>
      </>
  );
}