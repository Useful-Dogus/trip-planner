import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmail } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { error: '이메일과 비밀번호를 입력해주세요.', code: 'invalid_credentials' },
      { status: 400 },
    )
  }

  const { error } = await signInWithEmail(email, password)
  if (error) {
    const mapped = mapAuthError(error)

    // 계정 enumeration 방지: 비번 틀림 / 미가입 / 잠긴 계정은 모두 동일 메시지.
    if (mapped.code === 'invalid_credentials' || mapped.code === 'generic') {
      return NextResponse.json(
        {
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
          code: 'invalid_credentials',
        },
        { status: 401 },
      )
    }

    // email_not_confirmed / rate_limit 는 UX 상 별도 분기.
    const status = mapped.code === 'rate_limit' ? 429 : 400
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status },
    )
  }

  return NextResponse.json({ ok: true })
}
