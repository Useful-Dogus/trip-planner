'use client'

interface Chip {
  id: string
  label: string
  onRemove: () => void
}

interface ActiveFilterChipsProps {
  chips: Chip[]
}

export default function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div
      className="flex gap-1.5 overflow-x-auto -mx-4 px-4 py-0.5"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {chips.map(chip => (
        <span
          key={chip.id}
          className="flex-shrink-0 flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            aria-label={`${chip.label} 필터 제거`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  )
}
