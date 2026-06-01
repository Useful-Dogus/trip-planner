'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type TripRole = 'owner' | 'editor' | 'viewer'

export type TripContextValue = {
  id: string
  title: string
  startDate: string | null
  endDate: string | null
  region: string | null
  basecampAddress: string | null
  centerLat: number | null
  centerLng: number | null
  defaultZoom: number | null
  centerSource: 'auto' | 'manual' | null
  currency: string
  role: TripRole
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({
  value,
  children,
}: {
  value: TripContextValue
  children: ReactNode
}) {
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip(): TripContextValue {
  const value = useContext(TripContext)
  if (!value) {
    throw new Error('useTrip 은 TripProvider 내부에서만 사용할 수 있습니다.')
  }
  return value
}

export function useOptionalTrip(): TripContextValue | null {
  return useContext(TripContext)
}

export function useTripId(): string {
  return useTrip().id
}

export function useOptionalTripId(): string | null {
  return useContext(TripContext)?.id ?? null
}

export function buildTripPath(tripId: string, sub: string): string {
  const clean = sub.replace(/^\//, '')
  return clean ? `/trip/${tripId}/${clean}` : `/trip/${tripId}`
}

export function useTripPath(): (sub: string) => string {
  const tripId = useTripId()
  return (sub: string) => buildTripPath(tripId, sub)
}
