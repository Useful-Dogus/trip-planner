'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CalendarRange, Plus, Trash2, X } from 'lucide-react'
import type { ReservationStatus, TripItem } from '@/types'
import EmptyState from '@/components/UI/EmptyState'
import Button from '@/components/UI/Button'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { RESERVATION_STATUS_OPTIONS } from '@/lib/itemOptions'
import Link from 'next/link'
import { CATEGORY_META, RESERVATION_STATUS_META } from '@/lib/itemOptions'
import { haversineKm } from '@/lib/distance'
import { getLodgingForDate, isLodgingMidStay } from '@/lib/lodging'
import { useOptionalTripId, useOptionalTrip } from '@/lib/hooks/useTripContext'
import { formatBudget as fmtBudget, normalizeCurrency } from '@/lib/currency'
import { EDITABLE_FIELDS, type EditableField } from './TableRow'
import TableRow from './TableRow'
import DateGroupHeader from './DateGroupHeader'
import UndatedGroupHeader from './UndatedGroupHeader'
import DistanceSeparator from './DistanceSeparator'
import ItemWarnings from './ItemWarnings'
import { useDraggable } from '@dnd-kit/core'

interface EditingCell {
  itemId: string
  field: EditableField
}

interface ScheduleTableProps {
  items: TripItem[]
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
  onCreateItem: (item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>) => void
  onOpenPanel: (id: string) => void
  /** 벌크 삭제용. 미전달 시 삭제 액션 미노출. */
  onDeleteItem?: (id: string) => Promise<unknown> | unknown
}

const UNDATED_KEY = '__undated__'
const TABLE_MIN_WIDTH = 'min-w-[744px]'

function parseDropTarget(id: string | number | undefined): string | null {
  if (typeof id !== 'string') return null
  // drop:date:${date}:${variant}
  if (!id.startsWith('drop:date:')) return null
  const rest = id.slice('drop:date:'.length)
  const lastColon = rest.lastIndexOf(':')
  return lastColon === -1 ? rest : rest.slice(0, lastColon)
}

function parseDragSource(id: string | number | undefined): string | null {
  if (typeof id !== 'string') return null
  if (!id.startsWith('drag:item:')) return null
  return id.slice('drag:item:'.length)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime()
  const db = new Date(b).getTime()
  return Math.round((db - da) / (1000 * 60 * 60 * 24)) + 1
}

function formatBudget(value: number | undefined, currency: string) {
  if (value === undefined) return ''
  return fmtBudget(value, normalizeCurrency(currency))
}

function formatTimeRange(item: TripItem) {
  if (item.time_start && item.time_end) return `${item.time_start} - ${item.time_end}`
  if (item.time_start) return item.time_start
  return '시간 없음'
}

function getStatusMeta(value: ReservationStatus | null | undefined) {
  if (!value) {
    return {
      dotClass: 'bg-border',
      label: '예약 정보 없음',
    }
  }

  const shortLabel: Record<ReservationStatus, string> = {
    예약완료: '예약완료',
    '필요(미예약)': '예약필요',
    불필요: '불필요',
    '확인 필요': '확인필요',
  }

  return {
    dotClass: {
      예약완료: 'bg-success-bg0',
      '필요(미예약)': 'bg-warning-fg',
      불필요: 'bg-border-strong',
      '확인 필요': 'bg-warning-fg',
    }[value],
    label: shortLabel[value],
  }
}

function distanceBetween(a: TripItem, b: TripItem): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null
  const km = haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
  if (km < 0.05) return null
  return km
}

function formatDate(dateStr: string): string {
  if (dateStr === UNDATED_KEY) return '날짜 미정'
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayOfWeek = days[d.getUTCDay()]
  return `${month}월 ${day}일 (${dayOfWeek})`
}

function MobileScheduleItemCard({
  item,
  onOpenPanel,
  todayKey,
}: {
  item: TripItem
  onOpenPanel: (id: string) => void
  todayKey: string
}) {
  const trip = useOptionalTrip()
  const status = getStatusMeta(item.reservation_status)
  const budget = formatBudget(item.budget, trip?.currency ?? 'KRW')
  const time = formatTimeRange(item)
  const Icon = CATEGORY_META[item.category]?.Icon
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `drag:item:${item.id}`,
    data: { itemId: item.id, sourceDate: item.date ?? null },
  })

  return (
    <div ref={setNodeRef} className={`relative ${isDragging ? 'opacity-40' : ''}`}>
      <button
        type="button"
        onClick={() => onOpenPanel(item.id)}
        className="w-full rounded-2xl border border-border bg-bg-elevated p-4 pl-10 text-left shadow-sm transition-all hover:border-border-strong hover:shadow-md active:scale-[0.99]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-bg-subtle text-fg-muted">
            {Icon ? <Icon size={18} /> : null}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{item.name}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{item.category}</p>
              </div>
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-xs text-fg-muted">
                <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                {status.label}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-fg-muted">
              <span className="tabular-nums">{time}</span>
              {budget ? <span className="tabular-nums font-medium text-fg">{budget}</span> : <span />}
            </div>
            <ItemWarnings item={item} todayKey={todayKey} className="mt-2" />
          </div>
        </div>
      </button>
      <span
        {...listeners}
        {...attributes}
        role="button"
        aria-label="길게 눌러 다른 날짜로 이동"
        className="absolute top-0 left-0 bottom-0 w-8 flex items-center justify-center text-fg-subtle touch-none cursor-grab active:cursor-grabbing rounded-l-2xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zM7 10a1 1 0 11-2 0 1 1 0 012 0zM7 16a1 1 0 11-2 0 1 1 0 012 0zM15 4a1 1 0 11-2 0 1 1 0 012 0zM15 10a1 1 0 11-2 0 1 1 0 012 0zM15 16a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </span>
    </div>
  )
}

function DragPreviewCard({ item }: { item: TripItem }) {
  const trip = useOptionalTrip()
  const Icon = CATEGORY_META[item.category]?.Icon
  const budget = formatBudget(item.budget, trip?.currency ?? 'KRW')
  return (
    <div className="pointer-events-none w-72 rounded-2xl border border-accent bg-bg-elevated p-3 shadow-2xl rotate-1">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-fg-muted">
          {Icon ? <Icon size={16} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{item.name}</p>
          <p className="text-xs text-fg-muted">
            {item.category}
            {budget ? ` · ${budget}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

function MobileNewItemEditor({
  date,
  inputRef,
  value,
  onChange,
  onBlur,
  onKeyDown,
}: {
  date: string
  inputRef: (el: HTMLInputElement | null) => void
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-info-border bg-info-bg/40 p-4">
      <div className="mb-2 text-xs font-medium text-info-fg">{formatDate(date)}</div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => onKeyDown(e, value)}
        placeholder="이름 입력 후 Enter…"
        className="w-full bg-transparent border-b border-border-strong focus:border-accent outline-none text-sm text-fg py-1"
        style={{ fontSize: 16 }}
      />
    </div>
  )
}

export default function ScheduleTable({
  items,
  onUpdateItem,
  onCreateItem,
  onOpenPanel,
  onDeleteItem,
}: ScheduleTableProps) {
  const tripId = useOptionalTripId()
  const trip = useOptionalTrip()
  const storageKey = tripId ? `schedule:collapsed:${tripId}` : null
  const confirm = useConfirm()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending] = useState(false)

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedIds.size > 0) clearSelection()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedIds.size, clearSelection])

  useEffect(() => {
    if (selectedIds.size === 0) return
    const existing = new Set(items.map((i) => i.id))
    let changed = false
    const next = new Set<string>()
    selectedIds.forEach((id) => {
      if (existing.has(id)) next.add(id)
      else changed = true
    })
    if (changed) setSelectedIds(next)
  }, [items, selectedIds])

  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 8 },
  })
  const sensors = useSensors(pointerSensor, touchSensor)

  function handleDragStart(e: DragStartEvent) {
    const itemId = parseDragSource(e.active.id)
    setActiveItemId(itemId)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveItemId(null)
    const itemId = parseDragSource(e.active.id)
    const targetDate = parseDropTarget(e.over?.id)
    if (!itemId || targetDate === null) return
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const currentDate = item.date ?? UNDATED_KEY
    if (currentDate === targetDate) return
    onUpdateItem(itemId, { date: targetDate === UNDATED_KEY ? null : targetDate })
  }

  function handleDragCancel() {
    setActiveItemId(null)
  }

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(() => {
    if (typeof window === 'undefined' || !storageKey) return new Set()
    try {
      const raw = window.sessionStorage.getItem(storageKey)
      if (!raw) return new Set()
      const parsed = JSON.parse(raw) as { dates?: string[]; undated?: boolean }
      return new Set(parsed.dates ?? [])
    } catch {
      return new Set()
    }
  })
  const [undatedCollapsed, setUndatedCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !storageKey) return false
    try {
      const raw = window.sessionStorage.getItem(storageKey)
      if (!raw) return false
      const parsed = JSON.parse(raw) as { dates?: string[]; undated?: boolean }
      return !!parsed.undated
    } catch {
      return false
    }
  })

  // trip 별 sessionStorage 에 접기 상태 영속화 — 새로고침·뷰 전환 후에도 유지
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return
    try {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ dates: Array.from(collapsedDates), undated: undatedCollapsed }),
      )
    } catch {
      // 저장 실패는 silent — sessionStorage 비활성/quota 등
    }
  }, [storageKey, collapsedDates, undatedCollapsed])
  const [addingToDate, setAddingToDate] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const cancelNewItemRef = useRef(false)
  const newItemInputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) setTimeout(() => el.focus(), 0)
  }, [])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const todayRef = useRef<HTMLDivElement>(null)

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.date ?? '9999-12-31'
      const db = b.date ?? '9999-12-31'
      if (da !== db) return da.localeCompare(db)
      return (a.time_start ?? '').localeCompare(b.time_start ?? '')
    })
  }, [items])

  const dateGroups = useMemo(() => {
    const groups = new Map<string, TripItem[]>()
    for (const item of sortedItems) {
      const key = item.date ?? UNDATED_KEY
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return groups
  }, [sortedItems])

  const tripStartDate = useMemo(() => {
    const dates = items.map(i => i.date).filter(Boolean) as string[]
    return dates.length ? [...dates].sort()[0] : null
  }, [items])

  function getDayOffset(date: string): number | null {
    if (!tripStartDate || date === UNDATED_KEY) return null
    return daysBetween(tripStartDate, date)
  }

  // 오늘 날짜 자동 스크롤 (마운트 시 1회)
  useEffect(() => {
    if (!todayRef.current) return
    const todayItems = dateGroups.get(todayKey)
    if (todayItems && todayItems.length > 0) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNavigate(direction: 'tab' | 'shift-tab' | 'enter' | 'escape', field: EditableField) {
    if (!editingCell) return
    if (direction === 'escape') {
      setEditingCell(null)
      return
    }

    const itemIdx = sortedItems.findIndex(i => i.id === editingCell.itemId)
    const fieldIdx = EDITABLE_FIELDS.indexOf(field)

    if (direction === 'tab') {
      if (fieldIdx < EDITABLE_FIELDS.length - 1) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx + 1] })
      } else {
        const next = sortedItems[itemIdx + 1]
        if (next) setEditingCell({ itemId: next.id, field: EDITABLE_FIELDS[0] })
        else setEditingCell(null)
      }
    } else if (direction === 'shift-tab') {
      if (fieldIdx > 0) {
        setEditingCell({ itemId: editingCell.itemId, field: EDITABLE_FIELDS[fieldIdx - 1] })
      } else {
        const prev = sortedItems[itemIdx - 1]
        if (prev) setEditingCell({ itemId: prev.id, field: EDITABLE_FIELDS[EDITABLE_FIELDS.length - 1] })
        else setEditingCell(null)
      }
    } else if (direction === 'enter') {
      const next = sortedItems[itemIdx + 1]
      if (next) setEditingCell({ itemId: next.id, field })
      else setEditingCell(null)
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      // data-portal 요소(포털 드롭다운)와 data-schedule-row 내부 클릭은 무시한다.
      // 포털은 DOM 트리상 data-schedule-row 밖에 있지만 편집 셀을 닫아선 안 된다.
      if (target.closest('[data-portal]') || target.closest('[data-schedule-row]')) return
      setEditingCell(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleNewItemBlur(date: string | null) {
    if (cancelNewItemRef.current) {
      cancelNewItemRef.current = false
      return
    }
    const name = newItemName.trim()
    if (name) {
      onCreateItem({
        name,
        category: '기타' as const,
        trip_priority: '검토 필요' as const,
        links: [],
        ...(date && date !== UNDATED_KEY ? { date } : {}),
      })
    }
    setAddingToDate(null)
    setNewItemName('')
  }

  function handleNewItemKeyDown(e: React.KeyboardEvent<HTMLInputElement>, date: string | null) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewItemBlur(date)
    } else if (e.key === 'Escape') {
      cancelNewItemRef.current = true
      setAddingToDate(null)
      setNewItemName('')
    }
  }

  function renderDesktopGroupRows(date: string, groupItems: TripItem[]) {
    return (
      <>
        {groupItems.map((item, idx) => {
          const prev = idx > 0 ? groupItems[idx - 1] : null
          const km = prev ? distanceBetween(prev, item) : null
          return (
            <Fragment key={item.id}>
              {km != null && <DistanceSeparator km={km} variant="desktop" />}
              <div data-schedule-row="true">
                <TableRow
                  item={item}
                  editingField={editingCell?.itemId === item.id ? editingCell.field : null}
                  onCellActivate={field => setEditingCell({ itemId: item.id, field })}
                  onCellSave={(field, value) => onUpdateItem(item.id, { [field]: value })}
                  onCellDeactivate={() => setEditingCell(null)}
                  onNavigate={handleNavigate}
                  onOpenPanel={onOpenPanel}
                  todayKey={todayKey}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                  selectionActive={selectedIds.size > 0}
                />
              </div>
            </Fragment>
          )
        })}
        {addingToDate === date ? (
          <div className="flex min-w-[744px] items-center border-b border-border bg-info-bg/30">
            <div className="w-6 flex-shrink-0" />
            <div className="w-6 flex-shrink-0" />
            <div className="w-16 flex-shrink-0 px-3 py-2.5" />
            <div className="min-w-[220px] flex-1 px-3 py-2.5">
              <input
                ref={newItemInputRef}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onBlur={() => handleNewItemBlur(date)}
                onKeyDown={e => handleNewItemKeyDown(e, date)}
                placeholder="이름 입력 후 Enter…"
                className="w-full bg-transparent border-b border-border-strong focus:border-accent outline-none text-sm text-fg py-0.5"
                style={{ fontSize: 16 }}
              />
            </div>
            <div className="w-12 flex-shrink-0" />
            <div className="w-28 flex-shrink-0" />
            <div className="w-24 flex-shrink-0" />
            <div className="w-16 flex-shrink-0" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAddingToDate(date)
              setNewItemName('')
            }}
            className="flex min-w-[744px] items-center w-full px-3 py-2 text-xs text-fg-subtle hover:text-fg-muted hover:bg-bg-subtle transition-colors text-left gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            항목 추가…
          </button>
        )}
      </>
    )
  }

  function renderMobileGroupRows(date: string, groupItems: TripItem[]) {
    return (
      <div className="space-y-2 px-3 py-3">
        {groupItems.map((item, idx) => {
          const prev = idx > 0 ? groupItems[idx - 1] : null
          const km = prev ? distanceBetween(prev, item) : null
          return (
            <Fragment key={item.id}>
              {km != null && <DistanceSeparator km={km} variant="mobile" />}
              <MobileScheduleItemCard item={item} onOpenPanel={onOpenPanel} todayKey={todayKey} />
            </Fragment>
          )
        })}
        {addingToDate === date ? (
          <MobileNewItemEditor
            date={date}
            inputRef={newItemInputRef}
            value={newItemName}
            onChange={setNewItemName}
            onBlur={() => handleNewItemBlur(date)}
            onKeyDown={e => handleNewItemKeyDown(e, date)}
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setAddingToDate(date)
              setNewItemName('')
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-bg-subtle px-4 py-3 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            항목 추가
          </button>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-10" aria-hidden="true" />}
        title="아직 등록된 항목이 없어요"
        description="장소를 추가하면 여기에 날짜별로 표시됩니다"
        action={
          tripId ? (
            <Link href={`/trip/${tripId}/items/new`}>
              <Button>
                <Plus className="size-4 mr-1" aria-hidden="true" />
                새 항목 추가
              </Button>
            </Link>
          ) : undefined
        }
      />
    )
  }

  const undatedItems = dateGroups.get(UNDATED_KEY) ?? []
  // 확정인데 날짜가 없는 항목 — 일정에 떨어뜨려야 할 "다음 행동" 대상.
  const undatedNeedsDateCount = undatedItems.filter(
    (i) => i.trip_priority === '확정',
  ).length
  const datedEntries = Array.from(dateGroups.entries())
    .filter(([key]) => key !== UNDATED_KEY)
    .sort(([a], [b]) => a.localeCompare(b))

  const activeItem = activeItemId ? items.find(i => i.id === activeItemId) ?? null : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div className="space-y-4">
      <div className="md:hidden space-y-4">
        {datedEntries.map(([date, groupItems]) => {
          const visibleItems = groupItems.filter(i => !isLodgingMidStay(i, date))
          const totalBudget = visibleItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
          const isCollapsed = collapsedDates.has(date)
          const dayOffset = getDayOffset(date)
          const isToday = date === todayKey
          const lodging = getLodgingForDate(date, items)

          return (
            <div key={date} ref={isToday ? todayRef : undefined} className="overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm">
              <DateGroupHeader
                date={date}
                dayOffset={dayOffset}
                totalBudget={totalBudget}
                isCollapsed={isCollapsed}
                isToday={isToday}
                lodgingName={lodging?.name ?? null}
                dndVariant="mobile"
                onToggleCollapse={() =>
                  setCollapsedDates(prev => {
                    const next = new Set(prev)
                    if (next.has(date)) next.delete(date)
                    else next.add(date)
                    return next
                  })
                }
                onAddItem={() => {
                  setCollapsedDates(prev => {
                    const next = new Set(prev)
                    next.delete(date)
                    return next
                  })
                  setAddingToDate(date)
                  setNewItemName('')
                }}
              />
              {!isCollapsed && renderMobileGroupRows(date, visibleItems)}
            </div>
          )
        })}

        {undatedItems.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm">
            <UndatedGroupHeader
              count={undatedItems.length}
              needsDateCount={undatedNeedsDateCount}
              isCollapsed={undatedCollapsed}
              dndVariant="mobile"
              onToggleCollapse={() => setUndatedCollapsed(prev => !prev)}
              onAddItem={() => {
                setUndatedCollapsed(false)
                setAddingToDate(UNDATED_KEY)
                setNewItemName('')
              }}
            />
            {!undatedCollapsed && renderMobileGroupRows(UNDATED_KEY, undatedItems)}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        {selectedIds.size > 0 && (
          <BulkActionBar
            count={selectedIds.size}
            tripStart={trip?.startDate ?? null}
            tripEnd={trip?.endDate ?? null}
            pending={bulkPending}
            onClear={clearSelection}
            onApplyDate={async (date) => {
              setBulkPending(true)
              try {
                await Promise.all(
                  Array.from(selectedIds).map((id) => onUpdateItem(id, { date })),
                )
              } finally {
                setBulkPending(false)
              }
            }}
            onApplyStatus={async (status) => {
              setBulkPending(true)
              try {
                await Promise.all(
                  Array.from(selectedIds).map((id) =>
                    onUpdateItem(id, { reservation_status: status }),
                  ),
                )
              } finally {
                setBulkPending(false)
              }
            }}
            onDelete={
              onDeleteItem
                ? async () => {
                    const ok = await confirm({
                      title: `${selectedIds.size}개 항목 삭제`,
                      description: '되돌릴 수 없어요. 정말 삭제할까요?',
                      tone: 'destructive',
                      confirmLabel: '삭제',
                    })
                    if (!ok) return
                    setBulkPending(true)
                    try {
                      const ids = Array.from(selectedIds)
                      await Promise.all(ids.map((id) => onDeleteItem(id)))
                      clearSelection()
                    } finally {
                      setBulkPending(false)
                    }
                  }
                : null
            }
          />
        )}
        <div className="overflow-hidden rounded-xl border border-border bg-bg-elevated">
          <div className="overflow-x-auto">
            <div className={TABLE_MIN_WIDTH}>
              {/* 컬럼 헤더 */}
              <div className="flex items-center gap-0 border-b border-border bg-bg-elevated px-0">
                <div className="w-6 flex-shrink-0" />
                <div className="w-6 flex-shrink-0" />
                <div className="w-16 flex-shrink-0 px-3 py-2.5">
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">시간</span>
                </div>
                <div className="min-w-[220px] flex-1 px-3 py-2.5">
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">이름</span>
                </div>
                <div className="w-12 flex-shrink-0 px-2 py-2.5 text-center">
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">분류</span>
                </div>
                <div className="w-28 flex-shrink-0 px-2 py-2.5">
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">예약상태</span>
                </div>
                <div className="w-24 flex-shrink-0 px-3 py-2.5 text-right">
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">예산</span>
                </div>
                <div className="w-16 flex-shrink-0" />
              </div>

              {/* 날짜 있는 그룹 */}
              {datedEntries.map(([date, groupItems]) => {
                const visibleItems = groupItems.filter(i => !isLodgingMidStay(i, date))
                const totalBudget = visibleItems.reduce((sum, i) => sum + (i.budget ?? 0), 0)
                const isCollapsed = collapsedDates.has(date)
                const dayOffset = getDayOffset(date)
                const isToday = date === todayKey
                const lodging = getLodgingForDate(date, items)

                return (
                  <div key={date} ref={isToday ? todayRef : undefined}>
                    <DateGroupHeader
                      date={date}
                      dayOffset={dayOffset}
                      totalBudget={totalBudget}
                      isCollapsed={isCollapsed}
                      isToday={isToday}
                      lodgingName={lodging?.name ?? null}
                      dndVariant="desktop"
                      onToggleCollapse={() =>
                        setCollapsedDates(prev => {
                          const next = new Set(prev)
                          if (next.has(date)) next.delete(date)
                          else next.add(date)
                          return next
                        })
                      }
                      onAddItem={() => {
                        setCollapsedDates(prev => {
                          const next = new Set(prev)
                          next.delete(date)
                          return next
                        })
                        setAddingToDate(date)
                        setNewItemName('')
                      }}
                    />
                    {!isCollapsed && renderDesktopGroupRows(date, visibleItems)}
                  </div>
                )
              })}

              {/* 미배정 버킷 (최하단, 있을 때만) */}
              {undatedItems.length > 0 && (
                <div>
                  <UndatedGroupHeader
                    count={undatedItems.length}
                    needsDateCount={undatedNeedsDateCount}
                    isCollapsed={undatedCollapsed}
                    dndVariant="desktop"
                    onToggleCollapse={() => setUndatedCollapsed(prev => !prev)}
                    onAddItem={() => {
                      setUndatedCollapsed(false)
                      setAddingToDate(UNDATED_KEY)
                      setNewItemName('')
                    }}
                  />
                  {!undatedCollapsed && renderDesktopGroupRows(UNDATED_KEY, undatedItems)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    <DragOverlay>{activeItem ? <DragPreviewCard item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  )
}

interface BulkActionBarProps {
  count: number
  tripStart: string | null
  tripEnd: string | null
  pending: boolean
  onClear: () => void
  onApplyDate: (date: string | null) => Promise<void> | void
  onApplyStatus: (status: ReservationStatus) => Promise<void> | void
  onDelete: (() => Promise<void> | void) | null
}

function BulkActionBar({
  count,
  tripStart,
  tripEnd,
  pending,
  onClear,
  onApplyDate,
  onApplyStatus,
  onDelete,
}: BulkActionBarProps) {
  return (
    <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-bg/30 px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-fg">{count}개 선택됨</span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-fg-muted">날짜 이동</label>
        <input
          type="date"
          min={tripStart ?? undefined}
          max={tripEnd ?? undefined}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value
            if (v) void onApplyDate(v)
            e.target.value = ''
          }}
          className="h-8 rounded border border-border bg-bg px-2 text-xs text-fg disabled:opacity-50"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-fg-muted">예약 상태</label>
        <select
          disabled={pending}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value
            if (v) void onApplyStatus(v as ReservationStatus)
            e.target.value = ''
          }}
          className="h-8 rounded border border-border bg-bg px-2 text-xs text-fg disabled:opacity-50"
        >
          <option value="" disabled>
            선택
          </option>
          {RESERVATION_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => void onDelete()}
          disabled={pending}
          leftIcon={<Trash2 size={14} />}
        >
          삭제
        </Button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
        title="선택 해제 (Esc)"
      >
        <X size={14} /> 해제
      </button>
    </div>
  )
}
