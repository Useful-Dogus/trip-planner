'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, SearchX } from 'lucide-react'
import type { Category, ReservationStatus, TripItem, TripPriority } from '@/types'
import ItemCard from './ItemCard'
import GroupCard from './GroupCard'
import FilterButton from '@/components/Research/FilterButton'
import FilterPanel from '@/components/Research/FilterPanel'
import SortButton from '@/components/Research/SortButton'
import ActiveFilterChips from '@/components/Research/ActiveFilterChips'
import EmptyState from '@/components/UI/EmptyState'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { TRIP_PRIORITY_META } from '@/lib/itemOptions'

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
  | {
      type: 'group'
      name: string
      visibleItems: TripItem[]
      totalCount: number
      sortKey: string | number
    }

interface ItemListProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
  highlightedIds?: Set<string>
}

export default function ItemList({
  items,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  highlightedIds,
}: ItemListProps) {
  const router = useRouter()
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
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            categories: prev.categories.filter((x) => x !== c),
          })),
      })
    }
    for (const p of filterState.tripPriorities) {
      chips.push({
        id: `pri-${p}`,
        label: p,
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            tripPriorities: prev.tripPriorities.filter((x) => x !== p),
          })),
      })
    }
    for (const s of filterState.reservationStatuses) {
      chips.push({
        id: `res-${s}`,
        label: s,
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            reservationStatuses: prev.reservationStatuses.filter((x) => x !== s),
          })),
      })
    }
    if (filterState.showExcluded) {
      chips.push({
        id: 'excluded',
        label: '제외 포함',
        onRemove: () =>
          setFilterState((prev) => ({ ...prev, showExcluded: false })),
      })
    }
    return chips
  }, [filterState])

  const hasActiveFilter = activeCount > 0 || query.trim().length > 0

  function clearFilters() {
    setFilterState({
      categories: [],
      tripPriorities: [],
      reservationStatuses: [],
      showExcluded: false,
    })
    setQuery('')
  }

  function handleSortChange(key: SortKey, dir: SortDir) {
    setSortKey(key)
    setSortDir(dir)
  }

  const allGroups = useMemo(() => {
    const map = new Map<string, TripItem[]>()
    for (const item of items) {
      const key = item.name.trim().toLowerCase()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const { categories, tripPriorities, reservationStatuses, showExcluded } = filterState
    return items.filter((item) => {
      if (!showExcluded && item.trip_priority === '제외') return false
      if (categories.length && !categories.includes(item.category)) return false
      if (tripPriorities.length && !tripPriorities.includes(item.trip_priority))
        return false
      if (reservationStatuses.length) {
        if (
          !item.reservation_status ||
          !reservationStatuses.includes(item.reservation_status)
        )
          return false
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

  const renderEntries = useMemo(() => {
    const filteredIdSet = new Set(filtered.map((i) => i.id))
    const seen = new Set<string>()
    const entries: RenderEntry[] = []

    for (const item of filtered) {
      const key = item.name.trim().toLowerCase()
      const groupAll = allGroups.get(key) ?? []

      if (groupAll.length >= 2) {
        if (seen.has(key)) continue
        seen.add(key)

        const visibleItems = groupAll.filter((i) => filteredIdSet.has(i.id))
        if (visibleItems.length === 0) continue

        let sk: string | number = key
        if (sortKey === 'date') {
          const dates = visibleItems.map((i) => i.date ?? '').filter(Boolean)
          sk = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : ''
        } else if (sortKey === 'budget') {
          const budgets = visibleItems.map((i) => i.budget ?? 0)
          sk = budgets.length ? Math.min(...budgets) : 0
        } else if (sortKey === 'trip_priority') {
          const orders = visibleItems.map(
            (i) => TRIP_PRIORITY_META[i.trip_priority].order,
          )
          sk = orders.length ? Math.max(...orders) : 0
        }

        entries.push({
          type: 'group',
          name: item.name,
          visibleItems,
          totalCount: groupAll.length,
          sortKey: sk,
        })
      } else {
        let sk: string | number = key
        if (sortKey === 'date') sk = item.date ?? ''
        else if (sortKey === 'budget') sk = item.budget ?? 0
        else if (sortKey === 'trip_priority')
          sk = TRIP_PRIORITY_META[item.trip_priority].order

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
    () =>
      renderEntries.reduce(
        (acc, e) => acc + (e.type === 'group' ? e.visibleItems.length : 1),
        0,
      ),
    [renderEntries],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            type="search"
            hideLabel
            label="검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·주소·메모로 검색"
            leading={<Search className="size-4" aria-hidden="true" />}
          />
        </div>
        <div className="relative flex items-center gap-1.5 flex-shrink-0">
          <FilterButton
            activeCount={activeCount}
            onClick={() => setFilterPanelOpen(true)}
          />
          <SortButton sortKey={sortKey} sortDir={sortDir} onChange={handleSortChange} />
        </div>
      </div>

      <ActiveFilterChips chips={activeChips} />

      <p className="text-xs text-fg-subtle tabular" aria-live="polite">
        {totalDisplayCount}개 항목
      </p>

      <div className="space-y-2">
        {renderEntries.map((entry) =>
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
          ),
        )}
        {renderEntries.length === 0 && items.length === 0 && (
          <EmptyState
            icon={<MapPin className="size-10" aria-hidden="true" />}
            title="아직 장소가 없어요"
            description="가고 싶은 장소를 추가하면 여기에 모입니다."
            action={
              <Button onClick={() => router.push('/items/new')}>
                첫 장소 추가하기
              </Button>
            }
          />
        )}
        {renderEntries.length === 0 && items.length > 0 && (
          <EmptyState
            icon={<SearchX className="size-10" aria-hidden="true" />}
            title="검색 결과가 없어요"
            description="다른 키워드를 입력하거나 필터를 줄여보세요."
            action={
              hasActiveFilter ? (
                <Button variant="secondary" onClick={clearFilters}>
                  필터 초기화
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      <FilterPanel
        isOpen={filterPanelOpen}
        filterState={filterState}
        onChange={setFilterState}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  )
}
