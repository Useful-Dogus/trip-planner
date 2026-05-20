import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawTitle = typeof body?.title === 'string' ? body.title.trim() : ''
    const title = rawTitle || '새 여행'

    const client = createRouteHandlerSupabase()
    const { data: tripId, error } = await client.rpc('create_user_trip', { p_title: title })
    if (error) {
      console.error('[POST /api/trips] create_user_trip failed:', error)
      return NextResponse.json({ error: '여행 생성에 실패했습니다.' }, { status: 500 })
    }
    if (typeof tripId !== 'string') {
      return NextResponse.json({ error: '여행 생성에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ tripId, title }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/trips] unexpected:', e)
    return NextResponse.json({ error: '여행 생성에 실패했습니다.' }, { status: 500 })
  }
}
