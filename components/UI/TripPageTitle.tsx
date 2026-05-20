'use client'

import { useOptionalTrip } from '@/lib/hooks/useTripContext'

function formatRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  if (start && end) return `${start} - ${end}`
  return start ?? end
}

export default function TripPageTitle({ section }: { section: string }) {
  const trip = useOptionalTrip()
  const range = trip ? formatRange(trip.startDate, trip.endDate) : null
  return (
    <div className="min-w-0">
      {trip ? (
        <div className="truncate text-xs font-medium text-fg-subtle">
          <span className="truncate">{trip.title}</span>
          {range ? <span className="text-fg-subtle/70"> · {range}</span> : null}
        </div>
      ) : null}
      <h1 className="text-xl font-bold text-fg">{section}</h1>
    </div>
  )
}
