import { NextResponse } from 'next/server'
import { resolveListId, GmapsResolverError } from '@/services/gmaps/resolver'
import { fetchListPage, GmapsFetcherError } from '@/services/gmaps/fetcher'
import { parseListPage, GmapsParserError } from '@/services/gmaps/parser'
import { matchCandidates } from '@/services/gmaps/matcher'
import { readItems } from '@/lib/data'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { getUserRole } from '@/lib/trip'
import type { ImportCandidate } from '@/types'
import { mapGoogleCategory } from '@/services/gmaps/categoryMap'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, tripId: bodyTripId } = body as { url?: string; tripId?: string }

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { error: 'INVALID_URL', message: '올바른 구글맵 리스트 URL을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 중복검사는 "지금 보고 있는 trip" 의 항목과 비교해야 한다.
    // tripId 누락 시 ensureActiveTrip("첫 trip")으로 새는 import 버그의 read 짝.
    const tripId = bodyTripId && bodyTripId.trim()
    if (!tripId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '대상 여행이 지정되지 않았습니다.' },
        { status: 400 }
      )
    }
    const supabase = createRouteHandlerSupabase()
    const role = await getUserRole(supabase, tripId)
    if (!role) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: '이 여행에 접근할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 1. URL 해석 → list ID
    const listId = await resolveListId(url.trim())

    // 2. 리스트 페이지 fetch
    const html = await fetchListPage(listId)

    // 3. HTML 파싱 → GooglePlace[]
    const places = parseListPage(html)

    if (places.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    // 4. 기존 items 조회 후 중복/유사 분류 (현재 trip 기준)
    const existingItems = await readItems(supabase, tripId)
    const candidates: ImportCandidate[] = matchCandidates(places, existingItems).map(c => ({
      ...c,
      mappedCategory: c.mappedCategory ?? mapGoogleCategory(c.place.googleCategory),
    }))

    return NextResponse.json({ candidates })
  } catch (err) {
    if (err instanceof GmapsResolverError) {
      const status = err.code === 'INVALID_URL' ? 400 : err.code === 'PRIVATE_LIST' ? 403 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    if (err instanceof GmapsFetcherError) {
      const status = err.code === 'PRIVATE_LIST' ? 403 : 500
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    if (err instanceof GmapsParserError) {
      return NextResponse.json(
        { error: 'PARSE_ERROR', message: err.message },
        { status: 500 }
      )
    }

    console.error('[gmaps/preview] unexpected error:', err)
    return NextResponse.json(
      { error: 'NETWORK_ERROR', message: '장소 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
