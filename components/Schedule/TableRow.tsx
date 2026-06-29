'use client'

import { useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Category, ReservationStatus, TripItem } from '@/types'
import NameCell from './cells/NameCell'
import TimeCell from './cells/TimeCell'
import CategoryCell from './cells/CategoryCell'
import StatusCell from './cells/StatusCell'
import BudgetCell from './cells/BudgetCell'
import ItemWarnings from './ItemWarnings'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'

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
  todayKey: string
  selected?: boolean
  onToggleSelect?: (id: string) => void
  selectionActive?: boolean
}

export default function TableRow({
  item,
  editingField,
  onCellActivate,
  onCellSave,
  onCellDeactivate,
  onNavigate,
  onOpenPanel,
  todayKey,
  selected = false,
  onToggleSelect,
  selectionActive = false,
}: TableRowProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `drag:item:${item.id}`,
    data: { itemId: item.id, sourceDate: item.date ?? null },
  })

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
      ref={setNodeRef}
      className={`flex min-w-[744px] items-center gap-0 border-b border-border hover:bg-bg-subtle group transition-colors ${
        isDragging ? 'opacity-40' : ''
      } ${selected ? 'bg-accent-bg/40' : ''}`}
    >
      {/* 선택 체크박스 */}
      {onToggleSelect && (
        <div
          className={`w-6 flex-shrink-0 flex items-center justify-center self-stretch transition-opacity ${
            selectionActive || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={`${item.name} 선택`}
            className="size-4 accent-accent cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {/* 드래그 핸들 */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label="드래그하여 다른 날짜로 이동"
        title="드래그하여 다른 날짜로 이동"
        className="w-6 flex-shrink-0 flex items-center justify-center self-stretch text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>

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
              if (currentValue !== (item.time_start ?? '')) {
                onCellSave('time_start', currentValue ? currentValue : null)
              }
            })
          }
        />
      </div>

      {/* 이름 */}
      <div className="min-w-[220px] flex-1 px-3 py-2.5">
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
        <ItemWarnings item={item} todayKey={todayKey} className="mt-1" />
      </div>

      {/* 카테고리 */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center py-2.5">
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

      {/* 날짜 이동 + 상세 버튼 */}
      <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1 pr-2 py-2.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <DateChangeButton
          currentDate={item.date ?? null}
          onChange={(next) => onCellSave('date', next)}
        />
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

function DateChangeButton({
  currentDate,
  onChange,
}: {
  currentDate: string | null
  onChange: (next: string | null) => void
}) {
  const trip = useOptionalTrip()
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const el = inputRef.current
          if (!el) return
          // showPicker 는 신규 브라우저 지원, 폴백으로 focus+click
          if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
            ;(el as HTMLInputElement & { showPicker: () => void }).showPicker()
          } else {
            el.focus()
            el.click()
          }
        }}
        className="p-1 text-fg-subtle hover:text-fg rounded transition-colors"
        aria-label="다른 날짜로 이동"
        title="다른 날짜로 이동"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM4 8v8h12V8H4z" clipRule="evenodd" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={currentDate ?? ''}
        min={trip?.startDate ?? undefined}
        max={trip?.endDate ?? undefined}
        onChange={(e) => {
          const next = e.target.value || null
          if (next !== currentDate) onChange(next)
        }}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}
