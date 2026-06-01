'use client'

import { useEffect, useRef, useState } from 'react'
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
 * 지도 중심점 오버플로 메뉴(FR-027/028).
 * 상시 텍스트 배너 대신 디스크릿 아이콘 버튼 + 팝오버로 지도뷰 chrome 을 최소화한다.
 * manual 상태일 때만 버튼에 점 배지로 상태를 노출한다.
 * MapContainer 형제로 배치하는 오버레이라 leaflet 인스턴스를 prop 으로 받는다.
 */
export default function ManualCenterBanner({ map, items, basecampCoord, region }: BannerProps) {
  const trip = useOptionalTrip()
  const router = useRouter()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

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
    setOpen(false)
    if (ok) showToast({ message: '현재 화면을 중심점으로 고정했어요.', type: 'success' })
  }

  async function revertAuto() {
    const ok = await patch({
      center_lat: null,
      center_lng: null,
      default_zoom: null,
      center_source: null,
    })
    setOpen(false)
    if (ok && map) {
      applyAutoView(map, { items, basecampCoord, region })
      showToast({ message: '자동 중심으로 되돌렸어요.', type: 'success' })
    }
  }

  return (
    <div ref={ref} className="absolute bottom-3 left-3 z-[600]">
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-44 rounded-lg border border-border bg-bg-elevated p-1 shadow-lg">
          <p className="px-2 py-1 text-[11px] font-medium text-fg-subtle">지도 중심점</p>
          <button
            type="button"
            onClick={pinHere}
            disabled={busy}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-fg hover:bg-bg-subtle disabled:opacity-50"
          >
            <MapPin className="size-3.5 text-accent" aria-hidden />
            여기를 중심으로
          </button>
          {manualActive && (
            <button
              type="button"
              onClick={revertAuto}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-fg hover:bg-bg-subtle disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              자동으로 되돌리기
            </button>
          )}
          {manualActive && (
            <p className="px-2 pt-1 text-[11px] text-fg-subtle">직접 지정한 중심점 사용 중</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="지도 중심점 설정"
        aria-expanded={open}
        className="relative inline-flex size-9 items-center justify-center rounded-full bg-bg-elevated/95 text-fg shadow-md backdrop-blur hover:text-accent"
      >
        <MapPin className="size-4" aria-hidden />
        {manualActive && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-accent ring-2 ring-bg-elevated" />
        )}
      </button>
    </div>
  )
}
