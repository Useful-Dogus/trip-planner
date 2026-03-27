'use client'

import { useState, useRef, useEffect } from 'react'
import type { TripItem, Category, Status, Priority, Link as TripLink } from '@/types'
import { useItems } from '@/lib/hooks/useItems'

const CATEGORIES: Category[] = [
  '교통',
  '숙소',
  '식당',
  '카페',
  '관광',
  '공연',
  '스포츠',
  '쇼핑',
  '기타',
]

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: '검토중', label: '검토중 — 아직 결정 안 됨' },
  { value: '보류', label: '보류 — 나중에 다시 볼 것' },
  { value: '대기중', label: '대기중 — 거의 확정, 최종 확인 중' },
  { value: '확정', label: '확정 — 간다' },
  { value: '탈락', label: '탈락 — 안 간다' },
]

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: '반드시', label: '반드시 — 이건 꼭 가야 함' },
  { value: '들를만해', label: '들를만해 — 일정 맞으면 가자' },
  { value: '시간 남으면', label: '시간 남으면 — 여유 있을 때' },
]

interface FormData {
  name: string
  category: Category
  status: Status
  priority: Priority | ''
  address: string
  lat: string
  lng: string
  budget: string
  memo: string
  date: string
  time_start: string
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
    status: item.status,
    priority: item.priority ?? '',
    address: item.address ?? '',
    lat: item.lat?.toString() ?? '',
    lng: item.lng?.toString() ?? '',
    budget: item.budget?.toString() ?? '',
    memo: item.memo ?? '',
    date: item.date ?? '',
    time_start: item.time_start ?? '',
    links: item.links ?? [],
  })

  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  const memoRef = useRef<HTMLTextAreaElement>(null)

  // 메모 높이 자동 조절
  useEffect(() => {
    const el = memoRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.memo])

  // dirty 상태 계산 — 링크는 URL 비어있는 항목 제외 후 비교
  useEffect(() => {
    const cleanLinks = form.links.filter(l => l.url.trim())
    const dirty =
      form.name !== item.name ||
      form.category !== item.category ||
      form.status !== item.status ||
      form.priority !== (item.priority ?? '') ||
      form.address !== (item.address ?? '') ||
      form.lat !== (item.lat?.toString() ?? '') ||
      form.lng !== (item.lng?.toString() ?? '') ||
      form.budget !== (item.budget?.toString() ?? '') ||
      form.memo !== (item.memo ?? '') ||
      form.date !== (item.date ?? '') ||
      form.time_start !== (item.time_start ?? '') ||
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

  function addLink() {
    setField('links', [...form.links, { label: '', url: '' }])
  }

  function updateLink(i: number, field: keyof TripLink, value: string) {
    const updated = form.links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    setField('links', updated)
  }

  function removeLink(i: number) {
    setField(
      'links',
      form.links.filter((_, idx) => idx !== i)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const changes: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      status: form.status,
      links: form.links.filter(l => l.url.trim()),
    }

    if (form.priority) changes.priority = form.priority
    if (form.address.trim()) changes.address = form.address.trim()
    if (form.lat.trim()) changes.lat = parseFloat(form.lat)
    if (form.lng.trim()) changes.lng = parseFloat(form.lng)
    if (form.budget.trim()) changes.budget = parseInt(form.budget)
    if (form.memo.trim()) changes.memo = form.memo.trim()
    if (form.date.trim()) changes.date = form.date.trim()
    if (form.time_start.trim()) changes.time_start = form.time_start.trim()

    await updateItem(item.id, changes as Partial<TripItem>)
    onSave()
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* 스크롤 가능한 폼 필드 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-6">
        {/* 기본 정보 */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">기본 정보</h3>

          <div>
            <label className={labelClass}>이름 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              className={inputClass}
              placeholder="장소 또는 활동 이름"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>카테고리 *</label>
            <select
              value={form.category}
              onChange={e => setField('category', e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>상태 *</label>
            <select
              value={form.status}
              onChange={e => setField('status', e.target.value as Status)}
              className={inputClass}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>우선순위</label>
            <select
              value={form.priority}
              onChange={e => setField('priority', e.target.value as Priority | '')}
              className={inputClass}
            >
              <option value="">없음</option>
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>날짜</label>
              <input
                type="date"
                value={form.date}
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
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>예산 (USD)</label>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={e => setField('budget', e.target.value)}
              className={inputClass}
              placeholder="예: 50"
            />
          </div>
        </section>

        {/* 위치 */}
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">위치</h3>

          <div>
            <label className={labelClass}>주소</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setField('address', e.target.value)}
              onBlur={handleAddressBlur}
              className={inputClass}
              placeholder="주소 입력 후 포커스를 벗어나면 좌표 자동 입력"
            />
            {geocoding && <p className="text-xs text-gray-400 mt-1">좌표 검색 중...</p>}
            {!geocoding && geocodeError && (
              <p className="text-xs text-amber-500 mt-1">{geocodeError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>위도 (lat)</label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={e => setField('lat', e.target.value)}
                className={inputClass}
                placeholder="40.748817"
              />
            </div>
            <div>
              <label className={labelClass}>경도 (lng)</label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={e => setField('lng', e.target.value)}
                className={inputClass}
                placeholder="-73.985428"
              />
            </div>
          </div>
        </section>

        {/* 링크 — 모바일 1단, 데스크탑 2단 */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">링크</h3>

          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  className={inputClass}
                  placeholder="이름 (예: 공식 사이트)"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="mt-1.5 text-gray-300 hover:text-red-400 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLink}
            className="w-full text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg px-4 py-2 transition-colors"
          >
            + 링크 추가
          </button>
        </section>

        {/* 메모 */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">메모</h3>
          <textarea
            ref={memoRef}
            value={form.memo}
            onChange={e => setField('memo', e.target.value)}
            className={`${inputClass} resize-none overflow-hidden`}
            rows={4}
            placeholder="자유롭게 메모..."
          />
        </section>
      </div>

      {/* 고정 하단 버튼 영역 */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </form>
  )
}
