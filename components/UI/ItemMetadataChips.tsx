import type { TripItem } from '@/types'
import {
  CHIP_TONE,
  ITEM_FIELD_LABELS,
  PLACEHOLDER_LABELS,
  PLACEHOLDER_TONE,
} from '@/lib/itemOptions'
import TripPriorityBadge from '@/components/UI/TripPriorityBadge'
import ReservationStatusBadge from '@/components/UI/ReservationStatusBadge'

function PlaceholderChip({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PLACEHOLDER_TONE}`}>
      {label}
    </span>
  )
}

function CategoryChip({ category }: { category: TripItem['category'] | undefined }) {
  if (!category) return <PlaceholderChip label={PLACEHOLDER_LABELS.category} />
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CHIP_TONE}`}>
      {category}
    </span>
  )
}

export default function ItemMetadataChips({
  item,
  showLabels = false,
}: {
  item: TripItem
  showLabels?: boolean
}) {
  const chips = [
    {
      key: 'category',
      label: ITEM_FIELD_LABELS.category,
      node: <CategoryChip category={item.category} />,
    },
    {
      key: 'trip_priority',
      label: ITEM_FIELD_LABELS.trip_priority,
      node: item.trip_priority
        ? <TripPriorityBadge tripPriority={item.trip_priority} />
        : <PlaceholderChip label={PLACEHOLDER_LABELS.trip_priority} />,
    },
    {
      key: 'reservation_status',
      label: ITEM_FIELD_LABELS.reservation_status,
      node: item.reservation_status ? (
        <ReservationStatusBadge reservationStatus={item.reservation_status} />
      ) : (
        <PlaceholderChip label={PLACEHOLDER_LABELS.reservation_status} />
      ),
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(chip => (
        <div key={chip.key} className="flex items-center gap-1.5">
          {showLabels && <span className="text-[11px] font-medium text-gray-400">{chip.label}</span>}
          {chip.node}
        </div>
      ))}
    </div>
  )
}
