import type { ReservationStatus } from '@/types'
import { normalizeReservationStatus, RESERVATION_STATUS_META } from '@/lib/itemOptions'

export default function ReservationStatusBadge({
  reservationStatus,
}: {
  reservationStatus: ReservationStatus
}) {
  const normalized = normalizeReservationStatus(reservationStatus) ?? '확인 필요'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESERVATION_STATUS_META[normalized].tone}`}
    >
      {normalized}
    </span>
  )
}
