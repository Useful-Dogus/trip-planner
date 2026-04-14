'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ResearchTable from '@/components/Research/ResearchTable'
import { useItems } from '@/lib/hooks/useItems'

const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

type Tab = 'list' | 'table' | 'map'

export default function ResearchPage() {
  const { items, isLoading, updateItem, createItem } = useItems()
  const [tab, setTab] = useState<Tab>('list')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  return (
    <div className="md:pl-44">
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">리서치</h1>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'list' ? (
        <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-6">
          <ItemList
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={id => setSelectedItemId(prev => (prev === id ? null : id))}
            onUpdateItem={updateItem}
          />
        </div>
      ) : tab === 'table' ? (
        <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-6">
          <ResearchTable
            items={items}
            onUpdateItem={updateItem}
            onCreateItem={createItem}
            onOpenPanel={id => setSelectedItemId(prev => (prev === id ? null : id))}
          />
        </div>
      ) : (
        <div className="h-[calc(100vh-72px-56px)] md:h-[calc(100vh-72px)]">
          <ResearchMap
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

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { value: Tab; label: string }[] = [
    { value: 'list', label: '목록' },
    { value: 'table', label: '테이블' },
    { value: 'map', label: '지도' },
  ]
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {tabs.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
