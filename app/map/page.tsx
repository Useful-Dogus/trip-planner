'use client'

import { Suspense } from 'react'
import PlanScreen from '@/components/Plan/PlanScreen'

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <PlanScreen basePath="/map" />
    </Suspense>
  )
}
