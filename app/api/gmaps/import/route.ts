import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { mapGoogleCategory } from '@/services/gmaps/categoryMap'
import type { GooglePlace, TripItem } from '@/types'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { ensureActiveTrip } from '@/lib/trip'
import { reverseGeocode } from '@/lib/geocode'

// "34°39'53.7\"N 135°29'58.3\"E" 또는 "34.123, 135.456" 같이 좌표 자체가 이름인 경우를 감지.
const DMS_RE = /\d+°\d+['′]/
const DECIMAL_COORD_RE = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/

function isCoordinateName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return true
  if (DMS_RE.test(trimmed)) return true
  if (DECIMAL_COORD_RE.test(trimmed)) return true
  return false
}

async function resolvePinName(
  place: GooglePlace,
  regionLabel: string | null,
  fallbackIndex: number,
): Promise<string> {
  if (!isCoordinateName(place.name)) return place.name

  // 1차: reverse geocode
  if (typeof place.lat === 'number' && typeof place.lng === 'number') {
    try {
      const result = await reverseGeocode(place.lat, place.lng)
      if (result?.address) {
        // 너무 긴 address 는 앞 2-3 토큰만.
        const parts = result.address.split(',').map(s => s.trim()).filter(Boolean)
        const short = parts.slice(0, 2).join(', ')
        if (short) return `📍 ${short}`
      }
    } catch {
      // ignore
    }
  }

  // 2차: region 폴백
  if (regionLabel?.trim()) return `📍 핀 (${regionLabel.trim()} 근처)`

  // 3차: 순번
  return `📍 저장한 장소 ${fallbackIndex + 1}`
}

function placeToItem(
  place: GooglePlace,
  categoryOverride?: string
): Omit<TripItem, 'created_at' | 'updated_at'> & { created_at: string; updated_at: string } {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    name: place.name,
    category:
      (categoryOverride as TripItem['category']) ??
      mapGoogleCategory(place.googleCategory),
    trip_priority: '검토 필요',
    reservation_status: '확인 필요',
    address: place.address ?? undefined,
    lat: place.lat ?? undefined,
    lng: place.lng ?? undefined,
    links: [],
    budget: undefined,
    memo: undefined,
    date: undefined,
    end_date: undefined,
    time_start: undefined,
    time_end: undefined,
    google_place_id: place.googlePlaceId ?? null,
    created_at: now,
    updated_at: now,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      places,
      categoryOverrides = {},
    } = body as {
      places?: GooglePlace[]
      categoryOverrides?: Record<string, string>
    }

    if (!places || !Array.isArray(places) || places.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '추가할 장소가 없습니다.' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerSupabase()
    const queryTripId = request.nextUrl.searchParams.get('tripId')
    const tripId = queryTripId && queryTripId.trim()
      ? queryTripId
      : await ensureActiveTrip(supabase)

    // trip region 을 한 번 fetch — 좌표만 있는 핀의 폴백 라벨에 사용.
    const { data: tripRow } = await supabase
      .from('trips')
      .select('region')
      .eq('id', tripId)
      .maybeSingle<{ region: string | null }>()
    const regionLabel = tripRow?.region ?? null

    // 좌표만 있는 핀의 이름을 reverse geocode → region 폴백 → 순번 으로 정규화.
    const resolvedPlaces = await Promise.all(
      places.map(async (p, idx) => ({
        ...p,
        name: await resolvePinName(p, regionLabel, idx),
      })),
    )

    const rows = resolvedPlaces.map(p => {
      const override = p.googlePlaceId ? categoryOverrides[p.googlePlaceId] : undefined
      const item = placeToItem(p, override)
      return {
        id: item.id,
        trip_id: tripId,
        name: item.name,
        category: item.category,
        status: item.trip_priority,
        reservation_status: item.reservation_status,
        priority: null,
        address: item.address ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        links: [],
        budget: null,
        memo: null,
        date: null,
        end_date: null,
        time_start: null,
        time_end: null,
        google_place_id: item.google_place_id ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
    })

    const { data: insertedRows, error } = await supabase.from('items').insert(rows).select('id')

    if (error) {
      console.error('[gmaps/import] supabase error:', error)
      return NextResponse.json(
        { error: 'INSERT_FAILED', message: '일부 장소를 저장하는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const insertedIds = (insertedRows ?? []).map((r: { id: string }) => r.id)
    return NextResponse.json({ inserted: insertedIds.length, ids: insertedIds }, { status: 201 })
  } catch (err) {
    console.error('[gmaps/import] unexpected error:', err)
    return NextResponse.json(
      { error: 'INSERT_FAILED', message: '장소를 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
