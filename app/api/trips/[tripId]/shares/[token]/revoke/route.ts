import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { revokeShare } from '@/lib/share'

export async function POST(
  _request: NextRequest,
  { params }: { params: { tripId: string; token: string } },
) {
  try {
    const client = createRouteHandlerSupabase()
    await revokeShare(client, params.token)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[POST /api/trips/:tripId/shares/:token/revoke] failed:', e)
    return NextResponse.json({ error: '공유 링크 회수에 실패했습니다.' }, { status: 500 })
  }
}
