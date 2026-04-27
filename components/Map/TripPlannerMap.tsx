'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'

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
  if (!item.end_date) return item.date === date
  return item.date <= date && date <= item.end_date
}

export default function TripPlannerMap({
  items,
  selectedDate,
  selectedItemId,
  onSelectItem,
}: TripPlannerMapProps) {
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
      .filter(i => occursOnDate(i, selectedDate))
      .sort((a, b) => (a.time_start ?? '99:99').localeCompare(b.time_start ?? '99:99'))
  }, [visibleItems, selectedDate])

  const dayItemIds = useMemo(() => new Set(dayItems.map(i => i.id)), [dayItems])
  const polyline = dayItems.map(i => [i.lat!, i.lng!] as [number, number])

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
    </MapContainer>
  )
}
