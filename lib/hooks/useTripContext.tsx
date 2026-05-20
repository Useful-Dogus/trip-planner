'use client'

import { createContext, useContext, type ReactNode } from 'react'

const TripIdContext = createContext<string | null>(null)

export function TripIdProvider({
  tripId,
  children,
}: {
  tripId: string
  children: ReactNode
}) {
  return <TripIdContext.Provider value={tripId}>{children}</TripIdContext.Provider>
}

export function useTripId(): string {
  const id = useContext(TripIdContext)
  if (!id) {
    throw new Error('useTripId 는 TripIdProvider 내부에서만 사용할 수 있습니다.')
  }
  return id
}

export function useOptionalTripId(): string | null {
  return useContext(TripIdContext)
}

export function buildTripPath(tripId: string, sub: string): string {
  const clean = sub.replace(/^\//, '')
  return clean ? `/trip/${tripId}/${clean}` : `/trip/${tripId}`
}

export function useTripPath(): (sub: string) => string {
  const tripId = useTripId()
  return (sub: string) => buildTripPath(tripId, sub)
}
