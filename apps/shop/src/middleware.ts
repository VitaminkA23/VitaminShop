import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n/config';

// Paths (without locale prefix) that do NOT require authentication.
const PUBLIC_PATHS = ['/login'];

function getPreferredLocale(req: NextRequest): Locale {
  // 1. Honour an explicit cookie preference set by the LanguageSwitcher.
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie as Locale;

  // 2. Parse the Accept-Language request header.
  const acceptLang = req.headers.get('accept-language') ?? '';
  for (const part of acceptLang.split(',')) {
    const lang = part.split(';')[0].trim().split('-')[0].toLowerCase();
    if ((locales as readonly string[]).includes(lang)) return lang as Locale;
  }

  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Determine whether the URL already carries a valid locale prefix.
  const pathnameLocale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  // ── No locale prefix — redirect to the preferred locale ────────────────────
  if (!pathnameLocale) {
    const locale = getPreferredLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // ── Locale present — check authentication for protected paths ───────────────
  // Derive the sub-path after the locale segment (e.g. "/en/cart" → "/cart").
  // +1 skips the leading "/" that precedes the locale word.
  const subPath = pathname.slice(pathnameLocale.length + 1) || '/';

  const isPublic = PUBLIC_PATHS.some(
    (p) => subPath === p || subPath.startsWith(`${p}/`),
  );

  if (!isPublic) {
    const token = req.cookies.get('vitamin_token')?.value;
    if (!token) {
      const loginUrl = new URL(`/${pathnameLocale}/login`, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except Next.js internals and backend API pass-throughs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};