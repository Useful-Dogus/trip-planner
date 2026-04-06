import type { ReservationStatus } from '@/types'
import { RESERVATION_STATUS_META, normalizeReservationStatus } from '@/lib/itemOptions'

export default function ReservationStatusBadge({
  reservationStatus,
}: {
  reservationStatus: ReservationStatus
}) {
  const normalized = normalizeReservationStatus(reservationStatus) ?? '확인 필요'
  const meta = RESERVATION_STATUS_META[normalized]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
      style={meta.style}
    >
      {meta.emoji} {normalized}
    </span>
  )
}
