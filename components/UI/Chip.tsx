import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

type Size = 'sm' | 'md'

const SIZE: Record<Size, string> = {
  sm: 'h-6 px-2 text-[11px] gap-1 rounded',
  md: 'h-7 px-2.5 text-xs gap-1.5 rounded-full',
}

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size
  leading?: ReactNode
}

/** 비-인터랙티브 정보 칩. 카테고리·메타 표시. */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { size = 'md', leading, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center font-medium select-none',
        'bg-bg-subtle text-fg-muted border border-border',
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {leading && <span className="inline-flex shrink-0">{leading}</span>}
      {children}
    </span>
  )
})

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  selected?: boolean
  leading?: ReactNode
  /** removable 모드: 우측 X 표시 + onRemove */
  onRemove?: () => void
  removeLabel?: string
}

/** 클릭 가능한 칩 (필터, 토글). */
export const ChipButton = forwardRef<HTMLButtonElement, ChipButtonProps>(
  function ChipButton(
    {
      size = 'md',
      selected = false,
      leading,
      onRemove,
      removeLabel = '제거',
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <span className="inline-flex items-center">
        <button
          ref={ref}
          type={type}
          aria-pressed={selected}
          className={cn(
            'inline-flex items-center font-medium select-none',
            'transition-colors duration-150 ease-out-soft',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            SIZE[size],
            selected
              ? 'bg-accent text-accent-fg border border-accent'
              : 'bg-bg-elevated text-fg border border-border hover:bg-bg-subtle',
            onRemove && 'pr-1',
            className,
          )}
          {...rest}
        >
          {leading && <span className="inline-flex shrink-0">{leading}</span>}
          {children}
          {onRemove && (
            <span
              role="button"
              tabIndex={0}
              aria-label={removeLabel}
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove()
                }
              }}
              className={cn(
                'inline-flex items-center justify-center size-4 rounded-full ml-0.5',
                'hover:bg-fg/10',
              )}
            >
              <X className="size-3" />
            </span>
          )}
        </button>
      </span>
    )
  },
)
