import type { Status } from '@/types'
import { CHIP_TONE, normalizeStatus } from '@/lib/itemOptions'

export default function StatusBadge({ status }: { status: Status }) {
  const normalized = normalizeStatus(status)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_TONE}`}
    >
      {normalized}
    </span>
  )
}
