'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface VitalsSample {
  name: string
  value: number
  id: string
  rating?: string
  navigationType?: string
  pathname: string
  ts: number
}

declare global {
  interface Window {
    __tpVitals?: VitalsSample[]
  }
}

const MAX_BUFFER = 200

/**
 * #234 — 페이지 전환 baseline 측정.
 * Next.js 내장 useReportWebVitals 로 LCP/INP/CLS/FCP/TTFB 수집.
 * - 콘솔에 구조화된 로그 출력 (`[web-vitals]` prefix)
 * - window.__tpVitals 에 마지막 200건 버퍼링 — 데스크탑 콘솔에서 `copy(__tpVitals)` 로 추출
 *
 * 측정 대상 핵심 전환 (이슈 #234):
 *  1) /login → /dashboard
 *  2) /dashboard → /trip/[id]/list
 *  3) list ↔ map ↔ schedule
 *  4) /trip/[id]/gmaps-import → /trip/[id]/list
 *
 * 최적화는 후속 PR 에서 baseline 데이터 기준으로 진행.
 */
export default function WebVitalsReporter() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useReportWebVitals((metric) => {
    const sample: VitalsSample = {
      name: metric.name,
      value: Math.round(metric.value * 100) / 100,
      id: metric.id,
      rating: (metric as { rating?: string }).rating,
      navigationType: (metric as { navigationType?: string }).navigationType,
      pathname: pathnameRef.current,
      ts: Date.now(),
    }

    if (typeof window !== 'undefined') {
      if (!window.__tpVitals) window.__tpVitals = []
      window.__tpVitals.push(sample)
      if (window.__tpVitals.length > MAX_BUFFER) {
        window.__tpVitals.splice(0, window.__tpVitals.length - MAX_BUFFER)
      }
    }

    if (
      typeof process !== 'undefined' &&
      (process.env.NODE_ENV !== 'production' ||
        process.env.NEXT_PUBLIC_VITALS_DEBUG === '1')
    ) {
      // eslint-disable-next-line no-console
      console.log('[web-vitals]', sample)
    }
  })

  return null
}
