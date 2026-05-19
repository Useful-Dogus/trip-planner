import { NextRequest, NextResponse } from 'next/server'
import { getSession, updatePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!password) {
    return NextResponse.json({ error: '새 비밀번호를 입력해주세요.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: '세션이 만료되었습니다. 재설정 링크를 다시 받아주세요.' },
      { status: 401 },
    )
  }

  const { error } = await updatePassword(password)
  if (error) {
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
