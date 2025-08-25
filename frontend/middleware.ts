import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Try to get token from cookie (SSR) or from custom header (CSR)
  const token = req.cookies.get('token')?.value || req.headers.get('x-localstorage-token');
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup');

  if (token && isAuthPage) {
    // If logged in, redirect away from login/signup
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!token && !isAuthPage) {
    // If not logged in, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\\..*).*)'],
};
