/**
 * ISO 시각 문자열을 한국어 상대시간("3일 전")으로 변환한다.
 * created_at/updated_at 표시용(#326). 절대시각은 title 속성에 별도로 넣어 호버 시 확인.
 *
 * SSR(서버 컴포넌트)에서도 호출되므로 기준 시각을 인자로 받을 수 있게 두되,
 * 미지정 시 호출 시점 now 를 쓴다. 미래 시각이면 "방금"으로 클램프한다.
 */
export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return ''
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const diffMs = now.getTime() - then.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return '방금'

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`

  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`

  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}일 전`

  const week = Math.floor(day / 7)
  if (week < 5) return `${week}주 전`

  const month = Math.floor(day / 30)
  if (month < 12) return `${month}개월 전`

  const year = Math.floor(day / 365)
  return `${year}년 전`
}

/** 절대시각(YYYY. M. D. HH:mm) — title 속성용. */
export function formatAbsoluteTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
