import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { mapGoogleCategory } from '@/services/gmaps/categoryMap'
import type { GooglePlace, TripItem } from '@/types'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set')
  return createClient(url, key)
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

export async function POST(request: Request) {
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

    const rows = places.map(p => {
      const override = p.googlePlaceId ? categoryOverrides[p.googlePlaceId] : undefined
      const item = placeToItem(p, override)
      return {
        id: item.id,
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

    const supabase = getSupabaseClient()
    const { error } = await supabase.from('items').insert(rows)

    if (error) {
      console.error('[gmaps/import] supabase error:', error)
      return NextResponse.json(
        { error: 'INSERT_FAILED', message: '일부 장소를 저장하는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ inserted: rows.length }, { status: 201 })
  } catch (err) {
    console.error('[gmaps/import] unexpected error:', err)
    return NextResponse.json(
      { error: 'INSERT_FAILED', message: '장소를 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
