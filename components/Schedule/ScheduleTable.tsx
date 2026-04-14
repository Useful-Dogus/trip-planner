'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TripItem } from '@/types'
import { EDITABLE_FIELDS, type EditableField } from './TableRow'
import TableRow from './TableRow'
import DateGroupHeader from './DateGroupHeader'

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

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.round((db - da) / (1000 * 60 * 60 * 24)) + 1
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
    if (direction === 'escape') { setEditingCell(null); return }

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
      if ((e.target as HTMLElement).closest('[data-schedule-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewItemBlur(date: string | null) {
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
    if (e.key === 'Enter') { e.preventDefault(); handleNewItemBlur(date) }
    else if (e.key === 'Escape') { setAddingToDate(null); setNewItemName('') }
  }

  function renderGroupRows(date: string, groupItems: TripItem[]) {
    return (
      <>
        {groupItems.map(item => (
          <div key={item.id} data-schedule-row="true">
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
        ))}
        {addingToDate === date ? (
          <div className="flex items-center border-b border-gray-50 bg-blue-50/30">
            <div className="w-16 flex-shrink-0 px-3 py-2.5" />
            <div className="flex-1 min-w-0 px-3 py-2.5">
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
            <div className="w-10 flex-shrink-0" />
            <div className="w-28 flex-shrink-0" />
            <div className="w-24 flex-shrink-0" />
            <div className="w-8 flex-shrink-0" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setAddingToDate(date); setNewItemName('') }}
            className="flex items-center w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left gap-1.5"
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
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-0 border-b border-gray-200 bg-white px-0">
        <div className="w-16 flex-shrink-0 px-3 py-2.5">
          <span className="text-xs font-semibold text-gray-500">시간</span>
        </div>
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <span className="text-xs font-semibold text-gray-500">이름</span>
        </div>
        <div className="w-10 flex-shrink-0 px-2 py-2.5 text-center">
          <span className="text-xs font-semibold text-gray-500">분류</span>
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2.5">
          <span className="text-xs font-semibold text-gray-500">예약상태</span>
        </div>
        <div className="w-24 flex-shrink-0 px-3 py-2.5 text-right">
          <span className="text-xs font-semibold text-gray-500">예산</span>
        </div>
        <div className="w-8 flex-shrink-0" />
      </div>

      {/* 날짜 있는 그룹 */}
      {datedEntries.map(([date, groupItems]) => {
        const totalBudget = groupItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
        const isCollapsed = collapsedDates.has(date)
        const dayOffset = getDayOffset(date)
        const isToday = date === todayKey

        return (
          <div key={date} ref={isToday ? todayRef : undefined}>
            <DateGroupHeader
              date={date}
              dayOffset={dayOffset}
              totalBudget={totalBudget}
              isCollapsed={isCollapsed}
              isToday={isToday}
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
            {!isCollapsed && renderGroupRows(date, groupItems)}
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
              onClick={() => { setUndatedCollapsed(false); setAddingToDate(UNDATED_KEY); setNewItemName('') }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              추가
            </button>
          </div>
          {!undatedCollapsed && renderGroupRows(UNDATED_KEY, undatedItems)}
        </div>
      )}
    </div>
  )
}
