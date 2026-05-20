'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { Input } from './Input'
import { cn } from '@/lib/cn'

export type ConfirmTone = 'default' | 'destructive'

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  /**
   * 입력해야 하는 확인 문자열. 사용자가 정확히 같은 값을 타이핑해야 확인 가능.
   * trip 삭제처럼 파괴력이 큰 액션에서 사용.
   */
  typeToConfirm?: string
}

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const v = useContext(ConfirmContext)
  if (!v) throw new Error('useConfirm 은 ConfirmProvider 내부에서만 사용 가능합니다.')
  return v
}

interface PendingState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)

  const confirm = useCallback<ConfirmContextValue>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve })
      }),
    [],
  )

  function handleResolve(value: boolean) {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <ConfirmDialog options={pending} onResolve={handleResolve} />}
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({
  options,
  onResolve,
}: {
  options: ConfirmOptions
  onResolve: (value: boolean) => void
}) {
  const [typed, setTyped] = useState('')
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const requiresTyping = !!options.typeToConfirm
  const canConfirm = !requiresTyping || typed === options.typeToConfirm

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onResolve(false)
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)

    // 첫 포커스
    window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], input:not([disabled]), button:not([disabled])',
      )
      target?.focus()
    }, 30)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused.current?.focus?.()
    }
  }, [onResolve])

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={() => onResolve(false)}
        className="absolute inset-0 bg-overlay animate-fade-in cursor-default"
      />
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-sm rounded-2xl bg-bg-elevated border border-border shadow-e28',
          'animate-fade-in',
        )}
      >
        <div className="px-5 pt-5 pb-3">
          <h2 id="confirm-title" className="text-base font-semibold text-fg mb-2">
            {options.title}
          </h2>
          {options.description ? (
            <div className="text-sm text-fg-muted leading-relaxed">{options.description}</div>
          ) : null}
        </div>

        {requiresTyping && (
          <div className="px-5 pb-2 space-y-1.5">
            <p className="text-xs text-fg-subtle">
              계속하려면{' '}
              <code className="px-1 rounded bg-bg-subtle text-fg font-mono text-[11px]">
                {options.typeToConfirm}
              </code>{' '}
              를 입력하세요
            </p>
            <Input
              label="확인 문자열"
              hideLabel
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              data-autofocus
              autoComplete="off"
            />
          </div>
        )}

        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onResolve(false)}>
            {options.cancelLabel ?? '취소'}
          </Button>
          <Button
            variant={options.tone === 'destructive' ? 'destructive' : 'primary'}
            onClick={() => canConfirm && onResolve(true)}
            disabled={!canConfirm}
            data-autofocus={requiresTyping ? undefined : true}
          >
            {options.confirmLabel ?? '확인'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
