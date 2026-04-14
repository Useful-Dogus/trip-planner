'use client'

interface DateGroupHeaderProps {
  date: string
  dayOffset: number | null
  totalBudget: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem: () => void
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
  onToggleCollapse,
  onAddItem,
}: DateGroupHeaderProps) {
  const isUndated = date === '__undated__'

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex items-center gap-2 flex-1 min-w-0 text-left group"
      >
        <span className="text-xs font-semibold text-gray-700">
          {formatDate(date)}
        </span>
        {!isUndated && dayOffset !== null && (
          <span className="text-xs text-gray-400 font-normal">D+{dayOffset}</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
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

      <div className="flex items-center gap-3 flex-shrink-0">
        {totalBudget > 0 && (
          <span className="text-xs text-gray-400 tabular-nums">
            ${totalBudget.toLocaleString()}
          </span>
        )}
        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
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
  )
}
