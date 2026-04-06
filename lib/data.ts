import { createClient } from '@supabase/supabase-js'
import type { TripItem } from '@/types'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set')
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
  return (data ?? []).map(rowToItem)
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
function rowToItem(row: Record<string, unknown>): TripItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as TripItem['category'],
    status: row.status as TripItem['status'],
    priority: (row.priority ?? undefined) as TripItem['priority'],
    address: (row.address as string) ?? undefined,
    lat: (row.lat as number) ?? undefined,
    lng: (row.lng as number) ?? undefined,
    links: (row.links as TripItem['links']) ?? [],
    budget: (row.budget as number) ?? undefined,
    memo: (row.memo as string) ?? undefined,
    date: (row.date as string) ?? undefined,
    time_start: (row.time_start as string) ?? undefined,
    time_end: (row.time_end as string) ?? undefined,
    is_franchise: (row.is_franchise as boolean) ?? undefined,
    branches: (row.branches as TripItem['branches']) ?? undefined,
    google_place_id: (row.google_place_id as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function validateItem(item: TripItem): void {
  if (!item.id || !item.name || !item.category || !item.status) {
    throw new Error(`Invalid item: ${JSON.stringify(item)}`)
  }
}

// TripItem → DB row
function itemToRow(item: TripItem): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    status: item.status,
    priority: item.priority ?? null,
    address: item.address ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    links: item.links,
    budget: item.budget ?? null,
    memo: item.memo ?? null,
    date: item.date ?? null,
    time_start: item.time_start ?? null,
    time_end: item.time_end ?? null,
    is_franchise: item.is_franchise ?? null,
    branches: item.branches ?? null,
    google_place_id: item.google_place_id ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}
