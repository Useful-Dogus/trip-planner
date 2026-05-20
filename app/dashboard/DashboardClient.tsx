'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Search } from 'lucide-react'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { Input } from '@/components/UI/Input'
import Button from '@/components/UI/Button'
import EmptyState from '@/components/UI/EmptyState'
import { useToast } from '@/components/UI/Toast'
import { clearAppCache } from '@/lib/clearAppCache'
import type { TripSummary } from '@/lib/trips'

type SortKey = 'created_desc' | 'created_asc' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  created_desc: '최근 생성순',
  created_asc: '오래된 순',
  name: '이름순',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  clearAppCache()
  window.location.href = '/login'
}

interface Props {
  initialTrips: TripSummary[]
  userEmail: string | null
}

export default function DashboardClient({ initialTrips, userEmail }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [trips, setTrips] = useState<TripSummary[]>(initialTrips)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('created_desc')
  const [creating, setCreating] = useState(false)

  const visibleTrips = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? trips.filter(t => t.title.toLowerCase().includes(q))
      : trips
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title, 'ko')
      const cmp = a.created_at.localeCompare(b.created_at)
      return sort === 'created_asc' ? cmp : -cmp
    })
    return sorted
  }, [trips, query, sort])

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('create failed')
      const data = (await res.json()) as { tripId: string; title: string }
      router.push(`/trip/${data.tripId}/map`)
    } catch {
      showToast({ type: 'error', message: '여행 생성에 실패했습니다.' })
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-fg">내 여행</h1>
            {userEmail && (
              <p className="text-xs text-fg-subtle mt-0.5 truncate">{userEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              aria-label="로그아웃"
              className="p-2 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {trips.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 min-w-0">
              <Input
                type="search"
                hideLabel
                label="여행 검색"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="여행 이름으로 검색"
                leading={<Search className="size-4" aria-hidden="true" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="sort-select">정렬</label>
              <select
                id="sort-select"
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="bg-bg-elevated border border-border-strong rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-border-strong"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
              <Button onClick={handleCreate} disabled={creating}>
                <Plus className="size-4 mr-1" aria-hidden="true" />
                {creating ? '생성 중…' : '새 여행'}
              </Button>
            </div>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="아직 여행이 없어요"
              description="첫 여행을 만들어 일정을 정리해 보세요."
              action={
                <Button onClick={handleCreate} disabled={creating}>
                  <Plus className="size-4 mr-1" aria-hidden="true" />
                  {creating ? '생성 중…' : '첫 여행 만들기'}
                </Button>
              }
            />
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="검색 결과가 없어요"
              description="다른 키워드로 검색해 보세요."
            />
          </div>
        ) : (
          <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTrips.map(trip => (
              <li key={trip.id}>
                <Link
                  href={`/trip/${trip.id}/map`}
                  className="block bg-bg-elevated border border-border rounded-xl p-4 hover:border-border-strong hover:shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <h2 className="text-base font-semibold text-fg mb-1 truncate">{trip.title}</h2>
                  <p className="text-xs text-fg-subtle">
                    {formatDate(trip.created_at)} · 항목 {trip.itemCount}개
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
