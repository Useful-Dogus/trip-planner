'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type ThemeMode } from './ThemeProvider'
import { cn } from '@/lib/cn'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'system', label: '시스템', icon: Monitor },
  { value: 'dark', label: '다크', icon: Moon },
]

interface ThemeToggleProps {
  /** 'compact' 는 아이콘만, 'full' 은 라벨 함께 */
  variant?: 'compact' | 'full'
  className?: string
}

export default function ThemeToggle({ variant = 'compact', className }: ThemeToggleProps) {
  const { mode, setMode } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="테마 모드"
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-bg-subtle border border-border',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} 모드`}
            title={`${label} 모드`}
            onClick={() => setMode(value)}
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded',
              'transition-colors duration-150 ease-out-soft',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              variant === 'compact' ? 'size-7' : 'h-7 px-2 text-xs',
              active
                ? 'bg-bg-elevated text-fg shadow-e2'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {variant === 'full' && <span>{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
