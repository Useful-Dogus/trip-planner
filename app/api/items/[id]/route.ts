import { NextRequest, NextResponse } from 'next/server'
import { readItems, writeItems } from '@/lib/data'
import type { Category, TripPriority, ReservationStatus } from '@/types'
import {
  CATEGORY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  TRIP_PRIORITY_OPTIONS,
  TRIP_DATE_MAX,
  TRIP_DATE_MIN,
} from '@/lib/itemOptions'

function validatePartial(body: Record<string, unknown>): string | null {
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
  if (body.budget !== undefined && (typeof body.budget !== 'number' || body.budget < 0)) {
    return 'budget은 0 이상의 숫자여야 합니다.'
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
    ((body.date as string) < TRIP_DATE_MIN || (body.date as string) > TRIP_DATE_MAX)
  ) {
    return 'date는 2026-07-01부터 2026-07-31 사이여야 합니다.'
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
    ((body.end_date as string) < TRIP_DATE_MIN || (body.end_date as string) > TRIP_DATE_MAX)
  ) {
    return 'end_date는 2026-07-01부터 2026-07-31 사이여야 합니다.'
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
  if (
    body.time_start !== undefined &&
    body.time_start !== null &&
    !/^\d{2}:\d{2}$/.test(body.time_start as string)
  ) {
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
  return null
}

type RouteContext = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const items = await readItems()
  const item = items.find(i => i.id === params.id)
  if (!item) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }
  return NextResponse.json({ item })
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const items = await readItems()
  const idx = items.findIndex(i => i.id === params.id)
  if (idx === -1) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }

  const body = await request.json()
  const error = validatePartial(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const updated = {
    ...items[idx],
    ...body,
    id: items[idx].id,
    created_at: items[idx].created_at,
    updated_at: new Date().toISOString(),
  }

  items[idx] = updated
  await writeItems(items)

  return NextResponse.json({ item: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const items = await readItems()
  const idx = items.findIndex(i => i.id === params.id)
  if (idx === -1) {
    return NextResponse.json({ error: '항목을 찾을 수 없습니다.' }, { status: 404 })
  }

  items.splice(idx, 1)
  await writeItems(items)

  return NextResponse.json({ ok: true })
}
