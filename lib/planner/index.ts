import { scoreItems, type ScoredItem } from './score'
import { planRoute } from './route'
import type { DraftPlan, PlannerConstraints, PlannerInput, UnplacedItem } from './types'

export type {
  DraftPlan,
  DraftStop,
  UnplacedItem,
  PlannerInput,
  PlannerTrip,
  PlannerConstraints,
  BudgetSummary,
} from './types'
export { scoreItems, buildCategorySignals } from './score'
export { planRoute, listDays } from './route'

function isMustInclude(s: ScoredItem): boolean {
  return s.item.trip_priority === '확정'
}

/**
 * 예산 상한으로 라우팅 대상(eligible)을 추린다.
 * "반드시"(확정)는 예산과 무관하게 항상 포함 — must-include 우선. 선택 항목은
 * 점수순으로 누적 예산이 상한을 넘지 않는 선까지만 포함하고, 넘친 항목은 사유와 함께 제외한다.
 */
function selectByBudget(
  scored: ScoredItem[],
  budgetCap: number | null | undefined,
): { eligible: ScoredItem[]; excluded: UnplacedItem[] } {
  if (budgetCap == null) return { eligible: scored, excluded: [] }

  const must = scored.filter(isMustInclude)
  const optional = scored.filter((s) => !isMustInclude(s)) // scoreItems 가 이미 점수순 정렬

  let running = must.reduce((sum, s) => sum + (s.item.budget ?? 0), 0)
  const eligible = [...must]
  const excluded: UnplacedItem[] = []

  for (const s of optional) {
    const cost = s.item.budget ?? 0
    if (running + cost <= budgetCap) {
      eligible.push(s)
      running += cost
    } else {
      excluded.push({
        itemId: s.item.id,
        kind: 'budget',
        reason: cost > 0 ? `예산 한도로 제외 (이 항목 ${cost.toLocaleString()})` : '예산 한도로 제외',
      })
    }
  }
  return { eligible, excluded }
}

/**
 * 내 후보 더미 → 일자별 초안(#262 v1) + 개인 제약(#263).
 *
 * - 결정 이력(사유 #259·만족도 #264)을 카테고리 가중으로 소비(루프 닫힘).
 * - 동선·영업시간·휴무 제약 충족, 위반 슬롯은 배치 안 함.
 * - 제약(#263): "반드시"(확정) 100% 시도, 예산 상한 초과 선택 항목은 사유와 함께 제외.
 * - 못 넣은 항목은 kind 와 이유로 설명(조용히 누락 금지). 외부 장소·자동 확정 없음.
 */
export function generateDraft(input: PlannerInput, constraints: PlannerConstraints = {}): DraftPlan {
  const scored = scoreItems(input.items)
  const mustTotal = scored.filter(isMustInclude).length

  const { eligible, excluded } = selectByBudget(scored, constraints.budgetCap)
  const routed = planRoute(eligible, input.trip)

  const byId = new Map(input.items.map((i) => [i.id, i]))
  const total = routed.stops.reduce((sum, s) => sum + (byId.get(s.itemId)?.budget ?? 0), 0)
  const cap = constraints.budgetCap ?? null

  const placedMust = routed.stops.filter((s) => byId.get(s.itemId)?.trip_priority === '확정').length

  return {
    stops: routed.stops,
    unplaced: [...routed.unplaced, ...excluded],
    budget: { cap, total, over: cap != null ? Math.max(0, total - cap) : 0 },
    mustInclude: { total: mustTotal, placed: placedMust },
  }
}
