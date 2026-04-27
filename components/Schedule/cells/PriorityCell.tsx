'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TripPriority } from '@/types'
import { TRIP_PRIORITY_META, TRIP_PRIORITY_OPTIONS } from '@/lib/itemOptions'
import { cn } from '@/lib/cn'

interface PriorityCellProps {
  value: TripPriority
  isEditing: boolean
  onClick: () => void
  onSelect: (value: TripPriority) => void
  onClose: () => void
}

export default function PriorityCell({
  value,
  isEditing,
  onClick,
  onSelect,
  onClose,
}: PriorityCellProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const meta = TRIP_PRIORITY_META[value]

  useEffect(() => {
    if (!isEditing) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 4, left: rect.left })
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target))
        return
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
      setPosition((prev) =>
        prev
          ? {
              ...prev,
              left: Math.max(0, prev.left - (dropRect.right - window.innerWidth)),
            }
          : prev,
      )
    }
  }, [position])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        aria-label={`우선순위: ${value}, 클릭해서 변경`}
        className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded"
        title={value}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap',
            meta.className,
          )}
        >
          <span aria-hidden="true">{meta.emoji}</span>
          {value}
        </span>
      </button>

      {isEditing &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            data-portal="true"
            className="fixed z-[1200] rounded-lg border border-border bg-bg-elevated shadow-e16 p-1 w-52 animate-fade-in"
            style={{ top: position.top, left: position.left }}
          >
            {TRIP_PRIORITY_OPTIONS.map((priority) => {
              const m = TRIP_PRIORITY_META[priority]
              const active = priority === value
              return (
                <button
                  key={priority}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => onSelect(priority)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded px-3 py-2 text-left',
                    'hover:bg-bg-subtle transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                    active && 'bg-accent-subtle',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap',
                      m.className,
                    )}
                  >
                    <span aria-hidden="true">{m.emoji}</span>
                    {priority}
                  </span>
                  <span className="text-xs text-fg-subtle truncate">
                    {m.description}
                  </span>
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
