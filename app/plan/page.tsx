'use client'

import { Suspense } from 'react'
import PlanScreen from '@/components/Plan/PlanScreen'

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanScreen basePath="/plan" />
    </Suspense>
  )
}
