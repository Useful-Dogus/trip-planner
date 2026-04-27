'use client'

import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * /map 은 /plan 으로 통합되었습니다.
 * 북마크 호환을 위해 search params 를 그대로 넘기며 redirect 합니다.
 */
export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapRedirect />
    </Suspense>
  )
}

function MapRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    router.replace(qs ? `/plan?${qs}` : '/plan')
  }, [router, searchParams])

  return null
}
