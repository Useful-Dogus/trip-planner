import type { Status } from '@/types'
import { normalizeStatus, STATUS_META } from '@/lib/itemOptions'

export default function StatusBadge({ status }: { status: Status }) {
  const normalized = normalizeStatus(status)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_META[normalized].tone}`}
    >
      {normalized}
    </span>
  )
}
