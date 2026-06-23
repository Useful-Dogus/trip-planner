import type { Category, TripItem, TripPriority } from '@/types'
import { SATISFACTION_META } from '@/lib/itemOptions'

/** 우선순위 기본 욕구 가중. '제외'는 호출 전에 걸러진다. */
const PRIORITY_WEIGHT: Record<TripPriority, number> = {
  확정: 100,
  '가고 싶음': 60,
  '시간 되면': 30,
  '검토 필요': 10,
  제외: -Infinity,
}

const SATISFACTION_MAX_ADJ = 15 // 카테고리 만족도(-1..1) → ±15
const REJECTION_PENALTY = 8 // 탈락 1건당 감점
const REJECTION_CAP = 3 // 감점 누적 상한(=최대 -24)

export interface CategorySignal {
  /** 같은 카테고리 평가 항목 만족도 평균(-1..1). 평가 없으면 0. */
  satisfaction: number
  /** 같은 카테고리에서 사유와 함께 탈락한 건수. */
  rejection: number
}

/**
 * 결정 이력(만족도 #264 · 탈락 사유 #259)을 카테고리 단위 신호로 집계한다.
 * 이게 "범용 배치기"와 "내 결정 이력 위에서 도는 플래너"를 가르는 지점이다.
 */
export function buildCategorySignals(items: TripItem[]): Map<Category, CategorySignal> {
  const satSum = new Map<Category, number>()
  const satCount = new Map<Category, number>()
  const rejCount = new Map<Category, number>()

  for (const item of items) {
    if (item.satisfaction) {
      satSum.set(item.category, (satSum.get(item.category) ?? 0) + SATISFACTION_META[item.satisfaction].weight)
      satCount.set(item.category, (satCount.get(item.category) ?? 0) + 1)
    }
    if (item.trip_priority === '제외' && item.decision_reason && item.decision_reason.trim()) {
      rejCount.set(item.category, (rejCount.get(item.category) ?? 0) + 1)
    }
  }

  const signals = new Map<Category, CategorySignal>()
  const categories = new Set<Category>(
    Array.from(satCount.keys()).concat(Array.from(rejCount.keys())),
  )
  Array.from(categories).forEach((cat) => {
    const count = satCount.get(cat) ?? 0
    signals.set(cat, {
      satisfaction: count > 0 ? (satSum.get(cat) ?? 0) / count : 0,
      rejection: rejCount.get(cat) ?? 0,
    })
  })
  return signals
}

export interface ScoredItem {
  item: TripItem
  score: number
  /** 루프 신호에서 비롯된 가감점 설명(있을 때만). */
  signalReasons: string[]
}

export function scoreItem(item: TripItem, signals: Map<Category, CategorySignal>): ScoredItem {
  const base = PRIORITY_WEIGHT[item.trip_priority] ?? 0
  const sig = signals.get(item.category)
  const signalReasons: string[] = []
  let adj = 0

  if (item.trip_priority === '확정') {
    signalReasons.push('확정 항목 우선 배치')
  }
  if (sig && sig.satisfaction > 0) {
    adj += sig.satisfaction * SATISFACTION_MAX_ADJ
    signalReasons.push(`만족도 높았던 ${item.category} 우선`)
  } else if (sig && sig.satisfaction < 0) {
    adj += sig.satisfaction * SATISFACTION_MAX_ADJ
    signalReasons.push(`만족도 낮았던 ${item.category} 후순위`)
  }
  if (sig && sig.rejection > 0) {
    adj -= Math.min(sig.rejection, REJECTION_CAP) * REJECTION_PENALTY
    signalReasons.push(`비슷한 사유로 자주 뺀 ${item.category} 후순위`)
  }

  return { item, score: base + adj, signalReasons }
}

export function scoreItems(items: TripItem[]): ScoredItem[] {
  const signals = buildCategorySignals(items)
  return items
    .filter((i) => i.trip_priority !== '제외')
    .map((i) => scoreItem(i, signals))
    .sort((a, b) => b.score - a.score)
}
