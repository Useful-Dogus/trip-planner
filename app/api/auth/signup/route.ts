import { NextRequest, NextResponse } from 'next/server'
import { signUpWithEmail } from '@/lib/auth'
import { mapAuthError } from '@/lib/auth-errors'
import { isCommonPassword } from '@/lib/commonPasswords'

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
  if (isCommonPassword(password)) {
    return NextResponse.json(
      { error: '너무 흔한 비밀번호예요. 추측하기 어려운 비밀번호로 바꿔주세요.' },
      { status: 400 },
    )
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

  // NOTE(#306, 보류): 가입 이메일 인증(소유권 검증)·미인증 상태 UX 는 의도적으로 보류 중이다.
  // 현재는 Supabase 의 needsEmailConfirmation 플래그만 클라이언트에 전달하고, 미인증 상태로도
  // 로그인을 막지 않는다(soft). SSO(#318)에서 실유저 모집 전 "이메일 인증 없이 가입 불가"로
  // 강화하기로 한 방향과 함께 다룬다 — 그때 hard/soft 게이팅을 결정·구현한다.
  const needsEmailConfirmation = !data.session
  return NextResponse.json({ ok: true, needsEmailConfirmation })
}
