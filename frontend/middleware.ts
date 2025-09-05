import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Try to get token from cookie (SSR) or from custom header (CSR)
  const token = req.cookies.get('token')?.value || req.headers.get('x-localstorage-token');
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');

  // Skip middleware for API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  if (token && isAuthPage) {
    // If logged in, redirect away from login/signup
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Only redirect to login if not on auth pages and no token
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\\..*).*)'],
};
