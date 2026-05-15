'use client'

import { formatDistance } from '@/lib/distance'

interface DistanceSeparatorProps {
  km: number
  variant: 'desktop' | 'mobile'
}

export default function DistanceSeparator({ km, variant }: DistanceSeparatorProps) {
  if (variant === 'desktop') {
    return (
      <div
        aria-hidden="true"
        className="flex min-w-[720px] items-center px-3 py-1 text-[11px] text-fg-subtle"
      >
        <div className="flex w-16 flex-shrink-0 items-center justify-center">
          <span className="h-3 w-px bg-border" />
        </div>
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <span className="h-px w-3 bg-border" />
          <span className="tabular-nums">{formatDistance(km)}</span>
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="flex items-center gap-2 pl-12 pr-2">
      <span className="h-3 w-px bg-border" />
      <span className="text-[11px] tabular-nums text-fg-subtle">{formatDistance(km)}</span>
    </div>
  )
}
