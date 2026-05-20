'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Plus, Trash2, Check, AlertCircle } from 'lucide-react'
import Sheet from '@/components/UI/Sheet'
import Button from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import type { Share } from '@/lib/share'
import { isShareActive } from '@/lib/share'
import { buildShareUrl } from '@/lib/sharedTrip'

type Props = {
  open: boolean
  onClose: () => void
  tripId: string
}

export default function ShareDialog({ open, onClose, tripId }: Props) {
  const [shares, setShares] = useState<Share[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const { showToast } = useToast()

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), [])

  const loadShares = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/shares`, { cache: 'no-store' })
      if (!res.ok) throw new Error('목록을 불러오지 못했습니다.')
      const json = await res.json()
      setShares(json.shares as Share[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    if (open) void loadShares()
  }, [open, loadShares])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/shares`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('발급에 실패했습니다.')
      await loadShares()
      showToast({ message: '공유 링크를 만들었어요.', type: 'success' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (token: string) => {
    if (!window.confirm('이 링크를 회수하시겠어요? 이후로 접속이 차단됩니다.')) return
    try {
      const res = await fetch(`/api/trips/${tripId}/shares/${token}/revoke`, { method: 'POST' })
      if (!res.ok) throw new Error('회수에 실패했습니다.')
      await loadShares()
      showToast({ message: '링크를 회수했어요.', type: 'success' })
    } catch (e) {
      showToast({ message: (e as Error).message, type: 'error' })
    }
  }

  const handleCopy = async (token: string) => {
    const url = buildShareUrl(token, origin)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      window.setTimeout(() => setCopiedToken((cur) => (cur === token ? null : cur)), 1500)
    } catch {
      showToast({ message: '복사에 실패했어요. 직접 선택해주세요.', type: 'error' })
    }
  }

  const activeShares = (shares ?? []).filter((s) => isShareActive(s))
  const revokedShares = (shares ?? []).filter((s) => !isShareActive(s))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="공유 링크"
      description="가입 없이도 일정을 둘러볼 수 있는 읽기 전용 링크를 만들 수 있어요."
      side="auto"
    >
      <div className="space-y-5 p-1">
        <Button
          type="button"
          variant="primary"
          onClick={handleCreate}
          loading={creating}
          data-autofocus
          fullWidth
          leftIcon={<Plus className="size-4" aria-hidden />}
        >
          새 링크 만들기
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-critical-border bg-critical-bg p-3 text-sm text-critical-fg">
            <AlertCircle className="size-4 mt-0.5" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">활성 링크</h3>
          {loading && !shares ? (
            <p className="text-sm text-fg-subtle">불러오는 중…</p>
          ) : activeShares.length === 0 ? (
            <p className="text-sm text-fg-subtle">아직 발급된 활성 링크가 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {activeShares.map((s) => {
                const url = buildShareUrl(s.token, origin)
                return (
                  <li
                    key={s.token}
                    className="rounded-lg border border-border bg-bg-elevated p-3"
                  >
                    <div className="flex items-center gap-2">
                      <code className="flex-1 min-w-0 truncate text-xs text-fg-muted">{url}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(s.token)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 text-xs font-medium hover:bg-bg-subtle"
                        aria-label="링크 복사"
                      >
                        {copiedToken === s.token ? (
                          <>
                            <Check className="size-3.5" aria-hidden /> 복사됨
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" aria-hidden /> 복사
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(s.token)}
                        className="inline-flex items-center rounded-md border border-border bg-bg px-2 py-1 text-xs font-medium text-critical-fg hover:bg-critical-bg"
                        aria-label="링크 회수"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-fg-subtle tabular">
                      발급 {new Date(s.created_at).toLocaleDateString()}
                      {s.expires_at && ` · ${new Date(s.expires_at).toLocaleDateString()} 만료`}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {revokedShares.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">비활성</h3>
            <ul className="space-y-1.5">
              {revokedShares.slice(0, 10).map((s) => (
                <li key={s.token} className="text-xs text-fg-subtle">
                  <code className="truncate">{s.token.slice(0, 8)}…</code>
                  {' · '}
                  {s.revoked_at ? '회수됨' : '만료됨'}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  )
}
