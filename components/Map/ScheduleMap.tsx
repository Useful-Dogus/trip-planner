'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import TripPriorityBadge from '@/components/UI/TripPriorityBadge'

interface ScheduleMapProps {
  items: TripItem[]
  onSelectItem?: (id: string) => void
}

function createNumberIcon(num: number) {
  return L.divIcon({
    html: `<div class="tp-number-marker is-small">${num}</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

export default function ScheduleMap({ items, onSelectItem }: ScheduleMapProps) {
  const confirmedDates = useMemo(() => {
    return collectScheduleDates(items.filter(i => i.trip_priority === '확정'))
  }, [items])

  const [selectedDate, setSelectedDate] = useState<string>(confirmedDates[0] ?? '')

  const dayItems = useMemo(() => {
    return items
      .filter(
        i =>
          i.trip_priority === '확정' &&
          occursOnDate(i, selectedDate) &&
          i.lat !== undefined &&
          i.lng !== undefined
      )
      .sort((a, b) => {
        if (!a.time_start && !b.time_start) return 0
        if (!a.time_start) return 1
        if (!b.time_start) return -1
        return a.time_start.localeCompare(b.time_start)
      })
  }, [items, selectedDate])

  const polylinePositions = dayItems.map(i => [i.lat!, i.lng!] as [number, number])

  return (
    <div className="relative h-full">
      {/* Date chips */}
      {confirmedDates.length > 0 && (
        <div
          className="absolute top-2 left-12 right-2 z-[1000] flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {confirmedDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border shadow-sm transition-colors ${
                selectedDate === date
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-fg border-border hover:border-border-strong'
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      )}

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

        {dayItems.map((item, idx) => (
          <Marker
            key={item.id}
            position={[item.lat!, item.lng!]}
            icon={createNumberIcon(idx + 1)}
            eventHandlers={
              onSelectItem
                ? {
                    click: () => onSelectItem(item.id),
                  }
                : undefined
            }
          >
            <Popup>
              <div className="space-y-1 min-w-[140px]">
                <p className="font-semibold text-fg text-sm">
                  {idx + 1}. {item.name}
                </p>
                {item.time_start && <p className="text-xs text-fg-muted">{item.time_start}</p>}
                {item.budget !== undefined && (
                  <p className="text-xs text-fg-muted">${item.budget}</p>
                )}
                <TripPriorityBadge tripPriority={item.trip_priority} />
              </div>
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{ className: 'tp-day-route' }}
            weight={2}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  )
}

function occursOnDate(item: TripItem, date: string) {
  if (!item.date) return false
  if (!item.end_date) return item.date === date
  return item.date <= date && date <= item.end_date
}

function collectScheduleDates(items: TripItem[]) {
  const dates = new Set<string>()
  items.forEach(item => {
    if (!item.date) return
    const rangeEnd = item.end_date ?? item.date
    let cursor = item.date
    while (cursor <= rangeEnd) {
      dates.add(cursor)
      cursor = nextDate(cursor)
    }
  })
  return Array.from(dates).sort()
}

function nextDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}
