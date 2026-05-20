import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForSession } from '@/lib/auth'

function safeNext(next: string | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
  }

  const { error } = await exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
