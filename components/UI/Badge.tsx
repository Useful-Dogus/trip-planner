import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'critical' | 'info' | 'accent'

const TONE: Record<Tone, string> = {
  neutral: 'bg-bg-subtle text-fg-muted border-border',
  success: 'bg-success-bg text-success-fg border-success-border',
  warning: 'bg-warning-bg text-warning-fg border-warning-border',
  critical: 'bg-critical-bg text-critical-fg border-critical-border',
  info: 'bg-info-bg text-info-fg border-info-border',
  accent: 'bg-accent-subtle text-accent border-accent/30',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  emphasis?: 'subtle' | 'strong'
  leading?: ReactNode
  /** 취소선 표시 (예: "제외") */
  strike?: boolean
}

/** 상태 표시 배지. 색만으로 의미 전달하지 않도록 텍스트/아이콘 동반 사용을 권장. */
export default function Badge({
  tone = 'neutral',
  emphasis = 'subtle',
  leading,
  strike = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
        TONE[tone],
        emphasis === 'strong' && 'font-semibold',
        strike && 'line-through opacity-70',
        className,
      )}
      {...rest}
    >
      {leading && <span className="inline-flex shrink-0">{leading}</span>}
      {children}
    </span>
  )
}
