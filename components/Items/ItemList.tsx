'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Category, ReservationStatus, TripItem, TripPriority } from '@/types'
import ItemCard from './ItemCard'
import GroupCard from './GroupCard'
import FilterButton from '@/components/Research/FilterButton'
import FilterPanel from '@/components/Research/FilterPanel'
import SortButton from '@/components/Research/SortButton'
import ActiveFilterChips from '@/components/Research/ActiveFilterChips'
import {
  TRIP_PRIORITY_META,
} from '@/lib/itemOptions'

export type SortKey = 'name' | 'date' | 'budget' | 'trip_priority'
export type SortDir = 'asc' | 'desc'

export interface FilterState {
  categories: Category[]
  tripPriorities: TripPriority[]
  reservationStatuses: ReservationStatus[]
  showExcluded: boolean
}

export function getActiveFilterCount(state: FilterState): number {
  return (
    state.categories.length +
    state.tripPriorities.length +
    state.reservationStatuses.length +
    (state.showExcluded ? 1 : 0)
  )
}

type RenderEntry =
  | { type: 'single'; item: TripItem; sortKey: string | number }
  | { type: 'group'; name: string; visibleItems: TripItem[]; totalCount: number; sortKey: string | number }

interface ItemListProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
  highlightedIds?: Set<string>
}

export default function ItemList({ items, selectedItemId, onSelectItem, onUpdateItem, highlightedIds }: ItemListProps) {
  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    tripPriorities: [],
    reservationStatuses: [],
    showExcluded: false,
  })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const activeCount = useMemo(() => getActiveFilterCount(filterState), [filterState])

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = []
    for (const c of filterState.categories) {
      chips.push({
        id: `cat-${c}`,
        label: c,
        onRemove: () => setFilterState(prev => ({ ...prev, categories: prev.categories.filter(x => x !== c) })),
      })
    }
    for (const p of filterState.tripPriorities) {
      chips.push({
        id: `pri-${p}`,
        label: p,
        onRemove: () => setFilterState(prev => ({ ...prev, tripPriorities: prev.tripPriorities.filter(x => x !== p) })),
      })
    }
    for (const s of filterState.reservationStatuses) {
      chips.push({
        id: `res-${s}`,
        label: s,
        onRemove: () => setFilterState(prev => ({ ...prev, reservationStatuses: prev.reservationStatuses.filter(x => x !== s) })),
      })
    }
    if (filterState.showExcluded) {
      chips.push({
        id: 'excluded',
        label: '제외 포함',
        onRemove: () => setFilterState(prev => ({ ...prev, showExcluded: false })),
      })
    }
    return chips
  }, [filterState])

  const hasActiveFilter = activeCount > 0 || query.trim().length > 0

  function clearFilters() {
    setFilterState({ categories: [], tripPriorities: [], reservationStatuses: [], showExcluded: false })
    setQuery('')
  }

  function handleSortChange(key: SortKey, dir: SortDir) {
    setSortKey(key)
    setSortDir(dir)
  }

  // 전체 아이템 기준 그룹 맵 (필터 전)
  const allGroups = useMemo(() => {
    const map = new Map<string, TripItem[]>()
    for (const item of items) {
      const key = item.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  // 필터 적용
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const { categories, tripPriorities, reservationStatuses, showExcluded } = filterState
    return items.filter(item => {
      if (!showExcluded && item.trip_priority === '제외') return false
      if (categories.length && !categories.includes(item.category)) return false
      if (tripPriorities.length && !tripPriorities.includes(item.trip_priority)) return false
      if (reservationStatuses.length) {
        if (!item.reservation_status || !reservationStatuses.includes(item.reservation_status)) return false
      }
      if (q) {
        const haystack = [item.name, item.address, item.memo]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, query, filterState])

  // 렌더 엔트리 생성 + 정렬
  const renderEntries = useMemo(() => {
    const filteredIdSet = new Set(filtered.map(i => i.id))
    const seen = new Set<string>()

    const entries: RenderEntry[] = []

    for (const item of filtered) {
      const key = item.name.trim().toLowerCase()
      const groupAll = allGroups.get(key) ?? []

      if (groupAll.length >= 2) {
        if (seen.has(key)) continue
        seen.add(key)

        const visibleItems = groupAll.filter(i => filteredIdSet.has(i.id))
        if (visibleItems.length === 0) continue

        let sk: string | number = key
        if (sortKey === 'date') {
          const dates = visibleItems.map(i => i.date ?? '').filter(Boolean)
          sk = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : ''
        } else if (sortKey === 'budget') {
          const budgets = visibleItems.map(i => i.budget ?? 0)
          sk = budgets.length ? Math.min(...budgets) : 0
        } else if (sortKey === 'trip_priority') {
          const orders = visibleItems.map(i => TRIP_PRIORITY_META[i.trip_priority].order)
          sk = orders.length ? Math.max(...orders) : 0
        }

        entries.push({ type: 'group', name: item.name, visibleItems, totalCount: groupAll.length, sortKey: sk })
      } else {
        let sk: string | number = key
        if (sortKey === 'date') sk = item.date ?? ''
        else if (sortKey === 'budget') sk = item.budget ?? 0
        else if (sortKey === 'trip_priority') sk = TRIP_PRIORITY_META[item.trip_priority].order

        entries.push({ type: 'single', item, sortKey: sk })
      }
    }

    entries.sort((a, b) => {
      const ka = a.sortKey
      const kb = b.sortKey
      let cmp = 0
      if (typeof ka === 'string' && typeof kb === 'string') {
        cmp = ka.localeCompare(kb, 'ko')
      } else if (typeof ka === 'number' && typeof kb === 'number') {
        cmp = ka - kb
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return entries
  }, [filtered, allGroups, sortKey, sortDir])

  const totalDisplayCount = useMemo(
    () => renderEntries.reduce((acc, e) => acc + (e.type === 'group' ? e.visibleItems.length : 1), 0),
    [renderEntries]
  )

  return (
    <div className="space-y-3">
      {/* 검색 + 툴바 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="이름·주소·메모로 검색..."
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
        <div className="relative flex items-center gap-1.5 flex-shrink-0">
          <FilterButton activeCount={activeCount} onClick={() => setFilterPanelOpen(true)} />
          <SortButton sortKey={sortKey} sortDir={sortDir} onChange={handleSortChange} />
        </div>
      </div>

      {/* 활성 필터 요약 칩 */}
      <ActiveFilterChips chips={activeChips} />

      {/* 아이템 수 */}
      <p className="text-xs text-gray-400">{totalDisplayCount}개 항목</p>

      {/* 목록 */}
      <div className="space-y-2">
        {renderEntries.map(entry =>
          entry.type === 'group' ? (
            <GroupCard
              key={entry.name}
              name={entry.name}
              visibleItems={entry.visibleItems}
              totalCount={entry.totalCount}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
              onUpdateItem={onUpdateItem}
            />
          ) : (
            <ItemCard
              key={entry.item.id}
              item={entry.item}
              onSelect={onSelectItem}
              isActive={entry.item.id === selectedItemId}
              isHighlighted={highlightedIds?.has(entry.item.id) ?? false}
              onUpdateItem={onUpdateItem}
            />
          )
        )}
        {renderEntries.length === 0 && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm font-medium text-gray-700 mb-1">아직 항목이 없어요</p>
            <p className="text-xs text-gray-400 mb-4">가고 싶은 장소를 추가해보세요</p>
            <Link href="/items/new" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
              첫 항목 추가하기
            </Link>
          </div>
        )}
        {renderEntries.length === 0 && items.length > 0 && (
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

      {/* 필터 패널 (모바일 바텀시트 + 데스크탑 드롭다운) */}
      <FilterPanel
        isOpen={filterPanelOpen}
        filterState={filterState}
        onChange={setFilterState}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  )
}
