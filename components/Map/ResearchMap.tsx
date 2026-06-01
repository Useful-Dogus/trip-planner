'use client'

import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import type { TripItem, Category } from '@/types'
import { categoryIconSvg } from '@/lib/categoryIcon'
import MapInitialCenter from './MapInitialCenter'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'

function createCategoryChipIcon(category: Category) {
  const svg = categoryIconSvg(category, { size: 14, color: 'currentColor', strokeWidth: 2 })
  return L.divIcon({
    html: `<div class="tp-chip-marker">${svg}</div>`,
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
      center={[20, 0]}
      zoom={2}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
      className="touch-none"
    >
      <ZoomControl position="bottomright" />
      <MapInitialCenter
        items={mapItems}
        basecampCoord={null}
        region={trip?.region ?? null}
        tripCenter={
          trip?.centerLat != null && trip?.centerLng != null
            ? { lat: trip.centerLat, lng: trip.centerLng, zoom: trip.defaultZoom }
            : null
        }
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {mapItems.map(item => (
        <Marker
          key={item.id}
          position={[item.lat!, item.lng!]}
          icon={createCategoryChipIcon(item.category)}
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
