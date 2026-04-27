'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import type { Category, ReservationStatus, TripItem } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS, RESERVATION_STATUS_META } from '@/lib/itemOptions'
import { haversineKm } from '@/lib/distance'
import { EDITABLE_FIELDS, type EditableField } from './TableRow'
import TableRow from './TableRow'
import DateGroupHeader from './DateGroupHeader'
import DistanceSeparator from './DistanceSeparator'

interface EditingCell {
  itemId: string
  field: EditableField
}

interface ScheduleTableProps {
  items: TripItem[]
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
  onCreateItem: (item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>) => void
  onOpenPanel: (id: string) => void
}

const UNDATED_KEY = '__undated__'
const TABLE_MIN_WIDTH = 'min-w-[720px]'

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.round((db - da) / (1000 * 60 * 60 * 24)) + 1
}

function formatBudget(value?: number) {
  if (value === undefined) return ''
  return `$${value.toLocaleString()}`
}

function formatTimeRange(item: TripItem) {
  if (item.time_start && item.time_end) return `${item.time_start} - ${item.time_end}`
  if (item.time_start) return item.time_start
  return '시간 없음'
}

function getStatusMeta(value: ReservationStatus | null | undefined) {
  if (!value) {
    return {
      dotClass: 'bg-gray-200',
      label: '예약 정보 없음',
    }
  }

  const shortLabel: Record<ReservationStatus, string> = {
    예약완료: '예약완료',
    '필요(미예약)': '예약필요',
    불필요: '불필요',
    '확인 필요': '확인필요',
  }

  return {
    dotClass: {
      예약완료: 'bg-green-500',
      '필요(미예약)': 'bg-orange-400',
      불필요: 'bg-gray-300',
      '확인 필요': 'bg-yellow-400',
    }[value],
    label: shortLabel[value],
  }
}

function buildCategoryBreakdown(items: TripItem[]): { category: Category; count: number }[] {
  const counts = new Map<Category, number>()
  for (const it of items) {
    counts.set(it.category, (counts.get(it.category) ?? 0) + 1)
  }
  return CATEGORY_OPTIONS
    .filter(c => counts.has(c))
    .map(c => ({ category: c, count: counts.get(c)! }))
}

function distanceBetween(a: TripItem, b: TripItem): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const km = haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
  if (km < 0.05) return null
  return km
}

function formatDate(dateStr: string): string {
  if (dateStr === UNDATED_KEY) return '날짜 미정'
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = days[d.getUTCDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

function MobileScheduleItemCard({
  item,
  onOpenPanel,
}: {
  item: TripItem
  onOpenPanel: (id: string) => void
}) {
  const status = getStatusMeta(item.reservation_status)
  const budget = formatBudget(item.budget)
  const time = formatTimeRange(item)
  const emoji = CATEGORY_META[item.category]?.emoji ?? '📌'

  return (
    <button
      type="button"
      onClick={() => onOpenPanel(item.id)}
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-lg">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{item.category}</p>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
              <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
              {status.label}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500">
            <span className="tabular-nums">{time}</span>
            {budget ? <span className="tabular-nums font-medium text-gray-700">{budget}</span> : <span />}
          </div>
        </div>
      </div>
    </button>
  )
}

function MobileNewItemEditor({
  date,
  inputRef,
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  date: string
  inputRef: (el: HTMLInputElement | null) => void
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-4">
      <div className="mb-2 text-xs font-medium text-blue-700">{formatDate(date)}</div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => onKeyDown(e, value)}
        placeholder="이름 입력 후 Enter…"
        className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none text-sm text-gray-900 py-1"
        style={{ fontSize: 16 }}
      />
    </div>
  )
}

export default function ScheduleTable({
  items,
  onUpdateItem,
  onCreateItem,
  onOpenPanel,
}: ScheduleTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())
  const [undatedCollapsed, setUndatedCollapsed] = useState(false)
  const [addingToDate, setAddingToDate] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const cancelNewItemRef = useRef(false)
  const newItemInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) setTimeout(() => el.focus(), 0)
  }, [])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const todayRef = useRef<HTMLDivElement>(null)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.date ?? '9999-12-31'
      const db = b.date ?? '9999-12-31'
      if (da !== db) return da.localeCompare(db)
      return (a.time_start ?? '').localeCompare(b.time_start ?? '')
    })
  }, [items])

  const dateGroups = useMemo(() => {
    const groups = new Map<string, TripItem[]>()
    for (const item of sortedItems) {
      const key = item.date ?? UNDATED_KEY
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return groups
  }, [sortedItems])

  const tripStartDate = useMemo(() => {
    const dates = items.map(i => i.date).filter(Boolean) as string[]
    return dates.length ? [...dates].sort()[0] : null
  }, [items])

  function getDayOffset(date: string): number | null {
    if (!tripStartDate || date === UNDATED_KEY) return null
    return daysBetween(tripStartDate, date)
  }

  // 오늘 날짜 자동 스크롤 (마운트 시 1회)
  useEffect(() => {
    if (!todayRef.current) return
    const todayItems = dateGroups.get(todayKey)
    if (todayItems && todayItems.length > 0) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNavigate(direction: 'tab' | 'shift-tab' | 'enter' | 'escape', field: EditableField) {
    if (!editingCell) return
    if (direction === 'escape') {
      setEditingCell(null)
      return
    }

    const itemIdx = sortedItems.findIndex(i => i.id === editingCell.itemId)
    const fieldIdx = EDITABLE_FIELDS.indexOf(field)

    if (direction === 'tab') {
      if (fieldIdx < EDITABLE_FIELDS.length - 1) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx + 1] })
      } else {
        const next = sortedItems[itemIdx + 1]
        if (next) setEditingCell({ itemId: next.id, field: EDITABLE_FIELDS[0] })
        else setEditingCell(null)
      }
    } else if (direction === 'shift-tab') {
      if (fieldIdx > 0) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx - 1] })
      } else {
        const prev = sortedItems[itemIdx - 1]
        if (prev) setEditingCell({ itemId: prev.id, field: EDITABLE_FIELDS[EDITABLE_FIELDS.length - 1] })
        else setEditingCell(null)
      }
    } else if (direction === 'enter') {
      const next = sortedItems[itemIdx + 1]
      if (next) setEditingCell({ itemId: next.id, field })
      else setEditingCell(null)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      // data-portal 요소(포털 드롭다운)와 data-schedule-row 내부 클릭은 무시한다.
      // 포털은 DOM 트리상 data-schedule-row 밖에 있지만 편집 셀을 닫아선 안 된다.
      if (target.closest('[data-portal]') || target.closest('[data-schedule-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewItemBlur(date: string | null) {
    if (cancelNewItemRef.current) {
      cancelNewItemRef.current = false
      return
    }
    const name = newItemName.trim()
    if (name) {
      onCreateItem({
        name,
        category: '기타' as const,
        trip_priority: '검토 필요' as const,
        links: [],
        ...(date && date !== UNDATED_KEY ? { date } : {}),
      })
    }
    setAddingToDate(null)
    setNewItemName('')
  }

  function handleNewItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>, date: string | null) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewItemBlur(date)
    } else if (e.key === 'Escape') {
      cancelNewItemRef.current = true
      setAddingToDate(null)
      setNewItemName('')
    }
  }

  function renderDesktopGroupRows(date: string, groupItems: TripItem[]) {
    return (
      <>
        {groupItems.map((item, idx) => {
          const prev = idx > 0 ? groupItems[idx - 1] : null
          const km = prev ? distanceBetween(prev, item) : null
          return (
            <Fragment key={item.id}>
              {km != null && <DistanceSeparator km={km} variant="desktop" />}
              <div data-schedule-row="true">
                <TableRow
                  item={item}
                  editingField={editingCell?.itemId === item.id ? editingCell.field : null}
                  onCellActivate={field => setEditingCell({ itemId: item.id, field })}
                  onCellSave={(field, value) => onUpdateItem(item.id, { [field]: value })}
                  onCellDeactivate={() => setEditingCell(null)}
                  onNavigate={handleNavigate}
                  onOpenPanel={onOpenPanel}
                />
              </div>
            </Fragment>
          )
        })}
        {addingToDate === date ? (
          <div className="flex min-w-[720px] items-center border-b border-gray-50 bg-blue-50/30">
            <div className="w-16 flex-shrink-0 px-3 py-2.5" />
            <div className="min-w-[220px] flex-1 px-3 py-2.5">
              <input
                ref={newItemInputRef}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onBlur={() => handleNewItemBlur(date)}
                onKeyDown={e => handleNewItemKeyDown(e, date)}
                placeholder="이름 입력 후 Enter…"
                className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none text-sm text-gray-900 py-0.5"
                style={{ fontSize: 16 }}
              />
            </div>
            <div className="w-12 flex-shrink-0" />
            <div className="w-28 flex-shrink-0" />
            <div className="w-24 flex-shrink-0" />
            <div className="w-8 flex-shrink-0" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAddingToDate(date)
              setNewItemName('')
            }}
            className="flex min-w-[720px] items-center w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            항목 추가…
          </button>
        )}
      </>
    )
  }

  function renderMobileGroupRows(date: string, groupItems: TripItem[]) {
    return (
      <div className="space-y-2 px-3 py-3">
        {groupItems.map((item, idx) => {
          const prev = idx > 0 ? groupItems[idx - 1] : null
          const km = prev ? distanceBetween(prev, item) : null
          return (
            <Fragment key={item.id}>
              {km != null && <DistanceSeparator km={km} variant="mobile" />}
              <MobileScheduleItemCard item={item} onOpenPanel={onOpenPanel} />
            </Fragment>
          )
        })}
        {addingToDate === date ? (
          <MobileNewItemEditor
            date={date}
            inputRef={newItemInputRef}
            value={newItemName}
            onChange={setNewItemName}
            onBlur={() => handleNewItemBlur(date)}
            onKeyDown={e => handleNewItemKeyDown(e, date)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setAddingToDate(date)
              setNewItemName('')
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            항목 추가
          </button>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🗓️</div>
        <p className="text-sm font-medium text-gray-700 mb-1">아직 등록된 항목이 없어요</p>
        <p className="text-xs text-gray-400">전체 탭에서 장소를 추가하면<br />여기에 날짜별로 표시됩니다</p>
      </div>
    )
  }

  const undatedItems = dateGroups.get(UNDATED_KEY) ?? []
  const datedEntries = Array.from(dateGroups.entries())
    .filter(([key]) => key !== UNDATED_KEY)
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-4">
      <div className="md:hidden space-y-4">
        {datedEntries.map(([date, groupItems]) => {
          const totalBudget = groupItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
          const isCollapsed = collapsedDates.has(date)
          const dayOffset = getDayOffset(date)
          const isToday = date === todayKey
          const categoryBreakdown = buildCategoryBreakdown(groupItems)

          return (
            <div key={date} ref={isToday ? todayRef : undefined} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <DateGroupHeader
                date={date}
                dayOffset={dayOffset}
                totalBudget={totalBudget}
                isCollapsed={isCollapsed}
                isToday={isToday}
                categoryBreakdown={categoryBreakdown}
                onToggleCollapse={() =>
                  setCollapsedDates(prev => {
                    const next = new Set(prev)
                    if (next.has(date)) next.delete(date)
                    else next.add(date)
                    return next
                  })
                }
                onAddItem={() => {
                  setCollapsedDates(prev => {
                    const next = new Set(prev)
                    next.delete(date)
                    return next
                  })
                  setAddingToDate(date)
                  setNewItemName('')
                }}
              />
              {!isCollapsed && renderMobileGroupRows(date, groupItems)}
            </div>
          )
        })}

        {undatedItems.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 px-3 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setUndatedCollapsed(prev => !prev)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <span className="text-sm font-semibold text-gray-800">날짜 미정</span>
                <span className="text-xs text-gray-500">{undatedItems.length}개</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${undatedCollapsed ? '-rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUndatedCollapsed(false)
                  setAddingToDate(UNDATED_KEY)
                  setNewItemName('')
                }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                추가
              </button>
            </div>
            {!undatedCollapsed && renderMobileGroupRows(UNDATED_KEY, undatedItems)}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <div className={TABLE_MIN_WIDTH}>
              {/* 컬럼 헤더 */}
              <div className="flex items-center gap-0 border-b border-gray-200 bg-white px-0">
                <div className="w-16 flex-shrink-0 px-3 py-2.5">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">시간</span>
                </div>
                <div className="min-w-[220px] flex-1 px-3 py-2.5">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">이름</span>
                </div>
                <div className="w-12 flex-shrink-0 px-2 py-2.5 text-center">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">분류</span>
                </div>
                <div className="w-28 flex-shrink-0 px-2 py-2.5">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">예약상태</span>
                </div>
                <div className="w-24 flex-shrink-0 px-3 py-2.5 text-right">
                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">예산</span>
                </div>
                <div className="w-8 flex-shrink-0" />
              </div>

              {/* 날짜 있는 그룹 */}
              {datedEntries.map(([date, groupItems]) => {
                const totalBudget = groupItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
                const isCollapsed = collapsedDates.has(date)
                const dayOffset = getDayOffset(date)
                const isToday = date === todayKey
                const categoryBreakdown = buildCategoryBreakdown(groupItems)

                return (
                  <div key={date} ref={isToday ? todayRef : undefined}>
                    <DateGroupHeader
                      date={date}
                      dayOffset={dayOffset}
                      totalBudget={totalBudget}
                      isCollapsed={isCollapsed}
                      isToday={isToday}
                      categoryBreakdown={categoryBreakdown}
                      onToggleCollapse={() =>
                        setCollapsedDates(prev => {
                          const next = new Set(prev)
                          if (next.has(date)) next.delete(date)
                          else next.add(date)
                          return next
                        })
                      }
                      onAddItem={() => {
                        setCollapsedDates(prev => {
                          const next = new Set(prev)
                          next.delete(date)
                          return next
                        })
                        setAddingToDate(date)
                        setNewItemName('')
                      }}
                    />
                    {!isCollapsed && renderDesktopGroupRows(date, groupItems)}
                  </div>
                )
              })}

              {/* 미배정 버킷 (최하단, 있을 때만) */}
              {undatedItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
                    <button
                      type="button"
                      onClick={() => setUndatedCollapsed(prev => !prev)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <span className="text-sm font-semibold text-gray-800">날짜 미정</span>
                      <span className="text-xs text-gray-500">{undatedItems.length}개</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${undatedCollapsed ? '-rotate-90' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUndatedCollapsed(false)
                        setAddingToDate(UNDATED_KEY)
                        setNewItemName('')
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      추가
                    </button>
                  </div>
                  {!undatedCollapsed && renderDesktopGroupRows(UNDATED_KEY, undatedItems)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
