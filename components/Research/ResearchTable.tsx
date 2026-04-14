'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TripItem, TripPriority } from '@/types'
import { TRIP_PRIORITY_META, TRIP_PRIORITY_OPTIONS } from '@/lib/itemOptions'
import type { SortKey, SortDir } from '@/components/Items/ItemList'
import NameCell from '@/components/Schedule/cells/NameCell'
import CategoryCell from '@/components/Schedule/cells/CategoryCell'
import PriorityCell from '@/components/Schedule/cells/PriorityCell'
import StatusCell from '@/components/Schedule/cells/StatusCell'
import BudgetCell from '@/components/Schedule/cells/BudgetCell'
import type { Category, ReservationStatus } from '@/types'

// 우선순위 표시 순서 (확정이 맨 위, 제외가 맨 아래)
const PRIORITY_ORDER: TripPriority[] = ['확정', '가고 싶음', '시간 되면', '검토 필요', '제외']

type EditableField = 'name' | 'category' | 'trip_priority' | 'reservation_status' | 'budget'
const EDITABLE_FIELDS: EditableField[] = ['name', 'category', 'trip_priority', 'reservation_status', 'budget']

interface EditingCell {
  itemId: string
  field: EditableField
}

interface ResearchTableProps {
  items: TripItem[]
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
  onCreateItem: (item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>) => void
  onOpenPanel: (id: string) => void
  sortKey?: SortKey
  sortDir?: SortDir
  hasActiveSearch?: boolean
}

export default function ResearchTable({
  items,
  onUpdateItem,
  onCreateItem,
  onOpenPanel,
  sortKey = 'name',
  sortDir = 'asc',
  hasActiveSearch = false,
}: ResearchTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  // 제외 그룹은 기본 접힘
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TripPriority>>(new Set(['제외' as TripPriority]))
  const [addingToGroup, setAddingToGroup] = useState<TripPriority | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const newItemInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) setTimeout(() => el.focus(), 0)
  }, [])

  // 우선순위별 그룹
  const priorityGroups = useMemo(() => {
    const groups = new Map<TripPriority, TripItem[]>()
    for (const priority of PRIORITY_ORDER) {
      groups.set(priority, [])
    }
    for (const item of items) {
      const group = groups.get(item.trip_priority)
      if (group) group.push(item)
    }
    // 그룹 내 정렬
    PRIORITY_ORDER.forEach(p => {
      groups.get(p)?.sort((a, b) => {
        let cmp = 0
        if (sortKey === 'budget') cmp = (a.budget ?? 0) - (b.budget ?? 0)
        else if (sortKey === 'date') cmp = (a.date ?? '').localeCompare(b.date ?? '')
        else cmp = a.name.localeCompare(b.name, 'ko')
        return sortDir === 'asc' ? cmp : -cmp
      })
    })
    return groups
  }, [items, sortKey, sortDir])

  // 키보드 내비게이션용 flat 목록
  const sortedItems = useMemo(() => {
    const result: TripItem[] = []
    for (const priority of PRIORITY_ORDER) {
      result.push(...(priorityGroups.get(priority) ?? []))
    }
    return result
  }, [priorityGroups])

  function handleNavigate(
    direction: 'tab' | 'shift-tab' | 'enter' | 'escape',
    field: EditableField
  ) {
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
        setEditingCell(next ? { itemId: next.id, field: EDITABLE_FIELDS[0] } : null)
      }
    } else if (direction === 'shift-tab') {
      if (fieldIdx > 0) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx - 1] })
      } else {
        const prev = sortedItems[itemIdx - 1]
        setEditingCell(
          prev ? { itemId: prev.id, field: EDITABLE_FIELDS[EDITABLE_FIELDS.length - 1] } : null
        )
      }
    } else if (direction === 'enter') {
      const next = sortedItems[itemIdx + 1]
      setEditingCell(next ? { itemId: next.id, field } : null)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('[data-research-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewItemBlur(priority: TripPriority) {
    const name = newItemName.trim()
    if (name) {
      onCreateItem({
        name,
        category: '기타',
        trip_priority: priority,
        links: [],
      })
    }
    setAddingToGroup(null)
    setNewItemName('')
  }

  function handleNewItemKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    priority: TripPriority
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewItemBlur(priority)
    } else if (e.key === 'Escape') {
      setAddingToGroup(null)
      setNewItemName('')
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">{hasActiveSearch ? '🔍' : '📍'}</div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {hasActiveSearch ? '검색 결과가 없어요' : '아직 등록된 항목이 없어요'}
        </p>
        <p className="text-xs text-gray-400">
          {hasActiveSearch ? '필터 조건을 바꿔보세요' : '항목을 추가하면 여기에 표시됩니다'}
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-x-auto">
      {/* 컬럼 헤더 */}
      <div className="flex items-center border-b border-gray-200 bg-white">
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <span className="text-xs font-semibold text-gray-500">이름</span>
        </div>
        <div className="w-10 flex-shrink-0 px-2 py-2.5 text-center">
          <span className="text-xs font-semibold text-gray-500">분류</span>
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2.5">
          <span className="text-xs font-semibold text-gray-500">우선순위</span>
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2.5">
          <span className="text-xs font-semibold text-gray-500">예약상태</span>
        </div>
        <div className="w-24 flex-shrink-0 px-3 py-2.5 text-right">
          <span className="text-xs font-semibold text-gray-500">예산</span>
        </div>
        <div className="w-8 flex-shrink-0" />
      </div>

      {PRIORITY_ORDER.map(priority => {
        const groupItems = priorityGroups.get(priority) ?? []
        const isCollapsed = collapsedGroups.has(priority)
        const meta = TRIP_PRIORITY_META[priority]
        const totalBudget = groupItems.reduce((s, i) => s + (i.budget ?? 0), 0)

        return (
          <div key={priority}>
            {/* 그룹 헤더 */}
            <div className="flex items-center gap-2 px-3 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
              <button
                type="button"
                onClick={() =>
                  setCollapsedGroups(prev => {
                    const next = new Set(prev)
                    if (next.has(priority)) next.delete(priority)
                    else next.add(priority)
                    return next
                  })
                }
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                  style={meta.style as React.CSSProperties}
                >
                  {meta.emoji} {priority}
                </span>
                <span className="text-xs text-gray-500">{groupItems.length}개</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3 flex-shrink-0">
                {totalBudget > 0 && (
                  <span className="text-xs text-gray-500 tabular-nums">
                    ${totalBudget.toLocaleString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCollapsedGroups(prev => {
                      const next = new Set(prev)
                      next.delete(priority)
                      return next
                    })
                    setAddingToGroup(priority)
                    setNewItemName('')
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
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
                  추가
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <>
                {groupItems.map(item => (
                  <ResearchTableRow
                    key={item.id}
                    item={item}
                    editingField={editingCell?.itemId === item.id ? editingCell.field : null}
                    onCellActivate={field => setEditingCell({ itemId: item.id, field })}
                    onCellSave={(field, value) => onUpdateItem(item.id, { [field]: value })}
                    onCellDeactivate={() => setEditingCell(null)}
                    onNavigate={handleNavigate}
                    onOpenPanel={onOpenPanel}
                  />
                ))}

                {/* 새 항목 입력 행 */}
                {addingToGroup === priority ? (
                  <div className="flex items-center border-b border-gray-50 bg-blue-50/30">
                    <div className="flex-1 min-w-0 px-3 py-2.5">
                      <input
                        ref={newItemInputRef}
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        onBlur={() => handleNewItemBlur(priority)}
                        onKeyDown={e => handleNewItemKeyDown(e, priority)}
                        placeholder="이름 입력 후 Enter…"
                        className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none text-sm text-gray-900 py-0.5"
                        style={{ fontSize: 16 }}
                      />
                    </div>
                    <div className="w-10 flex-shrink-0" />
                    <div className="w-28 flex-shrink-0" />
                    <div className="w-28 flex-shrink-0" />
                    <div className="w-24 flex-shrink-0" />
                    <div className="w-8 flex-shrink-0" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingToGroup(priority)
                      setNewItemName('')
                    }}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left gap-1.5"
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

// ── ResearchTableRow ──────────────────────────────────────────────

interface ResearchTableRowProps {
  item: TripItem
  editingField: EditableField | null
  onCellActivate: (field: EditableField) => void
  onCellSave: (field: keyof TripItem, value: unknown) => void
  onCellDeactivate: () => void
  onNavigate: (direction: 'tab' | 'shift-tab' | 'enter' | 'escape', field: EditableField) => void
  onOpenPanel: (id: string) => void
}

function ResearchTableRow({
  item,
  editingField,
  onCellActivate,
  onCellSave,
  onCellDeactivate,
  onNavigate,
  onOpenPanel,
}: ResearchTableRowProps) {
  function handleTextKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    field: EditableField,
    saveValue: () => void
  ) {
    if (e.key === 'Tab') {
      e.preventDefault()
      saveValue()
      onNavigate(e.shiftKey ? 'shift-tab' : 'tab', field)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      saveValue()
      onNavigate('enter', field)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onNavigate('escape', field)
    }
  }

  return (
    <div
      data-research-row="true"
      className="flex items-center border-b border-gray-100 hover:bg-gray-50 group transition-colors"
    >
      {/* 이름 */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <NameCell
          value={item.name}
          isEditing={editingField === 'name'}
          onClick={() => onCellActivate('name')}
          onChange={() => {}}
          onBlur={value => {
            if (value.trim() && value !== item.name) onCellSave('name', value.trim())
            onCellDeactivate()
          }}
          onKeyDown={(e, currentValue) =>
            handleTextKeyDown(e, 'name', () => {
              if (currentValue.trim() && currentValue !== item.name)
                onCellSave('name', currentValue.trim())
            })
          }
        />
      </div>

      {/* 카테고리 */}
      <div className="w-10 flex-shrink-0 flex items-center justify-center py-2.5">
        <CategoryCell
          value={item.category}
          isEditing={editingField === 'category'}
          onClick={() => onCellActivate('category')}
          onSelect={value => {
            onCellSave('category', value as Category)
            onNavigate('tab', 'category')
          }}
          onClose={onCellDeactivate}
        />
      </div>

      {/* 우선순위 */}
      <div className="w-28 flex-shrink-0 px-2 py-2.5">
        <PriorityCell
          value={item.trip_priority}
          isEditing={editingField === 'trip_priority'}
          onClick={() => onCellActivate('trip_priority')}
          onSelect={value => {
            onCellSave('trip_priority', value as TripPriority)
            onNavigate('tab', 'trip_priority')
          }}
          onClose={onCellDeactivate}
        />
      </div>

      {/* 예약 상태 */}
      <div className="w-28 flex-shrink-0 px-2 py-2.5">
        <StatusCell
          value={item.reservation_status}
          isEditing={editingField === 'reservation_status'}
          onClick={() => onCellActivate('reservation_status')}
          onSelect={value => {
            onCellSave('reservation_status', value as ReservationStatus | null)
            onNavigate('tab', 'reservation_status')
          }}
          onClose={onCellDeactivate}
        />
      </div>

      {/* 예산 */}
      <div className="w-24 flex-shrink-0 px-3 py-2.5">
        <BudgetCell
          value={item.budget}
          isEditing={editingField === 'budget'}
          onClick={() => onCellActivate('budget')}
          onBlur={value => {
            if (value !== item.budget) onCellSave('budget', value ?? null)
            onCellDeactivate()
          }}
          onKeyDown={(e, currentValue) =>
            handleTextKeyDown(e, 'budget', () => {
              const parsed =
                currentValue === '' ? undefined : Number(currentValue.replace(/[^0-9]/g, ''))
              if (!isNaN(parsed ?? 0) && parsed !== item.budget)
                onCellSave('budget', parsed ?? null)
            })
          }
        />
      </div>

      {/* 상세 버튼 */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center py-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onOpenPanel(item.id)}
          className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
          aria-label="상세 보기"
          title="상세 편집"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
