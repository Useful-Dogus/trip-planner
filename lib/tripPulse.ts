import type { TripItem } from '@/types'

export type TripPulseSurface = 'list' | 'map' | 'schedule'

export interface TripPulseAction {
  label: string
  href: string
}

export interface TripPulseSummary {
  title: string
  action?: TripPulseAction
}

export interface TripPulsePaths {
  list: string
  map: string
  schedule: string
}

export interface TripPulseMetrics {
  total: number
  activeTotal: number
  wantCount: number
  confirmedCount: number
  reviewCount: number
  mappedCount: number
  mappedConfirmedCount: number
  scheduledConfirmedCount: number
  scheduledDayCount: number
  undatedConfirmedCount: number
}

function hasCoordinates(item: TripItem): boolean {
  return typeof item.lat === 'number' && typeof item.lng === 'number'
}

export function getTripPulseMetrics(items: TripItem[]): TripPulseMetrics {
  const scheduledDays = new Set<string>()
  const metrics: TripPulseMetrics = {
    total: items.length,
    activeTotal: 0,
    wantCount: 0,
    confirmedCount: 0,
    reviewCount: 0,
    mappedCount: 0,
    mappedConfirmedCount: 0,
    scheduledConfirmedCount: 0,
    scheduledDayCount: 0,
    undatedConfirmedCount: 0,
  }

  for (const item of items) {
    if (item.trip_priority !== '제외') metrics.activeTotal += 1
    if (item.trip_priority === '가고 싶음') metrics.wantCount += 1
    if (item.trip_priority === '검토 필요') metrics.reviewCount += 1
    if (hasCoordinates(item)) metrics.mappedCount += 1

    if (item.trip_priority !== '확정') continue

    metrics.confirmedCount += 1
    if (hasCoordinates(item)) metrics.mappedConfirmedCount += 1
    if (item.date) {
      metrics.scheduledConfirmedCount += 1
      scheduledDays.add(item.date)
    } else {
      metrics.undatedConfirmedCount += 1
    }
  }

  metrics.scheduledDayCount = scheduledDays.size
  return metrics
}

export function getTripPulseSummary(
  surface: TripPulseSurface,
  items: TripItem[],
  paths: TripPulsePaths,
): TripPulseSummary {
  const metrics = getTripPulseMetrics(items)
  switch (surface) {
    case 'list':
      return getListSummary(metrics, paths)
    case 'map':
      return getMapSummary(metrics, paths)
    case 'schedule':
      return getScheduleSummary(metrics, paths)
  }
}

function getListSummary(
  metrics: TripPulseMetrics,
  paths: TripPulsePaths,
): TripPulseSummary {
  if (metrics.scheduledConfirmedCount > 0) {
    return {
      title: `${metrics.scheduledConfirmedCount}곳이 일정에 들어갔어요`,
      action: { label: '일정에서 보기', href: paths.schedule },
    }
  }
  if (metrics.confirmedCount > 0) {
    return {
      title: `${metrics.confirmedCount}곳이 이번 여행에 들어갔어요`,
      action: { label: '지도에서 보기', href: paths.map },
    }
  }
  if (metrics.wantCount >= 3) {
    return {
      title: `가고 싶은 곳이 ${metrics.wantCount}곳 모였어요`,
      action: { label: '지도에서 보기', href: paths.map },
    }
  }
  if (metrics.activeTotal > 0) {
    return {
      title: `후보 ${metrics.activeTotal}곳을 살펴보고 있어요`,
      action: { label: '지도에서 보기', href: paths.map },
    }
  }
  return {
    title: '아직 첫 장소를 기다리고 있어요',
  }
}

function getMapSummary(
  metrics: TripPulseMetrics,
  paths: TripPulsePaths,
): TripPulseSummary {
  if (metrics.mappedConfirmedCount > 0) {
    return {
      title: `이번 여행에 들어간 ${metrics.mappedConfirmedCount}곳을 지도에서 보고 있어요`,
      action: { label: '일정에서 보기', href: paths.schedule },
    }
  }
  if (metrics.mappedCount > 0) {
    return {
      title: `지도에 ${metrics.mappedCount}곳을 펼쳐봤어요`,
      action: { label: '일정에서 보기', href: paths.schedule },
    }
  }
  return {
    title: '아직 지도에 펼칠 장소를 기다리고 있어요',
    action: { label: '목록에서 보기', href: paths.list },
  }
}

function getScheduleSummary(
  metrics: TripPulseMetrics,
  paths: TripPulsePaths,
): TripPulseSummary {
  if (metrics.scheduledDayCount >= 2) {
    return {
      title: `${metrics.scheduledDayCount}일의 여행이 채워지고 있어요`,
      action: { label: '목록에서 보기', href: paths.list },
    }
  }
  if (metrics.scheduledConfirmedCount > 0) {
    return {
      title: `${metrics.scheduledConfirmedCount}곳이 일정에 들어갔어요`,
      action: { label: '목록에서 보기', href: paths.list },
    }
  }
  if (metrics.undatedConfirmedCount > 0) {
    return {
      title: '아직 날짜를 정하지 않은 곳도 있어요',
      action: { label: '목록에서 보기', href: paths.list },
    }
  }
  return {
    title: '일정에 넣을 장소를 기다리고 있어요',
    action: { label: '목록에서 보기', href: paths.list },
  }
}
