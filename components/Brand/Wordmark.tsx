import { Route } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * 제품명 단일 소스. 이름 변경 시 이 상수 한 곳만 바꾸면 모든 표면에 반영된다.
 * (브랜드 정본: docs/brand.md — 이슈 #231)
 */
export const PRODUCT_NAME = 'Waypost'

/**
 * 제품 이익 한 문장 — "왜 쓰는가 = 무엇을 얻는가" (이슈 #258).
 * 기능 나열·협업 강조 대신, 사용자가 얻는 결과만 말한다.
 * 정본 기준 문장: "내가 모은 후보 더미를, 버리지 않고 추려서,
 * 현장에서 안 깨지는 하루 일정으로 만든다." 를 표면용으로 압축한 것.
 */
export const PRODUCT_TAGLINE = '모아둔 후보를 추려, 현장에서 안 깨지는 하루 일정으로'

type WordmarkSize = 'sm' | 'md' | 'lg'

const SIZES: Record<WordmarkSize, { box: string; icon: string; text: string; gap: string }> = {
  sm: { box: 'size-6', icon: 'size-3.5', text: 'text-base', gap: 'gap-1.5' },
  md: { box: 'size-8', icon: 'size-[18px]', text: 'text-xl', gap: 'gap-2' },
  lg: { box: 'size-11', icon: 'size-6', text: 'text-2xl', gap: 'gap-2.5' },
}

/**
 * 동선·이정표 모티프(lucide `route`)를 브라스 원형 테두리 안에 둔 브랜드 마크.
 * 아이콘 단독으로 쓸 때는 `aria-label` 을 부모가 제공한다.
 */
export function BrandMark({ size = 'md', className }: { size?: WordmarkSize; className?: string }) {
  const s = SIZES[size]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border-2 border-accent text-accent shrink-0',
        s.box,
        className,
      )}
    >
      <Route className={s.icon} aria-hidden="true" />
    </span>
  )
}

interface WordmarkProps {
  size?: WordmarkSize
  /** 마크만 표시하고 텍스트는 숨김 (아이콘 단독). */
  iconOnly?: boolean
  className?: string
}

/**
 * Waypost 워드마크: 마크 + 제품명. 헤더·로그인·빈 상태 등 브랜드 노출 표면에 사용.
 */
export default function Wordmark({ size = 'md', iconOnly = false, className }: WordmarkProps) {
  const s = SIZES[size]
  return (
    <span
      className={cn('inline-flex items-center', s.gap, className)}
      aria-label={iconOnly ? PRODUCT_NAME : undefined}
    >
      <BrandMark size={size} />
      {!iconOnly && (
        <span className={cn('font-semibold tracking-tight text-fg', s.text)}>{PRODUCT_NAME}</span>
      )}
    </span>
  )
}
