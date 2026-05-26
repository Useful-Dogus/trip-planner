'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { useToast } from '@/components/UI/Toast'
import { cn } from '@/lib/cn'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency'
import { useIsTouchDevice } from '@/lib/hooks/useIsTouchDevice'

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
  const [basecamp, setBasecamp] = useState('')
  const [basecampSkipped, setBasecampSkipped] = useState(false)
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

  function skipBasecamp() {
    setBasecamp('')
    setBasecampSkipped(true)
    if (step === 4) setStep(5)
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
        <ol className="flex items-center gap-2 mb-8" aria-label="단계 표시">
          {[1, 2, 3, 4, 5].map((n) => {
            const done = n < step
            const current = n === step
            return (
              <li key={n} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center size-7 rounded-full text-xs font-semibold transition-colors',
                    done && 'bg-accent text-accent-fg',
                    current && 'bg-accent text-accent-fg ring-2 ring-accent/30',
                    !done && !current && 'bg-bg-subtle text-fg-subtle',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : n}
                </div>
                <div className="hidden sm:block flex-1 min-w-0">
                  <p className={cn('text-xs truncate', current ? 'text-fg font-medium' : 'text-fg-subtle')}>
                    {STEP_TITLES[n as Step]}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

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
            <Step3 region={region} setRegion={setRegion} />
          )}
          {step === 4 && (
            <Step4
              basecamp={basecamp}
              setBasecamp={(v) => {
                setBasecamp(v)
                if (v.trim()) setBasecampSkipped(false)
              }}
              onSkip={skipBasecamp}
              skipped={basecampSkipped}
              currency={currency}
              setCurrency={setCurrency}
            />
          )}
          {step === 5 && (
            <Step5
              summary={{ title, startDate, endDate, region, basecamp, currency }}
              basecampSkipped={basecampSkipped && !basecamp.trim()}
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
}: {
  region: string
  setRegion: (v: string) => void
}) {
  const isTouch = useIsTouchDevice()
  return (
    <div className="space-y-3">
      <Input
        label="지역"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="예: 일본 오사카"
        autoFocus={!isTouch}
      />
      <p className="text-xs text-fg-subtle">국가·도시·테마 등 자유롭게.</p>
    </div>
  )
}

function Step4({
  basecamp,
  setBasecamp,
  onSkip,
  skipped,
  currency,
  setCurrency,
}: {
  basecamp: string
  setBasecamp: (v: string) => void
  onSkip: () => void
  skipped: boolean
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}) {
  const isTouch = useIsTouchDevice()
  return (
    <div className="space-y-4">
      <div>
        <Input
          label="베이스캠프 (숙소)"
          value={basecamp}
          onChange={(e) => setBasecamp(e.target.value)}
          placeholder="예: 난바 인근 호텔"
          autoFocus={!isTouch}
        />
        <p className="text-xs text-fg-subtle mt-1">
          선택사항. 동선의 기준점이 돼요. 보통은 숙소 주소를 적어요.
        </p>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-fg-muted underline-offset-2 hover:underline"
          >
            {skipped ? '나중에 정하기로 설정됨' : '나중에 정하기'}
          </button>
          {skipped && !basecamp.trim() && (
            <span className="text-xs text-fg-subtle">여행을 만든 뒤 설정에서 추가할 수 있어요.</span>
          )}
        </div>
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

function Step5({
  summary,
  basecampSkipped,
  onEdit,
}: {
  summary: { title: string; startDate: string; endDate: string; region: string; basecamp: string; currency: CurrencyCode }
  basecampSkipped: boolean
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
          value={
            summary.startDate || summary.endDate
              ? `${summary.startDate || '?'} – ${summary.endDate || '?'}`
              : '미정'
          }
          onEdit={() => onEdit(2)}
        />
        <SummaryEditRow
          label="지역"
          value={summary.region || '미설정'}
          onEdit={() => onEdit(3)}
        />
        <SummaryEditRow
          label="베이스캠프"
          value={
            summary.basecamp.trim()
              ? summary.basecamp
              : basecampSkipped
                ? '나중에 정하기'
                : '미설정'
          }
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
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg-elevated">
      <dt className="text-xs text-fg-muted w-20 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-fg flex-1 min-w-0 truncate">{value}</dd>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-accent hover:underline underline-offset-2"
      >
        수정
      </button>
    </div>
  )
}
