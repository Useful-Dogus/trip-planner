'use client'

import { useMemo, useState } from 'react'
import type { Category, TripItem } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS, TRIP_PRIORITY_META } from '@/lib/itemOptions'

interface MapCandidatePanelProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
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

export default function MapCandidatePanel({
  items,
  selectedItemId,
  onSelectItem,
}: MapCandidatePanelProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null)

  const candidates = useMemo(
    () => items.filter(i => i.trip_priority !== '제외'),
    [items],
  )

  const counts = useMemo(() => categoryCounts(candidates), [candidates])

  const filtered = useMemo(() => {
    return candidates
      .filter(i => (categoryFilter ? i.category === categoryFilter : true))
      .filter(i => matchesQuery(i, query))
      .sort((a, b) => {
        const oa = TRIP_PRIORITY_META[a.trip_priority]?.order ?? 99
        const ob = TRIP_PRIORITY_META[b.trip_priority]?.order ?? 99
        if (oa !== ob) return ob - oa
        return a.name.localeCompare(b.name)
      })
  }, [candidates, categoryFilter, query])

  return (
    <aside className="flex h-full flex-col bg-white">
      <header className="flex-shrink-0 border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            후보 <span className="text-gray-500 tabular-nums">({candidates.length})</span>
          </h2>
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="검색…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
          style={{ fontSize: 14 }}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
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
      </header>

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
    </aside>
  )
}
