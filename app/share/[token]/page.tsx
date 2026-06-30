import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, Compass, CalendarRange } from 'lucide-react'
import { fetchSharedTrip, type SharedTripPayload } from '@/lib/sharedTrip'
import SharedItemCard from '@/components/Share/SharedItemCard'
import EmptyState from '@/components/UI/EmptyState'
import type { TripItem } from '@/types'

type Props = { params: { token: string } }

export const dynamic = 'force-dynamic'

function tripPeriodLabel(trip: SharedTripPayload['trip']): string | null {
  const { start_date, end_date } = trip
  if (!start_date && !end_date) return null
  if (start_date && end_date) {
    if (start_date === end_date) return start_date
    return `${start_date} – ${end_date}`
  }
  return start_date || end_date
}

function ogDescription(payload: SharedTripPayload): string {
  const parts: string[] = []
  const period = tripPeriodLabel(payload.trip)
  if (period) parts.push(period)
  if (payload.trip.region) parts.push(payload.trip.region)
  parts.push(`일정 ${payload.items.length}개`)
  return parts.join(' · ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payload = await fetchSharedTrip(params.token)
  if (!payload) {
    return {
      title: '공유 링크가 유효하지 않습니다 · Waypost',
      description: '이 링크는 만료되었거나 회수되었습니다.',
      robots: { index: false, follow: false },
    }
  }
  const title = `${payload.trip.title} · Waypost`
  const description = ogDescription(payload)
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

type DateGroup = { date: string | null; items: TripItem[] }

function groupByDate(items: TripItem[]): DateGroup[] {
  const map = new Map<string, TripItem[]>()
  const undated: TripItem[] = []
  for (const it of items) {
    if (!it.date) {
      undated.push(it)
      continue
    }
    const arr = map.get(it.date) ?? []
    arr.push(it)
    map.set(it.date, arr)
  }
  const groups: DateGroup[] = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }))
  if (undated.length) groups.push({ date: null, items: undated })
  return groups
}

export default async function SharePage({ params }: Props) {
  const payload = await fetchSharedTrip(params.token)

  if (!payload) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <div className="rounded-xl border border-border bg-bg-elevated p-6 text-center">
          <Compass className="mx-auto mb-3 size-8 text-fg-subtle" aria-hidden />
          <h1 className="text-lg font-semibold text-fg">공유 링크가 유효하지 않습니다</h1>
          <p className="mt-2 text-sm text-fg-subtle">
            이 링크는 만료되었거나 회수되었습니다.<br />
            발급한 분에게 새 링크를 요청해주세요.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Waypost 둘러보기
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </main>
    )
  }

  const { trip, items } = payload
  const period = tripPeriodLabel(trip)
  const groups = groupByDate(items)

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">공유 일정</p>
        <h1 className="mt-1 text-2xl font-bold text-fg break-words sm:text-3xl">{trip.title}</h1>
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-subtle">
          {period && (
            <div className="tabular">
              <dt className="sr-only">기간</dt>
              <dd>{period}</dd>
            </div>
          )}
          {trip.region && (
            <div>
              <dt className="sr-only">지역</dt>
              <dd>{trip.region}</dd>
            </div>
          )}
          <div className="tabular">
            <dt className="sr-only">일정 수</dt>
            <dd>일정 {items.length}개</dd>
          </div>
        </dl>
        {trip.basecamp_address && (
          <p className="mt-2 text-sm text-fg-subtle">
            <span className="font-medium text-fg-muted">지도 기준점</span>{' '}
            <span className="break-words">{trip.basecamp_address}</span>
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-elevated">
          <EmptyState
            icon={<CalendarRange className="size-10" aria-hidden="true" />}
            title="아직 추가된 일정이 없어요"
          />
        </div>
      ) : (
        <section className="space-y-6">
          {groups.map((group) => (
            <div key={group.date ?? 'undated'}>
              <h2 className="mb-2 text-sm font-semibold text-fg-muted tabular">
                {group.date ?? '날짜 미정'}
              </h2>
              <div className="space-y-2">
                {group.items.map((it) => (
                  <SharedItemCard key={it.id} item={it} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <footer className="mt-10 rounded-xl border border-border bg-bg-elevated p-5 text-center">
        <p className="text-sm text-fg-subtle">마음에 들면 직접 만들어보세요.</p>
        <Link
          href="/signup"
          className="mt-3 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:bg-accent-hover"
        >
          Waypost 시작하기
        </Link>
      </footer>
    </main>
  )
}
