import type { TripItem } from '@/types'

export interface PlannerTrip {
  startDate: string | null
  endDate: string | null
  centerLat: number | null
  centerLng: number | null
}

export interface PlannerInput {
  items: TripItem[]
  trip: PlannerTrip
}

/** 배치된 한 스톱(초안). 자동 확정이 아니라 제안일 뿐이다. */
export interface DraftStop {
  itemId: string
  date: string // YYYY-MM-DD
  time_start: string // HH:MM (추천 시각)
  /** 왜 여기에 — 루프 신호 설명 포함(루프 닫힘 검증용). */
  reasons: string[]
}

/** 배치하지 못한 후보 + 이유. 조용히 누락하지 않는다(#263). */
export interface UnplacedItem {
  itemId: string
  reason: string
  /**
   * must-include: 확정("반드시")인데 자리를 못 잡음 — 제약 불충족(가장 눈에 띄게).
   * budget: 예산 한도로 제외.
   * closed: 여행 기간 내내 휴무.
   * fit: 남은 시간/동선에 자리 없음.
   */
  kind: 'must-include' | 'budget' | 'closed' | 'fit'
}

/** 개인 제약(#263). */
export interface PlannerConstraints {
  /** 예산 상한(trip 통화). null/undefined 면 제약 없음. */
  budgetCap?: number | null
}

export interface BudgetSummary {
  cap: number | null
  /** 배치된 스톱들의 예산 합. */
  total: number
  /** cap 초과분(없으면 0). */
  over: number
}

export interface DraftPlan {
  stops: DraftStop[]
  unplaced: UnplacedItem[]
  budget: BudgetSummary
  /** 확정("반드시") 항목 중 배치에 성공/실패한 수 — 제약 충족 검증용. */
  mustInclude: { total: number; placed: number }
}

export type { TripItem }
