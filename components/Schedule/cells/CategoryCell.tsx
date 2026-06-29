'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS } from '@/lib/itemOptions'

const PORTAL_MARGIN = 8

interface CategoryCellProps {
  value: Category
  isEditing: boolean
  onClick: () => void
  onSelect: (value: Category) => void
  onClose: () => void
}

export default function CategoryCell({
  value,
  isEditing,
  onClick,
  onSelect,
  onClose,
}: CategoryCellProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const rawValue = String(value)
  const safeCategory = CATEGORY_OPTIONS.includes(value) ? value : '기타'
  const CurrentIcon = CATEGORY_META[safeCategory].Icon
  const label = safeCategory === value ? value : `${rawValue} (분류 확인 필요)`

  useEffect(() => {
    if (!isEditing || typeof window === 'undefined') {
      setPosition(null)
      return
    }

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(PORTAL_MARGIN, rect.left),
      })
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      onClose()
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isEditing, onClose])

  useLayoutEffect(() => {
    if (!position || !dropdownRef.current || typeof window === 'undefined') return
    const dropRect = dropdownRef.current.getBoundingClientRect()
    const maxLeft = Math.max(PORTAL_MARGIN, window.innerWidth - dropRect.width - PORTAL_MARGIN)
    const nextLeft = Math.min(Math.max(PORTAL_MARGIN, position.left), maxLeft)
    if (nextLeft !== position.left) setPosition({ ...position, left: nextLeft })
  }, [position])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center leading-none select-none cursor-pointer text-fg-muted hover:text-fg transition-colors"
        title={label}
        aria-label={label}
      >
        <CurrentIcon size={16} />
      </button>

      {isEditing &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            data-portal="true"
            className="fixed z-[1200] rounded-xl border border-border bg-bg-elevated shadow-lg p-2"
            style={{ top: position.top, left: position.left }}
          >
            <div className="grid grid-cols-4 gap-1">
              {CATEGORY_OPTIONS.map(cat => {
                const ItemIcon = CATEGORY_META[cat].Icon
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onSelect(cat)
                    }}
                    title={cat}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-bg-subtle transition-colors text-xs ${
                      cat === value ? 'bg-bg-subtle ring-1 ring-border-strong' : ''
                    }`}
                  >
                    <ItemIcon size={18} className="text-fg-muted" />
                    <span className="text-fg-muted whitespace-nowrap">{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
