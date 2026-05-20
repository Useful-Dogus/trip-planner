import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

function sanitizeText(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t : null
}

function sanitizeDate(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const title = sanitizeText(body?.title) ?? '새 여행'
    const startDate = sanitizeDate(body?.start_date)
    const endDate = sanitizeDate(body?.end_date)
    const region = sanitizeText(body?.region)
    const basecamp = sanitizeText(body?.basecamp_address)

    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json(
        { error: '종료일은 시작일보다 빠를 수 없습니다.' },
        { status: 400 },
      )
    }

    const client = createRouteHandlerSupabase()
    const { data: tripId, error } = await client.rpc('create_trip_v2', {
      p_title: title,
      p_start_date: startDate,
      p_end_date: endDate,
      p_region: region,
      p_basecamp_address: basecamp,
    })
    if (error) {
      console.error('[POST /api/trips] create_trip_v2 failed:', error)
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
