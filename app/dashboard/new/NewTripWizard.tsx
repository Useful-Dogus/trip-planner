'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { mutate as globalMutate } from 'swr'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import LocationAutocompleteInput from '@/components/UI/LocationAutocompleteInput'
import { useToast } from '@/components/UI/Toast'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { useIsTouchDevice } from '@/lib/hooks/useIsTouchDevice'
import { resolveRegionCenter, resolutionToCenter } from '@/lib/resolveRegionCenter'
import type { CenterValue } from '@/components/Map/CenterPicker'

const CenterPicker = dynamic(() => import('@/components/Map/CenterPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-44 animate-pulse rounded-lg border border-border bg-bg-subtle" />
  ),
})

type Step = 1 | 2 | 3 | 4 | 5

const STEP_TITLES: Record<Step, string> = {
  1: '여행 이름',
  2: '기간',
  3: '지역',
  4: '베이스캠프',
  5: '확인',
}

export default function NewTripWizard() {
  const router = useRouter()
  const { showToast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [region, setRegion] = useState('')
  const [center, setCenter] = useState<CenterValue | null>(null)
  const [basecamp, setBasecamp] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('KRW')
  const [submitting, setSubmitting] = useState(false)

  const canProceed = useMemo(() => {
    if (step === 1) return title.trim().length > 0
    if (step === 2) {
      if (startDate && endDate && endDate < startDate) return false
      return true
    }
    return true
  }, [step, title, startDate, endDate])

  function next() {
    if (!canProceed) return
    if (step < 5) setStep((s) => (s + 1) as Step)
  }

  function prev() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function jumpToStep(target: Step) {
    setStep(target)
  }

  async function handleSubmit() {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? '여행 생성에 실패했습니다.')
      }
      const data = (await res.json()) as { tripId: string }
      // 지도 중심 좌표를 생성 시점에 저장(US2). 이후 지도 로드는 외부 호출 0회.
      // 미리보기(CenterPicker)에서 확보한 좌표를 우선 쓰고, 디바운스 레이스로 비어 있으면
      // region 으로 1회 재확보한다. 실패 시 좌표는 비운 채 둔다(지도 로드 시 preset/폴백).
      let resolved: { lat: number; lng: number; zoom: number; source: 'auto' | 'manual' } | null =
        center
      const trimmedRegion = region.trim()
      if (!resolved && trimmedRegion) {
        const c = resolutionToCenter(await resolveRegionCenter(trimmedRegion))
        if (c) resolved = { ...c, source: 'auto' }
      }
      if (resolved) {
        await fetch(`/api/trips/${data.tripId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            center_lat: resolved.lat,
            center_lng: resolved.lng,
            default_zoom: resolved.zoom,
            center_source: resolved.source,
          }),
        }).catch(() => {})
      }
      // 대시보드 SWR 캐시를 즉시 갱신해 두면, 사용자가 뒤로가서 목록으로 돌아왔을 때
      // 새 trip 이 0.3-0.5s 후 "팝업" 되는 대신 처음부터 보인다.
      // SWR 메모리 캐시(globalMutate)와 Next.js Router 캐시(router.refresh)를 함께 무효화해야
      // 대시보드 RSC(initialTrips)까지 재검증돼 새 trip 이 항상 보인다. (다른 mutation 사이트와 동일한 2줄 세트)
      await globalMutate('/api/trips')
      router.refresh()
      router.push(`/trip/${data.tripId}/map`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '여행 생성에 실패했습니다.'
      showToast({ type: 'error', message: msg })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            대시보드
          </Link>
          <h1 className="text-base font-bold text-fg ml-auto">새 여행 만들기</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-32">
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p className="text-sm font-semibold">
              <span className="text-accent">{step}</span>
              <span className="text-fg-subtle"> / 5</span>
              <span className="text-fg"> · {STEP_TITLES[step]}</span>
            </p>
            <p className="text-xs text-fg-subtle truncate">
              {step < 5 ? `다음: ${STEP_TITLES[(step + 1) as Step]}` : '마지막 단계'}
            </p>
          </div>
          <div
            className="h-1.5 rounded-full bg-bg-subtle overflow-hidden"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={step}
            aria-label={`5단계 중 ${step}단계: ${STEP_TITLES[step]}`}
          >
            <div
              className="h-full bg-accent transition-all duration-300 ease-out-soft"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <section className="bg-bg-elevated border border-border rounded-xl p-6">
          {step === 1 && (
            <Step1
              title={title}
              setTitle={setTitle}
            />
          )}
          {step === 2 && (
            <Step2
              startDate={startDate}
              endDate={endDate}
              setStartDate={(v) => {
                setStartDate(v)
                // 종료일이 비어있거나 시작일보다 이전이면 시작일로 맞춘다 — 종료일 picker 가 시작일 월에서 열리도록.
                if (!endDate || (v && endDate < v)) setEndDate(v)
              }}
              setEndDate={setEndDate}
            />
          )}
          {step === 3 && (
            <Step3 region={region} setRegion={setRegion} center={center} setCenter={setCenter} />
          )}
          {step === 4 && (
            <Step4
              basecamp={basecamp}
              setBasecamp={setBasecamp}
              currency={currency}
              setCurrency={setCurrency}
            />
          )}
          {step === 5 && (
            <Step5
              summary={{ title, startDate, endDate, region, basecamp, currency }}
              centerManual={center?.source === 'manual'}
              onEdit={jumpToStep}
            />
          )}
        </section>

        <div className="flex items-center justify-between mt-6 gap-3">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 1 || submitting}
          >
            이전
          </Button>
          {step < 5 ? (
            <Button onClick={next} disabled={!canProceed}>
              다음
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
              {submitting ? '생성 중…' : '여행 만들기'}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

function Step1({
  title,
  setTitle,
}: {
  title: string
  setTitle: (v: string) => void
}) {
  const isTouch = useIsTouchDevice()
  return (
    <div className="space-y-3">
      <Input
        label="여행 이름"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 오사카 가을 여행"
        autoFocus={!isTouch}
        required
      />
      <p className="text-xs text-fg-subtle">
        나중에 언제든 바꿀 수 있어요.
      </p>
    </div>
  )
}

function Step2({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: {
  startDate: string
  endDate: string
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
}) {
  const invalid = startDate && endDate && endDate < startDate
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          min={startDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      {invalid && (
        <p className="text-xs text-critical-fg">종료일은 시작일과 같거나 이후여야 합니다.</p>
      )}
      <p className="text-xs text-fg-subtle">기간은 선택사항이에요. 비워두면 나중에 정할 수 있어요.</p>
    </div>
  )
}

function Step3({
  region,
  setRegion,
  center,
  setCenter,
}: {
  region: string
  setRegion: (v: string) => void
  center: CenterValue | null
  setCenter: (v: CenterValue | null) => void
}) {
  const isTouch = useIsTouchDevice()
  return (
    <div className="space-y-3">
      <LocationAutocompleteInput
        label="지역"
        value={region}
        onChange={setRegion}
        onSelectCandidate={(c) => {
          setCenter({ lat: c.lat, lng: c.lng, zoom: center?.zoom ?? 11, source: 'auto' })
        }}
        placeholder="예: 일본 오사카"
        autoFocus={!isTouch}
      />
      <p className="text-xs text-fg-subtle">국가·도시·테마 등 자유롭게. 인식되지 않아도 진행할 수 있어요.</p>
      <CenterPicker region={region} value={center} onChange={setCenter} />
    </div>
  )
}

function Step4({
  basecamp,
  setBasecamp,
  currency,
  setCurrency,
}: {
  basecamp: string
  setBasecamp: (v: string) => void
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}) {
  const isTouch = useIsTouchDevice()
  return (
    <div className="space-y-4">
      <div>
        <LocationAutocompleteInput
          label="베이스캠프 (선택 · 숙소)"
          value={basecamp}
          onChange={setBasecamp}
          placeholder="예: 난바 인근 호텔"
          autoFocus={!isTouch}
        />
        <p className="text-xs text-fg-subtle mt-1">
          비워두면 여행을 만든 뒤 설정에서 추가할 수 있어요.
        </p>
      </div>
      <div className="border-t border-border pt-4">
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
          예산을 입력·표시할 통화를 정해요. 여행 설정에서 나중에 바꿀 수 있어요.
        </p>
      </div>
    </div>
  )
}

/** "2026-07-12" / "2026-07-19" → "2026.07.12 – 07.19 · 7박 8일" (같은 해면 종료일 연도 생략) */
function formatPeriod(start: string, end: string): string {
  if (!start && !end) return '미정'
  const full = (d: string) => d.split('-').join('.')
  const short = (d: string) => d.slice(5).split('-').join('.')
  if (start && end) {
    const sameYear = start.slice(0, 4) === end.slice(0, 4)
    const nights = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
    )
    const range = `${full(start)} – ${sameYear ? short(end) : full(end)}`
    return nights > 0 ? `${range} · ${nights}박 ${nights + 1}일` : range
  }
  return `${start ? full(start) : '?'} – ${end ? full(end) : '?'}`
}

function Step5({
  summary,
  centerManual,
  onEdit,
}: {
  summary: { title: string; startDate: string; endDate: string; region: string; basecamp: string; currency: CurrencyCode }
  centerManual: boolean
  onEdit: (step: Step) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-fg mb-1">아래 내용으로 여행을 만들어요</p>
        <p className="text-xs text-fg-subtle">각 항목 오른쪽 ‘수정’ 으로 돌아가 바꿀 수 있어요.</p>
      </div>
      <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        <SummaryEditRow
          label="이름"
          value={summary.title}
          onEdit={() => onEdit(1)}
        />
        <SummaryEditRow
          label="기간"
          value={formatPeriod(summary.startDate, summary.endDate)}
          onEdit={() => onEdit(2)}
        />
        <SummaryEditRow
          label="지역"
          value={
            (summary.region || '미설정') + (centerManual ? ' · 중심 직접 지정' : '')
          }
          onEdit={() => onEdit(3)}
        />
        <SummaryEditRow
          label="베이스캠프"
          value={summary.basecamp.trim() || '미설정 (나중에 추가 가능)'}
          onEdit={() => onEdit(4)}
        />
        <SummaryEditRow
          label="통화"
          value={(() => {
            const c = SUPPORTED_CURRENCIES.find((x) => x.code === summary.currency)
            return c ? `${c.symbol} ${c.code} — ${c.label}` : summary.currency
          })()}
          onEdit={() => onEdit(4)}
        />
      </dl>
    </div>
  )
}

function SummaryEditRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5 bg-bg-elevated">
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-fg-muted mb-0.5">{label}</dt>
        <dd className="text-sm text-fg break-words">{value}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-accent hover:underline underline-offset-2 shrink-0 pt-0.5"
      >
        수정
      </button>
    </div>
  )
}
