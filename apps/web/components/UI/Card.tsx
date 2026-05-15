import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 좌측 카테고리 컬러바 (4px) */
  accentColor?: string
  /** 인터랙티브 카드 여부 (hover/focus 스타일) */
  interactive?: boolean
  selected?: boolean
}

export function Card({
  accentColor,
  interactive = false,
  selected = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-bg-elevated text-fg border border-border rounded-lg overflow-hidden',
        'transition-colors duration-150 ease-out-soft',
        interactive &&
          'cursor-pointer hover:bg-bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-bg',
        className,
      )}
      {...rest}
    >
      {accentColor && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-2 p-4 pb-2', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 pb-3 space-y-2', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-4 py-3 border-t border-border',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <h3 className={cn('text-base font-semibold text-fg leading-snug', className)}>
      {children}
    </h3>
  )
}

export function CardMeta({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <p className={cn('text-xs text-fg-muted leading-normal', className)}>{children}</p>
  )
}
