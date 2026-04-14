'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ResearchTable from '@/components/Research/ResearchTable'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import FAB from '@/components/UI/FAB'
import FilterButton from '@/components/Research/FilterButton'
import FilterPanel from '@/components/Research/FilterPanel'
import SortButton from '@/components/Research/SortButton'
import ActiveFilterChips from '@/components/Research/ActiveFilterChips'
import { useItems } from '@/lib/hooks/useItems'
import type { FilterState, SortKey, SortDir } from '@/components/Items/ItemList'
import { getActiveFilterCount } from '@/components/Items/ItemList'
import type { Category, ReservationStatus, TripPriority } from '@/types'

const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

type ViewMode = 'items' | 'schedule'

export default function ResearchPage() {
  return (
    <Suspense fallback={null}>
      <ResearchPageContent />
    </Suspense>
  )
}

function ResearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, isLoading, updateItem, createItem } = useItems()
  const [view, setView] = useState<ViewMode>('items')

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    () => searchParams.get('item')
  )
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())

  // 데스크탑 검색/필터/정렬 상태
  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    tripPriorities: [],
    reservationStatuses: [],
    showExcluded: false,
  })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
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
        onRemove: () =>
          setFilterState(prev => ({ ...prev, reservationStatuses: prev.reservationStatuses.filter(x => x !== s) })),
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

  // 데스크탑 테이블에 넘길 필터된 아이템
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && activeCount === 0) return items
    return items.filter(item => {
      if (!filterState.showExcluded && item.trip_priority === '제외') return false
      if (filterState.categories.length && !filterState.categories.includes(item.category as Category)) return false
      if (filterState.tripPriorities.length && !filterState.tripPriorities.includes(item.trip_priority as TripPriority)) return false
      if (filterState.reservationStatuses.length) {
        if (!item.reservation_status || !filterState.reservationStatuses.includes(item.reservation_status as ReservationStatus)) return false
      }
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, query, filterState, activeCount])

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  // 임포트 완료 하이라이트 처리 (마운트 시 1회)
  useEffect(() => {
    const imported = searchParams.get('imported')
    if (!imported) return

    const ids = new Set(imported.split(',').filter(Boolean))
    setHighlightedIds(ids)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('imported')
    const newUrl = params.toString() ? `/research?${params.toString()}` : '/research'
    router.replace(newUrl, { scroll: false })

    const timer = setTimeout(() => setHighlightedIds(new Set()), 1000)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // invalid item ID 처리
  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find(i => i.id === selectedItemId)) {
      setSelectedItemId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('item')
      router.replace(params.toString() ? `/research?${params.toString()}` : '/research', { scroll: false })
    }
  }, [items, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectItem(id: string) {
    const next = selectedItemId === id ? null : id
    setSelectedItemId(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('item', next)
    else params.delete('item')
    router.replace(params.toString() ? `/research?${params.toString()}` : '/research', { scroll: false })
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(params.toString() ? `/research?${params.toString()}` : '/research', { scroll: false })
  }

  return (
    <div className="md:pl-44">
      {/* 헤더 */}
      <div className="px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">목록</h1>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* 데스크탑 검색/필터/정렬 툴바 — 목록 뷰에서만 표시 */}
        {view === 'items' && (
          <div className="hidden md:block mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="이름으로 검색..."
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
              />
              <div className="relative flex items-center gap-1.5 flex-shrink-0">
                <FilterButton activeCount={activeCount} onClick={() => setFilterPanelOpen(v => !v)} />
                <FilterPanel
                  isOpen={filterPanelOpen}
                  filterState={filterState}
                  onChange={setFilterState}
                  onClose={() => setFilterPanelOpen(false)}
                />
                <SortButton sortKey={sortKey} sortDir={sortDir} onChange={(k, d) => { setSortKey(k); setSortDir(d) }} />
              </div>
            </div>
            {activeChips.length > 0 && (
              <div className="mt-2">
                <ActiveFilterChips chips={activeChips} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{filteredItems.length}개 항목</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="px-4 md:px-8 space-y-2 max-w-3xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : view === 'items' ? (
        <>
          {/* 모바일: 카드 뷰 — ItemList가 자체적으로 검색/필터/정렬 포함 */}
          <div className="md:hidden px-4 pb-28">
            <ItemList
              items={items}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
              onUpdateItem={updateItem}
              highlightedIds={highlightedIds}
            />
            <FAB />
          </div>
          {/* 데스크탑: 테이블 뷰 */}
          <div className="hidden md:block px-8 pb-6">
            <ResearchTable
              items={filteredItems}
              onUpdateItem={updateItem}
              onCreateItem={createItem}
              onOpenPanel={handleSelectItem}
              sortKey={sortKey}
              sortDir={sortDir}
              hasActiveSearch={query.trim().length > 0 || activeCount > 0}
            />
          </div>
        </>
      ) : (
        /* 일정 뷰: 모바일/데스크탑 공통 */
        <div className="px-4 md:px-8 pb-24 md:pb-6">
          <ScheduleTable
            items={items}
            onUpdateItem={updateItem}
            onCreateItem={createItem}
            onOpenPanel={handleSelectItem}
          />
        </div>
      )}

      <Navigation />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={handleClosePanel}
        onSave={() => {}}
        onDelete={handleClosePanel}
      />
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => onChange('items')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          view === 'items' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        목록
      </button>
      <button
        onClick={() => onChange('schedule')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          view === 'schedule' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
        }`}
      >
        일정
      </button>
    </div>
  )
}
