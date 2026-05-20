import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'

type Props = { item: TripItem }

function formatTimeRange(item: TripItem): string | null {
  if (item.time_start && item.time_end) return `${item.time_start} – ${item.time_end}`
  if (item.time_start) return item.time_start
  return null
}

export default function SharedItemCard({ item }: Props) {
  const meta = CATEGORY_META[item.category]
  const time = formatTimeRange(item)

  return (
    <article className="rounded-lg border border-border bg-bg-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2 py-0.5 text-xs font-medium text-fg-subtle">
              <span aria-hidden="true">{meta?.emoji}</span>
              {item.category}
            </span>
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
