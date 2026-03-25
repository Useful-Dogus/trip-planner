'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import type { TripItem } from '@/types'

const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

export default function ResearchPage() {
  const [items, setItems] = useState<TripItem[]>([])
  const [tab, setTab] = useState<'list' | 'map'>('list')
  const [loading, setLoading] = useState(true)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
  }, [])

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  function handleSave(updated: TripItem) {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setSelectedItemId(null)
  }

  return (
    <div className="md:pl-44">
      {/* Header: 항상 제한된 너비 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">리서치</h1>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>
      </div>

      {/* 콘텐츠: 목록은 제한 너비, 지도는 전체 너비 */}
      {loading ? (
        <div className="max-w-2xl mx-auto px-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'list' ? (
        <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-6">
          <ItemList
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={id => setSelectedItemId(prev => (prev === id ? null : id))}
          />
        </div>
      ) : (
        <div className="h-[calc(100vh-72px)]">
          <ResearchMap items={items} />
        </div>
      )}

      <Navigation />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={() => setSelectedItemId(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

function TabSwitcher({
  tab,
  onChange,
}: {
  tab: 'list' | 'map'
  onChange: (t: 'list' | 'map') => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {(['list', 'map'] as const).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {t === 'list' ? '목록' : '지도'}
        </button>
      ))}
    </div>
  )
}
