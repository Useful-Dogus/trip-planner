'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ToastItem {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
  action?: { label: string; onClick: () => void }
}

interface ToastContextValue {
  showToast: (opts: Omit<ToastItem, 'id'> & { duration?: number }) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const typeStyles: Record<ToastItem['type'], string> = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
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
      setToasts(prev => [...prev, { id, message, type, action }].slice(-3))
      const timer = setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1100] flex flex-col gap-2 items-center w-full max-w-sm px-4 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 shadow-md text-sm pointer-events-auto ${typeStyles[toast.type]}`}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick()
                  dismiss(toast.id)
                }}
                className="flex-shrink-0 font-semibold underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 text-base leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
