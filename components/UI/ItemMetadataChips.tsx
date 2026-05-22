import type { TripItem } from '@/types'
import { ITEM_FIELD_LABELS, PLACEHOLDER_LABELS } from '@/lib/itemOptions'
import TripPriorityBadge from '@/components/UI/TripPriorityBadge'
import ReservationStatusBadge from '@/components/UI/ReservationStatusBadge'
import { Chip } from '@/components/UI/Chip'

function PlaceholderChip({ label }: { label: string }) {
  return (
    <Chip variant="neutral" size="sm" className="text-fg-subtle">
      {label}
    </Chip>
  )
}

function CategoryChip({ category }: { category: TripItem['category'] | undefined }) {
  if (!category) return <PlaceholderChip label={PLACEHOLDER_LABELS.category} />
  return (
    <Chip variant="category" size="sm" category={category}>
      {category}
    </Chip>
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
      node: item.trip_priority ? (
        <TripPriorityBadge tripPriority={item.trip_priority} />
      ) : (
        <PlaceholderChip label={PLACEHOLDER_LABELS.trip_priority} />
      ),
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
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <div key={chip.key} className="flex items-center gap-1">
          {showLabels && (
            <span className="text-[11px] font-medium text-fg-subtle">{chip.label}</span>
          )}
          {chip.node}
        </div>
      ))}
    </div>
  )
}
