'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'
import {
  SKIP_PERSIST_FLAG,
  pruneOtherUserSwrCaches,
  swrCacheKeyFor,
  swrTimestampKeyFor,
} from '@/lib/clearAppCache'

const TTL_MS = 24 * 60 * 60 * 1000

function makeLocalStorageProvider(userId: string | null) {
  return function localStorageProvider() {
    if (typeof window === 'undefined') return new Map()

    // 마운트 시점에 다른 user 의 캐시 잔재 제거 — 계정 전환 후 첫 페인트 누수 방지.
    pruneOtherUserSwrCaches(userId)

    const cacheKey = swrCacheKeyFor(userId)
    const timestampKey = swrTimestampKeyFor(userId)

    const timestamp = localStorage.getItem(timestampKey)
    const cacheAge = timestamp ? Date.now() - parseInt(timestamp) : Infinity

    let map: Map<string, unknown>
    if (cacheAge < TTL_MS) {
      try {
        const cached = localStorage.getItem(cacheKey)
        map = new Map(cached ? JSON.parse(cached) : [])
      } catch {
        map = new Map()
      }
    } else {
      map = new Map()
      localStorage.removeItem(cacheKey)
      localStorage.removeItem(timestampKey)
    }

    window.addEventListener('beforeunload', () => {
      // clearAppCache() 가 로그인/로그아웃 직전에 이 플래그를 세우면 write 건너뜀.
      // (그러지 않으면 in-memory map 이 다시 localStorage 로 흘러나가 이전 사용자의
      // 데이터가 다음 사용자에게 노출됨)
      if ((window as unknown as Record<string, unknown>)[SKIP_PERSIST_FLAG]) {
        try {
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(timestampKey)
        } catch {
          // ignore
        }
        return
      }
      try {
        localStorage.setItem(cacheKey, JSON.stringify(Array.from(map.entries())))
        localStorage.setItem(timestampKey, Date.now().toString())
      } catch {
        // storage unavailable
      }
    })

    return map
  }
}

export function SWRProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId: string | null
}) {
  return (
    <SWRConfig
      value={{
        // key 에 userId 를 박아 같은 SWRConfig 인스턴스가 사용자 전환 시 새 캐시 슬롯을 쓰게 한다.
        // (SWRConfig 가 리마운트되면 provider 함수가 다시 호출됨)
        provider: makeLocalStorageProvider(userId),
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
