import { createClient } from '@supabase/supabase-js'
import type { TripItem } from '@/types'
import {
  normalizeTripPriority,
  normalizeReservationStatus,
  normalizeTripItem,
  normalizeCategory,
} from '@/lib/itemOptions'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  }
  return createClient(url, key)
}

export async function readItems(): Promise<TripItem[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  const normalized = (data ?? []).map(rowToItem).map(normalizeTripItem)
  const items = normalized.map(entry => entry.item)
  if (normalized.some(entry => entry.changed)) {
    await writeItems(items)
  }
  return items
}

export async function writeItems(items: TripItem[]): Promise<void> {
  items.forEach(validateItem)
  const supabase = getSupabaseClient()

  const { data: existing, error: fetchError } = await supabase.from('items').select('id')
  if (fetchError) throw fetchError

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const incomingIds = new Set(items.map(i => i.id))

  const toDelete = Array.from(existingIds).filter(id => !incomingIds.has(id))
  const toUpsert = items.map(itemToRow)

  if (toDelete.length > 0) {
    const { error } = await supabase.from('items').delete().in('id', toDelete)
    if (error) throw error
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase.from('items').upsert(toUpsert)
    if (error) throw error
  }
}

// DB row → TripItem
// DB의 status 컬럼에 trip_priority 값이 저장된다.
// DB의 priority 컬럼은 deprecated (null로 유지).
// 구 status/priority 값이 있는 경우 normalizeTripPriority가 마이그레이션 처리.
function rowToItem(row: Record<string, unknown>): TripItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: normalizeCategory(row.category),
    trip_priority: normalizeTripPriority(row.status, row.priority),
    reservation_status: normalizeReservationStatus(row.reservation_status) ?? null,
    address: (row.address as string) ?? undefined,
    lat: (row.lat as number) ?? undefined,
    lng: (row.lng as number) ?? undefined,
    links: (row.links as TripItem['links']) ?? [],
    budget: (row.budget as number) ?? undefined,
    memo: (row.memo as string) ?? undefined,
    date: (row.date as string) ?? undefined,
    end_date: (row.end_date as string) ?? undefined,
    time_start: (row.time_start as string) ?? undefined,
    time_end: (row.time_end as string) ?? undefined,
    google_place_id: (row.google_place_id as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function validateItem(item: TripItem): void {
  if (!item.id || !item.name || !item.category || !item.trip_priority) {
    throw new Error(`Invalid item: ${JSON.stringify(item)}`)
  }
}

// TripItem → DB row
// trip_priority는 DB의 status 컬럼에 저장한다.
// priority 컬럼은 null로 저장 (deprecated).
function itemToRow(item: TripItem): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    status: item.trip_priority,
    reservation_status: item.reservation_status ?? null,
    priority: null,
    address: item.address ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    links: item.links,
    budget: item.budget ?? null,
    memo: item.memo ?? null,
    date: item.date ?? null,
    end_date: item.end_date ?? null,
    time_start: item.time_start ?? null,
    time_end: item.time_end ?? null,
    google_place_id: item.google_place_id ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}
