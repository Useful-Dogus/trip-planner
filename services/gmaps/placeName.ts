import type { GooglePlace } from '@/types'

// "34°39'53.7\"N 135°29'58.3\"E" 또는 "34.123, 135.456" 같이 좌표 자체가 이름인 경우.
const DMS_RE = /\d+°\d+['′]/
const DECIMAL_COORD_RE = /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/

/**
 * 사람이 읽을 이름이 없는 장소(좌표가 이름이거나 비어 있음).
 * 연동 프리뷰의 "이름 미정" 집계(#323)와 import 의 핀 이름 정규화(resolvePinName)가
 * 같은 기준을 쓰도록 단일 소스로 둔다.
 */
export function isCoordinateLikeName(name: string | null | undefined): boolean {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return true
  if (DMS_RE.test(trimmed)) return true
  if (DECIMAL_COORD_RE.test(trimmed)) return true
  return false
}

/** 좌표(lat/lng)가 없어 지도에 표시할 수 없는 장소(#323). */
export function hasNoCoordinates(place: Pick<GooglePlace, 'lat' | 'lng'>): boolean {
  return typeof place.lat !== 'number' || typeof place.lng !== 'number'
}
