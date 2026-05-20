import type { SupabaseClient } from '@supabase/supabase-js'

export type TripRole = 'owner' | 'editor' | 'viewer'

export type TripSupabaseClient = SupabaseClient

export async function getActiveTripId(client: TripSupabaseClient): Promise<string | null> {
  const { data, error } = await client
    .from('trip_members')
    .select('trip_id, role, invited_at')
    .order('role', { ascending: true }) // 'owner' < 'editor' < 'viewer' (사전순)
    .order('invited_at', { ascending: true })
    .limit(1)
  if (error) throw error
  if (!data || data.length === 0) return null
  return data[0].trip_id as string
}

export async function ensureActiveTrip(client: TripSupabaseClient): Promise<string> {
  const existing = await getActiveTripId(client)
  if (existing) return existing

  // SECURITY DEFINER RPC 로 trip + 멤버십을 원자 생성한다.
  // 두 단계 insert 로 분리하면 trips_select RLS(is_trip_member 기반) 가
  // INSERT..RETURNING 시점에 막아 403 을 반환할 수 있어 RPC 로 회피.
  const { data, error } = await client.rpc('create_user_trip')
  if (error) {
    console.error('[ensureActiveTrip] create_user_trip RPC failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw error
  }
  if (typeof data !== 'string') {
    throw new Error('create_user_trip 가 trip id 를 반환하지 않았습니다.')
  }
  return data
}

export async function getUserRole(
  client: TripSupabaseClient,
  tripId: string,
): Promise<TripRole | null> {
  const { data, error } = await client
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .maybeSingle()
  if (error) throw error
  return (data?.role as TripRole | undefined) ?? null
}
