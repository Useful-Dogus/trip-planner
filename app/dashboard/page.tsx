import { redirect } from 'next/navigation'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { listUserTrips } from '@/lib/trips'
import DashboardClient from './DashboardClient'

export const metadata = { title: '내 여행' }

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    redirect('/login?next=/dashboard')
  }

  const trips = await listUserTrips(client)
  return <DashboardClient initialTrips={trips} userEmail={userData.user.email ?? null} />
}
