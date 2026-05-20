import { redirectToActiveTrip } from '@/lib/activeTripRedirect'

export default async function LegacyNewItemRedirect() {
  await redirectToActiveTrip('items/new')
}
