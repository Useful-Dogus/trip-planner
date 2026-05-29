'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  /** 초기 펼침 여부 */
  defaultOpen?: boolean
  /** 헤더 우측 보조 카운트/태그 (예: 링크 수) */
  trailing?: ReactNode
  children: ReactNode
}

/**
 * Form 섹션용 접기/펼치기 컴포넌트.
 * 헤더 클릭 + Enter/Space 토글. aria-expanded/controls 처리.
 * 데스크탑·모바일 동일 동작.
 */
export default function CollapsibleSection({
  title,
  defaultOpen = false,
  trailing,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 text-left -mx-1 px-1 py-1 rounded hover:bg-bg-subtle transition-colors"
      >
        <span className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">
            {title}
          </h3>
          {trailing}
        </span>
        <ChevronDown
          className={`size-4 text-fg-subtle transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={contentId} className="space-y-4">
          {children}
        </div>
      )}
    </section>
  )
}
