import type { GooglePlace } from '@/types'

/** ChIJ... 형식의 정식 place_id 만 query_place_id 로 쓸 수 있다(헥사 FID 는 불가). */
const PLACE_ID_RE = /^ChIJ[A-Za-z0-9_-]{10,}$/

/**
 * 연동된 장소를 구글맵에서 다시 열 수 있는 링크를 만든다(#322).
 * 좌표·이름·place_id 중 가용한 것으로 항상 동작하는 검색 링크를 구성하며,
 * 식별 정보가 전혀 없으면 null(링크 생략).
 */
export function buildGoogleMapsLink(place: GooglePlace): string | null {
  const hasCoord = typeof place.lat === 'number' && typeof place.lng === 'number'
  const name = place.name?.trim()

  const query = name || (hasCoord ? `${place.lat},${place.lng}` : '')
  if (!query) return null

  let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  if (place.googlePlaceId && PLACE_ID_RE.test(place.googlePlaceId)) {
    url += `&query_place_id=${encodeURIComponent(place.googlePlaceId)}`
  }
  return url
}
