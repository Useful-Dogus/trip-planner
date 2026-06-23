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

/** 배치하지 못한 후보 + 이유. 조용히 누락하지 않는다. */
export interface UnplacedItem {
  itemId: string
  reason: string
}

export interface DraftPlan {
  stops: DraftStop[]
  unplaced: UnplacedItem[]
}

export type { TripItem }
