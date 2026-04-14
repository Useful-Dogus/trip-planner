'use client'

import type { Category, ReservationStatus, TripItem } from '@/types'
import NameCell from './cells/NameCell'
import TimeCell from './cells/TimeCell'
import CategoryCell from './cells/CategoryCell'
import StatusCell from './cells/StatusCell'
import BudgetCell from './cells/BudgetCell'

export type EditableField = 'time_start' | 'name' | 'category' | 'reservation_status' | 'budget'
export const EDITABLE_FIELDS: EditableField[] = [
  'time_start',
  'name',
  'category',
  'reservation_status',
  'budget',
]

interface TableRowProps {
  item: TripItem
  editingField: EditableField | null
  onCellActivate: (field: EditableField) => void
  onCellSave: (field: keyof TripItem, value: unknown) => void
  onCellDeactivate: () => void
  onNavigate: (direction: 'tab' | 'shift-tab' | 'enter' | 'escape', field: EditableField) => void
  onOpenPanel: (id: string) => void
}

export default function TableRow({
  item,
  editingField,
  onCellActivate,
  onCellSave,
  onCellDeactivate,
  onNavigate,
  onOpenPanel,
}: TableRowProps) {
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
    <div className="flex items-center gap-0 border-b border-gray-100 hover:bg-gray-50 group transition-colors">
      {/* 시간 */}
      <div className="w-16 flex-shrink-0 px-3 py-2.5">
        <TimeCell
          value={item.time_start}
          isEditing={editingField === 'time_start'}
          onClick={() => onCellActivate('time_start')}
          onBlur={value => {
            if (value !== item.time_start) onCellSave('time_start', value ?? null)
            onCellDeactivate()
          }}
          onKeyDown={(e, currentValue) =>
            handleTextKeyDown(e, 'time_start', () => {
              if (currentValue !== (item.time_start ?? '') && currentValue !== '') {
                onCellSave('time_start', currentValue)
              }
            })
          }
        />
      </div>

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
              const parsed = currentValue === '' ? undefined : Number(currentValue.replace(/[^0-9]/g, ''))
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
