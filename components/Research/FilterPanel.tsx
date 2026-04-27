'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { Category, ReservationStatus, TripPriority } from '@/types'
import type { FilterState } from '@/components/Items/ItemList'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
} from '@/lib/itemOptions'
import { getActiveFilterCount } from '@/components/Items/ItemList'
import IconButton from '@/components/UI/IconButton'
import { cn } from '@/lib/cn'

interface FilterPanelProps {
  isOpen: boolean
  filterState: FilterState
  onChange: (next: FilterState) => void
  onClose: () => void
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'bg-accent text-accent-fg border-accent'
          : 'bg-bg-elevated text-fg-muted border-border hover:border-border-strong hover:text-fg',
      )}
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
    onChange({
      categories: [],
      tripPriorities: [],
      reservationStatuses: [],
      showExcluded: false,
    })
  }

  return (
    <div className="flex flex-col h-full bg-bg-elevated">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-fg">필터</h2>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent transition-colors"
            >
              전체 초기화
            </button>
          )}
          <IconButton aria-label="필터 닫기" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
            {ITEM_FIELD_LABELS.category}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={filterState.categories.includes(c as Category)}
                onClick={() =>
                  onChange({
                    ...filterState,
                    categories: toggle(filterState.categories, c as Category),
                  })
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
            {ITEM_FIELD_LABELS.trip_priority}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {TRIP_PRIORITY_OPTIONS.map((p) => (
              <FilterChip
                key={p}
                label={p}
                active={filterState.tripPriorities.includes(p as TripPriority)}
                onClick={() =>
                  onChange({
                    ...filterState,
                    tripPriorities: toggle(filterState.tripPriorities, p as TripPriority),
                  })
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
            {ITEM_FIELD_LABELS.reservation_status}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {RESERVATION_STATUS_OPTIONS.map((s) => (
              <FilterChip
                key={s}
                label={s}
                active={filterState.reservationStatuses.includes(
                  s as ReservationStatus,
                )}
                onClick={() =>
                  onChange({
                    ...filterState,
                    reservationStatuses: toggle(
                      filterState.reservationStatuses,
                      s as ReservationStatus,
                    ),
                  })
                }
              />
            ))}
          </div>
        </section>

        <section>
          <FilterChip
            label="제외 항목 보기"
            active={filterState.showExcluded}
            onClick={() =>
              onChange({ ...filterState, showExcluded: !filterState.showExcluded })
            }
          />
        </section>
      </div>
    </div>
  )
}

export default function FilterPanel({
  isOpen,
  filterState,
  onChange,
  onClose,
}: FilterPanelProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  // Escape 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const touchStartY = useRef(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) onClose()
  }

  const desktopDropdown = (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="필터 패널"
      className={cn(
        'hidden md:block absolute top-full right-0 mt-1 z-50 w-80',
        'bg-bg-elevated border border-border rounded-lg shadow-e16 overflow-hidden',
        'transition-opacity duration-150 ease-out-soft',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
      style={{ maxHeight: '70vh' }}
    >
      <FilterPanelContent
        filterState={filterState}
        onChange={onChange}
        onClose={onClose}
      />
    </div>
  )

  const mobileBottomSheet = mounted
    ? createPortal(
        <>
          <div
            className={cn(
              'fixed inset-0 z-[890] md:hidden bg-overlay',
              'transition-opacity duration-200 ease-out-soft',
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={onClose}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="필터 패널"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={cn(
              'fixed bottom-0 inset-x-0 z-[900] md:hidden',
              'bg-bg-elevated rounded-t-2xl shadow-e28',
              'transition-transform duration-220 ease-out-soft',
              isOpen ? 'translate-y-0' : 'translate-y-full',
            )}
            style={{ maxHeight: '80vh' }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border-strong" />
            <div
              className="pt-4 h-full flex flex-col"
              style={{ maxHeight: '80vh' }}
            >
              <FilterPanelContent
                filterState={filterState}
                onChange={onChange}
                onClose={onClose}
              />
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <>
      {desktopDropdown}
      {mobileBottomSheet}
    </>
  )
}
