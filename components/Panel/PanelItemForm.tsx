'use client'

import { useState, useRef, useEffect } from 'react'
import type { Category, ReservationStatus, Satisfaction, TripItem, TripPriority, Link as TripLink } from '@/types'
import { useItems } from '@/lib/hooks/useItems'
import { useTrip } from '@/lib/hooks/useTripContext'
import { currencyFieldLabel, normalizeCurrency } from '@/lib/currency'
import { TriangleAlert } from 'lucide-react'
import CollapsibleSection from '@/components/UI/CollapsibleSection'
import MemoField from '@/components/UI/MemoField'
import { cn } from '@/lib/cn'
import { getScheduleWarnings } from '@/lib/scheduleWarnings'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  TRIP_PRIORITY_META,
  TRIP_PRIORITY_OPTIONS,
  RESERVATION_STATUS_META,
  RESERVATION_STATUS_OPTIONS,
  SATISFACTION_OPTIONS,
  SATISFACTION_META,
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
  decision_reason: string
  satisfaction: Satisfaction | ''
  date: string
  end_date: string
  time_start: string
  time_end: string
  last_entry_time: string
  reservation_deadline: string
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
  const trip = useTrip()
  const dateMin = trip.startDate ?? undefined
  const dateMax = trip.endDate ?? undefined
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
    decision_reason: item.decision_reason ?? '',
    satisfaction: item.satisfaction ?? '',
    date: item.date ?? '',
    end_date: item.end_date ?? '',
    time_start: item.time_start ?? '',
    time_end: item.time_end ?? '',
    last_entry_time: item.last_entry_time ?? '',
    reservation_deadline: item.reservation_deadline ?? '',
    links: item.links ?? [],
  })
  const [nameError, setNameError] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const memoRef = useRef<HTMLTextAreaElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

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
      form.decision_reason !== (item.decision_reason ?? '') ||
      form.satisfaction !== (item.satisfaction ?? '') ||
      form.date !== (item.date ?? '') ||
      form.end_date !== (item.end_date ?? '') ||
      form.time_start !== (item.time_start ?? '') ||
      form.time_end !== (item.time_end ?? '') ||
      form.last_entry_time !== (item.last_entry_time ?? '') ||
      form.reservation_deadline !== (item.reservation_deadline ?? '') ||
      JSON.stringify(cleanLinks) !== JSON.stringify(item.links ?? [])
    onDirtyChange(dirty)
  }, [form, item, onDirtyChange])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    if (key === 'name') setNameError('')
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
    if (!form.name.trim()) {
      setNameError('이름을 입력해야 저장할 수 있어요')
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nameRef.current?.focus()
      return
    }
    const trimmedAddress = form.address.trim()
    const changes: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      trip_priority: form.trip_priority,
      reservation_status: form.reservation_status,
      links: form.links.filter(l => l.url.trim()),
      address: trimmedAddress || null,
      lat: trimmedAddress && form.lat.trim() ? parseFloat(form.lat) : null,
      lng: trimmedAddress && form.lng.trim() ? parseFloat(form.lng) : null,
      budget: form.budget.trim() ? parseInt(form.budget) : null,
      memo: form.memo.trim() || null,
      decision_reason: form.decision_reason.trim() || null,
      satisfaction: form.satisfaction || null,
    }
    changes.date = form.date.trim() || null
    changes.end_date = form.end_date.trim() || null
    changes.time_start = form.time_start.trim() || null
    changes.time_end = form.time_end.trim() || null
    changes.last_entry_time = form.last_entry_time.trim() || null
    changes.reservation_deadline = form.reservation_deadline.trim() || null
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

  const inputClass = 'w-full border border-border-strong rounded-lg px-3 py-2 text-fg text-base focus:outline-none focus:ring-2 focus:ring-border-strong bg-bg-elevated'

  // 폼의 현재(미저장 포함) 값 기준으로 위반을 즉시 계산해 인라인 경고로 보여준다.
  const todayKey = new Date().toISOString().slice(0, 10)
  const scheduleWarnings = getScheduleWarnings(
    {
      ...item,
      time_start: form.time_start || undefined,
      last_entry_time: form.last_entry_time || null,
      reservation_deadline: form.reservation_deadline || null,
      reservation_status: form.reservation_status,
    },
    todayKey,
  )

  const scheduleHasValue = !!(item.date || item.end_date || item.time_start || item.time_end || item.budget != null || item.last_entry_time || item.reservation_deadline)
  const locationHasValue = !!(item.address || item.lat != null || item.lng != null)
  const linksHasValue = (item.links?.length ?? 0) > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">기본 정보</h3>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">이름 *</label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              className={`${inputClass}${nameError ? ' border-critical-fg focus:ring-critical-border' : ''}`}
              placeholder="장소 또는 활동 이름"
            />
            {nameError && <p className="text-xs text-critical-fg mt-1">{nameError}</p>}
          </div>
          <SelectField label={ITEM_FIELD_LABELS.category} value={form.category} onChange={value => setField('category', value as Category)} options={CATEGORY_OPTIONS.map(value => ({ value, label: value }))} />
          <SelectField label={ITEM_FIELD_LABELS.trip_priority} value={form.trip_priority} onChange={value => setField('trip_priority', value as TripPriority)} options={TRIP_PRIORITY_OPTIONS.map(value => ({ value, label: `${value} - ${TRIP_PRIORITY_META[value].description}` }))} />
          {(form.trip_priority === '제외' || form.decision_reason.trim()) && (
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                보류·탈락 사유 <span className="font-normal text-fg-subtle">(선택)</span>
              </label>
              <input
                type="text"
                value={form.decision_reason}
                onChange={e => setField('decision_reason', e.target.value)}
                maxLength={200}
                className={inputClass}
                placeholder="예: 거리가 멀어 동선에서 빠짐"
              />
              <p className="text-xs text-fg-subtle mt-1">왜 뺐는지 한 줄 남기면 나중에 결정을 되짚기 쉬워요.</p>
            </div>
          )}
          {(form.trip_priority === '확정' || form.satisfaction) && (
            <div>
              <label className="block text-sm font-medium text-fg mb-1">
                다녀온 뒤 만족도 <span className="font-normal text-fg-subtle">(선택)</span>
              </label>
              <div className="flex gap-1.5" role="group" aria-label="다녀온 뒤 만족도">
                {SATISFACTION_OPTIONS.map((option) => {
                  const active = form.satisfaction === option
                  const meta = SATISFACTION_META[option]
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      // 같은 값을 다시 누르면 해제 — 입력 강요 없음.
                      onClick={() => setField('satisfaction', active ? '' : option)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                        active ? meta.className : 'border-border text-fg-muted hover:bg-bg-subtle',
                      )}
                    >
                      <span aria-hidden="true">{meta.emoji}</span>
                      {option}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-fg-subtle mt-1">다녀온 곳의 만족도는 다음 추천에 반영돼요.</p>
            </div>
          )}
          <SelectField label={ITEM_FIELD_LABELS.reservation_status} value={form.reservation_status} onChange={value => setField('reservation_status', value as ReservationStatus)} options={RESERVATION_STATUS_OPTIONS.map(value => ({ value, label: `${value} - ${RESERVATION_STATUS_META[value].description}` }))} />
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">메모</h3>
          <MemoField
            inlineRef={memoRef}
            value={form.memo}
            onChange={v => setField('memo', v)}
            className={`${inputClass} resize-none overflow-hidden`}
            rows={4}
            placeholder="자유롭게 메모..."
          />
        </section>

        <CollapsibleSection title="일정" defaultOpen={scheduleHasValue}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Field label="시작 날짜" hint={form.category === '숙박' ? '체크인' : undefined}>
                <input
                  type="date"
                  value={form.date}
                  min={dateMin}
                  max={dateMax}
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
              <Field label="종료 날짜" hint={form.category === '숙박' ? '체크아웃' : undefined}>
                <input
                  type="date"
                  value={form.end_date}
                  min={dateMin}
                  max={dateMax}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="마지막 입장 시각" hint="이 시각 이후 도착이면 경고">
              <input
                type="time"
                value={form.last_entry_time}
                onChange={e => setField('last_entry_time', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="예약 마감일" hint="지났는데 미예약이면 경고">
              <input
                type="date"
                value={form.reservation_deadline}
                onChange={e => setField('reservation_deadline', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          {scheduleWarnings.length > 0 && (
            <ul className="space-y-1" aria-live="polite">
              {scheduleWarnings.map(w => (
                <li
                  key={w.kind}
                  className="flex items-center gap-1.5 rounded-lg border border-warning-border bg-warning-bg px-2.5 py-1.5 text-xs font-medium text-warning-fg"
                >
                  <TriangleAlert className="size-3.5 flex-shrink-0" aria-hidden="true" />
                  {w.message}
                </li>
              ))}
            </ul>
          )}
          <Field label={currencyFieldLabel('예산', normalizeCurrency(trip.currency))}>
            <input type="number" min="0" value={form.budget} onChange={e => setField('budget', e.target.value)} className={inputClass} placeholder="예: 50" />
          </Field>
        </CollapsibleSection>

        <CollapsibleSection title="위치" defaultOpen={locationHasValue}>
          <Field label="주소">
            <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} onBlur={handleAddressBlur} className={inputClass} placeholder="주소 입력 후 포커스를 벗어나면 좌표 자동 입력" />
          </Field>
          {geocoding && <p className="text-xs text-fg-subtle -mt-2">좌표 검색 중...</p>}
          {!geocoding && geocodeError && <p className="text-xs text-warning-fg -mt-2">{geocodeError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="위도 (lat)">
              <input type="number" step="any" value={form.lat} onChange={e => setField('lat', e.target.value)} className={inputClass} />
            </Field>
            <Field label="경도 (lng)">
              <input type="number" step="any" value={form.lng} onChange={e => setField('lng', e.target.value)} className={inputClass} />
            </Field>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="링크"
          defaultOpen={linksHasValue}
          trailing={
            form.links.length > 0 ? (
              <span className="text-xs text-fg-subtle tabular-nums">{form.links.length}</span>
            ) : null
          }
        >
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="text" value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} className={inputClass} placeholder="이름 (예: 공식 사이트)" />
                <input type="url" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} className={inputClass} placeholder="https://..." />
              </div>
              <button type="button" onClick={() => removeLink(i)} className="mt-1.5 text-fg-subtle hover:text-critical-fg text-xl leading-none transition-colors">×</button>
            </div>
          ))}
          <button type="button" onClick={addLink} className="w-full text-sm text-fg-subtle hover:text-fg-muted border border-dashed border-border-strong rounded-lg px-4 py-2 transition-colors">
            + 링크 추가
          </button>
        </CollapsibleSection>
      </div>

      <div className="flex-shrink-0 px-5 py-3 border-t border-border space-y-2">
        {nameError && (
          <p className="text-xs text-critical-fg">{nameError}</p>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm font-medium text-fg-muted border border-border hover:bg-bg-subtle transition-colors">
            취소
          </button>
          <button type="submit" className="flex-1 bg-accent text-accent-fg rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors">
            저장
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-fg mb-1">
        {label}
        {hint && <span className="ml-1 text-xs text-fg-subtle font-normal">({hint})</span>}
      </label>
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
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-border-strong rounded-lg px-3 py-2 text-fg text-base focus:outline-none focus:ring-2 focus:ring-border-strong bg-bg-elevated">
        {options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
