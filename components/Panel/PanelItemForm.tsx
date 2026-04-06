'use client'

import { useState, useRef, useEffect } from 'react'
import type { Category, ReservationStatus, TripItem, TripPriority, Link as TripLink } from '@/types'
import { useItems } from '@/lib/hooks/useItems'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  TRIP_PRIORITY_META,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_META,
  RESERVATION_STATUS_OPTIONS,
  TRIP_DATE_MAX,
  TRIP_DATE_MIN,
} from '@/lib/itemOptions'

interface FormData {
  name: string
  category: Category
  trip_priority: TripPriority
  reservation_status: ReservationStatus
  address: string
  lat: string
  lng: string
  budget: string
  memo: string
  date: string
  end_date: string
  time_start: string
  time_end: string
  links: TripLink[]
}

export interface PanelItemFormProps {
  item: TripItem
  onSave: () => void
  onCancel: () => void
  onDirtyChange: (dirty: boolean) => void
}

export default function PanelItemForm({ item, onSave, onCancel, onDirtyChange }: PanelItemFormProps) {
  const { updateItem } = useItems()
  const [form, setForm] = useState<FormData>({
    name: item.name,
    category: item.category,
    trip_priority: item.trip_priority,
    reservation_status: item.reservation_status ?? '확인 필요',
    address: item.address ?? '',
    lat: item.lat?.toString() ?? '',
    lng: item.lng?.toString() ?? '',
    budget: item.budget?.toString() ?? '',
    memo: item.memo ?? '',
    date: item.date ?? '',
    end_date: item.end_date ?? '',
    time_start: item.time_start ?? '',
    time_end: item.time_end ?? '',
    links: item.links ?? [],
  })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const memoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = memoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.memo])

  useEffect(() => {
    const cleanLinks = form.links.filter(l => l.url.trim())
    const dirty =
      form.name !== item.name ||
      form.category !== item.category ||
      form.trip_priority !== item.trip_priority ||
      form.reservation_status !== (item.reservation_status ?? '확인 필요') ||
      form.address !== (item.address ?? '') ||
      form.lat !== (item.lat?.toString() ?? '') ||
      form.lng !== (item.lng?.toString() ?? '') ||
      form.budget !== (item.budget?.toString() ?? '') ||
      form.memo !== (item.memo ?? '') ||
      form.date !== (item.date ?? '') ||
      form.end_date !== (item.end_date ?? '') ||
      form.time_start !== (item.time_start ?? '') ||
      form.time_end !== (item.time_end ?? '') ||
      JSON.stringify(cleanLinks) !== JSON.stringify(item.links ?? [])
    onDirtyChange(dirty)
  }, [form, item, onDirtyChange])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleAddressBlur() {
    if (!form.address.trim()) return
    setGeocoding(true)
    setGeocodeError('')
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(form.address)}`)
      const data = await res.json()
      if (data.lat !== null && data.lng !== null) {
        setField('lat', data.lat.toString())
        setField('lng', data.lng.toString())
      } else {
        setGeocodeError('주소를 찾을 수 없습니다. 좌표 없이 저장됩니다.')
      }
    } catch {
      setGeocodeError('좌표 검색에 실패했습니다. 좌표 없이 저장됩니다.')
    } finally {
      setGeocoding(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const changes: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      trip_priority: form.trip_priority,
      reservation_status: form.reservation_status,
      links: form.links.filter(l => l.url.trim()),
    }
    if (form.address.trim()) changes.address = form.address.trim()
    if (form.lat.trim()) changes.lat = parseFloat(form.lat)
    if (form.lng.trim()) changes.lng = parseFloat(form.lng)
    if (form.budget.trim()) changes.budget = parseInt(form.budget)
    if (form.memo.trim()) changes.memo = form.memo.trim()
    changes.date = form.date.trim() || null
    changes.end_date = form.end_date.trim() || null
    changes.time_start = form.time_start.trim() || null
    changes.time_end = form.time_end.trim() || null
    await updateItem(item.id, changes)
    onSave()
  }

  function addLink() {
    setField('links', [...form.links, { label: '', url: '' }])
  }

  function updateLink(i: number, field: keyof TripLink, value: string) {
    setField('links', form.links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  function removeLink(i: number) {
    setField('links', form.links.filter((_, idx) => idx !== i))
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">기본 정보</h3>
          <Field label="이름 *">
            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} className={inputClass} placeholder="장소 또는 활동 이름" required autoFocus />
          </Field>
          <SelectField label={`${ITEM_FIELD_LABELS.category} *`} value={form.category} onChange={value => setField('category', value as Category)} options={CATEGORY_OPTIONS.map(value => ({ value, label: value }))} />
          <SelectField label={`${ITEM_FIELD_LABELS.trip_priority} *`} value={form.trip_priority} onChange={value => setField('trip_priority', value as TripPriority)} options={TRIP_PRIORITY_OPTIONS.map(value => ({ value, label: `${value} - ${TRIP_PRIORITY_META[value].description}` }))} />
          <SelectField label={`${ITEM_FIELD_LABELS.reservation_status} *`} value={form.reservation_status} onChange={value => setField('reservation_status', value as ReservationStatus)} options={RESERVATION_STATUS_OPTIONS.map(value => ({ value, label: `${value} - ${RESERVATION_STATUS_META[value].description}` }))} />
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">일정</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Field label="시작 날짜">
                <input
                  type="date"
                  value={form.date}
                  min={TRIP_DATE_MIN}
                  max={TRIP_DATE_MAX}
                  onChange={e => setField('date', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="시작 시간">
                <input
                  type="time"
                  value={form.time_start}
                  onChange={e => setField('time_start', e.target.value)}
                  className={inputClass}
                  disabled={!form.date}
                />
              </Field>
            </div>
            <div className="space-y-3">
              <Field label="종료 날짜">
                <input
                  type="date"
                  value={form.end_date}
                  min={TRIP_DATE_MIN}
                  max={TRIP_DATE_MAX}
                  onChange={e => setField('end_date', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="종료 시간">
                <input
                  type="time"
                  value={form.time_end}
                  onChange={e => setField('time_end', e.target.value)}
                  className={inputClass}
                  disabled={!form.end_date}
                />
              </Field>
            </div>
          </div>
          <Field label="예산 (USD)">
            <input type="number" min="0" value={form.budget} onChange={e => setField('budget', e.target.value)} className={inputClass} placeholder="예: 50" />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">위치</h3>
          <Field label="주소">
            <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} onBlur={handleAddressBlur} className={inputClass} placeholder="주소 입력 후 포커스를 벗어나면 좌표 자동 입력" />
          </Field>
          {geocoding && <p className="text-xs text-gray-400 -mt-2">좌표 검색 중...</p>}
          {!geocoding && geocodeError && <p className="text-xs text-amber-500 -mt-2">{geocodeError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="위도 (lat)">
              <input type="number" step="any" value={form.lat} onChange={e => setField('lat', e.target.value)} className={inputClass} />
            </Field>
            <Field label="경도 (lng)">
              <input type="number" step="any" value={form.lng} onChange={e => setField('lng', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">링크</h3>
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="text" value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} className={inputClass} placeholder="이름 (예: 공식 사이트)" />
                <input type="url" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} className={inputClass} placeholder="https://..." />
              </div>
              <button type="button" onClick={() => removeLink(i)} className="mt-1.5 text-gray-300 hover:text-red-400 text-xl leading-none transition-colors">×</button>
            </div>
          ))}
          <button type="button" onClick={addLink} className="w-full text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg px-4 py-2 transition-colors">
            + 링크 추가
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">메모</h3>
          <textarea ref={memoRef} value={form.memo} onChange={e => setField('memo', e.target.value)} className={`${inputClass} resize-none overflow-hidden`} rows={4} placeholder="자유롭게 메모..." />
        </section>
      </div>

      <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button type="submit" className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
            저장
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
        {options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
