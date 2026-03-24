'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemList from '@/components/Items/ItemList'
import type { TripItem } from '@/types'

const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), { ssr: false })

export default function ResearchPage() {
  const [items, setItems] = useState<TripItem[]>([])
  const [tab, setTab] = useState<'list' | 'map'>('list')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="md:pl-44">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">리서치</h1>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16 text-sm">불러오는 중...</p>
        ) : tab === 'list' ? (
          <ItemList items={items} />
        ) : (
          <div className="h-[calc(100vh-130px)] -mx-4">
            <ResearchMap items={items} />
          </div>
        )}
      </div>
      <Navigation />
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
