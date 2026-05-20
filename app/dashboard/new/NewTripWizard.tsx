'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { useToast } from '@/components/UI/Toast'
import { cn } from '@/lib/cn'

type Step = 1 | 2 | 3 | 4

const STEP_TITLES: Record<Step, string> = {
  1: '여행 이름',
  2: '기간',
  3: '지역',
  4: '베이스캠프',
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
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  function prev() {
    if (step > 1) setStep((s) => (s - 1) as Step)
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
          {[1, 2, 3, 4].map((n) => {
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
                <div className="flex-1 min-w-0">
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
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
          )}
          {step === 3 && (
            <Step3 region={region} setRegion={setRegion} />
          )}
          {step === 4 && (
            <Step4
              basecamp={basecamp}
              setBasecamp={setBasecamp}
              summary={{ title, startDate, endDate, region }}
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
          {step < 4 ? (
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
  return (
    <div className="space-y-3">
      <Input
        label="여행 이름"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 뉴욕 여름 휴가"
        autoFocus
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
  return (
    <div className="space-y-3">
      <Input
        label="지역"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="예: 미국 뉴욕"
        autoFocus
      />
      <p className="text-xs text-fg-subtle">국가·도시·테마 등 자유롭게.</p>
    </div>
  )
}

function Step4({
  basecamp,
  setBasecamp,
  summary,
}: {
  basecamp: string
  setBasecamp: (v: string) => void
  summary: { title: string; startDate: string; endDate: string; region: string }
}) {
  return (
    <div className="space-y-4">
      <Input
        label="베이스캠프 (숙소)"
        value={basecamp}
        onChange={(e) => setBasecamp(e.target.value)}
        placeholder="예: 맨해튼 미드타운 호텔"
        autoFocus
      />
      <p className="text-xs text-fg-subtle">선택사항. 동선의 기준점이 돼요.</p>
      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">미리 보기</p>
        <dl className="text-sm space-y-1">
          <SummaryRow label="이름" value={summary.title} />
          <SummaryRow
            label="기간"
            value={
              summary.startDate || summary.endDate
                ? `${summary.startDate || '?'} – ${summary.endDate || '?'}`
                : '미정'
            }
          />
          <SummaryRow label="지역" value={summary.region || '미설정'} />
        </dl>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg truncate">{value}</dd>
    </div>
  )
}
