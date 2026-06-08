'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Dictionary } from './types';

const DictionaryContext = createContext<Dictionary | null>(null);

export function DictionaryProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={dict}>{children}</DictionaryContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error('useDictionary must be used inside <DictionaryProvider>');
  return ctx;
}