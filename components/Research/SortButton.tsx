'use client'

import { useState, useRef, useEffect } from 'react'
import type { SortKey, SortDir } from '@/components/Items/ItemList'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '이름' },
  { key: 'date', label: '날짜' },
  { key: 'budget', label: '예산' },
  { key: 'trip_priority', label: '우선순위' },
]

interface SortButtonProps {
  sortKey: SortKey
  sortDir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}

export default function SortButton({ sortKey, sortDir, onChange }: SortButtonProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  function handleSelect(key: SortKey) {
    if (key === sortKey) {
      onChange(key, sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      onChange(key, 'asc')
    }
    setOpen(false)
  }

  const currentLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? '이름'

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
        <span className="hidden sm:inline">{currentLabel}</span>
        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                key === sortKey
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{label}</span>
              {key === sortKey && (
                <span className="text-xs text-gray-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
