'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import { useItems } from '@/lib/hooks/useItems'

const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

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
      <div className="h-[calc(100vh-56px)] md:h-screen">
        <ResearchMap
          items={items}
          onSelectItem={handleSelectItem}
        />
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
