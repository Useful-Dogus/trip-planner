import { NextRequest, NextResponse } from 'next/server'
import { readItems, writeItems } from '@/lib/data'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { v4 as uuidv4 } from 'uuid'
import type { TripItem, Category, TripPriority, Link, ReservationStatus, Satisfaction } from '@/types'
import {
  CATEGORY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  TRIP_PRIORITY_OPTIONS,
  SATISFACTION_OPTIONS,
} from '@/lib/itemOptions'
import {
  fetchTripBounds,
  formatBoundsLabel,
  isDateWithinBounds,
  type TripBounds,
} from '@/lib/trips'

function validateItem(body: Record<string, unknown>, bounds: TripBounds | null): string | null {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return 'name은 필수입니다.'
  }
  if (body.category !== undefined && !CATEGORY_OPTIONS.includes(body.category as Category)) {
    return '유효하지 않은 category입니다.'
  }
  if (body.trip_priority !== undefined && !TRIP_PRIORITY_OPTIONS.includes(body.trip_priority as TripPriority)) {
    return '유효하지 않은 trip_priority입니다.'
  }
  if (
    body.reservation_status !== undefined &&
    body.reservation_status !== null &&
    !RESERVATION_STATUS_OPTIONS.includes(body.reservation_status as ReservationStatus)
  ) {
    return '유효하지 않은 reservation_status입니다.'
  }
  if (body.budget !== undefined && body.budget !== null && (typeof body.budget !== 'number' || body.budget < 0)) {
    return 'budget은 0 이상의 숫자여야 합니다.'
  }
  if (
    body.decision_reason !== undefined &&
    body.decision_reason !== null &&
    (typeof body.decision_reason !== 'string' || (body.decision_reason as string).length > 200)
  ) {
    return 'decision_reason은 200자 이하의 문자열이어야 합니다.'
  }
  if (
    body.satisfaction !== undefined &&
    body.satisfaction !== null &&
    !SATISFACTION_OPTIONS.includes(body.satisfaction as Satisfaction)
  ) {
    return '유효하지 않은 satisfaction입니다.'
  }
  if (body.date !== undefined && body.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.date as string)) {
    return 'date는 YYYY-MM-DD 형식이어야 합니다.'
  }
  if (
    body.date !== undefined &&
    body.date !== null &&
    !isDateWithinBounds(body.date as string, bounds)
  ) {
    return `date는 여행 기간(${formatBoundsLabel(bounds)}) 내여야 합니다.`
  }
  if (
    body.end_date !== undefined &&
    body.end_date !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(body.end_date as string)
  ) {
    return 'end_date는 YYYY-MM-DD 형식이어야 합니다.'
  }
  if (
    body.end_date !== undefined &&
    body.end_date !== null &&
    !isDateWithinBounds(body.end_date as string, bounds)
  ) {
    return `end_date는 여행 기간(${formatBoundsLabel(bounds)}) 내여야 합니다.`
  }
  if (
    body.date !== undefined &&
    body.date !== null &&
    body.end_date !== undefined &&
    body.end_date !== null &&
    (body.end_date as string) < (body.date as string)
  ) {
    return 'end_date는 시작 날짜보다 빠를 수 없습니다.'
  }
  if (body.time_start !== undefined && !/^\d{2}:\d{2}$/.test(body.time_start as string)) {
    return 'time_start는 HH:MM 형식이어야 합니다.'
  }
  if (
    body.time_end !== undefined &&
    body.time_end !== null &&
    !/^\d{2}:\d{2}$/.test(body.time_end as string)
  ) {
    return 'time_end는 HH:MM 형식이어야 합니다.'
  }
  if (body.time_start !== undefined && body.time_start !== null && !body.date) {
    return 'time_start를 입력하려면 시작 날짜가 필요합니다.'
  }
  if (body.time_end !== undefined && body.time_end !== null && !body.end_date) {
    return 'time_end를 입력하려면 종료 날짜가 필요합니다.'
  }
  if (body.lat !== undefined && (typeof body.lat !== 'number' || body.lat < -90 || body.lat > 90)) {
    return 'lat은 -90~90 사이의 숫자여야 합니다.'
  }
  if (body.lng !== undefined && (typeof body.lng !== 'number' || body.lng < -180 || body.lng > 180)) {
    return 'lng은 -180~180 사이의 숫자여야 합니다.'
  }
  return null
}

function getTripIdFromRequest(request: NextRequest): string | null {
  const v = request.nextUrl.searchParams.get('tripId')
  return v && v.trim() ? v : null
}

export async function GET(request: NextRequest) {
  try {
    const client = createRouteHandlerSupabase()
    const tripId = getTripIdFromRequest(request)
    if (!tripId) {
      return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
    }
    const items = await readItems(client, tripId)
    return NextResponse.json({ items })
  } catch (e) {
    const err = e as { message?: string; code?: string; details?: string; hint?: string }
    console.error('[GET /api/items] failed:', {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    })
    return NextResponse.json(
      { error: '항목을 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const client = createRouteHandlerSupabase()
  const tripId = getTripIdFromRequest(request)
  if (!tripId) {
    return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
  }
  const bounds = await fetchTripBounds(client, tripId)

  const error = validateItem(body, bounds)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const now = new Date().toISOString()
  const item: TripItem = {
    id: uuidv4(),
    name: (body.name as string).trim(),
    category: (body.category as Category | undefined) ?? '기타',
    trip_priority: (body.trip_priority as TripPriority | undefined) ?? '검토 필요',
    reservation_status: (body.reservation_status as ReservationStatus | null | undefined) ?? null,
    links: (body.links as Link[]) ?? [],
    created_at: now,
    updated_at: now,
  }

  if (body.address !== undefined) item.address = body.address as string
  if (body.lat !== undefined) item.lat = body.lat as number
  if (body.lng !== undefined) item.lng = body.lng as number
  if (body.budget !== undefined) item.budget = body.budget as number
  if (body.memo !== undefined) item.memo = body.memo as string
  if (body.decision_reason !== undefined) item.decision_reason = body.decision_reason as string | null
  if (body.satisfaction !== undefined) item.satisfaction = body.satisfaction as Satisfaction | null
  if (body.date !== undefined) item.date = body.date as string
  if (body.end_date !== undefined && body.end_date !== null) item.end_date = body.end_date as string
  if (body.time_start !== undefined) item.time_start = body.time_start as string
  if (body.time_end !== undefined && body.time_end !== null) item.time_end = body.time_end as string

  const items = await readItems(client, tripId)
  items.push(item)
  await writeItems(client, items, tripId)

  return NextResponse.json({ item }, { status: 201 })
}
