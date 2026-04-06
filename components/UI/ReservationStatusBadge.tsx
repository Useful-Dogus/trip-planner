import type { ReservationStatus } from '@/types'
import { CHIP_TONE, normalizeReservationStatus } from '@/lib/itemOptions'

export default function ReservationStatusBadge({
  reservationStatus,
}: {
  reservationStatus: ReservationStatus
}) {
  const normalized = normalizeReservationStatus(reservationStatus) ?? '확인 필요'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CHIP_TONE}`}
    >
      {normalized}
    </span>
  )
}
