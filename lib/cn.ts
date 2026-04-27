/**
 * 가벼운 className merger.
 * - falsy(null/false/undefined/'') 제거 후 공백으로 join.
 * - 외부 의존성을 늘리지 않기 위해 clsx 미사용.
 */
export type ClassValue = string | number | null | false | undefined | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  for (const v of inputs) {
    if (!v) continue
    if (Array.isArray(v)) {
      const inner = cn(...v)
      if (inner) out.push(inner)
    } else {
      out.push(String(v))
    }
  }
  return out.join(' ')
}
