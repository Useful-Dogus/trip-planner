'use client'

import { X } from 'lucide-react'

interface Chip {
  id: string
  label: string
  onRemove: () => void
}

interface ActiveFilterChipsProps {
  chips: Chip[]
}

export default function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div
      role="list"
      aria-label="적용된 필터"
      className="flex gap-1.5 overflow-x-auto -mx-4 px-4 py-0.5"
      style={
        {
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties
      }
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          role="listitem"
          className="flex-shrink-0 flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-accent-subtle border border-accent/30 rounded-full text-xs font-medium text-fg"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`${chip.label} 필터 제거`}
            className="text-fg-muted hover:text-fg rounded-full size-4 flex items-center justify-center hover:bg-fg/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  )
}
