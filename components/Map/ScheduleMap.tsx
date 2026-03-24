'use client'

import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import StatusBadge from '@/components/UI/StatusBadge'

function createNumberIcon(num: number) {
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;
      border-radius:50%;
      background:#374151;
      color:white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:11px;
      font-weight:700;
      border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    ">${num}</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

export default function ScheduleMap({ items }: { items: TripItem[] }) {
  const confirmedDates = useMemo(() => {
    const dates = items
      .filter(i => i.status === '확정' && i.date)
      .map(i => i.date!)
    return Array.from(new Set(dates)).sort()
  }, [items])

  const [selectedDate, setSelectedDate] = useState<string>(confirmedDates[0] ?? '')

  const dayItems = useMemo(() => {
    return items
      .filter(
        i =>
          i.status === '확정' &&
          i.date === selectedDate &&
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
          className="absolute top-2 left-2 right-2 z-[1000] flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {confirmedDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border shadow-sm transition-colors ${
                selectedDate === date
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {dayItems.map((item, idx) => (
          <Marker
            key={item.id}
            position={[item.lat!, item.lng!]}
            icon={createNumberIcon(idx + 1)}
          >
            <Popup>
              <div className="space-y-1 min-w-[140px]">
                <p className="font-semibold text-gray-900 text-sm">
                  {idx + 1}. {item.name}
                </p>
                {item.time_start && (
                  <p className="text-xs text-gray-500">{item.time_start}</p>
                )}
                {item.budget !== undefined && (
                  <p className="text-xs text-gray-500">${item.budget}</p>
                )}
                <StatusBadge status={item.status} />
              </div>
            </Popup>
          </Marker>
        ))}

        {polylinePositions.length > 1 && (
          <Polyline positions={polylinePositions} color="#94A3B8" weight={2} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  )
}
