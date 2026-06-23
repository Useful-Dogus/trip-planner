'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, CheckCircle2, Sparkles, TriangleAlert } from 'lucide-react'
import type { TripItem } from '@/types'
import { generateDraft, type DraftStop, type PlannerTrip, type UnplacedItem } from '@/lib/planner'
import { CATEGORY_META } from '@/lib/itemOptions'
import { formatBudget, normalizeCurrency } from '@/lib/currency'
import Sheet from '@/components/UI/Sheet'
import Button from '@/components/UI/Button'

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${m}월 ${d}일 (${days[dt.getUTCDay()]})`
}

const UNPLACED_GROUPS: { kind: UnplacedItem['kind']; label: string; tone: 'warn' | 'muted' }[] = [
  { kind: 'must-include', label: '반드시(확정)인데 못 넣음 — 확인 필요', tone: 'warn' },
  { kind: 'budget', label: '예산 한도로 제외', tone: 'muted' },
  { kind: 'closed', label: '기간 내내 휴무', tone: 'muted' },
  { kind: 'fit', label: '자리가 없어 빠짐', tone: 'muted' },
]

interface DraftPlanSheetProps {
  open: boolean
  onClose: () => void
  items: TripItem[]
  trip: PlannerTrip
  currency: string
  onApply: (stops: DraftStop[]) => Promise<void>
}

export default function DraftPlanSheet({ open, onClose, items, trip, currency, onApply }: DraftPlanSheetProps) {
  const cur = normalizeCurrency(currency)
  const [budgetInput, setBudgetInput] = useState('')
  const budgetCap = budgetInput.trim() ? Number(budgetInput.replace(/[^0-9]/g, '')) : null

  const plan = useMemo(
    () => generateDraft({ items, trip }, { budgetCap }),
    [items, trip, budgetCap],
  )
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (open) setSelected(new Set(plan.stops.map((s) => s.itemId)))
  }, [open, plan])

  const byDate = useMemo(() => {
    const map = new Map<string, DraftStop[]>()
    for (const s of plan.stops) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    }
    return Array.from(map.entries())
  }, [plan])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleApply() {
    const stops = plan.stops.filter((s) => selected.has(s.itemId))
    if (stops.length === 0) return
    setApplying(true)
    try {
      await onApply(stops)
      onClose()
    } finally {
      setApplying(false)
    }
  }

  const mustOk = plan.mustInclude.total > 0 && plan.mustInclude.placed === plan.mustInclude.total
  const mustFailed = plan.mustInclude.total - plan.mustInclude.placed

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-fg-subtle">초안일 뿐 — 수락해도 확정 상태는 그대로예요</span>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onClose} disabled={applying}>
          닫기
        </Button>
        <Button onClick={handleApply} disabled={applying || selected.size === 0}>
          {applying ? '적용 중…' : `선택 ${selected.size}개 일정에 넣기`}
        </Button>
      </div>
    </div>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="자동 일정 초안"
      description="내 후보·결정 이력으로 만든 제안이에요. 받을 것만 골라 넣으세요."
      footer={footer}
    >
      <div className="space-y-5 px-1 py-1">
        {/* 예산 제약 입력 + 합계 (#263) */}
        <div className="rounded-lg border border-border bg-bg-subtle p-3 space-y-2">
          <label className="flex items-center justify-between gap-3 text-xs font-medium text-fg">
            예산 한도 <span className="font-normal text-fg-subtle">(선택)</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="예: 300000"
              className="w-32 rounded border border-border-strong bg-bg-elevated px-2 py-1 text-right text-sm text-fg outline-none focus:ring-2 focus:ring-border-strong"
            />
          </label>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-muted">초안 예산 합계</span>
            <span className={`tabular-nums font-medium ${plan.budget.over > 0 ? 'text-warning-fg' : 'text-fg'}`}>
              {formatBudget(plan.budget.total, cur)}
              {plan.budget.cap != null && ` / ${formatBudget(plan.budget.cap, cur)}`}
            </span>
          </div>
          {plan.budget.over > 0 && (
            <p className="flex items-center gap-1 text-[11px] text-warning-fg">
              <TriangleAlert className="size-3 flex-shrink-0" aria-hidden="true" />
              확정(반드시) 항목만으로 한도를 {formatBudget(plan.budget.over, cur)} 초과해요.
            </p>
          )}
        </div>

        {/* 반드시(확정) 충족 상태 */}
        {plan.mustInclude.total > 0 && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              mustOk
                ? 'border-success-border bg-success-bg text-success-fg'
                : 'border-warning-border bg-warning-bg text-warning-fg'
            }`}
          >
            {mustOk ? (
              <CheckCircle2 className="size-4 flex-shrink-0" aria-hidden="true" />
            ) : (
              <TriangleAlert className="size-4 flex-shrink-0" aria-hidden="true" />
            )}
            {mustOk
              ? `반드시 갈 곳 ${plan.mustInclude.total}곳 모두 넣었어요`
              : `반드시 갈 곳 ${mustFailed}곳을 못 넣었어요 — 아래 사유 확인`}
          </div>
        )}

        {plan.stops.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-fg-muted">
            <CalendarRange className="size-8 text-fg-subtle" aria-hidden="true" />
            배치할 수 있는 후보가 없어요. 여행 날짜·후보를 먼저 확인해 주세요.
          </div>
        ) : (
          byDate.map(([date, stops]) => (
            <section key={date}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                {formatDate(date)}
              </h3>
              <ul className="space-y-1.5">
                {stops.map((stop) => {
                  const item = byId.get(stop.itemId)
                  if (!item) return null
                  const Icon = CATEGORY_META[item.category]?.Icon
                  const checked = selected.has(stop.itemId)
                  return (
                    <li key={stop.itemId}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-bg-elevated p-2.5 hover:border-border-strong">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(stop.itemId)}
                          className="mt-0.5 size-4 accent-accent"
                          aria-label={`${item.name} 초안 선택`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold tabular-nums text-accent">
                              {stop.time_start}
                            </span>
                            {Icon ? <Icon size={12} className="flex-shrink-0 text-fg-muted" aria-hidden="true" /> : null}
                            <span className="truncate text-sm font-medium text-fg">{item.name}</span>
                          </span>
                          {stop.reasons.length > 0 && (
                            <span className="mt-1 flex flex-wrap gap-1">
                              {stop.reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-bg-subtle px-1.5 py-0.5 text-[10px] text-fg-muted"
                                >
                                  <Sparkles className="size-2.5" aria-hidden="true" />
                                  {r}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}

        {/* 못 넣은 후보 — kind 별 그룹, 조용히 누락하지 않고 설명 (#263) */}
        {plan.unplaced.length > 0 &&
          UNPLACED_GROUPS.map(({ kind, label, tone }) => {
            const group = plan.unplaced.filter((u) => u.kind === kind)
            if (group.length === 0) return null
            return (
              <section key={kind}>
                <h3
                  className={`mb-2 text-xs font-semibold uppercase tracking-wider ${
                    tone === 'warn' ? 'text-warning-fg' : 'text-fg-subtle'
                  }`}
                >
                  {label} ({group.length})
                </h3>
                <ul className="space-y-1">
                  {group.map((u) => {
                    const item = byId.get(u.itemId)
                    if (!item) return null
                    return (
                      <li key={u.itemId} className="flex items-center justify-between gap-2 px-1 text-xs">
                        <span className={`truncate ${tone === 'warn' ? 'text-fg' : 'text-fg-muted'}`}>
                          {item.name}
                        </span>
                        <span className="flex-shrink-0 text-fg-subtle">{u.reason}</span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
      </div>
    </Sheet>
  )
}
