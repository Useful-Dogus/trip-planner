'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import { useItems } from '@/lib/hooks/useItems'

const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), { ssr: false })
const ScheduleMap = dynamic(() => import('@/components/Map/ScheduleMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

type MapView = 'all' | 'schedule'

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageContent />
    </Suspense>
  )
}

function MapPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, isLoading } = useItems()
  const [mapView, setMapView] = useState<MapView>('all')

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    () => searchParams.get('item')
  )

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null

  // invalid item ID 처리
  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find(i => i.id === selectedItemId)) {
      setSelectedItemId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('item')
      router.replace(params.toString() ? `/map?${params.toString()}` : '/map', { scroll: false })
    }
  }, [items, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectItem(id: string) {
    const next = selectedItemId === id ? null : id
    setSelectedItemId(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('item', next)
    else params.delete('item')
    router.replace(params.toString() ? `/map?${params.toString()}` : '/map', { scroll: false })
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(params.toString() ? `/map?${params.toString()}` : '/map', { scroll: false })
  }

  return (
    <div className="md:pl-44">
      <div className="relative h-[calc(100vh-56px)] md:h-screen">
        {/* 지도 뷰 토글 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setMapView('all')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mapView === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setMapView('schedule')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mapView === 'schedule' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            일정
          </button>
        </div>

        {mapView === 'all' ? (
          <ResearchMap items={items} onSelectItem={handleSelectItem} />
        ) : (
          <ScheduleMap items={items} onSelectItem={handleSelectItem} />
        )}
      </div>

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
