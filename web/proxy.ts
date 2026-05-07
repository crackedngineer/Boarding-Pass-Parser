import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard']
const AUTH_ONLY  = ['/login']
// ft-auth is a presence-only flag cookie set by the callback page after
// successful sign-in and cleared by useAuth on sign-out.
const AUTH_COOKIE = 'ft-auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value)

  if (PROTECTED.some(p => pathname.startsWith(p)) && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (AUTH_ONLY.some(p => pathname.startsWith(p)) && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = isAuthenticated ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
