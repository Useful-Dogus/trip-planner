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

  // 지도 핀 등 외부에서 그룹 소속 아이템 선택 시 자동 펼침
  useEffect(() => {
    if (visibleItems.some(i => i.id === selectedItemId)) {
      setIsOpen(true)
    }
  }, [selectedItemId, visibleItems])

  useEffect(() => {
    if (editingName !== null) inputRef.current?.select()
  }, [editingName])

  const emoji = CATEGORY_META[visibleItems[0]?.category]?.emoji ?? '📌'
  const visibleCount = visibleItems.length
  const badgeLabel = visibleCount === totalCount ? `${totalCount}곳` : `${visibleCount}/${totalCount}곳`

  function handleHeaderNameDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingName(name)
  }

  async function handleNameSave() {
    if (editingName === null) return
    const trimmed = editingName.trim()
    if (trimmed && trimmed !== name) {
      await Promise.all(visibleItems.map(item => onUpdateItem(item.id, { name: trimmed })))
    }
    setEditingName(null)
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleNameSave()
    if (e.key === 'Escape') setEditingName(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all hover:border-gray-200 hover:shadow-sm">
      {/* 그룹 헤더 */}
      <div
        onClick={() => editingName === null && setIsOpen(v => !v)}
        className="flex items-center justify-between gap-2 p-4 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0 text-base leading-none">{emoji}</span>
          {editingName !== null ? (
            <input
              ref={inputRef}
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              onClick={e => e.stopPropagation()}
              className="font-semibold text-gray-900 text-sm border-b border-gray-400 outline-none bg-transparent"
            />
          ) : (
            <span
              className="font-semibold text-gray-900 text-sm truncate"
              onDoubleClick={handleHeaderNameDoubleClick}
              title="더블클릭하여 전체 지점 이름 변경"
            >
              {name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {badgeLabel}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* 지점 목록 */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {visibleItems.map(item => (
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
      onClick={() => onSelect(item.id)}
      className={`flex items-start justify-between gap-2 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
        isActive ? 'bg-gray-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        <div className="min-w-0">
          {item.address ? (
            <span className="text-xs font-semibold text-gray-700 block">{item.address}</span>
          ) : (
            <span className="text-xs text-gray-400 italic block">(주소 없음)</span>
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
