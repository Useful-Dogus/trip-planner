'use client'

import { useState } from 'react'
import { PasswordInput, PasswordStrengthMeter } from '@/components/UI'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setDone(true)
      setLoading(false)
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return
    }
    const data = await res.json().catch(() => ({}))
    setError(data.error || '비밀번호 변경에 실패했습니다.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-subtle to-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-fg">새 비밀번호 설정</h1>
          <p className="text-sm text-fg-subtle mt-1">변경 후 로그인 페이지로 이동합니다</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-elevated rounded-2xl shadow-sm border border-border p-6 space-y-4"
        >
          <div>
            <PasswordInput
              label="새 비밀번호 (8자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {error && (
            <div className="bg-critical-bg border border-critical-border rounded-lg px-3 py-2">
              <p className="text-critical-fg text-sm">{error}</p>
            </div>
          )}

          {done && (
            <div className="bg-success-bg border border-success-border rounded-lg px-3 py-2">
              <p className="text-success-fg text-sm">변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || done}
            className="w-full bg-accent text-accent-fg rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-accent-hover active:bg-accent-hover transition-colors mt-2"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
