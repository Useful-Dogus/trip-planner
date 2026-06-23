import type { SupabaseClient } from '@supabase/supabase-js'
import type { TripItem } from '@/types'
import {
  normalizeTripPriority,
  normalizeReservationStatus,
  normalizeTripItem,
  normalizeCategory,
} from '@/lib/itemOptions'
type Client = SupabaseClient

// tripId 는 반드시 호출자가 명시한다. 예전엔 누락 시 ensureActiveTrip("첫 trip")으로
// 폴백했는데, 그게 사용자가 보고 있는 trip 과 달라 다른 trip 으로 항목이 새는 버그의
// 근원이었다(gmaps import/preview, items CRUD). 누락은 조용히 추측하지 않고 막는다.
function resolveTripId(tripId?: string | null): string {
  if (tripId && tripId.trim()) return tripId
  throw new Error('readItems/writeItems 에는 tripId 가 반드시 필요합니다.')
}

export async function readItems(client: Client, tripId?: string | null): Promise<TripItem[]> {
  const resolvedTripId = resolveTripId(tripId)
  const { data, error } = await client
    .from('items')
    .select('*')
    .eq('trip_id', resolvedTripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  const normalized = (data ?? []).map(rowToItem).map(normalizeTripItem)
  const items = normalized.map(entry => entry.item)
  if (normalized.some(entry => entry.changed)) {
    await writeItems(client, items, resolvedTripId)
  }
  return items
}

export async function writeItems(
  client: Client,
  items: TripItem[],
  tripId?: string | null,
): Promise<void> {
  items.forEach(validateItem)
  const resolvedTripId = resolveTripId(tripId)

  const { data: existing, error: fetchError } = await client
    .from('items')
    .select('id')
    .eq('trip_id', resolvedTripId)
  if (fetchError) throw fetchError

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const incomingIds = new Set(items.map(i => i.id))

  const toDelete = Array.from(existingIds).filter(id => !incomingIds.has(id))
  const toUpsert = items.map(item => itemToRow(item, resolvedTripId))

  if (toDelete.length > 0) {
    const { error } = await client
      .from('items')
      .delete()
      .eq('trip_id', resolvedTripId)
      .in('id', toDelete)
    if (error) throw error
  }

  if (toUpsert.length > 0) {
    const { error } = await client.from('items').upsert(toUpsert)
    if (error) throw error
  }
}

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
    decision_reason: (row.decision_reason as string) ?? null,
    satisfaction: (row.satisfaction as TripItem['satisfaction']) ?? null,
    date: (row.date as string) ?? undefined,
    end_date: (row.end_date as string) ?? undefined,
    time_start: (row.time_start as string) ?? undefined,
    time_end: (row.time_end as string) ?? undefined,
    last_entry_time: (row.last_entry_time as string) ?? null,
    reservation_deadline: (row.reservation_deadline as string) ?? null,
    opening_hours: (row.opening_hours as TripItem['opening_hours']) ?? null,
    closed_days: (row.closed_days as TripItem['closed_days']) ?? null,
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

function itemToRow(item: TripItem, tripId: string): Record<string, unknown> {
  return {
    id: item.id,
    trip_id: tripId,
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
    decision_reason: item.decision_reason ?? null,
    satisfaction: item.satisfaction ?? null,
    date: item.date ?? null,
    end_date: item.end_date ?? null,
    time_start: item.time_start ?? null,
    time_end: item.time_end ?? null,
    last_entry_time: item.last_entry_time ?? null,
    reservation_deadline: item.reservation_deadline ?? null,
    opening_hours: item.opening_hours ?? null,
    closed_days: item.closed_days ?? null,
    google_place_id: item.google_place_id ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}
