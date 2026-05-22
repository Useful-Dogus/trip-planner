'use client'

import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import MapInitialCenter from './MapInitialCenter'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'

function createEmojiChipIcon(emoji: string) {
  return L.divIcon({
    html: `<div class="tp-chip-marker">${emoji}</div>`,
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
  const trip = useOptionalTrip()
  const mapItems = items.filter(
    item => item.trip_priority !== '제외' && item.lat !== undefined && item.lng !== undefined
  )

  return (
    <MapContainer
      center={[36.2048, 138.2529]}
      zoom={5}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
      className="touch-none"
    >
      <ZoomControl position="bottomright" />
      <MapInitialCenter
        items={mapItems}
        basecampCoord={null}
        region={trip?.region ?? null}
      />
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
