'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TripPriority } from '@/types'
import { TRIP_PRIORITY_META, TRIP_PRIORITY_OPTIONS } from '@/lib/itemOptions'

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

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity select-none"
        title={value}
      >
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap"
          style={meta.style as React.CSSProperties}
        >
          {meta.emoji} {value}
        </span>
      </button>

      {isEditing &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[1200] rounded-xl border border-gray-200 bg-white shadow-lg p-1 w-52"
            style={{ top: position.top, left: position.left }}
          >
            {TRIP_PRIORITY_OPTIONS.map(priority => {
              const m = TRIP_PRIORITY_META[priority]
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => onSelect(priority)}
                  className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    priority === value ? 'bg-gray-50' : ''
                  }`}
                >
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border whitespace-nowrap"
                    style={m.style as React.CSSProperties}
                  >
                    {m.emoji} {priority}
                  </span>
                  <span className="text-xs text-gray-400 truncate">{m.description}</span>
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </>
  )
}
