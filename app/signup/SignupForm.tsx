'use client'

import Link from 'next/link'
import { useState } from 'react'
import { clearAppCache } from '@/lib/clearAppCache'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<null | { needsEmailConfirmation: boolean }>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      if (data.needsEmailConfirmation) {
        setSubmitted({ needsEmailConfirmation: true })
        setLoading(false)
        return
      }
      clearAppCache()
      window.location.href = '/dashboard'
      return
    }
    setError(data.error || '회원가입에 실패했습니다.')
    setLoading(false)
  }

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
          <h1 className="text-2xl font-bold text-fg">계정 만들기</h1>
          <p className="text-sm text-fg-subtle mt-1">trip-planner</p>
        </div>

        {submitted?.needsEmailConfirmation ? (
          <div className="bg-bg-elevated rounded-2xl shadow-sm border border-border p-6 space-y-3">
            <h2 className="text-base font-semibold text-fg">확인 메일을 보냈습니다</h2>
            <p className="text-sm text-fg-subtle">
              입력하신 이메일이 가입 가능한 주소라면 확인 링크가 발송되었습니다. 받은 메일의 링크를 눌러 가입을 완료해주세요.
            </p>
            <Link
              href="/login"
              className="block text-center w-full bg-accent text-accent-fg rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              로그인으로 이동
            </Link>
          </div>
        ) : (
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
                비밀번호 (8자 이상)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-border rounded-xl px-3.5 py-2.5 text-fg text-sm focus:outline-none focus:ring-2 focus-visible:outline-accent focus:border-transparent transition-shadow"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="bg-critical-bg border border-critical-border rounded-lg px-3 py-2">
                <p className="text-critical-fg text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-fg rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-accent-hover active:bg-accent-hover transition-colors mt-2"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>

            <div className="text-center text-sm text-fg-subtle pt-2">
              이미 계정이 있나요?{' '}
              <Link href="/login" className="text-accent font-semibold hover:underline">
                로그인
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
