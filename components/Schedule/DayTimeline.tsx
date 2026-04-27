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
  if (item.time_start && item.time_end) return `${item.time_start} - ${item.time_end}`
  if (item.time_start) return item.time_start
  return '시간 미정'
}

export default function DayTimeline({ items, selectedItemId, onSelectItem }: DayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-fg-subtle">
        이 날에 배정된 스톱이 없습니다
      </div>
    )
  }

  return (
    <ol className="flex flex-col">
      {items.map((item, idx) => {
        const prev = idx > 0 ? items[idx - 1] : null
        const km = prev ? distance(prev, item) : null
        const emoji = CATEGORY_META[item.category]?.emoji ?? '📌'
        const color = CATEGORY_META[item.category]?.color ?? '#cbd5e1'
        const active = item.id === selectedItemId
        return (
          <Fragment key={item.id}>
            {km != null && (
              <li
                aria-hidden="true"
                className="flex items-center gap-2 pl-7 pr-4 py-1 text-[10px] tabular-nums text-fg-subtle"
              >
                <span className="inline-block h-3 w-px bg-gray-200" />
                <span>{formatDistance(km)}</span>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={() => onSelectItem(item.id)}
                className={`flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors ${
                  active ? 'bg-bg-subtle' : 'hover:bg-bg-subtle'
                }`}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">{emoji}</span>
                    <span className="truncate text-xs font-semibold text-fg">
                      {item.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] tabular-nums text-fg-muted">
                    {formatTime(item)}
                  </span>
                </span>
              </button>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
