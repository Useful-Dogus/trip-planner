import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { isCurrencyCode } from '@/lib/currency'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sanitizeText(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t : null
}

function sanitizeDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

const FIELD_KEYS = ['title', 'start_date', 'end_date', 'region', 'basecamp_address'] as const

function sanitizeLat(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90 ? v : null
}

function sanitizeLng(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180 ? v : null
}

function sanitizeZoom(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 20 ? Math.round(v) : null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tripId: string } },
) {
  const { tripId } = params
  if (!UUID_RE.test(tripId)) {
    return NextResponse.json({ error: '잘못된 trip id' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청 본문' }, { status: 400 })
  }

  const patch: Record<string, string | number | null> = {}

  if ('center_lat' in body || 'center_lng' in body || 'default_zoom' in body || 'center_source' in body) {
    const lat = sanitizeLat(body.center_lat)
    const lng = sanitizeLng(body.center_lng)
    // 좌표는 lat·lng 가 둘 다 유효할 때만 저장. 하나라도 null 이면 좌표 전체를 비운다.
    if (lat !== null && lng !== null) {
      patch.center_lat = lat
      patch.center_lng = lng
      patch.default_zoom = sanitizeZoom(body.default_zoom)
      patch.center_source = body.center_source === 'manual' ? 'manual' : 'auto'
    } else {
      patch.center_lat = null
      patch.center_lng = null
      patch.default_zoom = null
      patch.center_source = null
    }
  }

  if ('currency' in body) {
    if (!isCurrencyCode(body.currency)) {
      return NextResponse.json({ error: '지원하지 않는 통화 코드' }, { status: 400 })
    }
    patch.currency = body.currency
  }

  for (const key of FIELD_KEYS) {
    if (!(key in body)) continue
    const raw = body[key]
    if (raw === null) {
      patch[key] = null
      continue
    }
    if (key === 'start_date' || key === 'end_date') {
      const d = sanitizeDate(raw)
      if (!d) {
        return NextResponse.json(
          { error: `${key} 는 YYYY-MM-DD 형식이어야 합니다.` },
          { status: 400 },
        )
      }
      patch[key] = d
    } else {
      const t = sanitizeText(raw)
      if (key === 'title' && !t) {
        return NextResponse.json({ error: '제목은 비울 수 없습니다.' }, { status: 400 })
      }
      patch[key] = t
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 필드가 없습니다.' }, { status: 400 })
  }

  const start = patch.start_date ?? null
  const end = patch.end_date ?? null
  if (start && end && end < start) {
    return NextResponse.json(
      { error: '종료일은 시작일보다 빠를 수 없습니다.' },
      { status: 400 },
    )
  }

  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await client
    .from('trips')
    .update(patch)
    .eq('id', tripId)
    .select('id, title, start_date, end_date, region, basecamp_address, center_lat, center_lng, default_zoom, center_source, currency')
    .maybeSingle()

  if (error) {
    console.error('[PATCH /api/trips/:id]', error)
    return NextResponse.json({ error: '여행 수정에 실패했습니다.' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: '권한이 없거나 trip 을 찾을 수 없습니다.' }, { status: 403 })
  }

  return NextResponse.json({ trip: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { tripId: string } },
) {
  const { tripId } = params
  if (!UUID_RE.test(tripId)) {
    return NextResponse.json({ error: '잘못된 trip id' }, { status: 400 })
  }

  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await client
    .from('trips')
    .delete()
    .eq('id', tripId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[DELETE /api/trips/:id]', error)
    return NextResponse.json({ error: '여행 삭제에 실패했습니다.' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json(
      { error: '권한이 없거나 trip 을 찾을 수 없습니다 (소유자만 삭제 가능).' },
      { status: 403 },
    )
  }

  return NextResponse.json({ ok: true })
}
