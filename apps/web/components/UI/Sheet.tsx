'use client'

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import IconButton from './IconButton'
import { cn } from '@/lib/cn'

type Side = 'right' | 'bottom' | 'auto'

interface SheetProps {
  open: boolean
  onClose: () => void
  /**
   * 'right' = 데스크톱 우측 드로어
   * 'bottom' = 모바일 바텀시트
   * 'auto' = md 브레이크포인트 기준 자동 (모바일 bottom, 데스크톱 right)
   */
  side?: Side
  /** 모바일 바텀시트 높이 (vh). 기본 80. */
  bottomHeightVh?: number
  /** 데스크톱 우측 드로어 폭 (px). 기본 480. */
  rightWidthPx?: number
  title?: string
  description?: string
  children: ReactNode
  /** 헤더 우측 영역 (액션 등). title 이 있을 때만 표시 */
  headerActions?: ReactNode
  /** 푸터 (저장/취소 등). 항상 하단 고정 */
  footer?: ReactNode
  /** 닫기 버튼 라벨 */
  closeLabel?: string
  className?: string
  contentClassName?: string
  /** 백드롭 클릭 시 닫기 (기본 true) */
  dismissibleBackdrop?: boolean
}

/**
 * 통합 시트 컴포넌트.
 * - 모바일에서는 바텀시트(하단 슬라이드 업), 데스크톱에서는 우측 드로어로 자동 전환.
 * - Escape 키 / 백드롭 클릭 / 닫기 버튼으로 닫기.
 * - 포커스 트랩(시트 내부 첫/마지막 요소 사이 순환).
 * - 포털 렌더 + body 스크롤 잠금.
 */
export default function Sheet({
  open,
  onClose,
  side = 'auto',
  bottomHeightVh = 80,
  rightWidthPx = 480,
  title,
  description,
  children,
  headerActions,
  footer,
  closeLabel = '닫기',
  className,
  contentClassName,
  dismissibleBackdrop = true,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Escape 키로 닫기 + 포커스 트랩
  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

    document.addEventListener('keydown', handleKeyDown)
    // body 스크롤 잠금
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 시트 내부 첫 요소에 포커스
    const focusTimer = window.setTimeout(() => {
      const focusable = sheetRef.current?.querySelector<HTMLElement>(
        '[data-autofocus], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 50)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(focusTimer)
      // 트리거로 포커스 복귀
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  const handleBackdropClick = useCallback(() => {
    if (dismissibleBackdrop) onClose()
  }, [dismissibleBackdrop, onClose])

  if (!open) return null
  if (typeof window === 'undefined') return null

  const sideClasses =
    side === 'bottom'
      ? 'inset-x-0 bottom-0 rounded-t-2xl animate-slide-up'
      : side === 'right'
        ? 'top-0 bottom-0 right-0 animate-slide-in-right'
        : // auto
          'inset-x-0 bottom-0 rounded-t-2xl animate-slide-up md:inset-x-auto md:top-0 md:bottom-0 md:right-0 md:rounded-t-none md:animate-slide-in-right'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
      aria-describedby={description ? 'sheet-desc' : undefined}
      className="fixed inset-0 z-[1100]"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label={closeLabel}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-overlay animate-fade-in cursor-default"
      />
      {/* sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bg-bg-elevated text-fg shadow-e28 flex flex-col',
          'border border-border',
          sideClasses,
          className,
        )}
        style={{
          height: side === 'right' ? '100vh' : `${bottomHeightVh}vh`,
          width: side === 'right' ? `${rightWidthPx}px` : undefined,
          ...(side === 'auto'
            ? ({ '--md-width': `${rightWidthPx}px` } as React.CSSProperties)
            : {}),
        }}
      >
        {/* 모바일 드래그 핸들 (시각 표시용) */}
        {side !== 'right' && (
          <div className="md:hidden pt-2 pb-1 flex justify-center" aria-hidden="true">
            <span className="block w-10 h-1 rounded-full bg-border-strong" />
          </div>
        )}
        {(title || headerActions) && (
          <div className="flex items-start justify-between gap-2 px-5 pt-3 pb-3 border-b border-border">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 id="sheet-title" className="text-base font-semibold text-fg truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p id="sheet-desc" className="text-xs text-fg-muted mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {headerActions}
              <IconButton aria-label={closeLabel} onClick={onClose} size="md">
                <X className="size-5" aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto', contentClassName)}>{children}</div>
        {footer && (
          <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface SheetSectionProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

/** 시트 본문 내부의 섹션 그루핑. */
export function SheetSection({
  title,
  className,
  children,
  ...rest
}: SheetSectionProps) {
  return (
    <section className={cn('px-5 py-4 border-b border-border last:border-b-0', className)} {...rest}>
      {title && (
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}
