import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n/config';

// Only these paths require the user to be authenticated.
const PROTECTED_PATHS = ['/profile', '/checkout', '/order-success'];

function getPreferredLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie as Locale;

  const acceptLang = req.headers.get('accept-language') ?? '';
  for (const part of acceptLang.split(',')) {
    const lang = part.split(';')[0].trim().split('-')[0].toLowerCase();
    if ((locales as readonly string[]).includes(lang)) return lang as Locale;
  }

  return defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const pathnameLocale = locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  // No locale prefix — redirect to the preferred locale.
  if (!pathnameLocale) {
    const locale = getPreferredLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // Derive the sub-path after the locale segment (e.g. "/en/checkout" → "/checkout").
  const subPath = '/' + pathname.slice(pathnameLocale.length + 1);

  const isProtected = PROTECTED_PATHS.some(
    (p) => subPath === p || subPath.startsWith(`${p}/`),
  );

  if (isProtected) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};