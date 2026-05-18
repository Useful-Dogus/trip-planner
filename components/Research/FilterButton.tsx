'use client'

import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'

interface FilterButtonProps {
  activeCount: number
  onClick: () => void
}

export default function FilterButton({ activeCount, onClick }: FilterButtonProps) {
  const active = activeCount > 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`필터${active ? ` (${activeCount}개 적용 중)` : ''}`}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium border rounded-lg',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'bg-accent text-accent-fg border-accent'
          : 'bg-bg-elevated text-fg border-border hover:bg-bg-subtle',
      )}
    >
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      <span>필터{active ? ` ${activeCount}` : ''}</span>
    </button>
  )
}
