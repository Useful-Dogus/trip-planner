import type { TripItem } from '@/types'

export interface ScheduleWarning {
  kind: 'last-entry' | 'reservation-deadline'
  message: string
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

  return warnings
}
