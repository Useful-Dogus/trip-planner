'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface MemoFieldProps {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  /** 인라인 textarea 에 적용할 클래스 (테두리·패딩 등) */
  className?: string
  /** 인라인 textarea rows. 기본 4. */
  rows?: number
  /** 인라인 textarea 의 ref — 외부에서 자동 높이 측정 등에 사용 */
  inlineRef?: React.Ref<HTMLTextAreaElement>
  /** 풀스크린 오버레이 제목. 기본 '메모'. */
  fullscreenTitle?: string
}

/**
 * 인라인 메모 textarea + 풀스크린 편집 모드 (#70).
 *
 * - 우상단 ‟확장" 버튼으로 풀스크린 오버레이 진입
 * - 오버레이: 거대한 textarea + 완료(Esc) / 닫기(X) 버튼
 * - 입력은 항상 인라인 value 와 동기화 (오버레이 내에서도 onChange 즉시 반영)
 * - 모바일에서 키보드가 올라온 상태에서도 충분한 입력 영역 확보 (h-full + safe-area)
 */
export default function MemoField({
  value,
  onChange,
  placeholder,
  className,
  rows = 4,
  inlineRef,
  fullscreenTitle = '메모',
}: MemoFieldProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const fullscreenTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!fullscreen) return
    // 오버레이 열릴 때 textarea 포커스 + 커서 끝으로
    const el = fullscreenTextareaRef.current
    if (el) {
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
    // body 스크롤 잠금
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setFullscreen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [fullscreen])

  return (
    <div className="relative">
      <textarea
        ref={inlineRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn(className, 'pr-10')}
        aria-label={fullscreenTitle}
      />
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        aria-label="풀스크린으로 편집"
        className={cn(
          'absolute top-2 right-2 inline-flex items-center justify-center size-7 rounded-md',
          'text-fg-subtle hover:text-fg hover:bg-bg-subtle transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <Maximize2 className="size-4" aria-hidden="true" />
      </button>
      {fullscreen && typeof document !== 'undefined'
        ? createPortal(
            <FullScreenMemoEditor
              value={value}
              onChange={onChange}
              onClose={() => setFullscreen(false)}
              title={fullscreenTitle}
              placeholder={placeholder}
              textareaRef={fullscreenTextareaRef}
            />,
            document.body,
          )
        : null}
    </div>
  )
}

function FullScreenMemoEditor({
  value,
  onChange,
  onClose,
  title,
  placeholder,
  textareaRef,
}: {
  value: string
  onChange: (next: string) => void
  onClose: () => void
  title: string
  placeholder?: string
  textareaRef: React.Ref<HTMLTextAreaElement>
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] bg-bg flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-elevated">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={cn(
            'inline-flex items-center justify-center size-10 rounded-md',
            'text-fg-muted hover:text-fg hover:bg-bg-subtle transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium',
            'text-accent hover:bg-bg-subtle transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          <Check className="size-4" aria-hidden="true" />
          완료
        </button>
      </header>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex-1 w-full resize-none bg-bg text-fg placeholder:text-fg-subtle',
          'px-4 py-3 text-base leading-relaxed',
          'focus:outline-none',
        )}
      />
    </div>
  )
}
