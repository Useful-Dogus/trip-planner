import type { Priority } from '@/types'
import { normalizePriority, PRIORITY_META } from '@/lib/itemOptions'

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const normalized = normalizePriority(priority) ?? '시간 남으면'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_META[normalized].tone}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[normalized].dot}`} />
      {normalized}
    </span>
  )
}
