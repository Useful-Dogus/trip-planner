import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PAGES = ['/research', '/schedule', '/items']
const PROTECTED_API = ['/api/items', '/api/geocode']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPage = PROTECTED_PAGES.some(p => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some(p => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next()

  const token = request.cookies.get('auth')?.value

  if (!token || !(await verifyToken(token))) {
    if (isProtectedApi) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/research/:path*',
    '/schedule/:path*',
    '/items/:path*',
    '/api/items/:path*',
    '/api/geocode',
  ],
}
