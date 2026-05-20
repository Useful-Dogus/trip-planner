import { createClient } from '@supabase/supabase-js'
import type { TripItem } from '@/types'

export type SharedTripMeta = {
  id: string
  title: string
  start_date: string | null
  end_date: string | null
  region: string | null
  basecamp_address: string | null
}

export type SharedTripPayload = {
  trip: SharedTripMeta
  items: TripItem[]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function anonClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.')
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function fetchSharedTrip(token: string): Promise<SharedTripPayload | null> {
  if (!token || !UUID_RE.test(token)) return null
  const client = anonClient()
  const { data, error } = await client.rpc('get_shared_trip', { p_token: token })
  if (error) {
    console.error('[fetchSharedTrip] RPC error', error)
    return null
  }
  if (!data) return null
  return data as SharedTripPayload
}

export function buildShareUrl(token: string, baseUrl?: string | null): string {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
  const path = `/share/${token}`
  return base ? `${base}${path}` : path
}
