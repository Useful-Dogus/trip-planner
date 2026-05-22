import { redirect } from 'next/navigation'
import { TripProvider, type TripRole } from '@/lib/hooks/useTripContext'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import TripAccessDenied from '@/components/UI/TripAccessDenied'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type TripRow = {
  id: string
  title: string
  start_date: string | null
  end_date: string | null
  region: string | null
  basecamp_address: string | null
  currency: string | null
  trip_members: { role: TripRole }[]
}

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

  const { data, error } = await client
    .from('trips')
    .select(
      'id, title, start_date, end_date, region, basecamp_address, currency, trip_members!inner(role)',
    )
    .eq('id', tripId)
    .eq('trip_members.user_id', userData.user.id)
    .maybeSingle<TripRow>()

  if (error || !data) {
    return <TripAccessDenied reason="forbidden" />
  }

  const role = data.trip_members[0]?.role
  if (!role) {
    return <TripAccessDenied reason="forbidden" />
  }

  return (
    <TripProvider
      value={{
        id: data.id,
        title: data.title,
        startDate: data.start_date,
        endDate: data.end_date,
        region: data.region,
        basecampAddress: data.basecamp_address,
        currency: data.currency ?? 'KRW',
        role,
      }}
    >
      {children}
    </TripProvider>
  )
}
