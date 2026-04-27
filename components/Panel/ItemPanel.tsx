'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TripItem } from '@/types'
import PanelItemForm from './PanelItemForm'
import { useItems } from '@/lib/hooks/useItems'
import {
  CATEGORY_OPTIONS,
  CHIP_TONE,
  ITEM_FIELD_LABELS,
  PLACEHOLDER_TONE,
  TRIP_PRIORITY_META,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_META,
  RESERVATION_STATUS_OPTIONS,
  TRIP_DATE_MAX,
  TRIP_DATE_MIN,
} from '@/lib/itemOptions'
import TripPriorityBadge from '@/components/UI/TripPriorityBadge'
import ReservationStatusBadge from '@/components/UI/ReservationStatusBadge'

export interface ItemPanelProps {
  item: TripItem | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}

export default function ItemPanel({ item, isOpen, onClose, onSave, onDelete }: ItemPanelProps) {
  const { deleteItem, updateItem } = useItems()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isDirty, setIsDirty] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [savingField, setSavingField] = useState<'category' | 'trip_priority' | 'reservation_status' | null>(null)
  const [openField, setOpenField] = useState<'category' | 'trip_priority' | 'reservation_status' | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMode('view')
    setIsDirty(false)
    setConfirmingClose(false)
    setSavingField(null)
    setOpenField(null)
  }, [item?.id])

  useEffect(() => {
    if (!isOpen) {
      setMode('view')
      setIsDirty(false)
      setConfirmingClose(false)
      setSavingField(null)
      setOpenField(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmingClose) {
          setConfirmingClose(false)
        } else if (mode === 'edit' && isDirty) {
          setConfirmingClose(true)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [confirmingClose, isDirty, isOpen, mode, onClose])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !isOpen) return
    const handler = () => {
      const height = window.innerHeight - vv.height - vv.offsetTop
      setKeyboardHeight(Math.max(0, height))
    }
    vv.addEventListener('resize', handler)
    vv.addEventListener('scroll', handler)
    handler()
    return () => {
      vv.removeEventListener('resize', handler)
      vv.removeEventListener('scroll', handler)
      setKeyboardHeight(0)
    }
  }, [isOpen])

  const touchStartY = useRef<number>(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (mode === 'edit') return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) onClose()
  }

  function tryClose() {
    if (mode === 'edit' && isDirty) {
      setConfirmingClose(true)
    } else {
      onClose()
    }
  }

  function handleDiscardAndClose() {
    setConfirmingClose(false)
    onClose()
  }

  async function handleDelete(id: string) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    await deleteItem(id)
    onDelete(id)
    onClose()
  }

  async function handleQuickUpdate(field: 'category' | 'trip_priority' | 'reservation_status', value: string | null) {
    if (!displayItem) return
    setSavingField(field)
    await updateItem(displayItem.id, { [field]: value })
    setSavingField(null)
    setOpenField(null)
    onSave()
  }

  async function handleFieldSave(changes: Record<string, unknown>) {
    if (!displayItem) return
    await updateItem(displayItem.id, changes)
    onSave()
  }

  const cachedItem = useRef<TripItem | null>(null)
  if (item) cachedItem.current = item
  const displayItem = item ?? cachedItem.current

  const panelStyle: React.CSSProperties =
    keyboardHeight > 0 ? { bottom: `${keyboardHeight}px`, maxHeight: `${window.innerHeight - keyboardHeight}px` } : {}

  return (
    <>
      <div className={`fixed inset-0 bg-overlay z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={confirmingClose ? () => setConfirmingClose(false) : tryClose} aria-hidden="true" />

      <div
        ref={panelRef}
        aria-label="항목 상세 패널"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={panelStyle}
        className={`fixed z-[1010] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col bottom-0 left-0 right-0 rounded-t-2xl h-[80vh] md:h-screen md:bottom-auto md:right-0 md:top-0 md:left-auto md:w-[520px] md:rounded-none md:rounded-l-2xl ${
          isOpen ? 'translate-y-0 md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border rounded-full md:hidden" />
          <span className="text-sm font-semibold text-fg">{mode === 'edit' ? '편집' : '상세 정보'}</span>
          <div className="flex items-center gap-2">
            {mode === 'edit' && displayItem && (
              <button onClick={() => handleDelete(displayItem.id)} aria-label="항목 삭제" className="px-3 py-1.5 text-xs font-medium text-critical-fg border border-critical-border rounded-lg hover:bg-critical-bg transition-colors">
                삭제
              </button>
            )}
            <button onClick={tryClose} aria-label="패널 닫기" className="p-1.5 text-fg-subtle hover:text-fg-muted transition-colors rounded-lg hover:bg-bg-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {displayItem && mode === 'view' && (
            <ItemDetailView
              item={displayItem}
              openField={openField}
              savingField={savingField}
              onOpenField={setOpenField}
              onQuickUpdate={handleQuickUpdate}
              onFieldSave={handleFieldSave}
              onDeleteRequest={() => handleDelete(displayItem.id)}
            />
          )}
          {displayItem && mode === 'edit' && (
            <PanelItemForm
              item={displayItem}
              onSave={() => {
                onSave()
                setMode('view')
              }}
              onCancel={() => setMode('view')}
              onDirtyChange={setIsDirty}
            />
          )}
        </div>

        {confirmingClose && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-warning-border px-5 pt-4 pb-6 z-10">
            <p className="text-sm font-medium text-fg mb-3">변경사항이 있습니다. 저장하지 않고 나가시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={handleDiscardAndClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors">나가기</button>
              <button onClick={() => setConfirmingClose(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-fg-muted border border-border hover:bg-bg-subtle transition-colors">계속 편집</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── 인라인 편집 가능한 뷰 ───────────────────────────────────────────────────

type InlineField = 'name' | 'budget' | 'date' | 'time_start' | 'end_date' | 'time_end' | 'address' | 'memo'

function ItemDetailView({
  item,
  openField,
  savingField,
  onOpenField,
  onQuickUpdate,
  onFieldSave,
  onDeleteRequest,
}: {
  item: TripItem
  openField: 'category' | 'trip_priority' | 'reservation_status' | null
  savingField: 'category' | 'trip_priority' | 'reservation_status' | null
  onOpenField: (field: 'category' | 'trip_priority' | 'reservation_status' | null) => void
  onQuickUpdate: (field: 'category' | 'trip_priority' | 'reservation_status', value: string | null) => void
  onFieldSave: (changes: Record<string, unknown>) => Promise<void>
  onDeleteRequest: () => void
}) {
  const [editing, setEditing] = useState<InlineField | null>(null)
  const [vals, setVals] = useState({
    name: item.name,
    budget: item.budget?.toString() ?? '',
    date: item.date ?? '',
    time_start: item.time_start ?? '',
    end_date: item.end_date ?? '',
    time_end: item.time_end ?? '',
    address: item.address ?? '',
    memo: item.memo ?? '',
  })
  const [links, setLinks] = useState(item.links ?? [])
  const [editingLinkIdx, setEditingLinkIdx] = useState<number | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const memoRef = useRef<HTMLTextAreaElement>(null)

  // item 변경 시 값 동기화
  useEffect(() => {
    setVals({
      name: item.name,
      budget: item.budget?.toString() ?? '',
      date: item.date ?? '',
      time_start: item.time_start ?? '',
      end_date: item.end_date ?? '',
      time_end: item.time_end ?? '',
      address: item.address ?? '',
      memo: item.memo ?? '',
    })
    setLinks(item.links ?? [])
    setEditing(null)
    setEditingLinkIdx(null)
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // textarea 자동 높이
  useEffect(() => {
    const el = memoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [vals.memo, editing])

  function activate(field: InlineField) {
    setEditing(field)
  }

  function cancel(field: InlineField) {
    // 원래 값으로 복원
    setVals(prev => ({
      ...prev,
      name: field === 'name' ? item.name : prev.name,
      budget: field === 'budget' ? (item.budget?.toString() ?? '') : prev.budget,
      date: field === 'date' ? (item.date ?? '') : prev.date,
      time_start: field === 'time_start' ? (item.time_start ?? '') : prev.time_start,
      end_date: field === 'end_date' ? (item.end_date ?? '') : prev.end_date,
      time_end: field === 'time_end' ? (item.time_end ?? '') : prev.time_end,
      address: field === 'address' ? (item.address ?? '') : prev.address,
      memo: field === 'memo' ? (item.memo ?? '') : prev.memo,
    }))
    setEditing(null)
  }

  async function commit(field: InlineField) {
    setEditing(null)
    const v = vals[field]
    switch (field) {
      case 'name': {
        const trimmed = v.trim()
        if (!trimmed || trimmed === item.name) return
        await onFieldSave({ name: trimmed })
        break
      }
      case 'budget': {
        const parsed = v.trim() ? parseInt(v) : null
        if (parsed === (item.budget ?? null)) return
        await onFieldSave({ budget: parsed })
        break
      }
      case 'date': {
        if (v === (item.date ?? '')) return
        await onFieldSave({ date: v || null, ...((!v) ? { time_start: null } : {}) })
        break
      }
      case 'time_start': {
        if (v === (item.time_start ?? '')) return
        await onFieldSave({ time_start: v || null })
        break
      }
      case 'end_date': {
        if (v === (item.end_date ?? '')) return
        await onFieldSave({ end_date: v || null, ...((!v) ? { time_end: null } : {}) })
        break
      }
      case 'time_end': {
        if (v === (item.time_end ?? '')) return
        await onFieldSave({ time_end: v || null })
        break
      }
      case 'address': {
        const trimmed = v.trim()
        if (trimmed === (item.address ?? '')) return
        if (!trimmed) { await onFieldSave({ address: null, lat: null, lng: null }); return }
        setGeocoding(true)
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`)
          const data = await res.json()
          await onFieldSave({
            address: trimmed,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          })
        } finally {
          setGeocoding(false)
        }
        break
      }
      case 'memo': {
        const trimmed = v.trim()
        if (trimmed === (item.memo ?? '')) return
        await onFieldSave({ memo: trimmed || null })
        break
      }
    }
  }

  async function saveLinks(newLinks: TripItem['links']) {
    setLinks(newLinks)
    await onFieldSave({ links: newLinks.filter(l => l.url.trim()) })
  }

  function inlineInput(field: InlineField, opts?: { type?: string; min?: string; max?: string; placeholder?: string; className?: string }) {
    return (
      <input
        autoFocus
        type={opts?.type ?? 'text'}
        min={opts?.min}
        max={opts?.max}
        value={vals[field]}
        placeholder={opts?.placeholder}
        onChange={e => setVals(prev => ({ ...prev, [field]: e.target.value }))}
        onBlur={() => commit(field)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit(field) }
          if (e.key === 'Escape') cancel(field)
        }}
        className={`border-b border-border-strong outline-none bg-transparent ${opts?.className ?? 'text-sm text-fg w-full'}`}
      />
    )
  }

  const inputClass = 'border-b border-border-strong outline-none bg-transparent text-sm text-fg w-full'
  const emptyClass = 'text-sm text-fg-subtle cursor-text'

  return (
    <div className="px-5 py-4 space-y-5 pb-8 overflow-y-auto">

      {/* 이름 */}
      <div>
        {editing === 'name' ? (
          <input
            autoFocus
            type="text"
            value={vals.name}
            onChange={e => setVals(prev => ({ ...prev, name: e.target.value }))}
            onBlur={() => commit('name')}
            onKeyDown={e => {
              if (e.key === 'Enter') commit('name')
              if (e.key === 'Escape') cancel('name')
            }}
            className="text-xl font-bold text-fg w-full border-b-2 border-border-strong outline-none bg-transparent mb-2"
          />
        ) : (
          <h2
            className="text-xl font-bold text-fg mb-2 cursor-text"
            onClick={() => activate('name')}
          >
            {item.name}
          </h2>
        )}

        {/* 칩 */}
        <div className="flex flex-wrap gap-2">
          <MetadataDropdownChip
            label={ITEM_FIELD_LABELS.category}
            isOpen={openField === 'category'}
            saving={savingField === 'category'}
            onToggle={() => onOpenField(openField === 'category' ? null : 'category')}
            currentNode={<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CHIP_TONE}`}>{item.category}</span>}
            options={CATEGORY_OPTIONS}
            onSelect={v => onQuickUpdate('category', v)}
          />
          <MetadataDropdownChip
            label={ITEM_FIELD_LABELS.trip_priority}
            isOpen={openField === 'trip_priority'}
            saving={savingField === 'trip_priority'}
            onToggle={() => onOpenField(openField === 'trip_priority' ? null : 'trip_priority')}
            currentNode={<TripPriorityBadge tripPriority={item.trip_priority} />}
            options={TRIP_PRIORITY_OPTIONS}
            descriptions={TRIP_PRIORITY_META}
            onSelect={v => onQuickUpdate('trip_priority', v)}
          />
          <MetadataDropdownChip
            label={ITEM_FIELD_LABELS.reservation_status}
            isOpen={openField === 'reservation_status'}
            saving={savingField === 'reservation_status'}
            onToggle={() => onOpenField(openField === 'reservation_status' ? null : 'reservation_status')}
            currentNode={
              item.reservation_status
                ? <ReservationStatusBadge reservationStatus={item.reservation_status} />
                : <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PLACEHOLDER_TONE}`}>예약 정보 없음</span>
            }
            options={RESERVATION_STATUS_OPTIONS}
            descriptions={RESERVATION_STATUS_META}
            onSelect={v => onQuickUpdate('reservation_status', v)}
          />
        </div>
      </div>

      {/* 일정 + 예산 */}
      <section className="bg-gray-50 rounded-xl p-4 space-y-2.5">
        <SectionTitle>일정 · 예산</SectionTitle>

        <InlineRow label="시작 날짜">
          {editing === 'date'
            ? inlineInput('date', { type: 'date', min: TRIP_DATE_MIN, max: TRIP_DATE_MAX })
            : <span className={vals.date ? 'text-sm text-fg cursor-text' : emptyClass} onClick={() => activate('date')}>{vals.date || '날짜 선택'}</span>
          }
        </InlineRow>

        <InlineRow label="시작 시간">
          {editing === 'time_start'
            ? inlineInput('time_start', { type: 'time' })
            : <span className={vals.time_start ? 'text-sm text-fg cursor-text' : emptyClass} onClick={() => vals.date && activate('time_start')}>{vals.time_start || (vals.date ? '시간 선택' : '—')}</span>
          }
        </InlineRow>

        <InlineRow label="종료 날짜">
          {editing === 'end_date'
            ? inlineInput('end_date', { type: 'date', min: TRIP_DATE_MIN, max: TRIP_DATE_MAX })
            : <span className={vals.end_date ? 'text-sm text-fg cursor-text' : emptyClass} onClick={() => activate('end_date')}>{vals.end_date || '날짜 선택'}</span>
          }
        </InlineRow>

        <InlineRow label="종료 시간">
          {editing === 'time_end'
            ? inlineInput('time_end', { type: 'time' })
            : <span className={vals.time_end ? 'text-sm text-fg cursor-text' : emptyClass} onClick={() => vals.end_date && activate('time_end')}>{vals.time_end || (vals.end_date ? '시간 선택' : '—')}</span>
          }
        </InlineRow>

        <InlineRow label="예산 (USD)">
          {editing === 'budget'
            ? <input
                autoFocus
                type="number"
                min="0"
                value={vals.budget}
                onChange={e => setVals(prev => ({ ...prev, budget: e.target.value }))}
                onBlur={() => commit('budget')}
                onKeyDown={e => {
                  if (e.key === 'Enter') commit('budget')
                  if (e.key === 'Escape') cancel('budget')
                }}
                className={`${inputClass} text-right w-28`}
                placeholder="0"
              />
            : <span className={vals.budget ? 'text-sm font-medium text-fg cursor-text' : emptyClass} onClick={() => activate('budget')}>
                {vals.budget ? `$${parseInt(vals.budget).toLocaleString()}` : '입력'}
              </span>
          }
        </InlineRow>
      </section>

      {/* 위치 */}
      <section>
        <SectionTitle>위치</SectionTitle>
        {editing === 'address'
          ? <input
              autoFocus
              type="text"
              value={vals.address}
              onChange={e => setVals(prev => ({ ...prev, address: e.target.value }))}
              onBlur={() => commit('address')}
              onKeyDown={e => {
                if (e.key === 'Enter') commit('address')
                if (e.key === 'Escape') cancel('address')
              }}
              className={`${inputClass} mb-1`}
              placeholder="주소 입력 후 포커스를 벗어나면 좌표 자동 입력"
            />
          : <p
              className={vals.address ? 'text-sm text-fg cursor-text' : emptyClass}
              onClick={() => activate('address')}
            >
              {vals.address || '주소 추가'}
            </p>
        }
        {geocoding && <p className="text-xs text-fg-subtle mt-1">좌표 검색 중...</p>}
        {!geocoding && item.lat !== undefined && item.lng !== undefined && (
          <p className="text-xs text-fg-subtle mt-1">{item.lat}, {item.lng}</p>
        )}
      </section>

      {/* 링크 */}
      <section>
        <SectionTitle>링크</SectionTitle>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i}>
              {editingLinkIdx === i ? (
                <div className="space-y-1.5">
                  <input
                    autoFocus
                    type="text"
                    value={link.label}
                    placeholder="이름 (예: 공식 사이트)"
                    onChange={e => {
                      const next = links.map((l, idx) => idx === i ? { ...l, label: e.target.value } : l)
                      setLinks(next)
                    }}
                    onKeyDown={e => e.key === 'Escape' && setEditingLinkIdx(null)}
                    className={inputClass}
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={link.url}
                      placeholder="https://..."
                      onChange={e => {
                        const next = links.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l)
                        setLinks(next)
                      }}
                      onBlur={() => { saveLinks(links); setEditingLinkIdx(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { saveLinks(links); setEditingLinkIdx(null) }
                        if (e.key === 'Escape') setEditingLinkIdx(null)
                      }}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => { const next = links.filter((_, idx) => idx !== i); saveLinks(next); setEditingLinkIdx(null) }}
                      className="text-fg-subtle hover:text-critical-fg text-xl leading-none transition-colors flex-shrink-0"
                    >×</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors min-w-0 flex-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    <span className="truncate">{link.label || link.url}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditingLinkIdx(i)}
                    className="text-fg-subtle hover:text-fg-muted transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 md:block hidden"
                    title="링크 편집"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  {/* 모바일: 탭으로 편집 활성화 */}
                  <button
                    type="button"
                    onClick={() => setEditingLinkIdx(i)}
                    className="text-fg-subtle hover:text-fg-muted transition-colors flex-shrink-0 md:hidden"
                    title="링크 편집"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...links, { label: '', url: '' }]
              setLinks(next)
              setEditingLinkIdx(next.length - 1)
            }}
            className="text-sm text-fg-subtle hover:text-fg-muted transition-colors"
          >
            + 링크 추가
          </button>
        </div>
      </section>

      {/* 메모 */}
      <section>
        <SectionTitle>메모</SectionTitle>
        {editing === 'memo'
          ? <textarea
              ref={memoRef}
              autoFocus
              value={vals.memo}
              onChange={e => setVals(prev => ({ ...prev, memo: e.target.value }))}
              onBlur={() => commit('memo')}
              onKeyDown={e => {
                if (e.key === 'Escape') cancel('memo')
              }}
              className="text-sm text-fg w-full border-b border-border-strong outline-none bg-transparent resize-none overflow-hidden"
              rows={3}
              placeholder="자유롭게 메모..."
            />
          : <p
              className={vals.memo ? 'text-sm text-fg whitespace-pre-wrap cursor-text' : emptyClass}
              onClick={() => activate('memo')}
            >
              {vals.memo || '메모 추가'}
            </p>
        }
      </section>

      {/* 삭제 버튼 */}
      <div className="pt-2">
        <button
          onClick={onDeleteRequest}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-critical-fg border border-critical-border hover:bg-critical-bg transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

// ─── 공통 UI ──────────────────────────────────────────────────────────────────

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2 ${className}`}>{children}</h3>
}

function InlineRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-fg-muted flex-shrink-0">{label}</span>
      <div className="flex-1 text-right">{children}</div>
    </div>
  )
}

// ─── MetadataDropdownChip ─────────────────────────────────────────────────────

function MetadataDropdownChip({
  label,
  isOpen,
  saving,
  onToggle,
  currentNode,
  options,
  onSelect,
  descriptions,
  placeholderLabel,
}: {
  label: string
  isOpen: boolean
  saving: boolean
  onToggle: () => void
  currentNode: React.ReactNode
  options: Array<string | null>
  onSelect: (value: string | null) => void
  descriptions?: Record<string, { description: string }>
  placeholderLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.max(rect.width, 224)
      const left = rect.left + width > window.innerWidth
        ? Math.max(0, rect.right - width)
        : rect.left
      setPosition({ top: rect.bottom + 8, left, width })
    }
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (ref.current?.contains(target) || dropdownRef.current?.contains(target)) return
      onToggle()
    }
    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, onToggle])

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        disabled={saving}
        className={saving ? 'opacity-60 cursor-wait' : ''}
      >
        {currentNode}
      </button>
      {isOpen && position && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[1200] rounded-xl border border-border bg-white shadow-lg p-1"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <div className="px-3 py-2 text-[11px] font-medium text-fg-subtle">{label}</div>
          {options.map(option => {
            const key = option ?? 'empty'
            const description = option && descriptions?.[option]?.description
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(option)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-bg-subtle transition-colors"
              >
                <div className="text-sm font-medium text-fg">{option ?? placeholderLabel ?? '없음'}</div>
                {description && <div className="mt-0.5 text-xs text-fg-subtle">{description}</div>}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
