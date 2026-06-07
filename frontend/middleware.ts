import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth-cookies';

const PROTECTED_PREFIXES = [
  '/chats',
  '/properties',
  '/leads',
  '/callbacks',
  '/calendar',
  '/analytics',
  '/settings',
  '/onboarding',
];

const AUTH_ROUTES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(REFRESH_COOKIE);

  if (pathname === '/signup' || pathname.startsWith('/signup/')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('invite', '1');
    return NextResponse.redirect(loginUrl);
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/onboarding',
    '/onboarding/:path*',
    '/chats',
    '/chats/:path*',
    '/properties',
    '/properties/:path*',
    '/leads',
    '/leads/:path*',
    '/callbacks',
    '/callbacks/:path*',
    '/calendar',
    '/calendar/:path*',
    '/analytics',
    '/analytics/:path*',
    '/settings',
    '/settings/:path*',
  ],
};
