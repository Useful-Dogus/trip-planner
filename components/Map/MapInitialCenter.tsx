'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'

interface MapInitialCenterProps {
  items: TripItem[]
  basecampCoord: [number, number] | null
  region: string | null
  fallback?: [number, number]
  fallbackZoom?: number
}

/**
 * trip 컨텍스트(items → basecamp → region geocode) 를 기반으로 지도 초기 중심점을 잡는다.
 * MapContainer 의 child 로 렌더한다. 사용자가 한 번이라도 지도를 움직이면 더 이상 자동 이동하지 않는다.
 */
export default function MapInitialCenter({
  items,
  basecampCoord,
  region,
  fallback = [36.2048, 138.2529],
  fallbackZoom = 5,
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

    const coords = items
      .filter(i => typeof i.lat === 'number' && typeof i.lng === 'number')
      .map(i => [i.lat as number, i.lng as number] as [number, number])

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords)
      if (basecampCoord) bounds.extend(basecampCoord)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false })
      settledRef.current = true
      return
    }

    if (basecampCoord) {
      map.setView(basecampCoord, 14, { animate: false })
      settledRef.current = true
      return
    }

    if (region && region.trim()) {
      let cancelled = false
      ;(async () => {
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(region.trim())}`)
          const data = await res.json()
          if (cancelled || userMovedRef.current) return
          if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
            map.setView([data.lat, data.lng], 11, { animate: false })
            settledRef.current = true
          } else {
            map.setView(fallback, fallbackZoom, { animate: false })
            settledRef.current = true
          }
        } catch {
          if (!cancelled && !userMovedRef.current) {
            map.setView(fallback, fallbackZoom, { animate: false })
            settledRef.current = true
          }
        }
      })()
      return () => {
        cancelled = true
      }
    }

    map.setView(fallback, fallbackZoom, { animate: false })
    settledRef.current = true
  }, [map, items, basecampCoord, region, fallback, fallbackZoom])

  return null
}
