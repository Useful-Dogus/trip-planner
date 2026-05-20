import { redirect } from 'next/navigation'
import { TripIdProvider } from '@/lib/hooks/useTripContext'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import TripAccessDenied from '@/components/UI/TripAccessDenied'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { tripId: string }
}) {
  const { tripId } = params

  if (!UUID_RE.test(tripId)) {
    return <TripAccessDenied reason="not-found" />
  }

  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`)
  }

  const { data: isMember, error } = await client.rpc('is_trip_member', { p_trip_id: tripId })
  if (error || !isMember) {
    return <TripAccessDenied reason="forbidden" />
  }

  return <TripIdProvider tripId={tripId}>{children}</TripIdProvider>
}
