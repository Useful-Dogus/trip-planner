import type { ReservationStatus } from '@/types'
import { RESERVATION_STATUS_META, normalizeReservationStatus } from '@/lib/itemOptions'
import { cn } from '@/lib/cn'

interface Props {
  reservationStatus: ReservationStatus
  size?: 'sm' | 'md'
  showEmoji?: boolean
  className?: string
}

export default function ReservationStatusBadge({
  reservationStatus,
  size = 'md',
  showEmoji = true,
  className,
}: Props) {
  const normalized = normalizeReservationStatus(reservationStatus) ?? '확인 필요'
  const meta = RESERVATION_STATUS_META[normalized]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        meta.className,
        className,
      )}
    >
      {showEmoji && <span aria-hidden="true">{meta.emoji}</span>}
      {normalized}
    </span>
  )
}
