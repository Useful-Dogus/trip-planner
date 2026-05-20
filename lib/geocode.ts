export async function geocodeAddress(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'trip-planner/1.0 (personal-travel-tool)',
    },
  })

  if (!res.ok) return null

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ address: string } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'trip-planner/1.0 (personal-travel-tool)' },
  })
  if (!res.ok) return null
  const data = await res.json()
  const address = data?.display_name as string | undefined
  if (!address) return null
  return { address }
}
