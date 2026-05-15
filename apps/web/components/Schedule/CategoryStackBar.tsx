'use client'

import type { Category } from '@/types'
import { CATEGORY_META } from '@/lib/itemOptions'

interface CategoryStackBarProps {
  breakdown: { category: Category; count: number }[]
}

export default function CategoryStackBar({ breakdown }: CategoryStackBarProps) {
  const total = breakdown.reduce((sum, b) => sum + b.count, 0)
  if (total === 0) return null

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle"
      role="img"
      aria-label={breakdown.map(b => `${b.category} ${b.count}`).join(', ')}
    >
      {breakdown.map(({ category, count }) => {
        const pct = (count / total) * 100
        const color = CATEGORY_META[category]?.color ?? '#cbd5e1'
        return (
          <div
            key={category}
            className="h-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
            title={`${category} · ${count}`}
          />
        )
      })}
    </div>
  )
}
