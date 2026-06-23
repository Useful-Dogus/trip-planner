'use client'

import { useId, useState } from 'react'
import type { InputHTMLAttributes, KeyboardEvent, FocusEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 라벨 텍스트 (예: "비밀번호", "새 비밀번호 (8자 이상)") */
  label: string
}

/**
 * 가입·로그인·비밀번호 재설정 공용 비밀번호 입력.
 * - 보기/숨기기 토글: 입력값을 사용자가 직접 확인해 오타를 입력 시점에 막는다.
 *   (구형 "비밀번호 확인란" 안티패턴 대신 — 마찰 없이 오타를 사용자가 본다.)
 * - Caps Lock 경고: 대문자 잠금으로 인한 로그인 실패를 예방.
 * - 토글 클릭 시 입력 포커스를 유지(onMouseDown preventDefault)하되, 키보드로도 도달 가능.
 */
export function PasswordInput({ label, className, id: idProp, ...rest }: PasswordInputProps) {
  const reactId = useId()
  const id = idProp ?? reactId
  const [visible, setVisible] = useState(false)
  const [capsOn, setCapsOn] = useState(false)

  function syncCaps(e: KeyboardEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>) {
    const getState = (e as KeyboardEvent<HTMLInputElement>).getModifierState
    if (typeof getState === 'function') {
      setCapsOn(getState.call(e, 'CapsLock'))
    }
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          onKeyDown={syncCaps}
          onKeyUp={syncCaps}
          onBlur={() => setCapsOn(false)}
          className={cn(
            'w-full border border-border rounded-xl px-3.5 py-2.5 pr-11 text-fg text-sm',
            'focus:outline-none focus:ring-2 focus-visible:outline-accent focus:border-transparent transition-shadow',
            className,
          )}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-fg-subtle hover:text-fg rounded-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent transition-colors"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {capsOn && (
        <p className="mt-1 text-xs text-warning-fg" role="status">
          Caps Lock 이 켜져 있습니다.
        </p>
      )}
    </div>
  )
}
