'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ResearchTable from '@/components/Research/ResearchTable'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import FAB from '@/components/UI/FAB'
import { useItems } from '@/lib/hooks/useItems'

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
          <h1 className="text-xl font-bold text-gray-900">전체</h1>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 md:px-8 space-y-2 max-w-3xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : view === 'items' ? (
        <>
          {/* 모바일: 카드 뷰 */}
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
          {/* 데스크탑: 테이블 뷰 (넓은 너비 활용) */}
          <div className="hidden md:block px-8 pb-6">
            <ResearchTable
              items={items}
              onUpdateItem={updateItem}
              onCreateItem={createItem}
              onOpenPanel={handleSelectItem}
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
