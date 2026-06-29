import { NextRequest, NextResponse } from 'next/server'
import { readItems, writeItems } from '@/lib/data'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import type { Category, TripPriority, ReservationStatus, Satisfaction } from '@/types'
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
import { isValidOpeningHours, isValidClosedDays } from '@/lib/itemValidation'
import { normalizeTimeField } from '@/lib/timeInput'

function validatePartial(body: Record<string, unknown>, bounds: TripBounds | null): string | null {
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    return 'name은 비워둘 수 없습니다.'
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
  if (
    body.last_entry_time !== undefined &&
    body.last_entry_time !== null &&
    !/^\d{2}:\d{2}$/.test(body.last_entry_time as string)
  ) {
    return 'last_entry_time는 HH:MM 형식이어야 합니다.'
  }
  if (
    body.reservation_deadline !== undefined &&
    body.reservation_deadline !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(body.reservation_deadline as string)
  ) {
    return 'reservation_deadline는 YYYY-MM-DD 형식이어야 합니다.'
  }
  if (body.opening_hours !== undefined && body.opening_hours !== null && !isValidOpeningHours(body.opening_hours)) {
    return 'opening_hours는 {open:"HH:MM", close:"HH:MM"} 형식이어야 합니다.'
  }
  if (body.closed_days !== undefined && body.closed_days !== null && !isValidClosedDays(body.closed_days)) {
    return 'closed_days는 0-6 정수 배열이어야 합니다.'
  }
  if (
    body.date !== undefined &&
    body.date !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date as string)
  ) {
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
  const timeStartError = normalizeTimeField(body, 'time_start')
  if (timeStartError) return timeStartError
  const timeEndError = normalizeTimeField(body, 'time_end')
  if (timeEndError) return timeEndError
  return null
}

type RouteContext = { params: { id: string } }

function getTripIdFromRequest(request: NextRequest): string | null {
  const v = request.nextUrl.searchParams.get('tripId')
  return v && v.trim() ? v : null
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const client = createRouteHandlerSupabase()
  const tripId = getTripIdFromRequest(request)
  if (!tripId) {
    return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
  }
  const items = await readItems(client, tripId)
  const item = items.find(i => i.id === params.id)
  if (!item) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }
  return NextResponse.json({ item })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const client = createRouteHandlerSupabase()
  const tripId = getTripIdFromRequest(request)
  if (!tripId) {
    return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
  }
  const items = await readItems(client, tripId)
  const idx = items.findIndex(i => i.id === params.id)
  if (idx === -1) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }

  const bounds = await fetchTripBounds(client, tripId)
  const body = await request.json()
  const error = validatePartial(body, bounds)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const updated = {
    ...items[idx],
    ...body,
    id: items[idx].id,
    created_at: items[idx].created_at,
    updated_at: new Date().toISOString(),
  }

  if (updated.time_start && !updated.date) {
    return NextResponse.json({ error: 'time_start를 입력하려면 시작 날짜가 필요합니다.' }, { status: 400 })
  }
  if (updated.time_end && !updated.end_date) {
    return NextResponse.json({ error: 'time_end를 입력하려면 종료 날짜가 필요합니다.' }, { status: 400 })
  }

  items[idx] = updated
  await writeItems(client, items, tripId)

  return NextResponse.json({ item: updated })
}

/** @deprecated PUT 은 호환용 alias. 신규 호출은 PATCH 사용. 다음 메이저에서 제거 예정. */
export const PUT = PATCH

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const client = createRouteHandlerSupabase()
  const tripId = getTripIdFromRequest(request)
  if (!tripId) {
    return NextResponse.json({ error: '대상 여행이 지정되지 않았습니다.' }, { status: 400 })
  }
  const items = await readItems(client, tripId)
  const idx = items.findIndex(i => i.id === params.id)
  if (idx === -1) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }

  items.splice(idx, 1)
  await writeItems(client, items, tripId)

  return NextResponse.json({ ok: true })
}
