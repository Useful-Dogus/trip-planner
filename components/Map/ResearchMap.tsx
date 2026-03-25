'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem, Category } from '@/types'
import StatusBadge from '@/components/UI/StatusBadge'
import PriorityBadge from '@/components/UI/PriorityBadge'

const categoryColors: Record<Category, string> = {
  교통: '#94A3B8',
  숙소: '#7DD3FC',
  식당: '#FB923C',
  카페: '#FDBA74',
  관광: '#6EE7B7',
  공연: '#F9A8D4',
  스포츠: '#86EFAC',
  쇼핑: '#C4B5FD',
  기타: '#FCD34D',
}

function createDotIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width:18px;height:18px;
      border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export default function ResearchMap({ items }: { items: TripItem[] }) {
  const mapItems = items.filter(
    item => item.status !== '탈락' && item.lat !== undefined && item.lng !== undefined
  )

  return (
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
      {mapItems.map(item => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
          icon={createDotIcon(categoryColors[item.category])}
        >
          <Popup>
            <div className="space-y-1 min-w-[140px]">
              <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
              <p className="text-xs text-gray-500">{item.category}</p>
              <div className="flex gap-1 flex-wrap pt-0.5">
                <StatusBadge status={item.status} />
                {item.priority && <PriorityBadge priority={item.priority} />}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
