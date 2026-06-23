'use client'

import { TriangleAlert } from 'lucide-react'
import { formatDistance, estimateTravelMinutes, formatDuration } from '@/lib/distance'
import { cn } from '@/lib/cn'

/**
 * 이 값을 넘는 직선거리 구간은 "동선이 멀다"는 정보성 경고로 위계를 올린다.
 * 직선거리 기준이라 실제 경로는 더 길다 — 보수적으로 잡는다.
 */
const FAR_LEG_KM = 2

interface DistanceSeparatorProps {
  km: number
  variant: 'desktop' | 'mobile'
}

export default function DistanceSeparator({ km, variant }: DistanceSeparatorProps) {
  const far = km >= FAR_LEG_KM
  const minutes = estimateTravelMinutes(km)
  // 이동시간은 추정이라 "약", 거리는 직선임을 정직하게 라벨링한다.
  const text = `약 ${formatDuration(minutes)} · 직선 ${formatDistance(km)}`
  const label = `다음 장소까지 ${text}${far ? ', 동선이 멀어요' : ''}`

  // 평상시 구간은 장식적 반복이라 스크린리더에서 숨기되, 먼 구간은 새 정보(경고)라 읽힌다.
  const a11y = far
    ? ({ role: 'note' as const, 'aria-label': label })
    : ({ 'aria-hidden': true as const, title: text })

  const toneText = far ? 'text-warning-fg' : 'text-fg-subtle'
  const toneLine = far ? 'bg-warning-fg/40' : 'bg-border'

  if (variant === 'desktop') {
    return (
      <div
        {...a11y}
        className={cn('flex min-w-[720px] items-center px-3 py-1 text-[11px]', toneText)}
      >
        <div className="flex w-16 flex-shrink-0 items-center justify-center">
          <span className={cn('h-3 w-px', toneLine)} />
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <span className={cn('h-px w-3', toneLine)} />
          {far && <TriangleAlert className="size-3 flex-shrink-0" aria-hidden="true" />}
          <span className="tabular-nums">{text}</span>
        </div>
      </div>
    )
  }

  return (
    <div {...a11y} className={cn('flex items-center gap-2 pl-12 pr-2', toneText)}>
      <span className={cn('h-3 w-px', toneLine)} />
      {far && <TriangleAlert className="size-3 flex-shrink-0" aria-hidden="true" />}
      <span className="text-[11px] tabular-nums">{text}</span>
    </div>
  )
}
