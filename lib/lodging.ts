import type { TripItem } from '@/types'

const LODGING_CATEGORY = '숙박' as const

function isLodging(item: TripItem): boolean {
  return item.category === LODGING_CATEGORY
}

export function isStayItem(item: TripItem): boolean {
  return (
    isLodging(item) &&
    !!item.date &&
    !!item.end_date &&
    item.end_date >= item.date
  )
}

export function getLodgingForDate(date: string, items: TripItem[]): TripItem | null {
  let best: TripItem | null = null
  for (const item of items) {
    if (!isStayItem(item)) continue
    if (item.date! <= date && date <= item.end_date!) {
      if (!best || best.date! < item.date!) best = item
    }
  }
  return best
}

export function isLodgingMidStay(item: TripItem, date: string): boolean {
  if (!isStayItem(item) || item.end_date === item.date) return false
  return date > item.date! && date < item.end_date!
}

// 그 날 아침 깨어난 숙소 (체크인일에는 해당 없음 — 그 전날부터 묵었어야 함)
export function getStartLodging(date: string, items: TripItem[]): TripItem | null {
  let best: TripItem | null = null
  for (const item of items) {
    if (!isStayItem(item)) continue
    if (item.date! < date && date <= item.end_date!) {
      if (!best || best.date! < item.date!) best = item
    }
  }
  return best
}

// 그 날 밤 잘 숙소 (체크아웃일에는 해당 없음 — 그 날 떠나기 때문)
export function getEndLodging(date: string, items: TripItem[]): TripItem | null {
  let best: TripItem | null = null
  for (const item of items) {
    if (!isStayItem(item)) continue
    if (item.date! <= date && date < item.end_date!) {
      if (!best || best.date! < item.date!) best = item
    }
  }
  return best
}
