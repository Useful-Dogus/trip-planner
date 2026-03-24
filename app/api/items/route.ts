import { NextRequest, NextResponse } from 'next/server'
import { readItems, writeItems } from '@/lib/data'
import { v4 as uuidv4 } from 'uuid'
import type { TripItem, Category, Status, Priority, Link } from '@/types'

const CATEGORIES: Category[] = ['교통', '숙소', '식당', '관광', '쇼핑', '기타']
const STATUSES: Status[] = ['검토중', '보류', '대기중', '확정', '탈락']
const PRIORITIES: Priority[] = ['반드시', '들를만해', '시간 남으면']

function validateItem(body: Record<string, unknown>): string | null {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return 'name은 필수입니다.'
  }
  if (!CATEGORIES.includes(body.category as Category)) {
    return '유효하지 않은 category입니다.'
  }
  if (!STATUSES.includes(body.status as Status)) {
    return '유효하지 않은 status입니다.'
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority as Priority)) {
    return '유효하지 않은 priority입니다.'
  }
  if (body.budget !== undefined && (typeof body.budget !== 'number' || body.budget < 0)) {
    return 'budget은 0 이상의 숫자여야 합니다.'
  }
  if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date as string)) {
    return 'date는 YYYY-MM-DD 형식이어야 합니다.'
  }
  if (body.time_start !== undefined && !/^\d{2}:\d{2}$/.test(body.time_start as string)) {
    return 'time_start는 HH:MM 형식이어야 합니다.'
  }
  if (body.lat !== undefined && (typeof body.lat !== 'number' || body.lat < -90 || body.lat > 90)) {
    return 'lat은 -90~90 사이의 숫자여야 합니다.'
  }
  if (body.lng !== undefined && (typeof body.lng !== 'number' || body.lng < -180 || body.lng > 180)) {
    return 'lng은 -180~180 사이의 숫자여야 합니다.'
  }
  return null
}

export async function GET() {
  const items = await readItems()
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const error = validateItem(body)
  if (error) return NextResponse.json({ error }, { status: 400 })

  const now = new Date().toISOString()
  const item: TripItem = {
    id: uuidv4(),
    name: (body.name as string).trim(),
    category: body.category as Category,
    status: body.status as Status,
    links: (body.links as Link[]) ?? [],
    created_at: now,
    updated_at: now,
  }

  if (body.priority !== undefined) item.priority = body.priority as Priority
  if (body.address !== undefined) item.address = body.address as string
  if (body.lat !== undefined) item.lat = body.lat as number
  if (body.lng !== undefined) item.lng = body.lng as number
  if (body.budget !== undefined) item.budget = body.budget as number
  if (body.memo !== undefined) item.memo = body.memo as string
  if (body.date !== undefined) item.date = body.date as string
  if (body.time_start !== undefined) item.time_start = body.time_start as string

  const items = await readItems()
  items.push(item)
  await writeItems(items)

  return NextResponse.json({ item }, { status: 201 })
}
