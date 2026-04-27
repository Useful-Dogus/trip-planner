'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  action?: { label: string; onClick: () => void }
}

interface ToastContextValue {
  showToast: (
    opts: Omit<ToastItem, 'id'> & { duration?: number },
  ) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const TONE: Record<ToastType, { wrap: string; icon: ReactNode; sr: string }> = {
  success: {
    wrap: 'bg-success-bg text-success-fg border-success-border',
    icon: <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />,
    sr: '성공',
  },
  error: {
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
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    ({
      message,
      type,
      action,
      duration = 4000,
    }: Omit<ToastItem, 'id'> & { duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type, action }].slice(-3))
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1100] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg border px-4 py-3 text-sm pointer-events-auto shadow-e8 animate-slide-up',
              TONE[toast.type].wrap,
            )}
          >
            <span className="sr-only">{TONE[toast.type].sr}: </span>
            {TONE[toast.type].icon}
            <span className="flex-1 leading-snug">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onClick()
                  dismiss(toast.id)
                }}
                className="shrink-0 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current rounded"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current rounded"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
