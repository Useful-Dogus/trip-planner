'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import { matchCityPreset } from '@/lib/cityPresets'

export interface TripCenter {
  lat: number
  lng: number
  zoom: number | null
}

interface AutoViewOpts {
  items: TripItem[]
  basecampCoord: [number, number] | null
  region: string | null
  fallback?: [number, number]
  fallbackZoom?: number
}

/**
 * 자동 중심 우선순위(저장 좌표 제외): region preset → items fitBounds → basecamp → 세계 폴백.
 * 저장 좌표(manual)를 비운 뒤 즉시 자동 화면으로 되돌릴 때도 재사용한다.
 */
export function applyAutoView(
  map: L.Map,
  { items, basecampCoord, region, fallback = [20, 0], fallbackZoom = 2 }: AutoViewOpts,
) {
  const preset = matchCityPreset(region)
  if (preset) {
    map.setView([preset.lat, preset.lng], preset.zoom, { animate: false })
    return
  }

  const coords = items
    .filter(i => typeof i.lat === 'number' && typeof i.lng === 'number')
    .map(i => [i.lat as number, i.lng as number] as [number, number])

  if (coords.length > 0) {
    const bounds = L.latLngBounds(coords)
    if (basecampCoord) bounds.extend(basecampCoord)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: false })
    return
  }

  if (basecampCoord) {
    map.setView(basecampCoord, 13, { animate: false })
    return
  }

  map.setView(fallback, fallbackZoom, { animate: false })
}

interface MapInitialCenterProps {
  items: TripItem[]
  basecampCoord: [number, number] | null
  region: string | null
  /** trip 에 저장된 중심 좌표(자동 또는 사용자 명시). 최우선. */
  tripCenter?: TripCenter | null
  /** 세계 중심 폴백 (단일 국가 좌표 금지, FR-010). */
  fallback?: [number, number]
  fallbackZoom?: number
}

/**
 * 지도 초기 중심점 우선순위(FR-007):
 *   1. trip 저장 좌표(tripCenter)        ← 자동/명시 공통
 *   2. region preset 매칭                ← 외부 호출 없음
 *   3. items fitBounds (items ≥ 1)
 *   4. basecamp 좌표
 *   5. 세계 중심 폴백 [20, 0] zoom 2
 * 지도 로드 경로는 외부 지오코딩을 호출하지 않는다(FR-011). 외부 호출은 폼 입력 시점에만.
 * 사용자가 한 번이라도 지도를 움직이면 더 이상 자동 이동하지 않는다.
 */
export default function MapInitialCenter({
  items,
  basecampCoord,
  region,
  tripCenter = null,
  fallback = [20, 0],
  fallbackZoom = 2,
}: MapInitialCenterProps) {
  const map = useMap()
  const settledRef = useRef(false)
  const userMovedRef = useRef(false)

  useEffect(() => {
    const onUserMove = () => {
      userMovedRef.current = true
    }
    map.on('dragstart', onUserMove)
    map.on('zoomstart', onUserMove)
    return () => {
      map.off('dragstart', onUserMove)
      map.off('zoomstart', onUserMove)
    }
  }, [map])

  useEffect(() => {
    if (settledRef.current || userMovedRef.current) return

    // 1. trip 저장 좌표 (자동 또는 사용자 명시)
    if (tripCenter) {
      map.setView([tripCenter.lat, tripCenter.lng], tripCenter.zoom ?? 11, { animate: false })
      settledRef.current = true
      return
    }

    // 2-5. region preset → items → basecamp → 세계 폴백
    applyAutoView(map, { items, basecampCoord, region, fallback, fallbackZoom })
    settledRef.current = true
  }, [map, items, basecampCoord, region, tripCenter, fallback, fallbackZoom])

  return null
}
