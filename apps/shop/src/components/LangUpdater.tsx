'use client';

import { useEffect } from 'react';

// Sets document.documentElement.lang to the active locale on every navigation.
// The root layout hard-codes lang="en" as a fallback; this component corrects it
// client-side without requiring a full-page reload.
export default function LangUpdater({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}