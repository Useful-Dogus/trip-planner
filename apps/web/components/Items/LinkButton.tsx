'use client'

import { useState, useRef, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Link as TripLink } from '@/types'
import { cn } from '@/lib/cn'

interface LinkButtonProps {
  links: TripLink[]
  className?: string
}

/**
 * 링크가 1개면 새 탭 열기, 여러 개면 드롭다운으로 선택.
 * 카드 내부에서 사용되므로 클릭 이벤트는 stopPropagation.
 */
export default function LinkButton({ links, className }: LinkButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (links.length === 0) return null

  if (links.length === 1) {
    return (
      <a
        href={links[0].url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={links[0].label || '링크 열기'}
        title={links[0].label || '링크 열기'}
        className={cn(
          'inline-flex items-center justify-center shrink-0 size-7 rounded',
          'text-fg-muted hover:text-accent hover:bg-bg-subtle transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          className,
        )}
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    )
  }

  return (
    <div ref={ref} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`링크 ${links.length}개`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'inline-flex items-center justify-center gap-0.5 shrink-0 h-7 px-1.5 rounded',
          'text-fg-muted hover:text-accent hover:bg-bg-subtle transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        <span className="text-xs tabular">{links.length}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 bg-bg-elevated border border-border rounded-lg shadow-e16 py-1 min-w-36 animate-fade-in"
        >
          {links.map((link, i) => (
            <a
              key={i}
              role="menuitem"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
              className="block px-3 py-1.5 text-xs text-fg hover:bg-bg-subtle truncate max-w-48 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              {link.label || link.url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
