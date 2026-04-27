'use client'

import { useState, useRef, useEffect } from 'react'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import ItemMetadataChips from '@/components/UI/ItemMetadataChips'
import LinkButton from './LinkButton'
import { cn } from '@/lib/cn'

interface ItemCardProps {
  item: TripItem
  onSelect?: (id: string) => void
  isActive?: boolean
  isHighlighted?: boolean
  onUpdateItem?: (id: string, changes: Record<string, unknown>) => void
}

export default function ItemCard({
  item,
  onSelect,
  isActive = false,
  isHighlighted = false,
  onUpdateItem,
}: ItemCardProps) {
  const [editingName, setEditingName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scheduleLabel = formatScheduleLabel(item)
  const accentColor = CATEGORY_META[item.category]?.color ?? '#cbd5e1'

  useEffect(() => {
    if (editingName !== null) inputRef.current?.select()
  }, [editingName])

  function handleNameDoubleClick(e: React.MouseEvent) {
    if (!onUpdateItem) return
    e.stopPropagation()
    setEditingName(item.name)
  }

  function handleNameSave() {
    if (editingName === null) return
    const trimmed = editingName.trim()
    if (trimmed && trimmed !== item.name) {
      onUpdateItem?.(item.id, { name: trimmed })
    }
    setEditingName(null)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleNameSave()
    if (e.key === 'Escape') setEditingName(null)
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (editingName !== null) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(item.id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={item.name}
      onClick={() => editingName === null && onSelect?.(item.id)}
      onKeyDown={handleCardKeyDown}
      className={cn(
        'relative rounded-lg border bg-bg-elevated p-4 cursor-pointer overflow-hidden',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        isHighlighted
          ? 'border-warning-border bg-warning-bg/40'
          : isActive
            ? 'border-accent ring-1 ring-accent bg-accent-subtle'
            : 'border-border hover:border-border-strong',
      )}
    >
      {/* 카테고리 컬러바 */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex-shrink-0 text-base leading-none"
            aria-hidden="true"
          >
            {CATEGORY_META[item.category]?.emoji ?? '📌'}
          </span>
          <div className="min-w-0">
            {editingName !== null ? (
              <input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                onClick={(e) => e.stopPropagation()}
                aria-label="장소 이름"
                className="font-semibold text-fg text-sm w-full border-b border-border-strong outline-none bg-transparent focus-visible:border-accent"
              />
            ) : (
              <span
                className="font-semibold text-fg truncate text-sm block"
                onDoubleClick={handleNameDoubleClick}
                title={onUpdateItem ? '더블클릭하여 이름 편집' : undefined}
              >
                {item.name}
              </span>
            )}
            {item.address && (
              <span className="text-xs text-fg-muted truncate block">
                {item.address}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
          <LinkButton links={item.links} />
        </div>
      </div>

      <div className="mt-3 pl-[22px]">
        <ItemMetadataChips item={item} />
      </div>

      {(scheduleLabel || item.budget !== undefined) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-fg-muted pl-[22px] flex-wrap tabular">
          {scheduleLabel && <span>{scheduleLabel}</span>}
          {item.budget !== undefined && (
            <span className="font-medium">${item.budget.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  )
}

function formatScheduleLabel(item: TripItem) {
  const startLabel = formatDateTime(item.date, item.time_start)
  const endLabel = formatDateTime(item.end_date, item.time_end)

  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  return startLabel
}

function formatDateTime(date?: string, time?: string) {
  if (!date) return ''
  return time ? `${date} ${time}` : date
}
