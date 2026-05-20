import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

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

  const patch: Record<string, string | null> = {}
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
    .select('id, title, start_date, end_date, region, basecamp_address')
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
