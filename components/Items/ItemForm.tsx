'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface ItemFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<TripItem>
  itemId?: string
}

export default function ItemForm({ mode, initialData, itemId }: ItemFormProps) {
  const router = useRouter()
  const { createItem, updateItem, deleteItem } = useItems()
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? '',
    category: initialData?.category ?? '명소',
    trip_priority: initialData?.trip_priority ?? '검토 필요',
    reservation_status: initialData?.reservation_status ?? '확인 필요',
    address: initialData?.address ?? '',
    lat: initialData?.lat?.toString() ?? '',
    lng: initialData?.lng?.toString() ?? '',
    budget: initialData?.budget?.toString() ?? '',
    memo: initialData?.memo ?? '',
    date: initialData?.date ?? '',
    end_date: initialData?.end_date ?? '',
    time_start: initialData?.time_start ?? '',
    time_end: initialData?.time_end ?? '',
    links: initialData?.links ?? [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const memoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = memoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.memo])

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

  function addLink() {
    setField('links', [...form.links, { label: '', url: '' }])
  }

  function updateLink(i: number, field: keyof TripLink, value: string) {
    setField('links', form.links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  function removeLink(i: number) {
    setField('links', form.links.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      trip_priority: form.trip_priority,
      reservation_status: form.reservation_status,
      links: form.links.filter(l => l.url.trim()),
    }

    if (form.address.trim()) body.address = form.address.trim()
    if (form.lat.trim()) body.lat = parseFloat(form.lat)
    if (form.lng.trim()) body.lng = parseFloat(form.lng)
    if (form.budget.trim()) body.budget = parseInt(form.budget)
    if (form.memo.trim()) body.memo = form.memo.trim()
    const trimmedDate = form.date.trim()
    const trimmedEndDate = form.end_date.trim()
    const trimmedTimeStart = form.time_start.trim()
    const trimmedTimeEnd = form.time_end.trim()

    if (trimmedDate) {
      body.date = trimmedDate
    } else if (mode === 'edit') {
      body.date = null
    }

    if (trimmedEndDate) {
      body.end_date = trimmedEndDate
    } else if (mode === 'edit') {
      body.end_date = null
    }

    if (trimmedTimeStart) {
      body.time_start = trimmedTimeStart
    } else if (mode === 'edit') {
      body.time_start = null
    }

    if (trimmedTimeEnd) {
      body.time_end = trimmedTimeEnd
    } else if (mode === 'edit') {
      body.time_end = null
    }

    try {
      if (mode === 'create') {
        await createItem(body as Omit<TripItem, 'id' | 'created_at' | 'updated_at'>)
        router.push('/research')
      } else if (itemId) {
        await updateItem(itemId, body)
        router.push(`/items/${itemId}`)
      }
    } catch {
      setError('저장에 실패했습니다.')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    setLoading(true)
    if (itemId) {
      await deleteItem(itemId)
      router.push('/research')
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-28 md:pb-8">
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">기본 정보</h2>

        <div>
          <label className={labelClass}>이름 *</label>
          <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} className={inputClass} placeholder="장소 또는 활동 이름" required />
        </div>

        <SelectField label={`${ITEM_FIELD_LABELS.category} *`} value={form.category} onChange={value => setField('category', value as Category)} options={CATEGORY_OPTIONS.map(value => ({ value, label: value }))} />
        <SelectField label={`${ITEM_FIELD_LABELS.trip_priority} *`} value={form.trip_priority} onChange={value => setField('trip_priority', value as TripPriority)} options={TRIP_PRIORITY_OPTIONS.map(value => ({ value, label: `${value} - ${TRIP_PRIORITY_META[value].description}` }))} />
        <SelectField label={`${ITEM_FIELD_LABELS.reservation_status} *`} value={form.reservation_status} onChange={value => setField('reservation_status', value as ReservationStatus)} options={RESERVATION_STATUS_OPTIONS.map(value => ({ value, label: `${value} - ${RESERVATION_STATUS_META[value].description}` }))} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>시작 날짜</label>
              <input
                type="date"
                value={form.date}
                min={TRIP_DATE_MIN}
                max={TRIP_DATE_MAX}
                onChange={e => setField('date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>시작 시간</label>
              <input
                type="time"
                value={form.time_start}
                onChange={e => setField('time_start', e.target.value)}
                className={inputClass}
                disabled={!form.date}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>종료 날짜</label>
              <input
                type="date"
                value={form.end_date}
                min={TRIP_DATE_MIN}
                max={TRIP_DATE_MAX}
                onChange={e => setField('end_date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>종료 시간</label>
              <input
                type="time"
                value={form.time_end}
                onChange={e => setField('time_end', e.target.value)}
                className={inputClass}
                disabled={!form.end_date}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>예산 (USD)</label>
          <input type="number" min="0" value={form.budget} onChange={e => setField('budget', e.target.value)} className={inputClass} placeholder="예: 50" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">위치</h2>
        <div>
          <label className={labelClass}>주소</label>
          <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} onBlur={handleAddressBlur} className={inputClass} placeholder="주소 입력 후 포커스를 벗어나면 좌표 자동 입력" />
          {geocoding && <p className="text-xs text-gray-400 mt-1">좌표 검색 중...</p>}
          {!geocoding && geocodeError && <p className="text-xs text-amber-500 mt-1">{geocodeError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>위도 (lat)</label>
            <input type="number" step="any" value={form.lat} onChange={e => setField('lat', e.target.value)} className={inputClass} placeholder="40.748817" />
          </div>
          <div>
            <label className={labelClass}>경도 (lng)</label>
            <input type="number" step="any" value={form.lng} onChange={e => setField('lng', e.target.value)} className={inputClass} placeholder="-73.985428" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">링크</h2>
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
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">메모</h2>
        <textarea ref={memoRef} value={form.memo} onChange={e => setField('memo', e.target.value)} className={`${inputClass} resize-none overflow-hidden`} rows={4} placeholder="자유롭게 메모..." />
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="fixed bottom-0 left-0 right-0 md:static bg-white/95 backdrop-blur border-t md:border-t-0 px-4 py-3 md:px-0 md:py-0">
        <div className="max-w-lg mx-auto md:max-w-none flex gap-3">
          {mode === 'edit' && (
            <button type="button" onClick={handleDelete} disabled={loading} className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
              삭제
            </button>
          )}
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button type="submit" disabled={loading} className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
        {options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
