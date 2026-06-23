import type { TripItem } from '@/types'

export interface ScheduleWarning {
  kind: 'last-entry' | 'reservation-deadline' | 'closed-day' | 'outside-hours'
  message: string
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

/** YYYY-MM-DD → 요일 인덱스(0=일..6=토). UTC 기준(일정 뷰의 날짜 표기와 일치). */
function weekdayOf(dateStr: string): number | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * 항목의 시간/예약 위반을 계산한다 (#261). 값이 없으면 경고도 없다(오탐 방지).
 * todayKey 는 로컬 기준 YYYY-MM-DD.
 *
 * - last-entry: 계획 시작 시각이 마지막 입장 시각보다 늦으면 경고.
 * - reservation-deadline: 예약 마감일이 지났는데 예약완료가 아니면 경고.
 */
export function getScheduleWarnings(item: TripItem, todayKey: string): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = []

  if (item.time_start && item.last_entry_time && item.time_start > item.last_entry_time) {
    warnings.push({
      kind: 'last-entry',
      message: `마지막 입장(${item.last_entry_time}) 이후 도착 예정`,
    })
  }

  if (
    item.reservation_deadline &&
    item.reservation_status !== '예약완료' &&
    item.reservation_deadline < todayKey
  ) {
    warnings.push({
      kind: 'reservation-deadline',
      message: `예약 마감(${item.reservation_deadline}) 지남`,
    })
  }

  // 휴무일 방문 — 정보(closed_days)가 있을 때만, 없으면 경고 없음(오탐 방지).
  if (item.date && item.closed_days && item.closed_days.length > 0) {
    const wd = weekdayOf(item.date)
    if (wd != null && item.closed_days.includes(wd)) {
      warnings.push({ kind: 'closed-day', message: `휴무일(${WEEKDAY_LABELS[wd]}) 방문 예정` })
    }
  }

  // 영업시간 밖 방문 — opening_hours 가 있을 때만.
  if (item.time_start && item.opening_hours?.open && item.opening_hours?.close) {
    const { open, close } = item.opening_hours
    if (item.time_start < open || item.time_start > close) {
      warnings.push({ kind: 'outside-hours', message: `영업시간(${open}-${close}) 밖 방문` })
    }
  }

  return warnings
}
