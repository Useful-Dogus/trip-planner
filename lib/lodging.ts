import type { TripItem } from '@/types'

const LODGING_CATEGORY = '숙박' as const

function isLodging(item: TripItem): boolean {
  return item.category === LODGING_CATEGORY
}

function isStayItem(item: TripItem): boolean {
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
