'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import ItemMetadataChips from '@/components/UI/ItemMetadataChips'
import LinkButton from './LinkButton'
import { cn } from '@/lib/cn'

interface GroupCardProps {
  name: string
  visibleItems: TripItem[]
  totalCount: number
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
}

export default function GroupCard({
  name,
  visibleItems,
  totalCount,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
}: GroupCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visibleItems.some((i) => i.id === selectedItemId)) {
      setIsOpen(true)
    }
  }, [selectedItemId, visibleItems])

  useEffect(() => {
    if (editingName !== null) inputRef.current?.select()
  }, [editingName])

  const emoji = CATEGORY_META[visibleItems[0]?.category]?.emoji ?? '📌'
  const visibleCount = visibleItems.length
  const badgeLabel =
    visibleCount === totalCount ? `${totalCount}곳` : `${visibleCount}/${totalCount}곳`

  function handleHeaderNameDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingName(name)
  }

  async function handleNameSave() {
    if (editingName === null) return
    const trimmed = editingName.trim()
    if (trimmed && trimmed !== name) {
      await Promise.all(
        visibleItems.map((item) => onUpdateItem(item.id, { name: trimmed })),
      )
    }
    setEditingName(null)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleNameSave()
    if (e.key === 'Escape') setEditingName(null)
  }

  function handleHeaderKeyDown(e: React.KeyboardEvent) {
    if (editingName !== null) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen((v) => !v)
    }
  }

  return (
    <div className="bg-bg-elevated rounded-lg border border-border overflow-hidden transition-colors duration-150 hover:border-border-strong">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${name}, ${badgeLabel}`}
        onClick={() => editingName === null && setIsOpen((v) => !v)}
        onKeyDown={handleHeaderKeyDown}
        className={cn(
          'flex items-center justify-between gap-2 p-4 cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 text-base leading-none" aria-hidden="true">
            {emoji}
          </span>
          {editingName !== null ? (
            <input
              ref={inputRef}
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              aria-label="그룹 이름"
              className="font-semibold text-fg text-sm border-b border-border-strong outline-none bg-transparent focus-visible:border-accent"
            />
          ) : (
            <span
              className="font-semibold text-fg text-sm truncate"
              onDoubleClick={handleHeaderNameDoubleClick}
              title="더블클릭하여 그룹 이름 변경"
            >
              {name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-fg-muted bg-bg-subtle px-2 py-0.5 rounded-full font-medium tabular">
            {badgeLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-fg-muted transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border">
          {visibleItems.map((item) => (
            <BranchRow
              key={item.id}
              item={item}
              isActive={item.id === selectedItemId}
              onSelect={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BranchRow({
  item,
  isActive,
  onSelect,
}: {
  item: TripItem
  isActive: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={item.address || item.name}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item.id)
        }
      }}
      className={cn(
        'flex items-start justify-between gap-2 px-4 py-3 cursor-pointer',
        'transition-colors duration-150 ease-out-soft',
        'border-b border-border last:border-b-0',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        isActive ? 'bg-accent-subtle' : 'hover:bg-bg-subtle',
      )}
    >
      <div className="flex items-start gap-2 min-w-0">
        <MapPin
          className="size-3.5 text-fg-subtle flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0">
          {item.address ? (
            <span className="text-xs font-semibold text-fg block">{item.address}</span>
          ) : (
            <span className="text-xs text-fg-subtle italic block">(주소 없음)</span>
          )}
          <div className="mt-1.5">
            <ItemMetadataChips item={item} />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <LinkButton links={item.links} />
      </div>
    </div>
  )
}
