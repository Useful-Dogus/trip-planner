'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, LogOut, User } from 'lucide-react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { logout } from '@/lib/auth-client'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { cn } from '@/lib/cn'

/**
 * 데스크탑 우상단 아바타 드롭다운 (#206).
 *
 * 목적: user-scope (프로필·테마·로그아웃) 와 trip-scope (목록·지도·일정) 의 IA 완전 분리.
 * 사이드바는 trip-scope 만 남기고 user-scope 는 여기로.
 *
 * - 데스크탑(md+) 은 항상 렌더.
 * - 모바일은 trip 컨텍스트 밖(대시보드·/me 등)에서만 렌더 — trip 페이지는 하단 네비
 *   ‟더보기" 시트가 user-scope 를 덮으므로 중복 방지로 숨긴다 (#310).
 * - 글로벌 위치 (fixed top-right) — 페이지 전환과 무관.
 * - 로그인 상태가 아니면 렌더 안 함.
 * - trip 컨텍스트 안에선 ‟내 여행 목록" 도 메뉴에 포함 — 사이드바에서 옮긴 진입점.
 */
export default function AvatarDropdown() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 클라이언트에서 사용자 이메일 한 번 읽기 — 인증 상태 표시용
  useEffect(() => {
    let cancelled = false
    const supabase = getBrowserSupabase()
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string | null } | null } }) => {
      if (cancelled) return
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return
        setEmail(session?.user?.email ?? null)
      },
    )
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // 바깥 클릭 / Esc 로 닫기
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // 페이지 이동 시 자동 닫기
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // 로그인 상태 아니면 렌더 안 함 (e.g. /login, /signup)
  if (!email) return null

  // 인증 전용 라우트에서는 노출 안 함
  const HIDE_ON = ['/login', '/signup', '/forgot', '/auth/']
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null

  const inTripContext = /^\/trip\/[0-9a-fA-F-]{36}/.test(pathname)
  const initial = (email[0] ?? '?').toUpperCase()

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed top-3 right-4 z-40',
        // trip 컨텍스트 안에서는 모바일 하단 네비가 user-scope 를 덮으므로 데스크탑만,
        // 밖(대시보드 등)에서는 모바일에서도 유저메뉴 진입점이 된다 (#310).
        inTripContext ? 'hidden md:block' : 'block',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`내 계정 메뉴 (${email})`}
        className={cn(
          'inline-flex items-center justify-center size-9 rounded-full',
          'bg-bg-elevated border border-border text-sm font-semibold text-fg',
          'hover:bg-bg-subtle transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 mt-2 w-64 rounded-xl border border-border bg-bg-elevated shadow-lg',
            'p-2 space-y-0.5',
          )}
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-[11px] text-fg-subtle">로그인됨</p>
            <p className="text-sm text-fg truncate" title={email}>
              {email}
            </p>
          </div>
          {inTripContext && (
            <Link
              role="menuitem"
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-fg hover:bg-bg-subtle transition-colors"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              <span>내 여행 목록</span>
            </Link>
          )}
          <Link
            role="menuitem"
            href="/me"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-fg hover:bg-bg-subtle transition-colors"
          >
            <User className="size-4 shrink-0" aria-hidden="true" />
            <span>프로필</span>
          </Link>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-fg">
            <span>테마</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-critical-fg hover:bg-bg-subtle transition-colors w-full text-left"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  )
}
