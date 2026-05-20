'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clearAppCache } from '@/lib/clearAppCache'
import { ErrorBanner } from '@/components/UI'
import { useToast } from '@/components/UI/Toast'
import type { AuthErrorCode } from '@/lib/auth-errors'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorState, setErrorState] = useState<{
    code: AuthErrorCode | 'init'
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'invalid_link') {
      setErrorState({
        code: 'init',
        message: '만료되었거나 사용된 링크입니다. 재설정 링크를 다시 받아주세요.',
      })
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorState(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      clearAppCache()
      window.location.href = '/dashboard'
      return
    }

    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      code?: AuthErrorCode
    }
    setErrorState({
      code: data.code ?? 'invalid_credentials',
      message: data.error ?? '로그인에 실패했습니다.',
    })
    setLoading(false)
  }

  async function handleResendConfirmation() {
    if (!email) return
    setResending(true)
    try {
      await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      showToast({
        type: 'success',
        message: '확인 메일을 다시 보냈어요. 메일함을 확인해주세요.',
      })
    } finally {
      setResending(false)
    }
  }

  const errorTone =
    errorState?.code === 'email_not_confirmed' ||
    errorState?.code === 'rate_limit'
      ? 'warning'
      : 'critical'

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-subtle to-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-accent-fg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fg">trip-planner</h1>
          <p className="text-sm text-fg-subtle mt-1">로그인하여 여행을 계획하세요</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-elevated rounded-2xl shadow-sm border border-border p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-3.5 py-2.5 text-fg text-sm focus:outline-none focus:ring-2 focus-visible:outline-accent focus:border-transparent transition-shadow"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wide mb-1.5">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-3.5 py-2.5 text-fg text-sm focus:outline-none focus:ring-2 focus-visible:outline-accent focus:border-transparent transition-shadow"
              autoComplete="current-password"
              required
            />
          </div>

          {errorState && (
            <ErrorBanner
              tone={errorTone}
              onDismiss={() => setErrorState(null)}
              action={
                errorState.code === 'email_not_confirmed' ? (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending || !email}
                    className="text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
                  >
                    {resending ? '재전송 중…' : '확인 메일 재전송'}
                  </button>
                ) : undefined
              }
            >
              {errorState.message}
            </ErrorBanner>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-fg rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-accent-hover active:bg-accent-hover transition-colors mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="flex items-center justify-between text-sm text-fg-subtle pt-2">
            <Link href="/signup" className="text-accent font-semibold hover:underline">
              가입하기
            </Link>
            <Link href="/forgot" className="hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
