import { matchCityPreset } from './cityPresets'

// 폼 region 입력에 대한 좌표 확보 결과(US6). 4가지로 구분된다.
export type RegionResolution =
  | { status: 'preset'; name: string; lat: number; lng: number; zoom: number }
  | { status: 'geocoded'; lat: number; lng: number; zoom: number }
  | { status: 'notfound' } // 영구 실패: 결과 없음
  | { status: 'error' } // 일시 장애: 네트워크/타임아웃/5xx

const GEOCODE_DEFAULT_ZOOM = 11

/**
 * region 텍스트에서 지도 중심 좌표를 확보한다(FR-012 우선순위: preset → 외부 호출).
 * 외부 호출은 폼 입력 시점에만 발생하며, 지도 로드 경로에서는 호출하지 않는다(FR-011).
 */
export async function resolveRegionCenter(
  region: string,
  opts: { skipPreset?: boolean } = {},
): Promise<RegionResolution> {
  const trimmed = region.trim()
  if (!trimmed) return { status: 'notfound' }

  if (!opts.skipPreset) {
    const preset = matchCityPreset(trimmed)
    if (preset) {
      return { status: 'preset', name: preset.name, lat: preset.lat, lng: preset.lng, zoom: preset.zoom }
    }
  }

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`)
    if (!res.ok) return { status: 'error' }
    const data = await res.json()
    if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
      return { status: 'geocoded', lat: data.lat, lng: data.lng, zoom: GEOCODE_DEFAULT_ZOOM }
    }
    return { status: 'notfound' }
  } catch {
    return { status: 'error' }
  }
}

/** 저장 가능한 좌표가 확보된 결과인지 판별. */
export function resolutionToCenter(
  r: RegionResolution,
): { lat: number; lng: number; zoom: number } | null {
  if (r.status === 'preset' || r.status === 'geocoded') {
    return { lat: r.lat, lng: r.lng, zoom: r.zoom }
  }
  return null
}
