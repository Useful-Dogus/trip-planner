import type { Priority } from '@/types'
import { PRIORITY_META } from '@/lib/itemOptions'

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_META[priority].tone}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[priority].dot}`} />
      {priority}
    </span>
  )
}
