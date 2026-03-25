'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemCard from '@/components/Items/ItemCard'
import type { TripItem } from '@/types'

const ScheduleMap = dynamic(() => import('@/components/Map/ScheduleMap'), { ssr: false })

export default function SchedulePage() {
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

  const confirmedItems = useMemo(() => items.filter(item => item.status === '확정'), [items])

  const scheduleItems = useMemo(() => {
    return confirmedItems
      .filter(item => item.date)
      .sort((a, b) => {
        if (a.date! < b.date!) return -1
        if (a.date! > b.date!) return 1
        if (!a.time_start && !b.time_start) return 0
        if (!a.time_start) return 1
        if (!b.time_start) return -1
        return a.time_start.localeCompare(b.time_start)
      })
  }, [confirmedItems])

  const undatedItems = useMemo(() => confirmedItems.filter(item => !item.date), [confirmedItems])

  const grouped = useMemo(() => {
    const groups: Record<string, TripItem[]> = {}
    for (const item of scheduleItems) {
      const date = item.date!
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    }
    return groups
  }, [scheduleItems])

  const totalBudget = useMemo(
    () => confirmedItems.reduce((sum, item) => sum + (item.budget ?? 0), 0),
    [confirmedItems]
  )

  return (
    <div className="md:pl-44">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24 md:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">일정</h1>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-16 text-sm">불러오는 중...</p>
        ) : tab === 'list' ? (
          <div className="space-y-6">
            {confirmedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-sm font-medium text-gray-700 mb-1">확정된 일정이 없어요</p>
                <p className="text-xs text-gray-400">
                  항목 상태를 &quot;확정&quot;으로 변경하고 날짜를 입력하면
                  <br />
                  여기에 일정이 표시됩니다
                </p>
              </div>
            ) : (
              <>
                {/* 예산 합계 */}
                {totalBudget > 0 && (
                  <div className="flex items-center justify-between px-1 py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400">확정 항목 예산 합계</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${totalBudget.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* 날짜별 일정 */}
                {Object.entries(grouped).map(([date, dateItems]) => {
                  const dayBudget = dateItems.reduce((sum, item) => sum + (item.budget ?? 0), 0)
                  return (
                    <div key={date}>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {date}
                        </h2>
                        {dayBudget > 0 && (
                          <span className="text-xs text-gray-400">
                            ${dayBudget.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {dateItems.map(item => (
                          <ItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* 날짜 미정 섹션 */}
                {undatedItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        미정
                      </h2>
                      {undatedItems.reduce((sum, i) => sum + (i.budget ?? 0), 0) > 0 && (
                        <span className="text-xs text-gray-400">
                          $
                          {undatedItems
                            .reduce((sum, i) => sum + (i.budget ?? 0), 0)
                            .toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {undatedItems.map(item => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="h-[calc(100vh-130px)] -mx-4">
            <ScheduleMap items={items} />
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
