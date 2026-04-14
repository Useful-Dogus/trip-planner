'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import { useItems } from '@/lib/hooks/useItems'

const ScheduleMap = dynamic(() => import('@/components/Map/ScheduleMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

export default function SchedulePage() {
  const { items, isLoading, updateItem, createItem } = useItems()
  const [tab, setTab] = useState<'table' | 'map'>('table')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  return (
    <div className="md:pl-44">
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">일정</h1>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'table' ? (
        <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-6">
          <ScheduleTable
            items={items}
            onUpdateItem={updateItem}
            onCreateItem={createItem}
            onOpenPanel={id => setSelectedItemId(prev => (prev === id ? null : id))}
          />
        </div>
      ) : (
        <div className="h-[calc(100vh-72px-56px)] md:h-[calc(100vh-72px)]">
          <ScheduleMap
            items={items}
            onSelectItem={id => setSelectedItemId(prev => (prev === id ? null : id))}
          />
        </div>
      )}

      <Navigation />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={() => setSelectedItemId(null)}
        onSave={() => {}}
        onDelete={() => setSelectedItemId(null)}
      />
    </div>
  )
}

function TabSwitcher({
  tab,
  onChange,
}: {
  tab: 'table' | 'map'
  onChange: (t: 'table' | 'map') => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {(['table', 'map'] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {t === 'table' ? '목록' : '지도'}
        </button>
      ))}
    </div>
  )
}
