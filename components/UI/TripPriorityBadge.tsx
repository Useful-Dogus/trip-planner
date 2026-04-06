import type { TripPriority } from '@/types'
import { TRIP_PRIORITY_META } from '@/lib/itemOptions'

export default function TripPriorityBadge({ tripPriority }: { tripPriority: TripPriority }) {
  const meta = TRIP_PRIORITY_META[tripPriority]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
      style={meta.style}
    >
      {meta.emoji} {tripPriority}
    </span>
  )
}
