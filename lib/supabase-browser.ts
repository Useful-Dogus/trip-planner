'use client'

import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let cached: ReturnType<typeof createBrowserClient> | null = null

/**
 * 브라우저(클라이언트 컴포넌트) 전용 Supabase 클라이언트.
 * - 같은 탭 안에서 한 번만 만들고 재사용 — onAuthStateChange 리스너 중복 방지.
 * - 서버에서 호출되면 에러 (assert).
 */
export function getBrowserSupabase() {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabase() must only be called in the browser')
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.')
  }
  if (!cached) {
    cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return cached
}
