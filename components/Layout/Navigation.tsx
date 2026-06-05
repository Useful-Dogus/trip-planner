'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, List, Map, CalendarDays, Download, LogOut, MoreHorizontal, User, Loader2 } from 'lucide-react'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import Sheet, { SheetSection } from '@/components/UI/Sheet'
import { cn } from '@/lib/cn'
import { logout } from '@/lib/auth-client'
import { useOptionalTripId, buildTripPath } from '@/lib/hooks/useTripContext'

interface NavItem {
  sub: string
  label: string
  icon: typeof List
}

const NAV_ITEMS: NavItem[] = [
  { sub: 'list', label: '목록', icon: List },
  { sub: 'map', label: '지도', icon: Map },
  { sub: 'schedule', label: '일정', icon: CalendarDays },
]

const handleLogout = logout

function legacyHref(sub: string): string {
  return `/${sub}`
}

export default function Navigation() {
  const pathname = usePathname()
  const tripId = useOptionalTripId()
  const [moreOpen, setMoreOpen] = useState(false)
  // 클릭 직후 즉시 "눌림" 표시를 위한 지연된 활성 href.
  // pathname 이 실제로 바뀌기 전까지 사용자에게 "이 항목으로 가고 있음" 을 표시한다 (#233).
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const hrefFor = (sub: string): string =>
    tripId ? buildTripPath(tripId, sub) : legacyHref(sub)

  const isActive = (sub: string): boolean => {
    const href = hrefFor(sub)
    return pathname.startsWith(href)
  }

  // pathname 이 pending href 와 같은 prefix 가 되면 = 라우트 도달 → pending 해제
  useEffect(() => {
    if (pendingHref && pathname.startsWith(pendingHref)) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref])

  // pendingHref 가 8초 넘게 유지되면 안전 폴백 — 라우트 변경 실패 시 무한 스피너 방지
  useEffect(() => {
    if (!pendingHref) return
    const t = setTimeout(() => setPendingHref(null), 8000)
    return () => clearTimeout(t)
  }, [pendingHref])

  const isPending = (sub: string): boolean => pendingHref === hrefFor(sub)

  const handleNavClick = (href: string) => {
    // 이미 같은 경로면 pending 표시 불필요
    if (pathname.startsWith(href)) return
    setPendingHref(href)
  }

  return (
    <>
      {/* Mobile: bottom fixed nav */}
      <nav
        className={cn(
          'md:hidden fixed bottom-0 inset-x-0 z-50',
          'bg-bg-elevated/90 backdrop-blur border-t border-border',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="기본 네비게이션"
      >
        <ul className="flex">
          {NAV_ITEMS.map(({ sub, label, icon: Icon }) => {
            const active = isActive(sub)
            const pending = isPending(sub)
            const href = hrefFor(sub)
            return (
              <li key={sub} className="flex-1">
                <Link
                  href={href}
                  onClick={() => handleNavClick(href)}
                  aria-current={active ? 'page' : undefined}
                  aria-busy={pending || undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-11',
                    'text-[11px] font-medium transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent rounded',
                    active || pending ? 'text-accent' : 'text-fg-subtle hover:text-fg-muted',
                  )}
                >
                  {pending ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-5" aria-hidden="true" />
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-11 w-full',
                'text-[11px] font-medium transition-colors duration-150 text-fg-subtle hover:text-fg-muted',
              )}
              aria-label="더보기"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span>더보기</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        side="bottom"
        title="더보기"
      >
        <SheetSection title="이 여행">
          <ul className="space-y-0.5">
            <li>
              <Link
                href={hrefFor('gmaps-import')}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-fg hover:bg-bg-subtle"
              >
                <Download className="size-4 shrink-0" aria-hidden />
                구글맵 가져오기
              </Link>
            </li>
          </ul>
        </SheetSection>
        <SheetSection title="내 계정">
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/dashboard"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-fg hover:bg-bg-subtle"
              >
                <ArrowLeft className="size-4 shrink-0" aria-hidden />
                내 여행 목록
              </Link>
            </li>
            <li>
              <Link
                href="/me"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-fg hover:bg-bg-subtle"
              >
                <User className="size-4 shrink-0" aria-hidden />
                프로필
              </Link>
            </li>
            <li>
              <div className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg text-sm text-fg">
                <span>테마</span>
                <ThemeToggle />
              </div>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-critical-fg hover:bg-bg-subtle w-full text-left"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                로그아웃
              </button>
            </li>
          </ul>
        </SheetSection>
      </Sheet>

      {/* Desktop: left sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-44 z-50 bg-bg-elevated border-r border-border p-4"
        aria-label="기본 네비게이션"
      >
        <div className="mb-6 px-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            내 여행 목록
          </Link>
        </div>
        <ul className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(({ sub, label, icon: Icon }) => {
            const active = isActive(sub)
            const pending = isPending(sub)
            const href = hrefFor(sub)
            return (
              <li key={sub}>
                <Link
                  href={href}
                  onClick={() => handleNavClick(href)}
                  aria-current={active ? 'page' : undefined}
                  aria-busy={pending || undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    active
                      ? 'bg-accent text-accent-fg'
                      : pending
                        ? 'bg-bg-subtle text-fg'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                  )}
                >
                  {pending ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
          <li>
            {(() => {
              const href = hrefFor('gmaps-import')
              const pending = pendingHref === href
              return (
                <Link
                  href={href}
                  onClick={() => handleNavClick(href)}
                  aria-busy={pending || undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    pending
                      ? 'bg-bg-subtle text-fg'
                      : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                  )}
                >
                  {pending ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="size-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>구글맵 가져오기</span>
                </Link>
              )
            })()}
          </li>
        </ul>
        <div className="border-t border-border pt-3 mt-2 space-y-0.5">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">내 계정</p>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-fg-subtle whitespace-nowrap">테마</span>
            <ThemeToggle />
          </div>
          <Link
            href="/me"
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
              'text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <User className="size-4 shrink-0" aria-hidden="true" />
            <span>프로필</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg w-full text-left',
              'text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  )
}
