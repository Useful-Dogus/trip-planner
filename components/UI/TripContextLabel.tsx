'use client'

import { useOptionalTrip } from '@/lib/hooks/useTripContext'

export default function TripContextLabel({ className = '' }: { className?: string }) {
  const trip = useOptionalTrip()
  if (!trip) return null
  const range =
    trip.startDate && trip.endDate
      ? `${trip.startDate} - ${trip.endDate}`
      : trip.startDate ?? trip.endDate
  return (
    <div className={`truncate text-xs font-medium text-fg-subtle ${className}`}>
      <span className="truncate">{trip.title}</span>
      {range ? <span className="text-fg-subtle/70"> · {range}</span> : null}
    </div>
  )
}
