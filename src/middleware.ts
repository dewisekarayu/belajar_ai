import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/chat', '/settings', '/dashboard', '/profile']
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*', '/settings/:path*', '/dashboard/:path*', '/profile/:path*', '/login', '/register'],
}
