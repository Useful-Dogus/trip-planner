import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }

  const { error } = await signInWithEmail(email, password)
  if (error) {
    return NextResponse.json(
      { error: '자격증명이 올바르지 않습니다.' },
      { status: 401 },
    )
  }

  return NextResponse.json({ ok: true })
}
