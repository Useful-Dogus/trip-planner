import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '요청 본문이 잘못되었습니다.' }, { status: 400 })
  }

  const updates: { email?: string; data?: Record<string, unknown> } = {}

  if (typeof body.nickname === 'string') {
    const nickname = body.nickname.trim()
    if (nickname.length > 40) {
      return NextResponse.json({ error: '닉네임은 40자 이하여야 합니다.' }, { status: 400 })
    }
    updates.data = { nickname: nickname || null }
  }

  if (typeof body.email === 'string') {
    const email = body.email.trim()
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다.' }, { status: 400 })
    }
    updates.email = email
  }

  if (!('email' in updates) && !('data' in updates)) {
    return NextResponse.json({ error: '변경할 항목이 없습니다.' }, { status: 400 })
  }

  const client = createRouteHandlerSupabase()
  const { error } = await client.auth.updateUser(updates)
  if (error) {
    console.error('[PATCH /api/auth/update-profile] failed:', error)
    return NextResponse.json(
      { error: '프로필 변경에 실패했습니다.' },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ok: true,
    requiresEmailConfirmation: 'email' in updates,
  })
}
