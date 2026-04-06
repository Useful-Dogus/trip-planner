import type { ReservationStatus } from '@/types'
import { RESERVATION_STATUS_META } from '@/lib/itemOptions'

export default function ReservationStatusBadge({
  reservationStatus,
}: {
  reservationStatus: ReservationStatus
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESERVATION_STATUS_META[reservationStatus].tone}`}
    >
      {reservationStatus}
    </span>
  )
}
