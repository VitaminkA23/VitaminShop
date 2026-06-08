import type { Locale } from './config';
import type { Dictionary } from './types';

// Dynamic import keeps each locale's JSON out of the shared bundle.
const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () =>
    import('../dictionaries/en.json').then((m) => m.default as unknown as Dictionary),
  ru: () =>
    import('../dictionaries/ru.json').then((m) => m.default as unknown as Dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (loaders[locale] ?? loaders.en)();
}