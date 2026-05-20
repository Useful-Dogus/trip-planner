'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTripPath } from '@/lib/hooks/useTripContext'

interface StickyAddBarProps {
  href?: string
  onClick?: () => void
  label?: string
  className?: string
}

/**
 * 모바일 하단 sticky 진입점. 목록 길이와 무관하게 한 번에 닿는 "추가" 액션.
 * Navigation 위에 떠 있는 텍스트 + 아이콘 바.
 */
export default function StickyAddBar({
  href,
  onClick,
  label = '새 장소 추가',
  className,
}: StickyAddBarProps) {
  const router = useRouter()
  const tripPath = useTripPath()
  const resolvedHref = href ?? tripPath('items/new')

  function handleClick() {
    if (onClick) {
      onClick()
    } else if (resolvedHref) {
      router.push(resolvedHref)
    }
  }

  return (
    <div
      className={cn(
        'md:hidden fixed inset-x-0 bottom-16 z-40 px-4 pointer-events-none',
        className,
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'pointer-events-auto w-full flex items-center justify-center gap-2',
          'rounded-full bg-accent text-accent-fg shadow-e16',
          'px-5 py-3 text-sm font-semibold',
          'hover:bg-accent-hover active:bg-accent-hover',
          'transition-colors duration-150 ease-out-soft',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        <Plus className="size-5" aria-hidden="true" />
        <span>{label}</span>
      </button>
    </div>
  )
}
