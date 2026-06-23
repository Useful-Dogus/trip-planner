'use client'

import { useDroppable } from '@dnd-kit/core'

interface UndatedGroupHeaderProps {
  count: number
  /** 이 중 확정 상태라 날짜 배정이 필요한 항목 수. */
  needsDateCount?: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem: () => void
  dndVariant: 'mobile' | 'desktop'
}

export default function UndatedGroupHeader({
  count,
  needsDateCount = 0,
  isCollapsed,
  onToggleCollapse,
  onAddItem,
  dndVariant,
}: UndatedGroupHeaderProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `drop:date:__undated__:${dndVariant}`,
    data: { date: '__undated__' },
  })
  const activeItemDate =
    (active?.data?.current as { sourceDate?: string } | undefined)?.sourceDate ?? null
  const isDropTarget = isOver && activeItemDate !== null

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 px-3 py-3 bg-bg-elevated border-b border-border sticky top-0 z-10 transition-colors ${
        isDropTarget ? 'bg-accent-subtle ring-2 ring-accent ring-inset' : ''
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <span className="text-sm font-semibold text-fg">날짜 미정</span>
        <span className="text-xs text-fg-muted">{count}개</span>
        {needsDateCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning-fg">
            확정 {needsDateCount}개 날짜 필요
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 text-fg-subtle transition-transform flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onAddItem}
        className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg-muted transition-colors flex-shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        추가
      </button>
    </div>
  )
}
