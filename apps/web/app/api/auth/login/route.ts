import { NextRequest, NextResponse } from 'next/server'
import { createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { id, password } = body

  if (id !== process.env.AUTH_ID || password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json(
      { error: '자격증명이 올바르지 않습니다.' },
      { status: 401 }
    )
  }

  const token = await createToken({ id })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('auth', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: '/',
    sameSite: 'lax',
  })

  return response
}
