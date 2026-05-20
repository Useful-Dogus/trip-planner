'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import { SKIP_PERSIST_FLAG, SWR_CACHE_KEY as CACHE_KEY, SWR_TIMESTAMP_KEY as TIMESTAMP_KEY } from '@/lib/clearAppCache'

const TTL_MS = 24 * 60 * 60 * 1000

function localStorageProvider() {
  if (typeof window === 'undefined') return new Map()

  const timestamp = localStorage.getItem(TIMESTAMP_KEY)
  const cacheAge = timestamp ? Date.now() - parseInt(timestamp) : Infinity

  let map: Map<string, unknown>
  if (cacheAge < TTL_MS) {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      map = new Map(cached ? JSON.parse(cached) : [])
    } catch {
      map = new Map()
    }
  } else {
    map = new Map()
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(TIMESTAMP_KEY)
  }

  window.addEventListener('beforeunload', () => {
    // clearAppCache() 가 로그인/로그아웃 직전에 이 플래그를 세우면 write 건너뜀.
    // (그러지 않으면 in-memory map 이 다시 localStorage 로 흘러나가 이전 사용자의
    // 데이터가 다음 사용자에게 노출됨)
    if ((window as unknown as Record<string, unknown>)[SKIP_PERSIST_FLAG]) {
      try {
        localStorage.removeItem(CACHE_KEY)
        localStorage.removeItem(TIMESTAMP_KEY)
      } catch {
        // ignore
      }
      return
    }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(map.entries())))
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString())
    } catch {
      // storage unavailable
    }
  })

  return map
}

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        revalidateOnFocus: true,
        focusThrottleInterval: 30_000,
        revalidateOnReconnect: true,
        dedupingInterval: 5_000,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  )
}
