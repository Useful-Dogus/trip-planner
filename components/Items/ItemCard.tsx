'use client'

import { useState, useRef, useEffect } from 'react'
import type { TripItem } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'
import ItemMetadataChips from '@/components/UI/ItemMetadataChips'

function LinkButton({ links }: { links: TripItem['links'] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (links.length === 0) return null

  if (links.length === 1) {
    return (
      <a
        href={links[0].url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 transition-colors"
        title={links[0].label || '링크 열기'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
    )
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(v => !v)
        }}
        className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-0.5"
        title="링크 목록"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
        <span className="text-xs">{links.length}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-36">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 truncate max-w-48"
            >
              {link.label || link.url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

interface ItemCardProps {
  item: TripItem
  onSelect?: (id: string) => void
  isActive?: boolean
  onUpdateItem?: (id: string, changes: Record<string, unknown>) => void
}

export default function ItemCard({ item, onSelect, isActive = false, onUpdateItem }: ItemCardProps) {
  const [editingName, setEditingName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scheduleLabel = formatScheduleLabel(item)

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

  return (
    <div
      onClick={() => editingName === null && onSelect?.(item.id)}
      className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer ${
        isActive
          ? 'border-gray-400 shadow-sm ring-1 ring-gray-300 bg-gray-50'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 text-base leading-none">
            {CATEGORY_META[item.category]?.emoji ?? '📌'}
          </span>
          <div className="min-w-0">
            {editingName !== null ? (
              <input
                ref={inputRef}
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                onClick={e => e.stopPropagation()}
                className="font-semibold text-gray-900 text-sm w-full border-b border-gray-400 outline-none bg-transparent"
              />
            ) : (
              <span
                className="font-semibold text-gray-900 truncate text-sm block"
                onDoubleClick={handleNameDoubleClick}
                title={onUpdateItem ? '더블클릭하여 이름 편집' : undefined}
              >
                {item.name}
              </span>
            )}
            {item.address && <span className="text-xs text-gray-400 truncate block">{item.address}</span>}
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
        <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-400 pl-[22px] flex-wrap">
          {scheduleLabel && <span>{scheduleLabel}</span>}
          {item.budget !== undefined && <span className="font-medium text-gray-500">${item.budget.toLocaleString()}</span>}
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
