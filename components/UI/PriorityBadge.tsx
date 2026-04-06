import type { Priority } from '@/types'
import { CHIP_TONE, normalizePriority } from '@/lib/itemOptions'

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const normalized = normalizePriority(priority) ?? '시간 남으면'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_TONE}`}
    >
      {normalized}
    </span>
  )
}
