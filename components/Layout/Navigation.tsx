'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navLinks = [
    { href: '/research', label: '리서치' },
    { href: '/schedule', label: '일정' },
    { href: '/items/new', label: '+ 추가' },
  ]

  return (
    <>
      {/* Mobile: bottom fixed nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                pathname.startsWith(href) && href !== '/items/new'
                  ? 'text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:w-44 bg-white border-r border-gray-200 p-4 z-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4 px-3">
          NYC Trip
        </p>
        <div className="flex-1 space-y-0.5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href) && href !== '/items/new'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 text-left rounded-lg hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </aside>
    </>
  )
}
