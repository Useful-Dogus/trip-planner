'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import { useTripPath } from '@/lib/hooks/useTripContext'

const LONG_PRESS_MS = 500

/**
 * 지도 우클릭(데스크탑) / 롱프레스(모바일) 핸들러.
 * 트리거된 좌표에 "여기에 새 장소 추가" 팝업 표시 → 클릭 시 items/new?lat=&lng= 로 이동.
 *
 * react-leaflet v4 의 useMap 훅을 사용. MapContainer 의 child 로 렌더해야 함.
 */
export default function MapAddOnLongPress() {
  const map = useMap()
  const router = useRouter()
  const tripPath = useTripPath()
  const [popup, setPopup] = useState<{ lat: number; lng: number } | null>(null)
  const popupMarkerRef = useRef<L.Marker | null>(null)
  const touchTimerRef = useRef<number | null>(null)
  const touchStartLatLngRef = useRef<L.LatLng | null>(null)

  useEffect(() => {
    function showAt(latlng: L.LatLng) {
      setPopup({ lat: latlng.lat, lng: latlng.lng })
    }

    function onContextMenu(e: L.LeafletMouseEvent) {
      e.originalEvent.preventDefault()
      showAt(e.latlng)
    }

    function onMapClick() {
      // 다른 곳 클릭 시 팝업 닫기
      setPopup(null)
    }

    function clearLongPress() {
      if (touchTimerRef.current != null) {
        window.clearTimeout(touchTimerRef.current)
        touchTimerRef.current = null
      }
      touchStartLatLngRef.current = null
    }

    function onTouchStart(e: L.LeafletEvent) {
      const ev = e as unknown as L.LeafletMouseEvent
      const latlng = ev.latlng
      if (!latlng) return
      touchStartLatLngRef.current = latlng
      touchTimerRef.current = window.setTimeout(() => {
        if (touchStartLatLngRef.current) showAt(touchStartLatLngRef.current)
        touchTimerRef.current = null
      }, LONG_PRESS_MS)
    }

    // mousedown/mouseup 으로 모바일 long-press 시뮬레이션 — leaflet 의 contextmenu 는 데스크탑 우클릭.
    map.on('contextmenu', onContextMenu)
    map.on('click', onMapClick)
    map.on('mousedown' as unknown as 'click', onTouchStart as unknown as L.LeafletMouseEventHandlerFn)
    map.on('mouseup' as unknown as 'click', clearLongPress as unknown as L.LeafletMouseEventHandlerFn)
    map.on('mousemove' as unknown as 'click', clearLongPress as unknown as L.LeafletMouseEventHandlerFn)
    map.on('dragstart', clearLongPress)

    return () => {
      map.off('contextmenu', onContextMenu)
      map.off('click', onMapClick)
      map.off('mousedown' as unknown as 'click', onTouchStart as unknown as L.LeafletMouseEventHandlerFn)
      map.off('mouseup' as unknown as 'click', clearLongPress as unknown as L.LeafletMouseEventHandlerFn)
      map.off('mousemove' as unknown as 'click', clearLongPress as unknown as L.LeafletMouseEventHandlerFn)
      map.off('dragstart', clearLongPress)
      clearLongPress()
    }
  }, [map])

  // 팝업 표시
  useEffect(() => {
    if (!popup) {
      popupMarkerRef.current?.remove()
      popupMarkerRef.current = null
      return
    }
    const html = `<button type="button" data-add-here class="px-2.5 py-1.5 rounded-md bg-accent text-accent-fg text-xs font-medium shadow-md hover:bg-accent-hover whitespace-nowrap">+ 여기에 새 장소</button>`
    const icon = L.divIcon({
      html,
      className: 'tp-add-here-popup',
      iconSize: [120, 28],
      iconAnchor: [60, 36],
    })
    const marker = L.marker([popup.lat, popup.lng], { icon, interactive: true, zIndexOffset: 2000 })
    marker.addTo(map)
    marker.on('click', () => {
      router.push(`${tripPath('items/new')}?lat=${popup.lat}&lng=${popup.lng}`)
    })
    popupMarkerRef.current = marker
    return () => {
      marker.remove()
    }
  }, [popup, map, router, tripPath])

  return null
}
