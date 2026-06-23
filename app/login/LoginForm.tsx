'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { clearAppCache } from '@/lib/clearAppCache'
import { ErrorBanner, PasswordInput } from '@/components/UI'
import { useToast } from '@/components/UI/Toast'
import { BrandMark, PRODUCT_NAME, PRODUCT_TAGLINE } from '@/components/Brand/Wordmark'
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
        <div className="flex flex-col items-center text-center mb-8">
          <BrandMark size="lg" className="mb-3" />
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{PRODUCT_NAME}</h1>
          <p className="text-sm text-fg-subtle mt-1">{PRODUCT_TAGLINE}</p>
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

          <PasswordInput
            label="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

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
