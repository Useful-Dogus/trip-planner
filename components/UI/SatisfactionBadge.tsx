import type { Satisfaction } from '@/types'
import { SATISFACTION_META } from '@/lib/itemOptions'
import { cn } from '@/lib/cn'

interface Props {
  satisfaction: Satisfaction
  size?: 'sm' | 'md'
  showEmoji?: boolean
  className?: string
}

export default function SatisfactionBadge({
  satisfaction,
  size = 'md',
  showEmoji = true,
  className,
}: Props) {
  const meta = SATISFACTION_META[satisfaction]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium select-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        meta.className,
        className,
      )}
    >
      {showEmoji && <span aria-hidden="true">{meta.emoji}</span>}
      {satisfaction}
    </span>
  )
}
