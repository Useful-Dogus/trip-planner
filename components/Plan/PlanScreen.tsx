'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import MapSidePanel, { type DaySummary } from '@/components/Map/MapSidePanel'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import FAB from '@/components/UI/FAB'
import { useItems } from '@/lib/hooks/useItems'
import {
  PANEL_SNAP_POINTS_VH,
  useMobilePanelHeight,
} from '@/lib/hooks/useMobilePanelHeight'
import { useToast } from '@/components/UI/Toast'
import { CATEGORY_OPTIONS } from '@/lib/itemOptions'
import type { Category, TripItem } from '@/types'

const TripPlannerMap = dynamic(() => import('@/components/Map/TripPlannerMap'), {
  ssr: false,
})
const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

interface PlanScreenProps {
  /** URL 동기화에 사용할 라우트 경로 (예: '/plan' 또는 '/map') */
  basePath: string
}

function nextDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

function occursOnDate(item: TripItem, date: string): boolean {
  if (!item.date) return false
  if (item.date === date) return true
  if (item.end_date && !item.time_start) {
    return item.date <= date && date <= item.end_date
  }
  return false
}

function buildDaySummaries(items: TripItem[]): DaySummary[] {
  const confirmed = items.filter((i) => i.trip_priority === '확정' && i.date)
  const dateSet = new Set<string>()
  for (const i of confirmed) {
    dateSet.add(i.date!)
    if (i.end_date && !i.time_start) {
      let cur = nextDate(i.date!)
      while (cur <= i.end_date) {
        dateSet.add(cur)
        cur = nextDate(cur)
      }
    }
  }
  const sortedDates = Array.from(dateSet).sort()
  if (sortedDates.length === 0) return []

  const tripStart = sortedDates[0]
  return sortedDates.map((date) => {
    const dayItems = confirmed.filter((i) => occursOnDate(i, date))
    const counts = new Map<Category, number>()
    for (const it of dayItems) {
      counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
    }
    const breakdown = CATEGORY_OPTIONS.filter((c) => counts.has(c)).map((c) => ({
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

export default function PlanScreen({ basePath }: PlanScreenProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, isLoading } = useItems()
  const { showToast } = useToast()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get('item'),
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    searchParams.get('day'),
  )

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null
  const days = useMemo(() => buildDaySummaries(items), [items])
  const mobilePanel = useMobilePanelHeight()

  // URL ↔ state 동기화 헬퍼
  function pushUrl(updates: { item?: string | null; day?: string | null }) {
    const params = new URLSearchParams(searchParams.toString())
    if ('item' in updates) {
      if (updates.item) params.set('item', updates.item)
      else params.delete('item')
    }
    if ('day' in updates) {
      if (updates.day) params.set('day', updates.day)
      else params.delete('day')
    }
    const qs = params.toString()
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
  }

  // invalid item ID 처리
  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find((i) => i.id === selectedItemId)) {
      setSelectedItemId(null)
      pushUrl({ item: null })
    }
  }, [items, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectItem(id: string) {
    const next = selectedItemId === id ? null : id
    setSelectedItemId(next)
    pushUrl({ item: next })
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    pushUrl({ item: null })
  }

  function handleSelectDate(date: string | null) {
    setSelectedDate(date)
    pushUrl({ day: date })
  }

  function handleSaved() {
    showToast({ type: 'success', message: '저장했어요' })
  }

  function handleDeleted(id: string) {
    setSelectedItemId(null)
    pushUrl({ item: null })
    showToast({ type: 'success', message: '삭제했어요' })
  }

  const sidePanel = (
    <MapSidePanel
      items={items}
      days={days}
      selectedDate={selectedDate}
      selectedItemId={selectedItemId}
      onSelectDate={handleSelectDate}
      onSelectItem={handleSelectItem}
    />
  )

  return (
    <div className="md:pl-44 bg-bg text-fg">
      {/* Desktop: side panel | map */}
      <div className="hidden md:flex h-screen">
        <div className="w-[360px] flex-shrink-0 border-r border-border bg-bg-elevated">
          {sidePanel}
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

      {/* Mobile: map fullscreen + bottom drawer with same panel */}
      <div
        className="md:hidden flex h-[calc(100vh-56px)] flex-col relative"
        style={{ '--mobile-panel-height': mobilePanel.heightStyle } as React.CSSProperties}
      >
        <div className="relative min-h-0 flex-1">
          <TripPlannerMap
            items={items}
            selectedDate={selectedDate}
            selectedItemId={selectedItemId}
            onSelectItem={handleSelectItem}
          />
          {/* 모바일 우측 상단 떠있는 테마 토글 + FAB */}
          <div className="absolute top-3 right-3 z-[600]">
            <ThemeToggle />
          </div>
          <FAB className="bottom-[calc(var(--mobile-panel-height,40vh)+1rem)] right-4" />
        </div>
        <div
          className={`flex-shrink-0 border-t border-border bg-bg-elevated flex flex-col ${
            mobilePanel.isDragging ? '' : 'transition-[height] duration-200 ease-out'
          }`}
          style={{ height: mobilePanel.heightStyle }}
        >
          <button
            type="button"
            role="slider"
            aria-label="패널 높이 조정"
            aria-valuemin={PANEL_SNAP_POINTS_VH[0]}
            aria-valuemax={PANEL_SNAP_POINTS_VH[PANEL_SNAP_POINTS_VH.length - 1]}
            aria-valuenow={PANEL_SNAP_POINTS_VH[mobilePanel.snapIndex]}
            aria-valuetext={
              ['축소', '기본', '확장'][mobilePanel.snapIndex] ?? '기본'
            }
            className="flex-shrink-0 flex items-center justify-center w-full py-2 cursor-row-resize touch-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            {...mobilePanel.handlers}
          >
            <span
              aria-hidden="true"
              className="block h-1 w-10 rounded-full bg-fg-subtle/40"
            />
          </button>
          <div className="min-h-0 flex-1">{sidePanel}</div>
        </div>
      </div>

      <Navigation />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={handleClosePanel}
        onSave={handleSaved}
        onDelete={handleDeleted}
      />
    </div>
  )
}
