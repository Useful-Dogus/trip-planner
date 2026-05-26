'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate as globalMutate } from 'swr'
import Sheet, { SheetSection } from '@/components/UI/Sheet'
import { Input } from '@/components/UI/Input'
import Button from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import { useTrip } from '@/lib/hooks/useTripContext'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { Trash2 } from 'lucide-react'
import { SUPPORTED_CURRENCIES, normalizeCurrency, type CurrencyCode } from '@/lib/currency'

interface Props {
  open: boolean
  onClose: () => void
}

export default function TripSettingsSheet({ open, onClose }: Props) {
  const trip = useTrip()
  const router = useRouter()
  const { showToast } = useToast()
  const confirm = useConfirm()

  const [title, setTitle] = useState(trip.title)
  const [startDate, setStartDate] = useState(trip.startDate ?? '')
  const [endDate, setEndDate] = useState(trip.endDate ?? '')
  const [region, setRegion] = useState(trip.region ?? '')
  const [basecamp, setBasecamp] = useState(trip.basecampAddress ?? '')
  const [currency, setCurrency] = useState<CurrencyCode>(normalizeCurrency(trip.currency))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      showToast({ message: '제목은 비울 수 없습니다.', type: 'error' })
      return
    }
    if (startDate && endDate && endDate < startDate) {
      showToast({ message: '종료일은 시작일보다 빠를 수 없습니다.', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          start_date: startDate || null,
          end_date: endDate || null,
          region: region.trim() || null,
          basecamp_address: basecamp.trim() || null,
          currency,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast({ message: data?.error ?? '저장에 실패했습니다.', type: 'error' })
        return
      }
      showToast({ message: '여행 정보를 저장했습니다.', type: 'success' })
      globalMutate('/api/trips')
      router.refresh()
      onClose()
    } catch {
      showToast({ message: '네트워크 오류가 발생했습니다.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (trip.role !== 'owner') {
      showToast({ message: '소유자만 여행을 삭제할 수 있습니다.', type: 'error' })
      return
    }
    const ok = await confirm({
      title: `여행 삭제: ${trip.title}`,
      description: '이 여행과 연관된 모든 항목·공유 링크·멤버가 함께 삭제됩니다. 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'destructive',
      typeToConfirm: trip.title,
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast({ message: data?.error ?? '삭제에 실패했습니다.', type: 'error' })
        return
      }
      showToast({ message: '여행을 삭제했어요.', type: 'success' })
      globalMutate('/api/trips')
      router.push('/dashboard')
    } catch {
      showToast({ message: '네트워크 오류가 발생했습니다.', type: 'error' })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="여행 설정"
      description="제목·기간·지역·베이스캠프를 수정합니다."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </>
      }
    >
      <SheetSection>
        <div className="space-y-4">
          <Input
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-autofocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Input
            label="지역"
            placeholder="예: 도쿄, 뉴욕"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <Input
            label="베이스캠프 주소"
            placeholder="숙소 등 동선의 기준점"
            value={basecamp}
            onChange={(e) => setBasecamp(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">통화</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-fg-subtle mt-1">
              예산 입력·표시에 사용해요. 기존 항목의 수치는 그대로 유지돼요.
            </p>
          </div>
        </div>
      </SheetSection>

      {trip.role === 'owner' && (
        <SheetSection title="위험 구역">
          <p className="text-xs text-fg-muted mb-3">
            여행을 삭제하면 연관된 모든 항목·공유 링크·멤버가 함께 삭제됩니다. 되돌릴 수 없습니다.
          </p>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
            <Trash2 className="size-4" aria-hidden />
            여행 삭제
          </Button>
        </SheetSection>
      )}
    </Sheet>
  )
}
