import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** 'inline' 은 컨테이너 내부 보조용, 'page' 는 메인 빈 상태용 */
  size?: 'inline' | 'page'
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'page',
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'page' ? 'gap-3 py-12 px-6' : 'gap-2 py-8 px-4',
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center text-fg-subtle',
            size === 'page' ? 'size-12' : 'size-8',
          )}
        >
          {icon}
        </div>
      )}
      <p
        className={cn(
          'font-semibold text-fg',
          size === 'page' ? 'text-base' : 'text-sm',
        )}
      >
        {title}
      </p>
      {description && (
        <p className="text-sm text-fg-muted max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
