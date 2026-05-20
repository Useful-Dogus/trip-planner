import { redirectToActiveTrip } from '@/lib/activeTripRedirect'

export default async function LegacyListRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await redirectToActiveTrip('list', buildQuery(searchParams))
}

function buildQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) v.forEach(x => sp.append(k, x))
    else if (v !== undefined) sp.set(k, v)
  }
  return sp.toString()
}
