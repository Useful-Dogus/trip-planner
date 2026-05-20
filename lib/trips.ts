import type { SupabaseClient } from '@supabase/supabase-js'

export type TripBounds = {
  start: string | null
  end: string | null
}

/**
 * 주어진 trip 의 시작·종료일을 조회한다. RLS 가 멤버 권한을 검증.
 * 둘 다 null 이면 검증 생략 의미.
 */
export async function fetchTripBounds(
  client: SupabaseClient,
  tripId: string,
): Promise<TripBounds | null> {
  const { data, error } = await client
    .from('trips')
    .select('start_date, end_date')
    .eq('id', tripId)
    .maybeSingle()
  if (error || !data) return null
  return { start: data.start_date as string | null, end: data.end_date as string | null }
}

export function isDateWithinBounds(date: string, bounds: TripBounds | null): boolean {
  if (!bounds) return true
  if (bounds.start && date < bounds.start) return false
  if (bounds.end && date > bounds.end) return false
  return true
}

export function formatBoundsLabel(bounds: TripBounds | null): string {
  if (!bounds || (!bounds.start && !bounds.end)) return '기간이 설정되지 않은 여행'
  const start = bounds.start ?? '~'
  const end = bounds.end ?? '~'
  return `${start} ~ ${end}`
}

export type TripSummary = {
  id: string
  title: string
  created_at: string
  start_date: string | null
  end_date: string | null
  region: string | null
  basecamp_address: string | null
  itemCount: number
}

export async function listUserTrips(client: SupabaseClient): Promise<TripSummary[]> {
  const { data: trips, error } = await client
    .from('trips')
    .select('id, title, created_at, start_date, end_date, region, basecamp_address')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (trips ?? []) as Array<{
    id: string
    title: string
    created_at: string
    start_date: string | null
    end_date: string | null
    region: string | null
    basecamp_address: string | null
  }>

  if (rows.length === 0) return []

  const ids = rows.map(t => t.id)
  const { data: items, error: itemsErr } = await client
    .from('items')
    .select('trip_id')
    .in('trip_id', ids)
  if (itemsErr) throw itemsErr

  const counts = new Map<string, number>()
  for (const row of (items ?? []) as Array<{ trip_id: string }>) {
    counts.set(row.trip_id, (counts.get(row.trip_id) ?? 0) + 1)
  }

  return rows.map(t => ({
    id: t.id,
    title: t.title,
    created_at: t.created_at,
    start_date: t.start_date,
    end_date: t.end_date,
    region: t.region,
    basecamp_address: t.basecamp_address,
    itemCount: counts.get(t.id) ?? 0,
  }))
}
