'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, Check, ArrowUp, ArrowDown } from 'lucide-react'
import type { SortKey, SortDir } from '@/components/Items/ItemList'
import { cn } from '@/lib/cn'

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
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    const timer = setTimeout(
      () => document.addEventListener('mousedown', handleClick),
      50,
    )
    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
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

  const currentLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? '이름'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`정렬: ${currentLabel} ${sortDir === 'asc' ? '오름차순' : '내림차순'}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium border rounded-lg',
          'bg-bg-elevated text-fg border-border hover:bg-bg-subtle',
          'transition-colors duration-150 ease-out-soft',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <ArrowUpDown className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{currentLabel}</span>
        {sortDir === 'asc' ? (
          <ArrowUp className="size-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="size-3" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-1 z-50 w-40 bg-bg-elevated border border-border rounded-lg shadow-e16 overflow-hidden animate-fade-in"
        >
          {SORT_OPTIONS.map(({ key, label }) => {
            const active = key === sortKey
            return (
              <button
                key={key}
                role="menuitemradio"
                aria-checked={active}
                type="button"
                onClick={() => handleSelect(key)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm',
                  'transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                  active
                    ? 'bg-accent-subtle text-fg font-medium'
                    : 'text-fg-muted hover:bg-bg-subtle',
                )}
              >
                <span className="flex items-center gap-2">
                  {active && <Check className="size-3.5 text-accent" aria-hidden="true" />}
                  {!active && <span className="size-3.5" aria-hidden="true" />}
                  {label}
                </span>
                {active && (
                  <span className="text-xs text-fg-muted tabular">
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
