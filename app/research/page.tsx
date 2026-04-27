'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ResearchTableSkeleton from '@/components/UI/ResearchTableSkeleton'
import ResearchTable from '@/components/Research/ResearchTable'
import FAB from '@/components/UI/FAB'
import FilterButton from '@/components/Research/FilterButton'
import FilterPanel from '@/components/Research/FilterPanel'
import ActiveFilterChips from '@/components/Research/ActiveFilterChips'
import { Input } from '@/components/UI/Input'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { useItems } from '@/lib/hooks/useItems'
import { useToast } from '@/components/UI/Toast'
import type { FilterState } from '@/components/Items/ItemList'
import { getActiveFilterCount } from '@/components/Items/ItemList'
import type { Category, ReservationStatus, TripPriority } from '@/types'

const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

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
  const { showToast } = useToast()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get('item'),
  )
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())

  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    tripPriorities: [],
    reservationStatuses: [],
    showExcluded: false,
  })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
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

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q && activeCount === 0) return items
    return items.filter((item) => {
      if (!filterState.showExcluded && item.trip_priority === '제외') return false
      if (
        filterState.categories.length &&
        !filterState.categories.includes(item.category as Category)
      )
        return false
      if (
        filterState.tripPriorities.length &&
        !filterState.tripPriorities.includes(item.trip_priority as TripPriority)
      )
        return false
      if (filterState.reservationStatuses.length) {
        if (
          !item.reservation_status ||
          !filterState.reservationStatuses.includes(
            item.reservation_status as ReservationStatus,
          )
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
  }, [items, query, filterState, activeCount])

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

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

  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find((i) => i.id === selectedItemId)) {
      setSelectedItemId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('item')
      router.replace(
        params.toString() ? `/research?${params.toString()}` : '/research',
        { scroll: false },
      )
    }
  }, [items, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectItem(id: string) {
    const next = selectedItemId === id ? null : id
    setSelectedItemId(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('item', next)
    else params.delete('item')
    router.replace(
      params.toString() ? `/research?${params.toString()}` : '/research',
      { scroll: false },
    )
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(
      params.toString() ? `/research?${params.toString()}` : '/research',
      { scroll: false },
    )
  }

  return (
    <div className="md:pl-44 bg-bg text-fg min-h-screen">
      <header className="px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-fg">목록</h1>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="hidden md:block mb-4">
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
                onClick={() => setFilterPanelOpen((v) => !v)}
              />
              <FilterPanel
                isOpen={filterPanelOpen}
                filterState={filterState}
                onChange={setFilterState}
                onClose={() => setFilterPanelOpen(false)}
              />
            </div>
          </div>
          {activeChips.length > 0 && (
            <div className="mt-2">
              <ActiveFilterChips chips={activeChips} />
            </div>
          )}
          <p className="text-xs text-fg-subtle mt-2 tabular" aria-live="polite">
            {filteredItems.length}개 항목
          </p>
        </div>
      </header>

      {isLoading ? (
        <>
          <div className="md:hidden px-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
          <div className="hidden md:block px-8">
            <ResearchTableSkeleton />
          </div>
        </>
      ) : (
        <>
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
          <div className="hidden md:block px-8 pb-6">
            <ResearchTable
              items={filteredItems}
              onUpdateItem={updateItem}
              onCreateItem={createItem}
              onOpenPanel={handleSelectItem}
              hasActiveSearch={query.trim().length > 0 || activeCount > 0}
            />
          </div>
        </>
      )}

      <Navigation />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={handleClosePanel}
        onSave={() => showToast({ type: 'success', message: '저장했어요' })}
        onDelete={() => {
          handleClosePanel()
          showToast({ type: 'success', message: '삭제했어요' })
        }}
      />
    </div>
  )
}
