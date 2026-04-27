'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '@/types'
import { CATEGORY_META, CATEGORY_OPTIONS } from '@/lib/itemOptions'

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

  useEffect(() => {
    if (!isEditing) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 4, left: rect.left })
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
    if (!position || !dropdownRef.current) return
    const dropRect = dropdownRef.current.getBoundingClientRect()
    if (dropRect.right > window.innerWidth) {
      setPosition(prev =>
        prev ? { ...prev, left: Math.max(0, prev.left - (dropRect.right - window.innerWidth)) } : prev
      )
    }
  }, [position])

  const emoji = CATEGORY_META[value]?.emoji ?? '🔖'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="text-base leading-none select-none cursor-pointer hover:opacity-70 transition-opacity"
        title={value}
      >
        {emoji}
      </button>

      {isEditing &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            data-portal="true"
            className="fixed z-[1200] rounded-xl border border-border bg-white shadow-lg p-2"
            style={{ top: position.top, left: position.left }}
          >
            <div className="grid grid-cols-4 gap-1">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onSelect(cat)
                  }}
                  title={cat}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-bg-subtle transition-colors text-xs ${
                    cat === value ? 'bg-bg-subtle ring-1 ring-border-strong' : ''
                  }`}
                >
                  <span className="text-base">{CATEGORY_META[cat].emoji}</span>
                  <span className="text-fg-muted whitespace-nowrap">{cat}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
