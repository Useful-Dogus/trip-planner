import { NextRequest, NextResponse } from 'next/server'
import { signUpWithEmail } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const emailRedirectTo = `${origin}/api/auth/callback?next=/login`

  const { data, error } = await signUpWithEmail(email, password, emailRedirectTo)
  if (error) {
    // 이메일 enumeration 방지: 기존 가입 여부를 응답에 노출하지 않는다.
    if (/already/i.test(error.message)) {
      return NextResponse.json({ ok: true, needsEmailConfirmation: true })
    }
    const mapped = mapAuthError(error)
    const status = mapped.code === 'rate_limit' ? 429 : 400
    return NextResponse.json(
      { error: mapped.message, code: mapped.code },
      { status },
    )
  }

  const needsEmailConfirmation = !data.session
  return NextResponse.json({ ok: true, needsEmailConfirmation })
}
