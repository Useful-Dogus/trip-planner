// 로그인/로그아웃/회원가입 시 호출. 이전 사용자의 SWR 캐시가
// 다음 사용자에게 노출되는 것을 막는다.
//
// SWRProvider 의 beforeunload 핸들러는 페이지 떠날 때 in-memory 캐시를
// localStorage 에 다시 써넣으므로, 단순히 localStorage.removeItem 만으로는
// navigation 직후 다시 채워진다. window 플래그로 핸들러를 무력화한 뒤 제거한다.

export const SWR_CACHE_KEY = 'trip-planner-swr-cache'
export const SWR_TIMESTAMP_KEY = 'trip-planner-swr-timestamp'
export const SKIP_PERSIST_FLAG = '__tripPlannerSkipSwrPersist'

export function clearAppCache(): void {
  if (typeof window === 'undefined') return
  ;(window as unknown as Record<string, unknown>)[SKIP_PERSIST_FLAG] = true
  try {
    localStorage.removeItem(SWR_CACHE_KEY)
    localStorage.removeItem(SWR_TIMESTAMP_KEY)
  } catch {
    // storage unavailable
  }
}
