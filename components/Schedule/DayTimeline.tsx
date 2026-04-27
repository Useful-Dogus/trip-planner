'use client'

import { Fragment } from 'react'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import { formatDistance, haversineKm } from '@/lib/distance'

interface DayTimelineProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

function distance(a: TripItem, b: TripItem): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const km = haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
  if (km < 0.05) return null
  return km
}

function formatTime(item: TripItem): string {
  if (item.time_start && item.time_end) return `${item.time_start}-${item.time_end}`
  if (item.time_start) return item.time_start
  return '시간 미정'
}

export default function DayTimeline({ items, selectedItemId, onSelectItem }: DayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-gray-400">
        이 날에 배정된 스톱이 없습니다
      </div>
    )
  }

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto px-3 py-3" style={{ scrollbarWidth: 'thin' }}>
      {items.map((item, idx) => {
        const prev = idx > 0 ? items[idx - 1] : null
        const km = prev ? distance(prev, item) : null
        const emoji = CATEGORY_META[item.category]?.emoji ?? '📌'
        const color = CATEGORY_META[item.category]?.color ?? '#cbd5e1'
        const active = item.id === selectedItemId
        return (
          <Fragment key={item.id}>
            {km != null && (
              <div
                aria-hidden="true"
                className="flex flex-shrink-0 items-center px-1.5 text-[10px] tabular-nums text-gray-400"
              >
                <span className="inline-block h-px w-3 bg-gray-200" />
                <span className="px-1">{formatDistance(km)}</span>
                <span className="inline-block h-px w-3 bg-gray-200" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelectItem(item.id)}
              className={`flex-shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                  : 'border-gray-200 bg-white hover:border-gray-400'
              }`}
              style={{ minWidth: 180, maxWidth: 220, borderLeftWidth: 3, borderLeftColor: color }}
            >
              <div className="flex items-center gap-1.5 text-[10px] tabular-nums text-gray-500">
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white"
                >
                  {idx + 1}
                </span>
                <span>{formatTime(item)}</span>
              </div>
              <div className="mt-1 flex items-start gap-1.5">
                <span className="text-sm leading-tight">{emoji}</span>
                <span className="line-clamp-2 text-xs font-semibold leading-tight text-gray-900">
                  {item.name}
                </span>
              </div>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
