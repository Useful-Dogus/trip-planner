'use client'

import { useMemo, useState } from 'react'
import { Search, MapPin, CalendarRange } from 'lucide-react'
import type { Category, TripItem } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS, TRIP_PRIORITY_META } from '@/lib/itemOptions'
import CategoryStackBar from '@/components/Schedule/CategoryStackBar'
import DayTimeline from '@/components/Schedule/DayTimeline'
import EmptyState from '@/components/UI/EmptyState'
import { Input } from '@/components/UI/Input'
import { cn } from '@/lib/cn'

export interface DaySummary {
  date: string
  dayOffset: number
  stopCount: number
  breakdown: { category: Category; count: number }[]
}

interface MapSidePanelProps {
  items: TripItem[]
  days: DaySummary[]
  selectedDate: string | null
  selectedItemId: string | null
  onSelectDate: (date: string | null) => void
  onSelectItem: (id: string) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateLabel(date: string): { tab: string; full: string } {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return {
    tab: `${m}/${d}`,
    full: `${m}월 ${d}일 (${WEEKDAYS[dt.getUTCDay()]})`,
  }
}

function categoryCounts(items: TripItem[]): Map<Category, number> {
  const counts = new Map<Category, number>()
  for (const it of items) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
  }
  return counts
}

function matchesQuery(item: TripItem, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return (
    item.name.toLowerCase().includes(needle) ||
    (item.address ?? '').toLowerCase().includes(needle) ||
    (item.memo ?? '').toLowerCase().includes(needle)
  )
}

function occursOnDate(item: TripItem, date: string): boolean {
  if (!item.date) return false
  if (item.date === date) return true
  if (item.end_date && !item.time_start) {
    return item.date <= date && date <= item.end_date
  }
  return false
}

export default function MapSidePanel({
  items,
  days,
  selectedDate,
  selectedItemId,
  onSelectDate,
  onSelectItem,
}: MapSidePanelProps) {
  const candidates = useMemo(
    () => items.filter((i) => i.trip_priority !== '제외'),
    [items],
  )

  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as TripItem[]
    return items
      .filter((i) => i.trip_priority === '확정' && occursOnDate(i, selectedDate))
      .sort((a, b) =>
        (a.time_start ?? '99:99').localeCompare(b.time_start ?? '99:99'),
      )
  }, [items, selectedDate])

  const dayBreakdown = useMemo(() => {
    if (!selectedDate) return null
    return days.find((d) => d.date === selectedDate) ?? null
  }, [days, selectedDate])

  const mode: 'candidates' | 'day' = selectedDate === null ? 'candidates' : 'day'

  function handleModeChange(next: 'candidates' | 'day') {
    if (next === 'candidates') {
      onSelectDate(null)
    } else if (selectedDate === null && days.length > 0) {
      onSelectDate(days[0].date)
    }
  }

  return (
    <aside className="flex h-full flex-col bg-bg-elevated">
      {/* Mode toggle (segmented) */}
      <div
        role="tablist"
        aria-label="패널 모드"
        className="flex flex-shrink-0 border-b border-border bg-bg-subtle p-1.5 gap-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={mode === 'candidates'}
          onClick={() => handleModeChange('candidates')}
          className={cn(
            'flex flex-1 items-baseline justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
            'transition-colors duration-150 ease-out-soft',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
            mode === 'candidates'
              ? 'bg-bg-elevated text-fg shadow-e2'
              : 'text-fg-muted hover:text-fg',
          )}
        >
          후보
          <span className="text-[10px] tabular opacity-70">{candidates.length}</span>
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={mode === 'day'}
          onClick={() => handleModeChange('day')}
          disabled={days.length === 0}
          className={cn(
            'flex flex-1 items-baseline justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
            'transition-colors duration-150 ease-out-soft',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            mode === 'day'
              ? 'bg-bg-elevated text-fg shadow-e2'
              : 'text-fg-muted hover:text-fg',
          )}
        >
          일정
          {days.length > 0 && (
            <span className="text-[10px] tabular opacity-70">{days.length}일</span>
          )}
        </button>
      </div>

      {/* Day grid */}
      {mode === 'day' && days.length > 0 && (
        <div
          role="tablist"
          aria-label="일자 선택"
          className="flex flex-shrink-0 flex-wrap gap-1.5 border-b border-border px-3 py-2"
        >
          {days.map((day) => {
            const active = day.date === selectedDate
            const { tab } = formatDateLabel(day.date)
            return (
              <button
                key={day.date}
                role="tab"
                type="button"
                aria-selected={active}
                aria-label={`Day ${day.dayOffset + 1}, ${tab}, ${day.stopCount}곳`}
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  'flex items-baseline gap-1 rounded-md border px-2 py-1 text-xs font-medium',
                  'transition-colors duration-150 ease-out-soft',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  active
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-bg-elevated text-fg-muted hover:border-border-strong hover:text-fg',
                )}
              >
                <span className="text-[10px] font-semibold tracking-wider opacity-80">
                  D{day.dayOffset + 1}
                </span>
                <span className="tabular">{tab}</span>
              </button>
            )
          })}
        </div>
      )}

      {selectedDate === null ? (
        <CandidatesView
          items={candidates}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
      ) : (
        <DayView
          dateLabel={formatDateLabel(selectedDate).full}
          breakdown={dayBreakdown?.breakdown ?? []}
          items={dayItems}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
      )}
    </aside>
  )
}

function CandidatesView({
  items,
  selectedItemId,
  onSelectItem,
}: {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)

  const counts = useMemo(() => categoryCounts(items), [items])
  const filtered = useMemo(() => {
    return items
      .filter((i) => (categoryFilter ? i.category === categoryFilter : true))
      .filter((i) => matchesQuery(i, query))
      .sort((a, b) => {
        const oa = TRIP_PRIORITY_META[a.trip_priority]?.order ?? 99
        const ob = TRIP_PRIORITY_META[b.trip_priority]?.order ?? 99
        if (oa !== ob) return ob - oa
        return a.name.localeCompare(b.name)
      })
  }, [items, categoryFilter, query])

  const hasActiveFilter = query.trim().length > 0 || categoryFilter !== null

  return (
    <>
      <div className="flex-shrink-0 border-b border-border px-4 pt-3 pb-3 space-y-2">
        <Input
          type="search"
          hideLabel
          label="장소 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·주소·메모로 검색"
          leading={<Search className="size-4" aria-hidden="true" />}
        />
        <div className="flex flex-wrap gap-1">
          <CategoryFilterChip
            active={categoryFilter === null}
            onClick={() => setCategoryFilter(null)}
            color={null}
          >
            모두
            <span className="tabular ml-1 opacity-70">{items.length}</span>
          </CategoryFilterChip>
          {CATEGORY_OPTIONS.filter((c) => (counts.get(c) ?? 0) > 0).map((c) => {
            const active = categoryFilter === c
            const color = CATEGORY_META[c]?.color ?? '#cbd5e1'
            return (
              <CategoryFilterChip
                key={c}
                active={active}
                onClick={() => setCategoryFilter(active ? null : c)}
                color={color}
              >
                {c}
                <span className="tabular ml-1 opacity-70">{counts.get(c)}</span>
              </CategoryFilterChip>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            size="inline"
            icon={<MapPin className="size-7" aria-hidden="true" />}
            title={hasActiveFilter ? '검색 결과가 없어요' : '아직 후보가 없어요'}
            description={
              hasActiveFilter
                ? '다른 키워드나 카테고리로 다시 검색해 보세요.'
                : '지도를 길게 눌러 장소를 추가하거나 구글맵에서 가져오세요.'
            }
          />
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {filtered.map((item) => {
            const active = item.id === selectedItemId
            const color = CATEGORY_META[item.category]?.color ?? '#cbd5e1'
            const emoji = CATEGORY_META[item.category]?.emoji ?? '📌'
            const isConfirmed = item.trip_priority === '확정'
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`${item.name}${item.address ? ', ' + item.address : ''}${
                    isConfirmed ? ', 일정 확정' : ''
                  }`}
                  className={cn(
                    'flex w-full items-start gap-2 px-4 py-2.5 text-left',
                    'transition-colors duration-150 ease-out-soft',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                    active ? 'bg-accent-subtle' : 'hover:bg-bg-subtle',
                  )}
                >
                  <span
                    className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="truncate text-xs font-semibold text-fg">
                        {item.name}
                      </span>
                      {isConfirmed && (
                        <span className="flex-shrink-0 rounded bg-success-bg px-1 py-px text-[9px] font-semibold tracking-wide text-success-fg">
                          확정
                        </span>
                      )}
                    </span>
                    {item.address && (
                      <span className="mt-0.5 block truncate text-[10px] text-fg-muted">
                        {item.address}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function CategoryFilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color: string | null
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'bg-accent text-accent-fg'
          : 'bg-bg-subtle text-fg-muted hover:bg-border',
      )}
    >
      {color && (
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  )
}

function DayView({
  dateLabel,
  breakdown,
  items,
  selectedItemId,
  onSelectItem,
}: {
  dateLabel: string
  breakdown: { category: Category; count: number }[]
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}) {
  return (
    <>
      <div className="flex-shrink-0 border-b border-border px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-fg">{dateLabel}</h2>
          <span className="text-[11px] tabular text-fg-muted">{items.length}곳</span>
        </div>
        {breakdown.length > 0 && (
          <div className="mt-2">
            <CategoryStackBar breakdown={breakdown} />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState
            size="inline"
            icon={<CalendarRange className="size-7" aria-hidden="true" />}
            title="이 날 잡힌 장소가 없어요"
            description="후보 탭에서 장소를 골라 일정 확정으로 옮겨보세요."
          />
        ) : (
          <DayTimeline
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={onSelectItem}
          />
        )}
      </div>
    </>
  )
}
