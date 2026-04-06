'use client'

import { useState, useRef, useEffect } from 'react'
import type { TripItem } from '@/types'
import StatusBadge from '@/components/UI/StatusBadge'
import { useItems } from '@/lib/hooks/useItems'
import { STATUS_OPTIONS } from '@/lib/itemOptions'

export default function StatusDropdown({ item }: { item: TripItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { updateStatus } = useItems()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(v => !v)
        }}
        aria-label="상태 변경"
      >
        <StatusBadge status={item.status} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-24">
          {STATUS_OPTIONS.map(status => (
            <button
              key={status}
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                updateStatus(item.id, status)
                setOpen(false)
              }}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                item.status === status ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
