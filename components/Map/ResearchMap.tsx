'use client'

import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'

function createEmojiChipIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:2px 6px;
      background:white;
      border:1.5px solid #e2e8f0;
      border-radius:9999px;
      box-shadow:0 1px 4px rgba(0,0,0,0.15);
      font-size:14px;
      line-height:1;
      white-space:nowrap;
    ">${emoji}</div>`,
    className: '',
    iconSize: [28, 24],
    iconAnchor: [14, 12],
  })
}

interface ResearchMapProps {
  items: TripItem[]
  onSelectItem?: (id: string) => void
}

export default function ResearchMap({ items, onSelectItem }: ResearchMapProps) {
  const mapItems = items.filter(
    item => item.trip_priority !== '제외' && item.lat !== undefined && item.lng !== undefined
  )

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
      {mapItems.map(item => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
          icon={createEmojiChipIcon(CATEGORY_META[item.category]?.emoji ?? '📌')}
          eventHandlers={
            onSelectItem
              ? {
                  click: () => onSelectItem(item.id),
                }
              : undefined
          }
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={0.9}>
            <span className="text-xs font-medium">{item.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
