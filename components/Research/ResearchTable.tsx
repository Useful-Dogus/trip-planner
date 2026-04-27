'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TripItem, TripPriority } from '@/types'
import { TRIP_PRIORITY_META } from '@/lib/itemOptions'
import NameCell from '@/components/Schedule/cells/NameCell'
import CategoryCell from '@/components/Schedule/cells/CategoryCell'
import PriorityCell from '@/components/Schedule/cells/PriorityCell'
import StatusCell from '@/components/Schedule/cells/StatusCell'
import BudgetCell from '@/components/Schedule/cells/BudgetCell'
import type { Category, ReservationStatus } from '@/types'
type SortKey = 'name' | 'trip_priority' | 'reservation_status' | 'budget'
type SortDir = 'asc' | 'desc'

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
  hasActiveSearch?: boolean
}

const PRIORITY_ORDER: Record<TripPriority, number> = {
  '확정': 0,
  '가고 싶음': 1,
  '시간 되면': 2,
  '검토 필요': 3,
  '제외': 4,
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm4 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-fg-muted" viewBox="0 0 20 20" fill="currentColor">
      {dir === 'asc'
        ? <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        : <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      }
    </svg>
  )
}

export default function ResearchTable({
  items,
  onUpdateItem,
  onCreateItem,
  onOpenPanel,
  hasActiveSearch = false,
}: ResearchTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('trip_priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSortHeader(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }
  const [addingRow, setAddingRow] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const cancelNewItemRef = useRef(false)
  const newItemInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) setTimeout(() => el.focus(), 0)
  }, [])

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'budget') {
        cmp = (a.budget ?? 0) - (b.budget ?? 0)
      } else if (sortKey === 'reservation_status') {
        cmp = (a.reservation_status ?? 'zzz').localeCompare(b.reservation_status ?? 'zzz')
      } else if (sortKey === 'trip_priority') {
        cmp = (PRIORITY_ORDER[a.trip_priority] ?? 99) - (PRIORITY_ORDER[b.trip_priority] ?? 99)
        if (cmp === 0) cmp = a.name.localeCompare(b.name, 'ko')
      } else {
        // name
        cmp = a.name.localeCompare(b.name, 'ko')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

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
      const target = e.target as HTMLElement
      if (target.closest('[data-portal]') || target.closest('[data-research-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewItemBlur() {
    if (cancelNewItemRef.current) {
      cancelNewItemRef.current = false
      return
    }
    const name = newItemName.trim()
    if (name) {
      onCreateItem({
        name,
        category: '기타',
        trip_priority: '검토 필요',
        links: [],
      })
    }
    setAddingRow(false)
    setNewItemName('')
  }

  function handleNewItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewItemBlur()
    } else if (e.key === 'Escape') {
      cancelNewItemRef.current = true
      setAddingRow(false)
      setNewItemName('')
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">{hasActiveSearch ? '🔍' : '📍'}</div>
        <p className="text-sm font-medium text-fg mb-1">
          {hasActiveSearch ? '검색 결과가 없어요' : '아직 등록된 항목이 없어요'}
        </p>
        <p className="text-xs text-fg-subtle">
          {hasActiveSearch ? '필터 조건을 바꿔보세요' : '항목을 추가하면 여기에 표시됩니다'}
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl overflow-x-auto">
      {/* 컬럼 헤더 */}
      <div className="flex items-center border-b border-border bg-white">
        <button
          type="button"
          onClick={() => handleSortHeader('name')}
          className="flex-1 min-w-0 px-3 py-2.5 flex items-center gap-1 group text-left hover:bg-bg-subtle transition-colors"
        >
          <span className={`text-xs font-semibold ${sortKey === 'name' ? 'text-fg' : 'text-fg-muted'}`}>이름</span>
          <SortIcon active={sortKey === 'name'} dir={sortDir} />
        </button>
        <div className="w-10 flex-shrink-0 px-2 py-2.5 text-center">
          <span className="text-xs font-semibold text-fg-muted">분류</span>
        </div>
        <button
          type="button"
          onClick={() => handleSortHeader('trip_priority')}
          className="w-28 flex-shrink-0 px-2 py-2.5 flex items-center gap-1 group hover:bg-bg-subtle transition-colors"
        >
          <span className={`text-xs font-semibold ${sortKey === 'trip_priority' ? 'text-fg' : 'text-fg-muted'}`}>우선순위</span>
          <SortIcon active={sortKey === 'trip_priority'} dir={sortDir} />
        </button>
        <button
          type="button"
          onClick={() => handleSortHeader('reservation_status')}
          className="w-28 flex-shrink-0 px-2 py-2.5 flex items-center gap-1 group hover:bg-bg-subtle transition-colors"
        >
          <span className={`text-xs font-semibold ${sortKey === 'reservation_status' ? 'text-fg' : 'text-fg-muted'}`}>예약상태</span>
          <SortIcon active={sortKey === 'reservation_status'} dir={sortDir} />
        </button>
        <button
          type="button"
          onClick={() => handleSortHeader('budget')}
          className="w-24 flex-shrink-0 px-3 py-2.5 flex items-center justify-end gap-1 group hover:bg-bg-subtle transition-colors"
        >
          <span className={`text-xs font-semibold ${sortKey === 'budget' ? 'text-fg' : 'text-fg-muted'}`}>예산</span>
          <SortIcon active={sortKey === 'budget'} dir={sortDir} />
        </button>
        <div className="w-8 flex-shrink-0" />
      </div>

      {/* 행 목록 */}
      {sortedItems.map(item => (
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

      {/* 새 항목 추가 행 */}
      {addingRow ? (
        <div className="flex items-center border-b border-border bg-info-bg/30">
          <div className="flex-1 min-w-0 px-3 py-2.5">
            <input
              ref={newItemInputRef}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onBlur={handleNewItemBlur}
              onKeyDown={handleNewItemKeyDown}
              placeholder="이름 입력 후 Enter…"
              className="w-full bg-transparent border-b border-blue-300 focus:border-blue-500 outline-none text-sm text-fg py-0.5"
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
          onClick={() => { setAddingRow(true); setNewItemName('') }}
          className="flex items-center w-full px-3 py-2 text-xs text-fg-subtle hover:text-fg-muted hover:bg-bg-subtle transition-colors text-left gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          항목 추가…
        </button>
      )}
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
      className="flex items-center border-b border-border hover:bg-bg-subtle group transition-colors"
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
          className="p-1 text-fg-subtle hover:text-fg rounded transition-colors"
          aria-label="상세 보기"
          title="상세 편집"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
