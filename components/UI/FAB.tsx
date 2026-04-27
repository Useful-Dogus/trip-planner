'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface FABProps {
  href?: string
  onClick?: () => void
  label?: string
  className?: string
}

/** 모바일 우측 하단 떠 있는 주요 액션 버튼. */
export default function FAB({
  href = '/items/new',
  onClick,
  label = '새 장소 추가',
  className,
}: FABProps) {
  const router = useRouter()

  function handleClick() {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        'fixed bottom-20 right-4 z-40 size-14 rounded-full',
        'bg-accent text-accent-fg shadow-e16',
        'flex items-center justify-center',
        'hover:bg-accent-hover active:bg-accent-hover',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
      style={{
        marginBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Plus className="size-6" aria-hidden="true" />
    </button>
  )
}
