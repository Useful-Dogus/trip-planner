'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

// 날짜 없는 항목의 그룹 키
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
  // 그룹별 새 항목 생성 중인지 여부 (날짜 키)
  const [addingToDate, setAddingToDate] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const newItemInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) setTimeout(() => el.focus(), 0)
  }, [])

  // 날짜 기준 정렬된 전체 flat 항목 목록 (키보드 내비게이션용)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.date ?? '9999-12-31'
      const db = b.date ?? '9999-12-31'
      if (da !== db) return da.localeCompare(db)
      return (a.time_start ?? '').localeCompare(b.time_start ?? '')
    })
  }, [items])

  // 날짜별 그룹 Map
  const dateGroups = useMemo(() => {
    const groups = new Map<string, TripItem[]>()
    for (const item of sortedItems) {
      const key = item.date ?? UNDATED_KEY
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return groups
  }, [sortedItems])

  // 여행 첫날 (D+ 계산 기준)
  const tripStartDate = useMemo(() => {
    const dates = items.map(i => i.date).filter(Boolean) as string[]
    return dates.length ? [...dates].sort()[0] : null
  }, [items])

  function getDayOffset(date: string): number | null {
    if (!tripStartDate || date === UNDATED_KEY) return null
    return daysBetween(tripStartDate, date)
  }

  // 키보드 내비게이션
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
        const nextItem = sortedItems[itemIdx + 1]
        if (nextItem) setEditingCell({ itemId: nextItem.id, field: EDITABLE_FIELDS[0] })
        else setEditingCell(null)
      }
    } else if (direction === 'shift-tab') {
      if (fieldIdx > 0) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx - 1] })
      } else {
        const prevItem = sortedItems[itemIdx - 1]
        if (prevItem) setEditingCell({ itemId: prevItem.id, field: EDITABLE_FIELDS[EDITABLE_FIELDS.length - 1] })
        else setEditingCell(null)
      }
    } else if (direction === 'enter') {
      const nextItem = sortedItems[itemIdx + 1]
      if (nextItem) setEditingCell({ itemId: nextItem.id, field })
      else setEditingCell(null)
    }
  }

  // 그룹 외부 클릭 시 편집 해제
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      // 셀 내부 클릭이면 무시
      if (target.closest('[data-schedule-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // 새 항목 저장
  function handleNewItemBlur(date: string | null) {
    const name = newItemName.trim()
    if (name) {
      const baseItem = {
        name,
        category: '기타' as const,
        trip_priority: '검토 필요' as const,
        links: [],
        ...(date && date !== UNDATED_KEY ? { date } : {}),
      }
      onCreateItem(baseItem)
    }
    setAddingToDate(null)
    setNewItemName('')
  }

  function handleNewItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>, date: string | null) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewItemBlur(date)
    } else if (e.key === 'Escape') {
      setAddingToDate(null)
      setNewItemName('')
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🗓️</div>
        <p className="text-sm font-medium text-gray-700 mb-1">아직 등록된 항목이 없어요</p>
        <p className="text-xs text-gray-400">
          리서치 탭에서 장소를 추가하면
          <br />
          여기에 날짜별로 표시됩니다
        </p>
      </div>
    )
  }

  const groupEntries = Array.from(dateGroups.entries())
  // 날짜 미정을 항상 마지막으로
  const sorted = groupEntries.sort(([a], [b]) => {
    if (a === UNDATED_KEY) return 1
    if (b === UNDATED_KEY) return -1
    return a.localeCompare(b)
  })

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* 컬럼 헤더 */}
      <div className="flex items-center gap-0 border-b border-gray-100 bg-white px-0">
        <div className="w-16 flex-shrink-0 px-3 py-2">
          <span className="text-xs font-medium text-gray-400">시간</span>
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">
          <span className="text-xs font-medium text-gray-400">이름</span>
        </div>
        <div className="w-10 flex-shrink-0 px-2 py-2 text-center">
          <span className="text-xs font-medium text-gray-400">분류</span>
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2">
          <span className="text-xs font-medium text-gray-400">예약상태</span>
        </div>
        <div className="w-24 flex-shrink-0 px-3 py-2 text-right">
          <span className="text-xs font-medium text-gray-400">예산</span>
        </div>
        <div className="w-8 flex-shrink-0" />
      </div>

      {sorted.map(([date, groupItems]) => {
        const totalBudget = groupItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
        const isCollapsed = collapsedDates.has(date)
        const dayOffset = getDayOffset(date)

        return (
          <div key={date}>
            <DateGroupHeader
              date={date}
              dayOffset={dayOffset}
              totalBudget={totalBudget}
              isCollapsed={isCollapsed}
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

            {!isCollapsed && (
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

                {/* 새 항목 입력 행 */}
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
                  /* 고스트 행 */
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToDate(date)
                      setNewItemName('')
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-300 hover:text-gray-500 hover:bg-gray-50/50 transition-colors text-left gap-1.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    항목 추가…
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
