import { redirectToActiveTrip } from '@/lib/activeTripRedirect'

export default async function LegacyGmapsImportRedirect() {
  await redirectToActiveTrip('gmaps-import')
}
