'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Category, ReservationStatus, TripItem, TripPriority } from '@/types'
import ItemCard from './ItemCard'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  TRIP_PRIORITY_META,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
} from '@/lib/itemOptions'

type SortKey = 'name' | 'date' | 'budget' | 'trip_priority'
type SortDir = 'asc' | 'desc'

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

interface ItemListProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

export default function ItemList({ items, selectedItemId, onSelectItem }: ItemListProps) {
  const [selCats, setSelCats] = useState<Category[]>([])
  const [selTripPriorities, setSelTripPriorities] = useState<TripPriority[]>([])
  const [selReservationStatuses, setSelReservationStatuses] = useState<ReservationStatus[]>([])
  const [showExcluded, setShowExcluded] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const onSelectItemRef = useRef(onSelectItem)
  useEffect(() => {
    onSelectItemRef.current = onSelectItem
  })

  const excludedCount = useMemo(() => items.filter(i => i.trip_priority === '제외').length, [items])

  function clearFilters() {
    setSelCats([])
    setSelTripPriorities([])
    setSelReservationStatuses([])
    setShowExcluded(false)
    setQuery('')
  }

  const hasActiveFilter = useMemo(
    () =>
      selCats.length > 0 ||
      selTripPriorities.length > 0 ||
      selReservationStatuses.length > 0 ||
      query.trim().length > 0,
    [selCats, selTripPriorities, selReservationStatuses, query]
  )

  function handleSortChange(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = items.filter(item => {
      if (!showExcluded && item.trip_priority === '제외') return false
      if (selCats.length && !selCats.includes(item.category)) return false
      if (selTripPriorities.length && !selTripPriorities.includes(item.trip_priority)) return false
      if (selReservationStatuses.length) {
        if (!item.reservation_status || !selReservationStatuses.includes(item.reservation_status)) return false
      }
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'ko')
      } else if (sortKey === 'date') {
        const da = a.date ?? ''
        const db = b.date ?? ''
        cmp = da < db ? -1 : da > db ? 1 : 0
      } else if (sortKey === 'budget') {
        cmp = (a.budget ?? 0) - (b.budget ?? 0)
      } else if (sortKey === 'trip_priority') {
        const pa = TRIP_PRIORITY_META[a.trip_priority].order
        const pb = TRIP_PRIORITY_META[b.trip_priority].order
        cmp = pa - pb
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [items, query, selCats, selTripPriorities, selReservationStatuses, showExcluded, sortDir, sortKey])

  useEffect(() => {
    if (selectedItemId && !filtered.some(i => i.id === selectedItemId)) {
      onSelectItemRef.current(selectedItemId)
    }
  }, [filtered, selectedItemId])

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'name', label: '이름' },
    { key: 'date', label: '날짜' },
    { key: 'budget', label: '예산' },
    { key: 'trip_priority', label: '이번 여행에서' },
  ]

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="이름으로 검색..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400">{ITEM_FIELD_LABELS.category}</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_OPTIONS.map(c => <Chip key={c} label={c} active={selCats.includes(c)} onClick={() => setSelCats(toggle(selCats, c))} />)}
        </div>
        <p className="text-xs font-medium text-gray-400">{ITEM_FIELD_LABELS.trip_priority}</p>
        <div className="flex flex-wrap gap-1.5">
          {TRIP_PRIORITY_OPTIONS.map(p => (
            <Chip key={p} label={p} active={selTripPriorities.includes(p)} onClick={() => setSelTripPriorities(toggle(selTripPriorities, p))} />
          ))}
        </div>
        <p className="text-xs font-medium text-gray-400">{ITEM_FIELD_LABELS.reservation_status}</p>
        <div className="flex flex-wrap gap-1.5">
          {RESERVATION_STATUS_OPTIONS.map(status => (
            <Chip
              key={status}
              label={status}
              active={selReservationStatuses.includes(status)}
              onClick={() => setSelReservationStatuses(toggle(selReservationStatuses, status))}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-400">정렬:</span>
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              sortKey === key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
            {sortKey === key && <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{filtered.length}개 항목</p>
        {excludedCount > 0 && (
          <button
            onClick={() => setShowExcluded(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {showExcluded ? `제외 항목 숨기기` : `제외 항목 보기 (${excludedCount})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <ItemCard key={item.id} item={item} onSelect={onSelectItem} isActive={item.id === selectedItemId} />
        ))}
        {filtered.length === 0 && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm font-medium text-gray-700 mb-1">아직 항목이 없어요</p>
            <p className="text-xs text-gray-400 mb-4">가고 싶은 장소를 추가해보세요</p>
            <Link href="/items/new" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
              첫 항목 추가하기
            </Link>
          </div>
        )}
        {filtered.length === 0 && items.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium text-gray-700 mb-1">검색 결과가 없어요</p>
            <p className="text-xs text-gray-400 mb-4">필터 조건을 바꿔보세요</p>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
