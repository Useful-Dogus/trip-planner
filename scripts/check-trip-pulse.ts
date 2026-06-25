import assert from 'node:assert/strict'
import {
  getTripPulseMetrics,
  getTripPulseSummary,
  type TripPulseSurface,
} from '../lib/tripPulse'
import type { TripItem, TripPriority } from '../types'

const paths = {
  list: '/trip/t/list',
  map: '/trip/t/map',
  schedule: '/trip/t/schedule',
}

function item(
  id: string,
  tripPriority: TripPriority,
  overrides: Partial<TripItem> = {},
): TripItem {
  return {
    id,
    name: `Place ${id}`,
    category: '명소',
    trip_priority: tripPriority,
    links: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function title(surface: TripPulseSurface, items: TripItem[]): string {
  return getTripPulseSummary(surface, items, paths).title
}

const empty: TripItem[] = []
assert.equal(title('list', empty), '아직 첫 장소를 기다리고 있어요')
assert.equal(title('map', empty), '아직 지도에 펼칠 장소를 기다리고 있어요')
assert.equal(title('schedule', empty), '일정에 넣을 장소를 기다리고 있어요')

const wantItems = [
  item('w1', '가고 싶음'),
  item('w2', '가고 싶음'),
  item('w3', '가고 싶음'),
]
assert.equal(title('list', wantItems), '가고 싶은 곳이 3곳 모였어요')

const candidateItems = [item('r1', '검토 필요'), item('t1', '시간 되면')]
assert.equal(title('list', candidateItems), '후보 2곳을 살펴보고 있어요')

const excludedOnly = [item('x1', '제외'), item('x2', '제외')]
assert.equal(title('list', excludedOnly), '아직 첫 장소를 기다리고 있어요')

const confirmed = [item('c1', '확정')]
assert.equal(title('list', confirmed), '1곳이 이번 여행에 들어갔어요')

const mapped = [
  item('m1', '검토 필요', { lat: 37.5, lng: 127.0 }),
  item('m2', '가고 싶음', { lat: 37.6, lng: 127.1 }),
]
assert.equal(title('map', mapped), '지도에 2곳을 펼쳐봤어요')

const mappedConfirmed = [
  item('mc1', '확정', { lat: 37.5, lng: 127.0 }),
  item('mc2', '확정', { lat: 37.6, lng: 127.1 }),
  item('mc3', '확정'),
]
assert.equal(
  title('map', mappedConfirmed),
  '이번 여행에 들어간 2곳을 지도에서 보고 있어요',
)

const scheduledOne = [item('s1', '확정', { date: '2026-07-01' })]
assert.equal(title('schedule', scheduledOne), '1곳이 일정에 들어갔어요')

const scheduledDays = [
  item('d1', '확정', { date: '2026-07-01' }),
  item('d2', '확정', { date: '2026-07-02' }),
]
assert.equal(title('schedule', scheduledDays), '2일의 여행이 채워지고 있어요')

const undatedConfirmed = [item('u1', '확정'), item('u2', '확정')]
assert.equal(title('schedule', undatedConfirmed), '아직 날짜를 정하지 않은 곳도 있어요')

const metrics = getTripPulseMetrics([
  ...scheduledDays,
  item('x', '제외'),
  item('m', '시간 되면', { lat: 35.1, lng: 129.1 }),
])
assert.deepEqual(
  {
    total: metrics.total,
    activeTotal: metrics.activeTotal,
    mappedCount: metrics.mappedCount,
    scheduledDayCount: metrics.scheduledDayCount,
  },
  {
    total: 4,
    activeTotal: 3,
    mappedCount: 1,
    scheduledDayCount: 2,
  },
)

console.log('Trip Pulse checks passed')
