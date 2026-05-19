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

  const { data: userData, error: userErr } = await client.auth.getUser()
  if (userErr) throw userErr
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인된 사용자가 없습니다.')

  const { data: trip, error: tripErr } = await client
    .from('trips')
    .insert({ owner_user_id: userId, title: '내 여행' })
    .select('id')
    .single()
  if (tripErr) throw tripErr
  const tripId = trip.id as string

  const { error: memberErr } = await client
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: userId, role: 'owner' })
  if (memberErr) throw memberErr

  return tripId
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
