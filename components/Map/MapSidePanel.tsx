'use client'

import { useMemo, useState } from 'react'
import type { Category, TripItem } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS, TRIP_PRIORITY_META } from '@/lib/itemOptions'
import CategoryStackBar from '@/components/Schedule/CategoryStackBar'
import DayTimeline from '@/components/Schedule/DayTimeline'

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
  if (!item.end_date) return item.date === date
  return item.date <= date && date <= item.end_date
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
    () => items.filter(i => i.trip_priority !== '제외'),
    [items],
  )

  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as TripItem[]
    return items
      .filter(i => i.trip_priority === '확정' && occursOnDate(i, selectedDate))
      .sort((a, b) => (a.time_start ?? '99:99').localeCompare(b.time_start ?? '99:99'))
  }, [items, selectedDate])

  const dayBreakdown = useMemo(() => {
    if (!selectedDate) return null
    return days.find(d => d.date === selectedDate) ?? null
  }, [days, selectedDate])

  return (
    <aside className="flex h-full flex-col bg-white">
      {/* Scope tabs */}
      <nav
        className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50/50 px-2 py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        <button
          type="button"
          onClick={() => onSelectDate(null)}
          className={`flex flex-shrink-0 items-baseline gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            selectedDate === null
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          후보
          <span className="text-[10px] tabular-nums opacity-70">{candidates.length}</span>
        </button>
        {days.map(day => {
          const active = day.date === selectedDate
          const { tab } = formatDateLabel(day.date)
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={`flex flex-shrink-0 items-baseline gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title={`${tab} · ${day.stopCount}곳`}
            >
              <span className="text-[10px] font-semibold tracking-wider opacity-70">
                D{day.dayOffset + 1}
              </span>
              <span className="tabular-nums">{tab}</span>
            </button>
          )
        })}
      </nav>

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
      .filter(i => (categoryFilter ? i.category === categoryFilter : true))
      .filter(i => matchesQuery(i, query))
      .sort((a, b) => {
        const oa = TRIP_PRIORITY_META[a.trip_priority]?.order ?? 99
        const ob = TRIP_PRIORITY_META[b.trip_priority]?.order ?? 99
        if (oa !== ob) return ob - oa
        return a.name.localeCompare(b.name)
      })
  }, [items, categoryFilter, query])

  return (
    <>
      <div className="flex-shrink-0 border-b border-gray-100 px-4 pt-3 pb-3">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="검색…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
          style={{ fontSize: 14 }}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              categoryFilter === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            모두
          </button>
          {CATEGORY_OPTIONS.filter(c => (counts.get(c) ?? 0) > 0).map(c => {
            const active = categoryFilter === c
            const color = CATEGORY_META[c]?.color ?? '#cbd5e1'
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(active ? null : c)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {c}
                <span className="tabular-nums opacity-70">{counts.get(c)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-gray-400">결과가 없습니다</li>
        ) : (
          filtered.map(item => {
            const active = item.id === selectedItemId
            const color = CATEGORY_META[item.category]?.color ?? '#cbd5e1'
            const emoji = CATEGORY_META[item.category]?.emoji ?? '📌'
            const isConfirmed = item.trip_priority === '확정'
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  className={`flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors ${
                    active ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs">{emoji}</span>
                      <span className="truncate text-xs font-semibold text-gray-900">
                        {item.name}
                      </span>
                      {isConfirmed && (
                        <span className="flex-shrink-0 rounded bg-green-50 px-1 py-px text-[9px] font-semibold tracking-wide text-green-700">
                          확정
                        </span>
                      )}
                    </span>
                    {item.address && (
                      <span className="mt-0.5 block truncate text-[10px] text-gray-500">
                        {item.address}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </>
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
      <div className="flex-shrink-0 border-b border-gray-100 px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{dateLabel}</h2>
          <span className="text-[11px] tabular-nums text-gray-500">
            {items.length}곳
          </span>
        </div>
        {breakdown.length > 0 && (
          <div className="mt-2">
            <CategoryStackBar breakdown={breakdown} />
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DayTimeline
          items={items}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
      </div>
    </>
  )
}
