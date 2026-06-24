'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, MapPin, MoreVertical, Plus, Search, SearchX, Trash2, User } from 'lucide-react'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import Wordmark, { BrandMark } from '@/components/Brand/Wordmark'
import { Input } from '@/components/UI/Input'
import Button from '@/components/UI/Button'
import EmptyState from '@/components/UI/EmptyState'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { useToast } from '@/components/UI/Toast'
import { logout } from '@/lib/auth-client'
import type { TripSummary } from '@/lib/trips'

type SortKey = 'created_desc' | 'start_date' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  created_desc: '최근 생성순',
  start_date: '기간 시작일순',
  name: '이름순',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return iso
  }
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  if (start && end) return `${formatDateShort(start)} – ${formatDateShort(end)}`
  if (start) return `${formatDateShort(start)} 부터`
  return `${formatDateShort(end!)} 까지`
}

const handleLogout = logout

interface Props {
  initialTrips: TripSummary[]
  userEmail: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function DashboardClient({ initialTrips, userEmail }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const { data, mutate: mutateTrips } = useSWR<{ trips: TripSummary[] }>(
    '/api/trips',
    fetcher,
    { fallbackData: { trips: initialTrips } },
  )
  const trips = data?.trips ?? initialTrips
  // legacy state (탬플릿 호환). 실제 보존은 SWR 캐시.
  const setTrips = (updater: (prev: TripSummary[]) => TripSummary[]) => {
    mutateTrips(
      (cur) => ({ trips: updater(cur?.trips ?? initialTrips) }),
      { revalidate: false },
    )
  }
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('created_desc')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  async function handleDeleteTrip(trip: TripSummary) {
    setMenuOpen(null)
    const ok = await confirm({
      title: `여행 삭제: ${trip.title}`,
      description: '이 여행과 연관된 모든 항목·공유 링크·멤버가 함께 삭제됩니다. 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'destructive',
      typeToConfirm: trip.title,
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast({ message: data?.error ?? '삭제에 실패했습니다.', type: 'error' })
        return
      }
      setTrips((prev) => prev.filter((t) => t.id !== trip.id))
      showToast({ message: '여행을 삭제했어요.', type: 'success' })
      mutateTrips()
      router.refresh()
    } catch {
      showToast({ message: '네트워크 오류가 발생했습니다.', type: 'error' })
    }
  }

  const visibleTrips = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? trips.filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.region ?? '').toLowerCase().includes(q),
        )
      : trips
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title, 'ko')
      if (sort === 'start_date') {
        const av = a.start_date ?? ''
        const bv = b.start_date ?? ''
        if (av && bv) return av.localeCompare(bv)
        if (av) return -1
        if (bv) return 1
        return b.created_at.localeCompare(a.created_at)
      }
      return b.created_at.localeCompare(a.created_at)
    })
    return sorted
  }, [trips, query, sort])

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Wordmark size="sm" className="mb-1.5" />
            <h1 className="text-lg md:text-xl font-bold text-fg">내 여행</h1>
            {userEmail && (
              <p className="text-xs text-fg-subtle mt-0.5 truncate">{userEmail}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/me"
              aria-label="프로필"
              className="p-2 rounded-lg text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors"
            >
              <User className="size-4" aria-hidden="true" />
            </Link>
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
                placeholder="이름·지역으로 검색"
                leading={<Search className="size-4" aria-hidden="true" />}
                data-shortcut="search"
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
              <Link href="/dashboard/new">
                <Button>
                  <Plus className="size-4 mr-1" aria-hidden="true" />
                  새 여행
                </Button>
              </Link>
            </div>
          </div>
        )}

        {trips.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<BrandMark size="lg" />}
              title="첫 여행을 시작해요"
              description="모아둔 후보를 추려, 현장에서 안 깨지는 하루 일정으로 만들어요."
              action={
                <Link href="/dashboard/new">
                  <Button>
                    <Plus className="size-4 mr-1" aria-hidden="true" />
                    첫 여행 만들기
                  </Button>
                </Link>
              }
            />
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<SearchX className="size-10" aria-hidden="true" />}
              title="검색 결과가 없어요"
              description="다른 키워드로 검색해 보세요."
            />
          </div>
        ) : (
          <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTrips.map(trip => {
              const range = formatRange(trip.start_date, trip.end_date)
              return (
                <li key={trip.id} className="relative">
                  <Link
                    href={`/trip/${trip.id}/map`}
                    className="block bg-bg-elevated border border-border rounded-xl p-4 hover:border-border-strong hover:shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <h2 className="text-base font-semibold text-fg mb-2 truncate pr-8">{trip.title}</h2>
                    <div className="space-y-1 text-xs text-fg-muted">
                      {range ? (
                        <p>{range}</p>
                      ) : (
                        <p className="text-fg-subtle">기간 미정</p>
                      )}
                      {trip.region && (
                        <p className="flex items-center gap-1 truncate">
                          <MapPin className="size-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{trip.region}</span>
                        </p>
                      )}
                      <p className="text-fg-subtle">
                        {formatDate(trip.created_at)} 생성 · 항목 {trip.itemCount}개
                      </p>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setMenuOpen(menuOpen === trip.id ? null : trip.id)
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-subtle hover:text-fg-muted"
                      aria-label="여행 메뉴"
                      aria-expanded={menuOpen === trip.id}
                    >
                      <MoreVertical className="size-4" aria-hidden />
                    </button>
                    {menuOpen === trip.id && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-10 cursor-default"
                          aria-label="메뉴 닫기"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-border bg-bg-elevated shadow-md py-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteTrip(trip)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-critical-fg hover:bg-bg-subtle"
                          >
                            <Trash2 className="size-4" aria-hidden />
                            여행 삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
