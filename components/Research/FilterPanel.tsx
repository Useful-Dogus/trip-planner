'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Category, ReservationStatus, TripPriority } from '@/types'
import type { FilterState } from '@/components/Items/ItemList'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
} from '@/lib/itemOptions'
import { getActiveFilterCount } from '@/components/Items/ItemList'

interface FilterPanelProps {
  isOpen: boolean
  filterState: FilterState
  onChange: (next: FilterState) => void
  onClose: () => void
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

function FilterPanelContent({
  filterState,
  onChange,
  onClose,
}: {
  filterState: FilterState
  onChange: (next: FilterState) => void
  onClose: () => void
}) {
  const activeCount = getActiveFilterCount(filterState)

  function clearAll() {
    onChange({ categories: [], tripPriorities: [], reservationStatuses: [], showExcluded: false })
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-900">필터</span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              전체 초기화
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="필터 닫기"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 필터 옵션 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">{ITEM_FIELD_LABELS.category}</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map(c => (
              <FilterChip
                key={c}
                label={c}
                active={filterState.categories.includes(c as Category)}
                onClick={() =>
                  onChange({ ...filterState, categories: toggle(filterState.categories, c as Category) })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">{ITEM_FIELD_LABELS.trip_priority}</p>
          <div className="flex flex-wrap gap-1.5">
            {TRIP_PRIORITY_OPTIONS.map(p => (
              <FilterChip
                key={p}
                label={p}
                active={filterState.tripPriorities.includes(p as TripPriority)}
                onClick={() =>
                  onChange({ ...filterState, tripPriorities: toggle(filterState.tripPriorities, p as TripPriority) })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">{ITEM_FIELD_LABELS.reservation_status}</p>
          <div className="flex flex-wrap gap-1.5">
            {RESERVATION_STATUS_OPTIONS.map(s => (
              <FilterChip
                key={s}
                label={s}
                active={filterState.reservationStatuses.includes(s as ReservationStatus)}
                onClick={() =>
                  onChange({
                    ...filterState,
                    reservationStatuses: toggle(filterState.reservationStatuses, s as ReservationStatus),
                  })
                }
              />
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => onChange({ ...filterState, showExcluded: !filterState.showExcluded })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterState.showExcluded
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            제외 항목 보기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FilterPanel({ isOpen, filterState, onChange, onClose }: FilterPanelProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 데스크탑: 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // 약간 지연 — 버튼 클릭 이벤트와 충돌 방지
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  // 모바일: 스와이프 감지
  const touchStartY = useRef(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) onClose()
  }

  // 데스크탑 드롭다운
  const desktopDropdown = (
    <div
      ref={dropdownRef}
      className={`hidden md:block absolute top-full right-0 mt-1 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden transition-opacity duration-150 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ maxHeight: '70vh' }}
    >
      <FilterPanelContent filterState={filterState} onChange={onChange} onClose={onClose} />
    </div>
  )

  // 모바일 바텀시트 (portal)
  const mobileBottomSheet =
    typeof window !== 'undefined'
      ? createPortal(
          <>
            {/* 백드롭 */}
            <div
              className={`fixed inset-0 bg-black/30 z-[890] md:hidden transition-opacity duration-300 ${
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={onClose}
              aria-hidden="true"
            />
            {/* 바텀시트 */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label="필터 패널"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`fixed bottom-0 left-0 right-0 z-[900] bg-white rounded-t-2xl shadow-2xl md:hidden transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ maxHeight: '80vh' }}
            >
              {/* 드래그 핸들 */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
              <div className="pt-4 h-full flex flex-col" style={{ maxHeight: '80vh' }}>
                <FilterPanelContent filterState={filterState} onChange={onChange} onClose={onClose} />
              </div>
            </div>
          </>,
          document.body
        )
      : null

  return (
    <>
      {desktopDropdown}
      {mobileBottomSheet}
    </>
  )
}
