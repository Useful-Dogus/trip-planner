'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { TripItem } from '@/types'

interface Props {
  selectedItem: TripItem | null
}

/**
 * 선택된 item 이 현재 뷰포트 밖이면 부드럽게 panTo.
 * 줌 레벨은 보존. 이미 보이는 마커를 클릭한 경우엔 지도가 움직이지 않음.
 */
export default function SelectedItemPan({ selectedItem }: Props) {
  const map = useMap()
  const lastIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedItem) {
      lastIdRef.current = null
      return
    }
    if (selectedItem.id === lastIdRef.current) return
    if (typeof selectedItem.lat !== 'number' || typeof selectedItem.lng !== 'number') return
    lastIdRef.current = selectedItem.id

    const target = map.options.crs?.latLngToPoint
      ? [selectedItem.lat, selectedItem.lng]
      : [selectedItem.lat, selectedItem.lng]
    const bounds = map.getBounds()
    const latLng = { lat: selectedItem.lat, lng: selectedItem.lng } as { lat: number; lng: number }
    if (bounds.contains([latLng.lat, latLng.lng])) {
      // 이미 뷰포트 안 — 지도 이동 없음
      void target
      return
    }
    map.panTo([latLng.lat, latLng.lng], { animate: true, duration: 0.4 })
  }, [map, selectedItem])

  return null
}
