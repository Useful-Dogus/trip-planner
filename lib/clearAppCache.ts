// 로그인/로그아웃/회원가입 시 호출. 이전 사용자의 SWR 캐시가
// 다음 사용자에게 노출되는 것을 막는다.
//
// SWRProvider 의 beforeunload 핸들러는 페이지 떠날 때 in-memory 캐시를
// localStorage 에 다시 써넣으므로, 단순히 localStorage.removeItem 만으로는
// navigation 직후 다시 채워진다. window 플래그로 핸들러를 무력화한 뒤 제거한다.

// Legacy 전역 키 (이전 빌드에서 모든 사용자가 공유). 청소용으로만 참조한다.
export const SWR_CACHE_KEY_LEGACY = 'trip-planner-swr-cache'
export const SWR_TIMESTAMP_KEY_LEGACY = 'trip-planner-swr-timestamp'

export const SWR_CACHE_KEY_PREFIX = 'trip-planner-swr-cache:'
export const SWR_TIMESTAMP_KEY_PREFIX = 'trip-planner-swr-timestamp:'
export const SKIP_PERSIST_FLAG = '__tripPlannerSkipSwrPersist'

export function swrCacheKeyFor(userId: string | null): string {
  return `${SWR_CACHE_KEY_PREFIX}${userId ?? 'anon'}`
}

export function swrTimestampKeyFor(userId: string | null): string {
  return `${SWR_TIMESTAMP_KEY_PREFIX}${userId ?? 'anon'}`
}

/**
 * 로그인/로그아웃/회원가입/계정 전환 시 호출.
 * 모든 trip-planner-swr-cache* / -timestamp* 키 + legacy 전역 키 제거.
 */
export function clearAppCache(): void {
  if (typeof window === 'undefined') return
  ;(window as unknown as Record<string, unknown>)[SKIP_PERSIST_FLAG] = true
  try {
    localStorage.removeItem(SWR_CACHE_KEY_LEGACY)
    localStorage.removeItem(SWR_TIMESTAMP_KEY_LEGACY)
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith(SWR_CACHE_KEY_PREFIX) || k.startsWith(SWR_TIMESTAMP_KEY_PREFIX)) {
        toRemove.push(k)
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // storage unavailable
  }
}

/**
 * 현재 사용자(userId) 외의 다른 user 캐시 키만 정리한다.
 * SWRProvider 가 마운트될 때 호출 — 계정 전환 시 이전 사용자의 잔재를 제거.
 */
export function pruneOtherUserSwrCaches(currentUserId: string | null): void {
  if (typeof window === 'undefined') return
  const keepCache = swrCacheKeyFor(currentUserId)
  const keepTs = swrTimestampKeyFor(currentUserId)
  try {
    localStorage.removeItem(SWR_CACHE_KEY_LEGACY)
    localStorage.removeItem(SWR_TIMESTAMP_KEY_LEGACY)
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const isSwrKey =
        k.startsWith(SWR_CACHE_KEY_PREFIX) || k.startsWith(SWR_TIMESTAMP_KEY_PREFIX)
      if (isSwrKey && k !== keepCache && k !== keepTs) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
