'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import PlanScreen from '@/components/Plan/PlanScreen'
import { buildTripPath } from '@/lib/hooks/useTripContext'

export default function MapPage() {
  const params = useParams()
  const tripId = params?.tripId as string
  return (
    <Suspense fallback={null}>
      <PlanScreen basePath={buildTripPath(tripId, 'map')} />
    </Suspense>
  )
}
