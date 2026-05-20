'use client'

import { clearAppCache } from '@/lib/clearAppCache'

/**
 * 클라이언트 로그아웃 일원화 헬퍼.
 * - /api/auth/logout 호출
 * - 앱 로컬 캐시 클리어
 * - /login 으로 하드 리로드 (state 완전 초기화)
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    clearAppCache()
    window.location.href = '/login'
  }
}
