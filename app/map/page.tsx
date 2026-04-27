'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import { useItems } from '@/lib/hooks/useItems'
import DayTabs, { type DaySummary } from '@/components/Schedule/DayTabs'
import DayTimeline from '@/components/Schedule/DayTimeline'
import MapCandidatePanel from '@/components/Map/MapCandidatePanel'
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null
  const days = useMemo(() => buildDaySummaries(items), [items])

  // 첫 렌더 시 첫 day 자동 선택
  useEffect(() => {
    if (selectedDate === null && days.length > 0) {
      setSelectedDate(days[0].date)
    }
  }, [days, selectedDate])

  const dayItems = useMemo(() => {
    if (!selectedDate) return [] as TripItem[]
    return items
      .filter(i => i.trip_priority === '확정' && occursOnDate(i, selectedDate))
      .sort((a, b) => (a.time_start ?? '99:99').localeCompare(b.time_start ?? '99:99'))
  }, [items, selectedDate])

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
      {/* Desktop layout: left candidates | center map | bottom day strip */}
      <div className="hidden md:flex h-screen flex-col">
        <div className="flex min-h-0 flex-1">
          <div className="w-[300px] flex-shrink-0 border-r border-gray-200">
            <MapCandidatePanel
              items={items}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
            />
          </div>
          <div className="relative min-w-0 flex-1">
            <TripPlannerMap
              items={items}
              selectedDate={selectedDate}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
            />
          </div>
        </div>
        {days.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <DayTabs days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
            <div className="border-t border-gray-100">
              <DayTimeline
                items={dayItems}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile layout: map fullscreen + bottom day tabs (timeline scrolls) */}
      <div className="md:hidden flex h-[calc(100vh-56px)] flex-col">
        <div className="relative min-h-0 flex-1">
          <TripPlannerMap
            items={items}
            selectedDate={selectedDate}
            selectedItemId={selectedItemId}
            onSelectItem={handleSelectItem}
          />
        </div>
        {days.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <DayTabs days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
            {dayItems.length > 0 && (
              <div className="border-t border-gray-100">
                <DayTimeline
                  items={dayItems}
                  selectedItemId={selectedItemId}
                  onSelectItem={handleSelectItem}
                />
              </div>
            )}
          </div>
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
