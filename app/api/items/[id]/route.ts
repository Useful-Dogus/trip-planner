import { NextRequest, NextResponse } from 'next/server'
import { readItems, writeItems } from '@/lib/data'
import type { Category, Priority, ReservationStatus, Status } from '@/types'
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/itemOptions'

function validatePartial(body: Record<string, unknown>): string | null {
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    return 'name은 비워둘 수 없습니다.'
  }
  if (body.category !== undefined && !CATEGORY_OPTIONS.includes(body.category as Category)) {
    return '유효하지 않은 category입니다.'
  }
  if (body.status !== undefined && !STATUS_OPTIONS.includes(body.status as Status)) {
    return '유효하지 않은 status입니다.'
  }
  if (
    body.reservation_status !== undefined &&
    body.reservation_status !== null &&
    !RESERVATION_STATUS_OPTIONS.includes(body.reservation_status as ReservationStatus)
  ) {
    return '유효하지 않은 reservation_status입니다.'
  }
  if (
    body.priority !== undefined &&
    body.priority !== null &&
    !PRIORITY_OPTIONS.includes(body.priority as Priority)
  ) {
    return '유효하지 않은 priority입니다.'
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
  if (body.priority === null) {
    delete updated.priority
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
