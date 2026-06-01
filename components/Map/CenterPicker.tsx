'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import {
  resolveRegionCenter,
  resolutionToCenter,
  type RegionResolution,
} from '@/lib/resolveRegionCenter'

export interface CenterValue {
  lat: number
  lng: number
  zoom: number
  source: 'auto' | 'manual'
}

interface CenterPickerProps {
  region: string
  value: CenterValue | null
  onChange: (v: CenterValue | null) => void
}

const pinIcon = L.divIcon({
  html: `<div class="tp-basecamp-marker">📍</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 30],
})

const WORLD_CENTER: [number, number] = [20, 0]

/** 자동 해석 결과를 지도에 반영(수동 핀 조정 중에는 재중심 안 함). */
function ApplyAutoView({ value }: { value: CenterValue | null }) {
  const map = useMap()
  const lastKey = useRef('')
  useEffect(() => {
    if (!value || value.source !== 'auto') return
    const key = `${value.lat.toFixed(4)},${value.lng.toFixed(4)},${value.zoom}`
    if (key === lastKey.current) return
    lastKey.current = key
    map.setView([value.lat, value.lng], value.zoom, { animate: false })
  }, [value, map])
  return null
}

/** 마운트 직후 컨테이너 크기 보정 + 지도 클릭 = 수동 지정. */
function MapBehaviors({
  onReady,
  onPick,
}: {
  onReady: (m: L.Map) => void
  onPick: (lat: number, lng: number) => void
}) {
  const map = useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  useEffect(() => {
    onReady(map)
    const t = setTimeout(() => map.invalidateSize(), 0)
    return () => clearTimeout(t)
  }, [map, onReady])
  return null
}

/**
 * region 텍스트의 지도 중심 미니맵. 자동 해석 핀을 보여주고, 핀 드래그/지도 클릭으로
 * 직접 조정(manual)할 수 있다. 생성 마법사·설정에서 공통 사용한다.
 */
export default function CenterPicker({ region, value, onChange }: CenterPickerProps) {
  const [resolution, setResolution] = useState<RegionResolution | null>(null)
  const [resolving, setResolving] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // onChange 정체성이 매 렌더 바뀌어도 effect 가 재실행되지 않도록 ref 로 고정.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // region 변경 시 디바운스 후 자동 해석. 수동 핀은 region 이 다시 바뀌면 자동으로 덮인다.
  useEffect(() => {
    const trimmed = region.trim()
    if (!trimmed) {
      setResolution(null)
      onChangeRef.current(null)
      return
    }
    let cancelled = false
    setResolving(true)
    const t = setTimeout(async () => {
      const res = await resolveRegionCenter(trimmed)
      if (cancelled) return
      setResolution(res)
      setResolving(false)
      const c = resolutionToCenter(res)
      if (c) onChangeRef.current({ lat: c.lat, lng: c.lng, zoom: c.zoom, source: 'auto' })
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [region])

  function pickManual(lat: number, lng: number) {
    const zoom = mapRef.current?.getZoom() ?? value?.zoom ?? 11
    onChangeRef.current({ lat, lng, zoom, source: 'manual' })
  }

  const manual = value?.source === 'manual'

  return (
    <div className="space-y-1.5">
      <div className="h-44 overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={value ? [value.lat, value.lng] : WORLD_CENTER}
          zoom={value?.zoom ?? 2}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          className="touch-none"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ApplyAutoView value={value} />
          <MapBehaviors
            onReady={(m) => {
              mapRef.current = m
            }}
            onPick={pickManual}
          />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend(e) {
                  const ll = (e.target as L.Marker).getLatLng()
                  pickManual(ll.lat, ll.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <CenterPickerHint manual={manual} resolving={resolving} resolution={resolution} region={region} />
    </div>
  )
}

function CenterPickerHint({
  manual,
  resolving,
  resolution,
  region,
}: {
  manual: boolean
  resolving: boolean
  resolution: RegionResolution | null
  region: string
}) {
  if (manual) {
    return (
      <p className="flex items-center gap-1 text-xs text-accent">
        <MapPin className="size-3" aria-hidden />
        직접 지정한 위치 · 핀을 끌어 조정
      </p>
    )
  }
  if (resolving) return <p className="text-xs text-fg-subtle">위치 확인 중…</p>
  if (!resolution || !region.trim()) {
    return <p className="text-xs text-fg-subtle">지역을 입력하면 중심점을 표시해요. 핀을 끌거나 지도를 눌러 직접 정할 수도 있어요.</p>
  }
  if (resolution.status === 'preset') {
    return (
      <p className="flex items-center gap-1 text-xs text-accent">
        <MapPin className="size-3" aria-hidden />
        {resolution.name}로 인식됨 · 핀을 끌어 조정
      </p>
    )
  }
  if (resolution.status === 'geocoded') {
    return (
      <p className="flex items-center gap-1 text-xs text-accent">
        <MapPin className="size-3" aria-hidden />
        좌표 확보 · 핀을 끌어 조정
      </p>
    )
  }
  if (resolution.status === 'notfound') {
    return (
      <p className="text-xs text-critical-fg">
        「{region.trim()}」 위치를 찾지 못했어요. 지도를 눌러 직접 지정하세요.
      </p>
    )
  }
  return (
    <p className="text-xs text-critical-fg">
      위치 검색이 일시적으로 실패했어요. 지도를 눌러 직접 지정하세요.
    </p>
  )
}
