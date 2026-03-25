'use client'

import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'

const categoryColors: Record<string, string> = {
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

interface ResearchMapProps {
  items: TripItem[]
  onSelectItem?: (id: string) => void
}

export default function ResearchMap({ items, onSelectItem }: ResearchMapProps) {
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mapItems.map(item => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
          icon={createDotIcon(categoryColors[item.category])}
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
