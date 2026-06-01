'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mutate as globalMutate } from 'swr'
import Sheet, { SheetSection } from '@/components/UI/Sheet'
import { Input } from '@/components/UI/Input'
import Button from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import { useTrip } from '@/lib/hooks/useTripContext'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { Trash2, MapPin } from 'lucide-react'
import { SUPPORTED_CURRENCIES, normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import {
  resolveRegionCenter,
  resolutionToCenter,
  type RegionResolution,
} from '@/lib/resolveRegionCenter'

type PendingCenter = { lat: number; lng: number; zoom: number }

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
  const [homeCurrency, setHomeCurrency] = useState<CurrencyCode | ''>(
    (trip.homeCurrency as CurrencyCode | null) ?? '',
  )
  const [homeCurrencyRate, setHomeCurrencyRate] = useState<string>(
    trip.homeCurrencyRate != null ? String(trip.homeCurrencyRate) : '',
  )
  const [saving, setSaving] = useState(false)

  const [resolution, setResolution] = useState<RegionResolution | null>(null)
  const [resolving, setResolving] = useState(false)
  const [pendingCenter, setPendingCenter] = useState<PendingCenter | null>(
    trip.centerLat != null && trip.centerLng != null
      ? { lat: trip.centerLat, lng: trip.centerLng, zoom: trip.defaultZoom ?? 11 }
      : null,
  )
  const [pendingSource, setPendingSource] = useState<'auto' | 'manual' | null>(trip.centerSource)
  const [guardChoice, setGuardChoice] = useState<'keep' | 'recalc'>('keep')

  const manualActive = trip.centerSource === 'manual'
  const regionChanged = (region.trim() || null) !== (trip.region || null)
  const showGuard = manualActive && regionChanged

  async function resolveAndStore(value: string, opts: { skipPreset?: boolean } = {}) {
    const trimmed = value.trim()
    if (!trimmed) {
      setResolution(null)
      setPendingCenter(null)
      setPendingSource(null)
      return
    }
    setResolving(true)
    try {
      const r = await resolveRegionCenter(trimmed, opts)
      setResolution(r)
      const center = resolutionToCenter(r)
      if (center) {
        setPendingCenter(center)
        setPendingSource('auto')
      }
    } finally {
      setResolving(false)
    }
  }

  function handleRegionBlur() {
    if (showGuard) return // 가드 UI 가 재계산 여부를 받는다
    if (!regionChanged && pendingCenter) return // 좌표 이미 확보 + 변경 없음
    void resolveAndStore(region)
  }

  async function handleSave() {
    if (!title.trim()) {
      showToast({ message: '제목은 비울 수 없습니다.', type: 'error' })
      return
    }
    if (startDate && endDate && endDate < startDate) {
      showToast({ message: '종료일은 시작일보다 빠를 수 없습니다.', type: 'error' })
      return
    }
    // 환율 입력 검증: home 통화가 선택돼야 환율 의미가 있다.
    let homeRateNum: number | null = null
    if (homeCurrencyRate.trim()) {
      const parsed = Number(homeCurrencyRate)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        showToast({ message: '환율은 0 보다 큰 숫자여야 합니다.', type: 'error' })
        return
      }
      homeRateNum = parsed
    }
    // home 통화 선택 안 했으면 rate 도 함께 비워 일관성 유지
    const finalHomeCurrency = homeCurrency || null
    const finalHomeRate = finalHomeCurrency ? homeRateNum : null

    // 명시 좌표 유지: manual 좌표가 활성이고 region 이 바뀌었는데 사용자가 재계산을 고르지 않은 경우
    const keepManual = showGuard && guardChoice !== 'recalc'

    const body: Record<string, string | number | null> = {
      title: title.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      region: region.trim() || null,
      basecamp_address: basecamp.trim() || null,
      currency,
      home_currency: finalHomeCurrency,
      home_currency_rate: finalHomeRate,
    }
    if (!keepManual) {
      if (pendingCenter) {
        body.center_lat = pendingCenter.lat
        body.center_lng = pendingCenter.lng
        body.default_zoom = pendingCenter.zoom
        body.center_source = pendingSource ?? 'auto'
      } else {
        body.center_lat = null
        body.center_lng = null
        body.default_zoom = null
        body.center_source = null
      }
    }


    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <div>
            <Input
              label="지역"
              placeholder="예: 도쿄, 뉴욕"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              onBlur={handleRegionBlur}
            />
            <RegionFeedback
              resolving={resolving}
              resolution={resolution}
              region={region}
              showGuard={showGuard}
              guardChoice={guardChoice}
              onGuardChoice={(choice) => {
                setGuardChoice(choice)
                if (choice === 'recalc') void resolveAndStore(region)
              }}
              onPickOther={() => void resolveAndStore(region, { skipPreset: true })}
            />
          </div>
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

          <div className="rounded-lg border border-border bg-bg-subtle p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">환산 표시 (선택)</label>
              <p className="text-xs text-fg-subtle">
                합계 옆에 home 통화로 환산한 값을 부가 표시합니다. 미입력 시 표시 안 함.
              </p>
            </div>
            <div>
              <label className="block text-xs text-fg-muted mb-1">Home 통화</label>
              <select
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value as CurrencyCode | '')}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">설정 안 함</option>
                {SUPPORTED_CURRENCIES.filter((c) => c.code !== currency).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>
            {homeCurrency && (
              <Input
                label={`환율 (1 ${currency} = N ${homeCurrency})`}
                type="number"
                inputMode="decimal"
                step="0.0001"
                min="0"
                value={homeCurrencyRate}
                onChange={(e) => setHomeCurrencyRate(e.target.value)}
                placeholder="예: 9.2"
              />
            )}
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

function RegionFeedback({
  resolving,
  resolution,
  region,
  showGuard,
  guardChoice,
  onGuardChoice,
  onPickOther,
}: {
  resolving: boolean
  resolution: RegionResolution | null
  region: string
  showGuard: boolean
  guardChoice: 'keep' | 'recalc'
  onGuardChoice: (choice: 'keep' | 'recalc') => void
  onPickOther: () => void
}) {
  const coords = resolution ? resolutionToCenter(resolution) : null
  const coordsLabel = useMemo(
    () => (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : null),
    [coords],
  )

  if (showGuard) {
    return (
      <div className="mt-2 rounded-lg border border-warning-border bg-warning-bg p-3 space-y-2">
        <p className="text-xs text-fg">
          중심점을 직접 지정했습니다. region 을 바꾸면 어떻게 할까요?
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-fg cursor-pointer">
            <input
              type="radio"
              name="region-guard"
              checked={guardChoice === 'keep'}
              onChange={() => onGuardChoice('keep')}
            />
            명시 좌표 유지
          </label>
          <label className="flex items-center gap-2 text-xs text-fg cursor-pointer">
            <input
              type="radio"
              name="region-guard"
              checked={guardChoice === 'recalc'}
              onChange={() => onGuardChoice('recalc')}
            />
            새 region 으로 재계산
          </label>
        </div>
      </div>
    )
  }

  if (resolving) {
    return <p className="mt-2 text-xs text-fg-subtle">위치 확인 중…</p>
  }

  if (!resolution) return null

  if (resolution.status === 'notfound') {
    return (
      <p className="mt-2 text-xs text-critical-fg">
        「{region.trim()}」 위치를 찾지 못했습니다. 지도에서 직접 지정하거나 다른 표기를 시도하세요.
      </p>
    )
  }

  if (resolution.status === 'error') {
    return (
      <p className="mt-2 text-xs text-critical-fg">
        위치 검색이 일시적으로 실패했습니다. 잠시 후 다시 시도하거나 지도에서 직접 지정하세요.
      </p>
    )
  }

  const label =
    resolution.status === 'preset' ? `${resolution.name}로 인식됨` : '검색 결과로 좌표 확보'

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
        <MapPin className="size-3" aria-hidden />
        {label}
      </span>
      {coordsLabel && <span className="text-xs text-fg-subtle">{coordsLabel}</span>}
      {resolution.status === 'preset' && (
        <button
          type="button"
          onClick={onPickOther}
          className="text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
        >
          다른 도시
        </button>
      )}
    </div>
  )
}
