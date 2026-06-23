import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

export interface VoteTally {
  count: number
  mine: boolean
}

/** GET /api/item-votes?tripId= → { [itemId]: { count, mine } } (RLS 가 멤버로 스코프). */
export async function GET(request: NextRequest) {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  const tripId = request.nextUrl.searchParams.get('tripId')
  if (!tripId) {
    return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
  }

  const { data, error } = await client
    .from('item_votes')
    .select('item_id, user_id')
    .eq('trip_id', tripId)
  if (error) {
    return NextResponse.json({ error: '투표를 불러오지 못했습니다.' }, { status: 500 })
  }

  const tallies: Record<string, VoteTally> = {}
  for (const row of (data ?? []) as Array<{ item_id: string; user_id: string }>) {
    const t = (tallies[row.item_id] ??= { count: 0, mine: false })
    t.count += 1
    if (row.user_id === userData.user.id) t.mine = true
  }
  return NextResponse.json({ tallies })
}

/** POST /api/item-votes — 현재 사용자의 항목 투표 토글. body: { itemId, tripId }. */
export async function POST(request: NextRequest) {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  const body = await request.json()
  const itemId = body.itemId
  const tripId = body.tripId
  if (!itemId || !tripId || typeof itemId !== 'string' || typeof tripId !== 'string') {
    return NextResponse.json({ error: 'itemId·tripId가 필요합니다.' }, { status: 400 })
  }

  const userId = userData.user.id
  const { data: existing } = await client
    .from('item_votes')
    .select('item_id')
    .eq('item_id', itemId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await client
      .from('item_votes')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', userId)
    // RLS 위반(viewer 등)은 권한 없음으로 반환.
    if (error) return NextResponse.json({ error: '투표 권한이 없습니다.' }, { status: 403 })
    return NextResponse.json({ voted: false })
  }

  const { error } = await client
    .from('item_votes')
    .insert({ item_id: itemId, trip_id: tripId, user_id: userId })
  if (error) return NextResponse.json({ error: '투표 권한이 없습니다.' }, { status: 403 })
  return NextResponse.json({ voted: true })
}
