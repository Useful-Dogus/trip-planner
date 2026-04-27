'use client'

import type { Category } from '@/types'
import CategoryStackBar from './CategoryStackBar'

export interface DaySummary {
  date: string
  dayOffset: number
  stopCount: number
  breakdown: { category: Category; count: number }[]
}

interface DayTabsProps {
  days: DaySummary[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function formatTab(date: string): { weekday: string; label: string } {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return {
    weekday: WEEKDAYS[dt.getUTCDay()],
    label: `${m}/${d}`,
  }
}

export default function DayTabs({ days, selectedDate, onSelect }: DayTabsProps) {
  if (days.length === 0) {
    return (
      <div className="px-4 py-3 text-xs text-gray-400">
        확정된 일정이 없습니다
      </div>
    )
  }

  return (
    <div className="flex gap-1 overflow-x-auto px-2 py-2" style={{ scrollbarWidth: 'thin' }}>
      {days.map(day => {
        const { weekday, label } = formatTab(day.date)
        const active = day.date === selectedDate
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(day.date)}
            className={`flex-shrink-0 flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
              active
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
            }`}
            style={{ minWidth: 92 }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-semibold tracking-wider opacity-70">
                D{day.dayOffset + 1}
              </span>
              <span className="text-[10px] tracking-wide opacity-60">{weekday}</span>
            </div>
            <div className="flex w-full items-baseline justify-between gap-2">
              <span className="text-sm font-bold tabular-nums">{label}</span>
              <span className={`text-[10px] tabular-nums ${active ? 'opacity-80' : 'text-gray-500'}`}>
                {day.stopCount}곳
              </span>
            </div>
            {day.breakdown.length > 0 && (
              <div className={`w-full ${active ? 'opacity-90' : ''}`}>
                <CategoryStackBar breakdown={day.breakdown} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
