'use client'

import { TriangleAlert } from 'lucide-react'
import type { TripItem } from '@/types'
import { getScheduleWarnings } from '@/lib/scheduleWarnings'

/**
 * 항목의 시간/예약 위반(#261)을 정보성 경고 칩으로 노출한다.
 * 위반이 없으면 아무것도 렌더하지 않는다(값 없으면 경고 없음).
 */
export default function ItemWarnings({
  item,
  todayKey,
  className,
}: {
  item: TripItem
  todayKey: string
  className?: string
}) {
  const warnings = getScheduleWarnings(item, todayKey)
  if (warnings.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ''}`}>
      {warnings.map((w) => (
        <span
          key={w.kind}
          role="note"
          className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning-fg"
        >
          <TriangleAlert className="size-2.5 flex-shrink-0" aria-hidden="true" />
          {w.message}
        </span>
      ))}
    </div>
  )
}
