import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PAGES = ['/research', '/schedule', '/items']
const PROTECTED_API = ['/api/items', '/api/geocode']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPage = PROTECTED_PAGES.some(p => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some(p => pathname.startsWith(p))
  const isLoginPage = pathname === '/login'

  const token = request.cookies.get('auth')?.value
  const isAuthenticated = token ? await verifyToken(token) : false

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/research', request.url))
    }
    return NextResponse.next()
  }

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next()

  if (!isAuthenticated) {
    if (isProtectedApi) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/research/:path*',
    '/schedule/:path*',
    '/items/:path*',
    '/api/items/:path*',
    '/api/geocode',
  ],
}
