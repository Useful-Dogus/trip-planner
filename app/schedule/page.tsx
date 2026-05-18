'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { useItems } from '@/lib/hooks/useItems'
import { useToast } from '@/components/UI/Toast'

const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageContent />
    </Suspense>
  )
}

function SchedulePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, isLoading, updateItem, createItem } = useItems()
  const { showToast } = useToast()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get('item'),
  )

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find((i) => i.id === selectedItemId)) {
      setSelectedItemId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('item')
      router.replace(
        params.toString() ? `/schedule?${params.toString()}` : '/schedule',
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
      params.toString() ? `/schedule?${params.toString()}` : '/schedule',
      { scroll: false },
    )
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(
      params.toString() ? `/schedule?${params.toString()}` : '/schedule',
      { scroll: false },
    )
  }

  return (
    <div className="md:pl-44 bg-bg text-fg min-h-screen">
      <header className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-fg">일정</h1>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-6">
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
        onSave={() => showToast({ type: 'success', message: '저장했어요' })}
        onDelete={() => {
          handleClosePanel()
          showToast({ type: 'success', message: '삭제했어요' })
        }}
      />
    </div>
  )
}
