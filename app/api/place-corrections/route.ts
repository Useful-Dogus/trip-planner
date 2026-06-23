import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { readLatestCorrections, insertCorrection } from '@/lib/placeCorrections'
import { isValidOpeningHours, isValidClosedDays } from '@/lib/itemValidation'

/** GET /api/place-corrections?placeIds=a,b,c → place 별 최신 공유 보정. */
export async function GET(request: NextRequest) {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const raw = request.nextUrl.searchParams.get('placeIds') ?? ''
  const placeIds = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (placeIds.length === 0) return NextResponse.json({ corrections: {} })

  try {
    const map = await readLatestCorrections(client, placeIds)
    const corrections = Object.fromEntries(map.entries())
    return NextResponse.json({ corrections })
  } catch {
    return NextResponse.json({ error: '공유 보정을 불러오지 못했습니다.' }, { status: 500 })
  }
}

/** POST /api/place-corrections — 현재 사용자가 한 장소의 영업시간/휴무 보정을 공유. */
export async function POST(request: NextRequest) {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json()
  const googlePlaceId = body.googlePlaceId
  if (!googlePlaceId || typeof googlePlaceId !== 'string') {
    return NextResponse.json({ error: 'googlePlaceId가 필요합니다.' }, { status: 400 })
  }
  if (body.openingHours != null && !isValidOpeningHours(body.openingHours)) {
    return NextResponse.json({ error: 'opening_hours 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  if (body.closedDays != null && !isValidClosedDays(body.closedDays)) {
    return NextResponse.json({ error: 'closed_days 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  if (body.openingHours == null && body.closedDays == null) {
    return NextResponse.json({ error: '공유할 영업시간 또는 휴무 정보가 필요합니다.' }, { status: 400 })
  }

  try {
    await insertCorrection(client, userData.user.id, {
      googlePlaceId,
      openingHours: body.openingHours ?? null,
      closedDays: body.closedDays ?? null,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '공유에 실패했습니다.' }, { status: 500 })
  }
}
