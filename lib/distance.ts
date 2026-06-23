const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// 직선거리 → 실제 경로 보정. 직선은 항상 실제보다 짧아 보수적으로 늘린다.
const DETOUR_FACTOR = 1.3
// 이 직선거리(km) 이하는 도보, 초과는 대중교통/차량 평균속도로 가정한다.
const WALK_MAX_KM = 1.2
const WALK_KMH = 4.5
const TRANSIT_KMH = 18

/**
 * 직선거리(km)에서 대략적인 이동 시간(분)을 추정한다.
 * 외부 라우팅 API 없이 시작하는 편의 추정이라 "약" 으로만 표기해야 한다 —
 * 실측 라우팅·신뢰 해자는 #260 에서 다룬다.
 */
export function estimateTravelMinutes(straightKm: number): number {
  const realKm = straightKm * DETOUR_FACTOR
  const kmh = straightKm <= WALK_MAX_KM ? WALK_KMH : TRANSIT_KMH
  return Math.max(1, Math.round((realKm / kmh) * 60))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
