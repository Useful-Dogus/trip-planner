import { scoreItems } from './score'
import { planRoute } from './route'
import type { DraftPlan, PlannerInput } from './types'

export type { DraftPlan, DraftStop, UnplacedItem, PlannerInput, PlannerTrip } from './types'
export { scoreItems, buildCategorySignals } from './score'
export { planRoute, listDays } from './route'

/**
 * 내 후보 더미 → 일자별 초안(#262 v1, 규칙 기반).
 *
 * - 입력: 내 후보(제외 제외)·좌표·영업시간·휴무·날짜 범위·basecamp
 *   + 과거 탈락 사유(#259)·만족도(#264) → 카테고리 단위 가중으로 소비(루프 닫힘).
 * - 동선(이동시간 최소) + 영업시간/휴무 충족 + 결정 이력 가중으로 일자 배치.
 * - 외부 장소 주입 없음. 자동 확정 없음(초안일 뿐).
 */
export function generateDraft(input: PlannerInput): DraftPlan {
  const scored = scoreItems(input.items)
  return planRoute(scored, input.trip)
}
