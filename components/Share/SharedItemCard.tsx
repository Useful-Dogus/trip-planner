import type { TripItem } from '@/types'
import { Chip } from '@/components/UI/Chip'

type Props = { item: TripItem }

function formatTimeRange(item: TripItem): string | null {
  if (item.time_start && item.time_end) return `${item.time_start} – ${item.time_end}`
  if (item.time_start) return item.time_start
  return null
}

export default function SharedItemCard({ item }: Props) {
  const time = formatTimeRange(item)

  return (
    <article className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Chip variant="category" size="sm" category={item.category}>
              {item.category}
            </Chip>
            {time && <span className="text-xs text-fg-subtle tabular">{time}</span>}
          </div>
          <h3 className="text-base font-semibold text-fg break-words">{item.name}</h3>
          {item.address && (
            <p className="text-sm text-fg-subtle mt-1 break-words">{item.address}</p>
          )}
          {item.memo && (
            <p className="text-sm text-fg-muted mt-2 whitespace-pre-wrap break-words">
              {item.memo}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
