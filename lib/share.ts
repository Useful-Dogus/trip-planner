import type { SupabaseClient } from '@supabase/supabase-js'

export type Share = {
  token: string
  trip_id: string
  created_by_user_id: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

export type CreateShareOptions = {
  expiresAt?: Date | null
}

export async function createShare(
  client: SupabaseClient,
  tripId: string,
  options?: CreateShareOptions,
): Promise<Share> {
  const { data: userData, error: userErr } = await client.auth.getUser()
  if (userErr) throw userErr
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  const { data, error } = await client
    .from('shares')
    .insert({
      trip_id: tripId,
      created_by_user_id: userId,
      expires_at: options?.expiresAt ? options.expiresAt.toISOString() : null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Share
}

export async function listSharesForTrip(
  client: SupabaseClient,
  tripId: string,
): Promise<Share[]> {
  const { data, error } = await client
    .from('shares')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Share[]
}

export async function revokeShare(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  const { error } = await client
    .from('shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token)
  if (error) throw error
}

export function isShareActive(share: Pick<Share, 'expires_at' | 'revoked_at'>, now: Date = new Date()): boolean {
  if (share.revoked_at) return false
  if (share.expires_at && new Date(share.expires_at) <= now) return false
  return true
}

// PostgREST 의 단일-요청-단일-트랜잭션 모델 때문에 set_config 의 효과는 해당 트랜잭션 한정이다.
// 익명 read 의 실제 호출 패턴(set_share_token RPC + 후속 쿼리 vs 단일 RPC 통합)은 #113 에서 확정한다.
export async function applyShareTokenToSession(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  const { error } = await client.rpc('set_share_token', { p_token: token })
  if (error) throw error
}
