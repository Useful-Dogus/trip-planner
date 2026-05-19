import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromMiddleware } from '@/lib/auth'

const PROTECTED_PAGES = ['/list', '/map', '/schedule', '/items', '/gmaps-import']
const PROTECTED_API = ['/api/items', '/api/geocode', '/api/gmaps']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPage = PROTECTED_PAGES.some(p => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some(p => pathname.startsWith(p))
  const isLoginPage = pathname === '/login'

  const response = NextResponse.next({ request })
  const session = await getSessionFromMiddleware(request, response)
  const isAuthenticated = session !== null

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/list', request.url))
    }
    return response
  }

  if (!isProtectedPage && !isProtectedApi) return response

  if (!isAuthenticated) {
    if (isProtectedApi) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/list/:path*',
    '/map/:path*',
    '/schedule/:path*',
    '/items/:path*',
    '/gmaps-import/:path*',
    '/api/items/:path*',
    '/api/geocode',
    '/api/gmaps/:path*',
  ],
}
