// items API 의 신규 구조 필드 검증 (#260). 두 라우트(POST/PATCH)가 공유한다.

const HHMM = /^\d{2}:\d{2}$/

export function isValidOpeningHours(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.open === 'string' && HHMM.test(v.open) && typeof v.close === 'string' && HHMM.test(v.close)
}

export function isValidClosedDays(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.every((d) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
}
