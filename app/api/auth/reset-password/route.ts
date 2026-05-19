import { NextRequest, NextResponse } from 'next/server'
import { requestPasswordReset } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const redirectTo = `${origin}/api/auth/callback?next=/auth/update-password`

  await requestPasswordReset(email, redirectTo)
  return NextResponse.json({ ok: true })
}
