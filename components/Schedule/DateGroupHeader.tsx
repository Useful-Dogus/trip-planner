'use client'

import { useDroppable } from '@dnd-kit/core'
import { useOptionalTrip } from '@/lib/hooks/useTripContext'
import {
  formatBudget,
  formatHomeConversion,
  isCurrencyCode,
  normalizeCurrency,
} from '@/lib/currency'

interface DateGroupHeaderProps {
  date: string
  dayOffset: number | null
  totalBudget: number
  isCollapsed: boolean
  isToday?: boolean
  lodgingName?: string | null
  onToggleCollapse: () => void
  onAddItem: () => void
  dndVariant: 'mobile' | 'desktop'
}

function formatDate(dateStr: string): string {
  if (dateStr === '__undated__') return '날짜 미정'
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = days[d.getUTCDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

export default function DateGroupHeader({
  date,
  dayOffset,
  totalBudget,
  isCollapsed,
  isToday = false,
  lodgingName = null,
  onToggleCollapse,
  onAddItem,
  dndVariant,
}: DateGroupHeaderProps) {
  const trip = useOptionalTrip()
  const isUndated = date === '__undated__'
  const { setNodeRef, isOver, active } = useDroppable({
    id: `drop:date:${date}:${dndVariant}`,
    data: { date },
  })
  const activeItemDate =
    (active?.data?.current as { sourceDate?: string } | undefined)?.sourceDate ?? null
  const isDropTarget = isOver && activeItemDate !== date

  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-elevated border-b border-border sticky top-0 z-10 transition-colors ${
        isDropTarget ? 'bg-accent-subtle ring-2 ring-accent ring-inset' : ''
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center gap-2 flex-1 min-w-0 text-left group"
      >
        <span className="text-sm font-semibold text-fg whitespace-nowrap">
          {formatDate(date)}
        </span>
        {isToday && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-info-bg text-info-fg">
            오늘
          </span>
        )}
        {!isUndated && dayOffset !== null && (
          <span className="text-xs text-fg-muted font-normal whitespace-nowrap">D+{dayOffset}</span>
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

      <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
        {lodgingName && (
          <span
            className="inline-flex items-center gap-1 text-xs text-fg-muted min-w-0 max-w-[10rem] sm:max-w-[14rem]"
            title={lodgingName}
          >
            <span className="flex-shrink-0">🏨</span>
            <span className="truncate">{lodgingName}</span>
          </span>
        )}
        {totalBudget > 0 && (() => {
          const tripCurrency = normalizeCurrency(trip?.currency)
          const homeCurrency = isCurrencyCode(trip?.homeCurrency) ? trip.homeCurrency : null
          const converted = formatHomeConversion(
            totalBudget,
            tripCurrency,
            homeCurrency,
            trip?.homeCurrencyRate ?? null,
          )
          return (
            <span className="text-xs text-fg-muted tabular-nums">
              {formatBudget(totalBudget, tripCurrency)}
              {converted && (
                <span className="ml-1 text-fg-subtle">≈ {converted}</span>
              )}
            </span>
          )
        })()}
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg transition-colors"
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
      </div>
    </div>
  )
}
