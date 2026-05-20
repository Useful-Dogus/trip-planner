import { redirect } from 'next/navigation'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import NewTripWizard from './NewTripWizard'

export const dynamic = 'force-dynamic'

export default async function NewTripPage() {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    redirect('/login?next=/dashboard/new')
  }
  return <NewTripWizard />
}
