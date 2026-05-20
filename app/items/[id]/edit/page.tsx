import { redirectToActiveTrip } from '@/lib/activeTripRedirect'

export default async function LegacyItemEditRedirect({
  params,
}: {
  params: { id: string }
}) {
  await redirectToActiveTrip(`items/${params.id}/edit`)
}
