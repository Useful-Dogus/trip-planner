import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { createShare, listSharesForTrip } from '@/lib/share'

export async function GET(_request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const client = createRouteHandlerSupabase()
    const shares = await listSharesForTrip(client, params.tripId)
    return NextResponse.json({ shares })
  } catch (e) {
    console.error('[GET /api/trips/:tripId/shares] failed:', e)
    return NextResponse.json({ error: '공유 링크 목록을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { tripId: string } }) {
  try {
    const body = await request.json().catch(() => ({}))
    const expiresAtRaw = typeof body?.expires_at === 'string' ? body.expires_at : null
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
    if (expiresAt && isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: '만료 시각 형식이 잘못되었습니다.' }, { status: 400 })
    }

    const client = createRouteHandlerSupabase()
    const share = await createShare(client, params.tripId, { expiresAt })
    return NextResponse.json({ share }, { status: 201 })
  } catch (e) {
    console.error('[POST /api/trips/:tripId/shares] failed:', e)
    return NextResponse.json({ error: '공유 링크 발급에 실패했습니다.' }, { status: 500 })
  }
}
