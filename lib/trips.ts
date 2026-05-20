import type { SupabaseClient } from '@supabase/supabase-js'

export type TripSummary = {
  id: string
  title: string
  created_at: string
  itemCount: number
}

export async function listUserTrips(client: SupabaseClient): Promise<TripSummary[]> {
  const { data: trips, error } = await client
    .from('trips')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = (trips ?? []) as Array<{ id: string; title: string; created_at: string }>

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
    itemCount: counts.get(t.id) ?? 0,
  }))
}
