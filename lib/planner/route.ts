import { haversineKm, estimateTravelMinutes } from '@/lib/distance'
import type { ScoredItem } from './score'
import type { DraftStop, PlannerTrip, UnplacedItem } from './types'

/** planRoute 산출(예산·must-include 요약은 generateDraft 가 덧붙인다). */
export interface RouteResult {
  stops: DraftStop[]
  unplaced: UnplacedItem[]
}

const DAY_START_MIN = 9 * 60 // 09:00
const DAY_END_MIN = 21 * 60 // 21:00
const VISIT_MIN = 90 // 한 스톱 체류 가정(분)

function toMin(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** YYYY-MM-DD 범위를 일자 배열로. start>end 또는 누락이면 빈 배열. */
export function listDays(start: string | null, end: string | null): string[] {
  if (!start || !end || start > end) return []
  const days: string[] = []
  const [sy, sm, sd] = start.split('-').map(Number)
  const cursor = new Date(Date.UTC(sy, sm - 1, sd))
  const endDate = end
  // 안전 상한(과도 범위 방지)
  for (let i = 0; i < 366; i++) {
    const key = cursor.toISOString().slice(0, 10)
    days.push(key)
    if (key >= endDate) break
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

interface Coord {
  lat: number
  lng: number
}

function coordOf(item: ScoredItem['item']): Coord | null {
  return item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null
}

/**
 * 점수순 greedy + 일자별 시계 진행으로 초안을 만든다.
 * 영업시간·휴무·마지막 입장을 어기는 슬롯은 배치하지 않는다(수용 기준: 위반 0).
 */
export function planRoute(
  scored: ScoredItem[],
  trip: PlannerTrip,
  opts: { days?: string[] } = {},
): RouteResult {
  const days = opts.days ?? listDays(trip.startDate, trip.endDate)
  const anchor: Coord | null =
    trip.centerLat != null && trip.centerLng != null
      ? { lat: trip.centerLat, lng: trip.centerLng }
      : null

  if (days.length === 0) {
    return {
      stops: [],
      unplaced: scored.map((s) => ({
        itemId: s.item.id,
        reason: '여행 날짜 범위가 설정되지 않았어요',
        kind: 'fit' as const,
      })),
    }
  }

  const remaining = new Set(scored.map((s) => s.item.id))
  const byId = new Map(scored.map((s) => [s.item.id, s]))
  const stops: DraftStop[] = []

  for (const date of days) {
    const weekday = weekdayOf(date)
    let clock = DAY_START_MIN
    let pos: Coord | null = anchor

    // 하루를 채운다: 매 스텝에서 "지금 시각에 넣을 수 있는" 최고 점수 항목을 고른다.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let best: { id: string; arrival: number; travel: number } | null = null

      for (const id of Array.from(remaining)) {
        const s = byId.get(id)!
        const item = s.item

        // 휴무 요일이면 이 날 배치 불가.
        if (item.closed_days && item.closed_days.includes(weekday)) continue

        const c = coordOf(item)
        const travel = pos && c ? estimateTravelMinutes(haversineKm(pos, c)) : 0
        let arrival = clock + travel

        // 영업시간: 개점 전 도착이면 개점까지 대기.
        const open = item.opening_hours?.open ? toMin(item.opening_hours.open) : null
        const close = item.opening_hours?.close ? toMin(item.opening_hours.close) : null
        const lastEntry = item.last_entry_time ? toMin(item.last_entry_time) : null
        if (open != null && arrival < open) arrival = open

        // 제약 충족 검사(어기면 후보 제외 → 위반 0 보장).
        if (close != null && arrival > close) continue
        if (lastEntry != null && arrival > lastEntry) continue
        if (arrival + VISIT_MIN > DAY_END_MIN) continue
        if (close != null && arrival + VISIT_MIN > close) continue

        // 점수 우선, 동점이면 더 빨리 도착(=동선 효율).
        if (
          !best ||
          s.score > byId.get(best.id)!.score ||
          (s.score === byId.get(best.id)!.score && arrival < best.arrival)
        ) {
          best = { id, arrival, travel }
        }
      }

      if (!best) break // 이 날 더 넣을 수 없음

      const s = byId.get(best.id)!
      const reasons = [...s.signalReasons]
      if (best.travel > 0) reasons.push(`이동 약 ${best.travel}분`)
      stops.push({ itemId: best.id, date, time_start: toHHMM(best.arrival), reasons })

      clock = best.arrival + VISIT_MIN
      pos = coordOf(s.item) ?? pos
      remaining.delete(best.id)
    }
  }

  const unplaced: UnplacedItem[] = Array.from(remaining).map((id) => {
    const item = byId.get(id)!.item
    const closedAll = !!(
      item.closed_days && item.closed_days.length > 0 &&
      days.every((d) => item.closed_days!.includes(weekdayOf(d)))
    )
    const mustInclude = item.trip_priority === '확정'
    const reason = closedAll
      ? '여행 기간 내내 휴무라 배치하지 못했어요'
      : mustInclude
        ? '확정인데 자리를 못 잡았어요 — 동선·시간을 확인해 주세요'
        : '남은 시간/동선에 맞는 자리가 없어 빠졌어요'
    // 확정("반드시")은 못 넣은 이유가 무엇이든 제약 불충족으로 가장 눈에 띄게 표시한다.
    const kind: UnplacedItem['kind'] = mustInclude ? 'must-include' : closedAll ? 'closed' : 'fit'
    return { itemId: id, reason, kind }
  })

  return { stops, unplaced }
}
