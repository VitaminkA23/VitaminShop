import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale } from '../../../../i18n/config';

export async function GET(request: NextRequest) {
  // Detect locale from Referer or cookie so we redirect back to the right locale's login.
  const referer = request.headers.get('referer') ?? '';
  const localeMatch = referer.match(/\/(en|ru)\//);
  const locale = localeMatch ? localeMatch[1] : defaultLocale;

  const response = NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  response.cookies.delete('vitamin_token');
  return response;
}