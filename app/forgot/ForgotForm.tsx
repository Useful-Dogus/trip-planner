'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSubmitted(true)
      setLoading(false)
      return
    }
    const data = await res.json().catch(() => ({}))
    setError(data.error || '요청에 실패했습니다.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-subtle to-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fg">비밀번호 재설정</h1>
          <p className="text-sm text-fg-subtle mt-1">가입 시 사용한 이메일을 입력하세요</p>
        </div>

        {submitted ? (
          <div className="bg-bg-elevated rounded-2xl shadow-sm border border-border p-6 space-y-3">
            <h2 className="text-base font-semibold text-fg">메일을 확인해주세요</h2>
            <p className="text-sm text-fg-subtle">
              입력하신 이메일이 가입된 주소라면 재설정 링크가 발송되었습니다. 받은 메일의 링크를 눌러 새 비밀번호를 설정해주세요.
            </p>
            <Link
              href="/login"
              className="block text-center w-full bg-accent text-accent-fg rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              로그인으로 돌아가기
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
              {loading ? '전송 중...' : '재설정 링크 받기'}
            </button>

            <div className="text-center text-sm text-fg-subtle pt-2">
              <Link href="/login" className="text-accent font-semibold hover:underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
