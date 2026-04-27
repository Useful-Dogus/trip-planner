'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import { useItems } from '@/lib/hooks/useItems'
import MapSidePanel, { type DaySummary } from '@/components/Map/MapSidePanel'
import { CATEGORY_OPTIONS } from '@/lib/itemOptions'
import type { Category, TripItem } from '@/types'

const TripPlannerMap = dynamic(() => import('@/components/Map/TripPlannerMap'), { ssr: false })
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageContent />
    </Suspense>
  )
}

function nextDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

function occursOnDate(item: TripItem, date: string): boolean {
  if (!item.date) return false
  if (!item.end_date) return item.date === date
  return item.date <= date && date <= item.end_date
}

function buildDaySummaries(items: TripItem[]): DaySummary[] {
  const confirmed = items.filter(i => i.trip_priority === '확정' && i.date)
  const dateSet = new Set<string>()
  for (const i of confirmed) {
    const end = i.end_date ?? i.date!
    let cur = i.date!
    while (cur <= end) {
      dateSet.add(cur)
      cur = nextDate(cur)
    }
  }
  const sortedDates = Array.from(dateSet).sort()
  if (sortedDates.length === 0) return []

  const tripStart = sortedDates[0]
  return sortedDates.map(date => {
    const dayItems = confirmed.filter(i => occursOnDate(i, date))
    const counts = new Map<Category, number>()
    for (const it of dayItems) {
      counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
    }
    const breakdown = CATEGORY_OPTIONS.filter(c => counts.has(c)).map(c => ({
      category: c,
      count: counts.get(c)!,
    }))
    const offsetMs = new Date(date).getTime() - new Date(tripStart).getTime()
    const dayOffset = Math.round(offsetMs / (1000 * 60 * 60 * 24))
    return {
      date,
      dayOffset,
      stopCount: dayItems.length,
      breakdown,
    }
  })
}

function MapPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, isLoading } = useItems()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    () => searchParams.get('item'),
  )
  // null = 후보 모드 (기본). 날짜 문자열이면 해당 day 모드.
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null
  const days = useMemo(() => buildDaySummaries(items), [items])

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

  const sidePanel = (
    <MapSidePanel
      items={items}
      days={days}
      selectedDate={selectedDate}
      selectedItemId={selectedItemId}
      onSelectDate={setSelectedDate}
      onSelectItem={handleSelectItem}
    />
  )

  return (
    <div className="md:pl-44">
      {/* Desktop: side panel | map */}
      <div className="hidden md:flex h-screen">
        <div className="w-[320px] flex-shrink-0 border-r border-gray-200">{sidePanel}</div>
        <div className="relative min-w-0 flex-1">
          <TripPlannerMap
            items={items}
            selectedDate={selectedDate}
            selectedItemId={selectedItemId}
            onSelectItem={handleSelectItem}
          />
        </div>
      </div>

      {/* Mobile: map fullscreen + bottom drawer with same panel */}
      <div className="md:hidden flex h-[calc(100vh-56px)] flex-col">
        <div className="relative min-h-0 flex-1">
          <TripPlannerMap
            items={items}
            selectedDate={selectedDate}
            selectedItemId={selectedItemId}
            onSelectItem={handleSelectItem}
          />
        </div>
        <div className="flex-shrink-0 border-t border-gray-200" style={{ height: '40vh' }}>
          {sidePanel}
        </div>
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
