'use client'

import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ErrorBannerTone = 'critical' | 'warning' | 'info' | 'success'

interface ErrorBannerProps {
  tone?: ErrorBannerTone
  title?: string
  children: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  className?: string
}

const TONE: Record<
  ErrorBannerTone,
  { wrap: string; icon: ReactNode; sr: string }
> = {
  critical: {
    wrap: 'bg-critical-bg text-critical-fg border-critical-border',
    icon: <AlertCircle className="size-4 shrink-0" aria-hidden="true" />,
    sr: '오류',
  },
  warning: {
    wrap: 'bg-warning-bg text-warning-fg border-warning-border',
    icon: <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />,
    sr: '경고',
  },
  info: {
    wrap: 'bg-info-bg text-info-fg border-info-border',
    icon: <Info className="size-4 shrink-0" aria-hidden="true" />,
    sr: '안내',
  },
  success: {
    wrap: 'bg-success-bg text-success-fg border-success-border',
    icon: <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />,
    sr: '성공',
  },
}

export default function ErrorBanner({
  tone = 'critical',
  title,
  children,
  action,
  onDismiss,
  className,
}: ErrorBannerProps) {
  const { wrap, icon, sr } = TONE[tone]
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      aria-live={tone === 'critical' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        wrap,
        className,
      )}
    >
      <span className="sr-only">{sr}: </span>
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0 leading-snug">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="배너 닫기"
          onClick={onDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current rounded"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
