'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { estimateStrength, STRENGTH_LABEL, type StrengthResult } from '@/lib/passwordStrength'

interface Props {
  password: string
}

const BAR_COLOR: Record<StrengthResult['score'], string> = {
  0: 'bg-critical-fg',
  1: 'bg-critical-fg',
  2: 'bg-warning-fg',
  3: 'bg-success-fg',
  4: 'bg-success-fg',
}

/**
 * 비밀번호 강도 미터. zxcvbn-ts 를 동적 로드해 점수(0-4)·경고·제안을 보여준다.
 * 가입·비밀번호 재설정에서 PasswordInput 아래에 둔다(로그인에는 쓰지 않는다).
 */
export default function PasswordStrengthMeter({ password }: Props) {
  const [result, setResult] = useState<StrengthResult | null>(null)

  useEffect(() => {
    if (!password) {
      setResult(null)
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      estimateStrength(password)
        .then((r) => {
          if (!cancelled) setResult(r)
        })
        .catch(() => {
          /* 동적 로드 실패 시 미터만 생략(가입 자체는 서버 검증으로 보호) */
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [password])

  if (!password || !result) return null

  const tip = result.score < 3 ? '더 길게 쓰거나 추측하기 어려운 단어 조합을 써보세요.' : ''

  return (
    <div className="mt-1.5" aria-live="polite">
      <div className="flex gap-1" role="presentation">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= result.score - 1 ? BAR_COLOR[result.score] : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-fg-subtle">
        비밀번호 강도: <span className="font-medium text-fg-muted">{STRENGTH_LABEL[result.score]}</span>
        {tip ? ` · ${tip}` : ''}
      </p>
    </div>
  )
}
