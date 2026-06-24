'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LogOut, Trash2 } from 'lucide-react'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { useToast } from '@/components/UI/Toast'
import { useConfirm } from '@/components/UI/ConfirmDialog'
import { logout } from '@/lib/auth-client'
import { clearAppCache } from '@/lib/clearAppCache'

const handleLogout = logout

interface Props {
  email: string
  initialNickname: string
}

export default function ProfileClient({ email, initialNickname }: Props) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-fg-subtle hover:text-fg transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            대시보드
          </Link>
          <h1 className="text-base font-bold text-fg ml-auto">프로필 / 설정</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-8 py-6 space-y-6">
        <NicknameSection initialNickname={initialNickname} />
        <EmailSection currentEmail={email} />
        <PasswordSection />
        <section className="bg-bg-elevated border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-fg mb-3">계정</h2>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="size-4 mr-1.5" aria-hidden="true" />
            로그아웃
          </Button>
        </section>
        <DangerSection />
      </main>
    </div>
  )
}

function DangerSection() {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  async function handleDelete() {
    if (submitting) return

    // 사전 고지: 함께 삭제될 '내가 소유한 여행' 개수를 먼저 조회한다(#321).
    let ownedTripCount = 0
    try {
      const res = await fetch('/api/auth/delete-account')
      if (res.ok) {
        const data = await res.json()
        ownedTripCount = data.ownedTripCount ?? 0
      }
    } catch {
      // 개수 조회 실패 시 일반 문구로 진행
    }

    const ok = await confirm({
      title: '회원 탈퇴',
      description: (
        <>
          계정과{' '}
          {ownedTripCount > 0 ? `내가 소유한 여행 ${ownedTripCount}개를 포함한 ` : ''}
          모든 데이터가 <strong>즉시·영구 삭제</strong>됩니다. 되돌릴 수 없습니다.
        </>
      ),
      confirmLabel: '영구 삭제',
      cancelLabel: '취소',
      tone: 'destructive',
      typeToConfirm: '탈퇴',
    })
    if (!ok) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? '탈퇴에 실패했습니다.')
      // 계정이 사라졌으니 로컬 캐시를 비우고 로그인 화면으로 하드 리로드한다.
      clearAppCache()
      window.location.href = '/login'
    } catch (e) {
      const msg = e instanceof Error ? e.message : '탈퇴에 실패했습니다.'
      showToast({ type: 'error', message: msg })
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-bg-elevated border border-critical-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-critical-fg mb-1">위험 구역</h2>
      <p className="text-xs text-fg-subtle mb-3">
        탈퇴 시 계정과 내가 소유한 여행·항목이 즉시 영구 삭제됩니다. 복구할 수 없습니다.
      </p>
      <Button variant="destructive" onClick={handleDelete} loading={submitting}>
        <Trash2 className="size-4 mr-1.5" aria-hidden="true" />
        회원 탈퇴
      </Button>
    </section>
  )
}

function NicknameSection({ initialNickname }: { initialNickname: string }) {
  const { showToast } = useToast()
  const [value, setValue] = useState(initialNickname)
  const [saved, setSaved] = useState(initialNickname)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || value === saved) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? '저장 실패')
      setSaved(value)
      showToast({ type: 'success', message: '닉네임을 저장했어요.' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      showToast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-bg-elevated border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-fg mb-3">닉네임</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <Input
          label="닉네임"
          hideLabel
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="표시 이름을 입력하세요"
          maxLength={40}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || value === saved}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const { showToast } = useToast()
  const [value, setValue] = useState(currentEmail)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || value === currentEmail) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? '저장 실패')
      showToast({
        type: 'success',
        message: data.requiresEmailConfirmation
          ? '확인 메일을 보냈어요. 새 이메일에서 링크를 눌러 변경을 완료해주세요.'
          : '이메일을 저장했어요.',
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.'
      showToast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-bg-elevated border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-fg mb-3">이메일</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <Input
          label="이메일"
          hideLabel
          type="email"
          value={value}
          onChange={e => setValue(e.target.value)}
          required
        />
        <p className="text-xs text-fg-subtle">
          변경 시 새 이메일로 확인 링크가 전송됩니다. 링크를 눌러야 실제로 바뀝니다.
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || value === currentEmail}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function PasswordSection() {
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm
  const tooShort = password.length > 0 && password.length < 8

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (tooShort || mismatch || !password) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? '저장 실패')
      setPassword('')
      setConfirm('')
      showToast({ type: 'success', message: '비밀번호를 변경했어요.' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.'
      showToast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-bg-elevated border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-fg mb-3">비밀번호 변경</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <Input
          label="새 비밀번호"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          aria-invalid={tooShort || undefined}
          error={tooShort ? '비밀번호는 8자 이상이어야 합니다.' : undefined}
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          aria-invalid={mismatch || undefined}
          error={mismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !password || tooShort || mismatch}
          >
            {submitting ? '저장 중…' : '변경'}
          </Button>
        </div>
      </form>
    </section>
  )
}
