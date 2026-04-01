/**
 * Next.js middleware for authentication and route protection.
 * Handles auth checks and redirects based on authentication state.
 */

import { NextRequest, NextResponse } from 'next/server';

// Define protected and public routes
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/callback'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has authentication token (simplified check)
  // In a real app, you'd validate the JWT token properly
  const token = request.cookies.get('access_token')?.value;
  const isAuthenticated = Boolean(token);

  // Protect dashboard and other protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated && pathname !== '/callback') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};