import type { TripPriority } from '@/types'
import { CHIP_TONE } from '@/lib/itemOptions'

export default function TripPriorityBadge({ tripPriority }: { tripPriority: TripPriority }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_TONE}`}
    >
      {tripPriority}
    </span>
  )
}
