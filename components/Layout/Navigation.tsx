'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, Map, CalendarDays, Download, LogOut } from 'lucide-react'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { cn } from '@/lib/cn'

interface NavItem {
  href: string
  label: string
  icon: typeof List
}

const NAV_ITEMS: NavItem[] = [
  { href: '/research', label: '목록', icon: List },
  { href: '/map', label: '지도', icon: Map },
  { href: '/schedule', label: '일정', icon: CalendarDays },
]

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

export default function Navigation() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname.startsWith(href)

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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-11',
                    'text-[11px] font-medium transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent rounded',
                    active ? 'text-accent' : 'text-fg-subtle hover:text-fg-muted',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Desktop: left sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-44 z-50 bg-bg-elevated border-r border-border p-4"
        aria-label="기본 네비게이션"
      >
        <div className="mb-6 px-3">
          <p className="text-sm font-bold text-fg">NYC Trip</p>
          <p className="text-xs text-fg-subtle mt-0.5">2026년 7월</p>
        </div>
        <ul className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    active
                      ? 'bg-accent text-accent-fg'
                      : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-border pt-3 mt-2 space-y-0.5">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-fg-subtle">테마</span>
            <ThemeToggle />
          </div>
          <Link
            href="/gmaps-import"
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg',
              'text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <Download className="size-4 shrink-0" aria-hidden="true" />
            <span>지도 연동</span>
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
