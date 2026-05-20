import { redirect } from 'next/navigation'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    redirect('/login?next=/me')
  }
  const user = userData.user
  const nickname =
    (user.user_metadata?.nickname as string | undefined) ?? ''

  return (
    <ProfileClient
      email={user.email ?? ''}
      initialNickname={nickname}
    />
  )
}
