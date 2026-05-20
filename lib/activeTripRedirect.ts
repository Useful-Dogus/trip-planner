import { redirect } from 'next/navigation'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { ensureActiveTrip } from '@/lib/trip'

/**
 * 단일 trip 가정으로 짜였던 레거시 라우트(`/map`, `/list`, ...)를
 * tripId 가 명시된 canonical 라우트(`/trip/<id>/...`)로 이동시킨다.
 *
 * 인증되지 않은 사용자는 미들웨어가 먼저 /login 으로 보내므로 여기 도달하지 않는다.
 * 첫 로그인이라 trip 이 없는 사용자에게는 ensureActiveTrip 이 RPC 로 trip 을 만들어 준다.
 */
export async function redirectToActiveTrip(
  subPath: string,
  queryString = '',
): Promise<never> {
  const client = createRouteHandlerSupabase()
  const tripId = await ensureActiveTrip(client)
  const cleanSub = subPath.replace(/^\//, '')
  const base = cleanSub ? `/trip/${tripId}/${cleanSub}` : `/trip/${tripId}`
  redirect(queryString ? `${base}?${queryString}` : base)
}
