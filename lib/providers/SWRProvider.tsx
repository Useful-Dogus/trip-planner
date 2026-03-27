'use client'

import { ReactNode } from 'react'
import { SWRConfig } from 'swr'

const CACHE_KEY = 'trip-planner-swr-cache'
const TIMESTAMP_KEY = 'trip-planner-swr-timestamp'
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
