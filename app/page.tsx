import { redirectToActiveTrip } from '@/lib/activeTripRedirect'

export default async function Home() {
  await redirectToActiveTrip('map')
}
