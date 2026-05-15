import type { TripPriority } from '@/types'
import { TRIP_PRIORITY_META } from '@/lib/itemOptions'
import { cn } from '@/lib/cn'

interface Props {
  tripPriority: TripPriority
  size?: 'sm' | 'md'
  showEmoji?: boolean
  className?: string
}

export default function TripPriorityBadge({
  tripPriority,
  size = 'md',
  showEmoji = true,
  className,
}: Props) {
  const meta = TRIP_PRIORITY_META[tripPriority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        meta.className,
        className,
      )}
    >
      {showEmoji && (
        <span aria-hidden="true">{meta.emoji}</span>
      )}
      {tripPriority}
    </span>
  )
}
