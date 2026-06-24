import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * 주요 액션을 화면 하단에 고정해 긴 목록에서도 항상 도달 가능하게 한다(모바일 below-the-fold 방지).
 * 부모 카드의 좌우 패딩(px-6)을 상쇄하도록 기본 -mx-6 px-6 을 둔다.
 */
export default function StickyActionBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-6 mt-4 flex items-center justify-end gap-2 border-t border-border px-6 py-3',
        'bg-bg-elevated/95 backdrop-blur supports-[backdrop-filter]:bg-bg-elevated/80',
        className,
      )}
    >
      {children}
    </div>
  )
}
