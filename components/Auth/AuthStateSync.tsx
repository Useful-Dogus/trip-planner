'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { clearAppCache } from '@/lib/clearAppCache'

/**
 * Supabase 클라이언트 세션 변화와 SWR/localStorage 캐시 일관성을 잇는 글로벌 리스너.
 *
 * - SIGNED_OUT: 캐시 전체 폐기 후 /login 으로 하드 리로드.
 * - SIGNED_IN / USER_UPDATED: 서버가 인식하는 user 와 클라이언트 세션이 다르면
 *   (= 계정 전환) 캐시 폐기 + 페이지 새로고침으로 SSR 데이터 재페치.
 *
 * 매 이벤트마다 무조건 clear 하지 않는다 — 같은 user 의 TOKEN_REFRESHED 같은 정상 이벤트에서
 * 캐시 폭파는 과잉 반응.
 */
export default function AuthStateSync({ initialUserId }: { initialUserId: string | null }) {
  const router = useRouter()
  const lastSeenUserId = useRef<string | null>(initialUserId)

  useEffect(() => {
    const supabase = getBrowserSupabase()
    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      const nextUserId = session?.user?.id ?? null

      if (event === 'SIGNED_OUT') {
        if (lastSeenUserId.current !== null) {
          clearAppCache()
          // 모든 SWR 캐시 키 무효화 (서버 데이터 재페치 강제). second arg=undefined + revalidate=false 로 즉시 비움.
          mutate(() => true, undefined, { revalidate: false })
        }
        lastSeenUserId.current = null
        return
      }

      // SIGNED_IN, INITIAL_SESSION, USER_UPDATED, TOKEN_REFRESHED 등
      if (nextUserId && nextUserId !== lastSeenUserId.current) {
        // 사용자가 실제로 바뀐 경우에만 캐시 폐기 + 서버 컴포넌트 재페치.
        if (lastSeenUserId.current !== null) {
          clearAppCache()
          mutate(() => true, undefined, { revalidate: false })
          router.refresh()
        }
        lastSeenUserId.current = nextUserId
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [router])

  return null
}
