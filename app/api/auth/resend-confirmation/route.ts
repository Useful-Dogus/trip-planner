import { NextRequest, NextResponse } from 'next/server'
import { resendSignupConfirmation } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  // 열거 방지: email 비어있어도 ok 응답.
  if (!email) {
    return NextResponse.json({ ok: true })
  }

  const origin = new URL(request.url).origin
  const emailRedirectTo = `${origin}/api/auth/callback?next=/login`
  await resendSignupConfirmation(email, emailRedirectTo)

  // 결과(존재 여부 / rate limit) 와 무관하게 ok.
  return NextResponse.json({ ok: true })
}
