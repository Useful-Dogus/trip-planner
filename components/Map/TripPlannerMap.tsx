'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import MapAddOnLongPress from './MapAddOnLongPress'
import L from 'leaflet'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import { getEndLodging, getStartLodging, isStayItem } from '@/lib/lodging'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'

interface TripPlannerMapProps {
  items: TripItem[]
  selectedDate: string | null
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

function chipIcon(emoji: string, opts: { dim?: boolean; selected?: boolean }) {
  const cls = [
    'tp-chip-marker',
    opts.selected && 'is-selected',
    opts.dim && 'is-dim',
  ]
    .filter(Boolean)
    .join(' ')
  return L.divIcon({
    html: `<div class="${cls}">${emoji}</div>`,
    className: '',
    iconSize: [28, 24],
    iconAnchor: [14, 12],
  })
}

function numberIcon(num: number, selected: boolean) {
  const cls = ['tp-number-marker', selected && 'is-selected'].filter(Boolean).join(' ')
  return L.divIcon({
    html: `<div class="${cls}">${num}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function occursOnDate(item: TripItem, date: string): boolean {
  if (!item.date) return false
  if (item.date === date) return true
  // end_date 까지 확장하는 건 종일/다일 일정(time_start 없음)에만 적용.
  // 자정을 넘기는 단일 일정이 종료일에 끼어들지 않도록.
  if (item.end_date && !item.time_start) {
    return item.date <= date && date <= item.end_date
  }
  return false
}

export default function TripPlannerMap({
  items,
  selectedDate,
  selectedItemId,
  onSelectItem,
}: TripPlannerMapProps) {
  const trip = useOptionalTrip()
  const [basecampCoord, setBasecampCoord] = useState<[number, number] | null>(null)

  useEffect(() => {
    const addr = trip?.basecampAddress?.trim()
    if (!addr) {
      setBasecampCoord(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`)
        const data = await res.json()
        if (!cancelled && typeof data?.lat === 'number' && typeof data?.lng === 'number') {
          setBasecampCoord([data.lat, data.lng])
        }
      } catch {
        // 베이스캠프 좌표 실패는 silent — lodging item 만으로 동작
      }
    })()
    return () => {
      cancelled = true
    }
  }, [trip?.basecampAddress])

  const visibleItems = useMemo(
    () =>
      items.filter(
        i => i.trip_priority !== '제외' && i.lat !== undefined && i.lng !== undefined,
      ),
    [items],
  )

  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as TripItem[]
    return visibleItems
      .filter(i => i.trip_priority === '확정' && occursOnDate(i, selectedDate))
      .sort((a, b) => (a.time_start ?? '99:99').localeCompare(b.time_start ?? '99:99'))
  }, [visibleItems, selectedDate])

  const dayItemIds = useMemo(() => new Set(dayItems.map(i => i.id)), [dayItems])

  const polyline = useMemo<[number, number][]>(() => {
    if (!selectedDate) return []
    const activityCoords = dayItems
      .filter(i => !isStayItem(i))
      .map(i => [i.lat!, i.lng!] as [number, number])
    const startStay = getStartLodging(selectedDate, items)
    const endStay = getEndLodging(selectedDate, items)
    const startCoord: [number, number] | null =
      startStay && startStay.lat != null && startStay.lng != null
        ? [startStay.lat, startStay.lng]
        : basecampCoord
    const endCoord: [number, number] | null =
      endStay && endStay.lat != null && endStay.lng != null
        ? [endStay.lat, endStay.lng]
        : basecampCoord
    return [
      ...(startCoord ? [startCoord] : []),
      ...activityCoords,
      ...(endCoord ? [endCoord] : []),
    ]
  }, [dayItems, items, selectedDate, basecampCoord])

  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="touch-none"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {visibleItems
        .filter(i => !dayItemIds.has(i.id))
        .map(item => (
          <Marker
            key={item.id}
            position={[item.lat!, item.lng!]}
            icon={chipIcon(CATEGORY_META[item.category]?.emoji ?? '📌', {
              dim: selectedDate !== null,
              selected: item.id === selectedItemId,
            })}
            eventHandlers={{ click: () => onSelectItem(item.id) }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
              <span className="text-xs font-medium">{item.name}</span>
            </Tooltip>
          </Marker>
        ))}

      {dayItems.map((item, idx) => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
          icon={numberIcon(idx + 1, item.id === selectedItemId)}
          eventHandlers={{ click: () => onSelectItem(item.id) }}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
            <span className="text-xs font-medium">
              {idx + 1}. {item.name}
            </span>
          </Tooltip>
        </Marker>
      ))}

      {polyline.length > 1 && (
        <Polyline positions={polyline} pathOptions={{ className: 'tp-day-route' }} weight={2.5} opacity={0.6} />
      )}

      {basecampCoord && (
        <Marker
          position={basecampCoord}
          icon={L.divIcon({
            html: `<div class="tp-basecamp-marker">🏠</div>`,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
          interactive={false}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={0.9}>
            <span className="text-xs font-medium">베이스캠프</span>
          </Tooltip>
        </Marker>
      )}

      <MapAddOnLongPress />
    </MapContainer>
  )
}
