'use client'

import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import { useRouter } from 'next/navigation'
import { mutate as globalMutate } from 'swr'
import type L from 'leaflet'
import { MapPin, RotateCcw } from 'lucide-react'
import type { TripItem } from '@/types'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'
import { useToast } from '@/components/UI/Toast'
import { applyAutoView } from './MapInitialCenter'

/** MapContainer 내부에서 leaflet 인스턴스를 부모로 끌어올린다. */
export function MapRefBinder({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

interface BannerProps {
  map: L.Map | null
  items: TripItem[]
  basecampCoord: [number, number] | null
  region: string | null
}

/**
 * 명시 좌표 상태 배너 + "여기를 중심으로"/"자동으로 되돌리기"(FR-027/028).
 * MapContainer 형제로 배치하는 오버레이라 leaflet 인스턴스를 prop 으로 받는다.
 */
export default function ManualCenterBanner({ map, items, basecampCoord, region }: BannerProps) {
  const trip = useOptionalTrip()
  const router = useRouter()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  if (!trip || trip.role === 'viewer' || !map) return null

  const manualActive = trip.centerSource === 'manual'

  async function patch(body: Record<string, string | number | null>) {
    if (!trip) return false
    setBusy(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        showToast({ message: data?.error ?? '저장에 실패했습니다.', type: 'error' })
        return false
      }
      globalMutate('/api/trips')
      router.refresh()
      return true
    } catch {
      showToast({ message: '네트워크 오류가 발생했습니다.', type: 'error' })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function pinHere() {
    if (!map) return
    const c = map.getCenter()
    const ok = await patch({
      center_lat: c.lat,
      center_lng: c.lng,
      default_zoom: Math.round(map.getZoom()),
      center_source: 'manual',
    })
    if (ok) showToast({ message: '현재 화면을 중심점으로 고정했어요.', type: 'success' })
  }

  async function revertAuto() {
    const ok = await patch({
      center_lat: null,
      center_lng: null,
      default_zoom: null,
      center_source: null,
    })
    if (ok && map) {
      applyAutoView(map, { items, basecampCoord, region })
      showToast({ message: '자동 중심으로 되돌렸어요.', type: 'success' })
    }
  }

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-[600] -translate-x-1/2">
      {manualActive ? (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-bg-elevated/95 px-3 py-1.5 text-xs shadow-md backdrop-blur">
          <span className="inline-flex items-center gap-1 font-medium text-fg">
            <MapPin className="size-3.5 text-accent" aria-hidden />
            직접 지정한 중심점 사용 중
          </span>
          <span className="text-fg-subtle" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={revertAuto}
            disabled={busy}
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            자동으로 되돌리기
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pinHere}
          disabled={busy}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-bg-elevated/95 px-3 py-1.5 text-xs font-medium text-fg shadow-md backdrop-blur hover:text-accent disabled:opacity-50"
        >
          <MapPin className="size-3.5" aria-hidden />
          여기를 중심으로
        </button>
      )}
    </div>
  )
}
