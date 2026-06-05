'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sheet from '@/components/UI/Sheet'

/**
 * 전역 키보드 단축키 (#42).
 *
 * 단축키:
 *  - `n`       → 현재 컨텍스트에 맞는 "새 항목 추가"
 *                · /trip/[tripId]/** → 그 trip 에 새 item 추가
 *                · /dashboard       → 새 여행 만들기
 *  - `/`, `Ctrl+K` / `⌘+K` → 현재 페이지의 검색 입력에 포커스
 *  - `?`       → 단축키 도움말 시트 열기
 *  - `Esc`     → 도움말 시트 닫기 (다른 패널은 각자 처리)
 *
 * 안전:
 *  - 입력 필드(input/textarea/select/contenteditable) 안에서는 단축키 무시
 *    단, `/` 키만은 ‟Esc + /" 흐름을 막지 않게 inputs 에서도 동작 안 함
 *  - 모디파이어(Ctrl/Meta) 없는 단일 키는 IME composition 중일 때 무시
 *  - data-shortcut="search" 가 페이지에 있을 때만 검색 단축키 활성
 */
export default function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const [helpOpen, setHelpOpen] = useState(false)

  const triggerNewItem = useCallback(() => {
    const tripMatch = pathname.match(/^\/trip\/([0-9a-fA-F-]{36})/)
    if (tripMatch) {
      router.push(`/trip/${tripMatch[1]}/items/new`)
      return
    }
    if (pathname.startsWith('/dashboard')) {
      router.push('/dashboard/new')
      return
    }
    // 그 외 페이지(/login, /me 등) 에서는 무동작
  }, [pathname, router])

  const focusSearch = useCallback(() => {
    // 명시적 마커 우선
    const explicit = document.querySelector<HTMLInputElement>(
      '[data-shortcut="search"]',
    )
    if (explicit) {
      explicit.focus()
      explicit.select()
      return true
    }
    return false
  }, [])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (target.isContentEditable) return true
      return false
    }

    function handleKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return
      // IME composition 중에는 단축키 비활성 (한글 입력 충돌 방지)
      if (e.isComposing) return

      const cmdK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')

      // Ctrl/⌘+K 는 입력 필드 안에서도 동작 (검색 포커스 전환)
      if (cmdK) {
        if (focusSearch()) {
          e.preventDefault()
        }
        return
      }

      // 입력 필드 포커스 중에는 단일 키 단축키 비활성
      if (isTypingTarget(e.target)) return

      // 모디파이어 없는 단일 키만 처리
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        // `?` 는 보통 Shift+/ 이므로 shift 는 허용
        if (!(e.shiftKey && e.key === '?')) return
      }

      switch (e.key) {
        case 'n':
        case 'N':
          triggerNewItem()
          e.preventDefault()
          break
        case '/':
          if (focusSearch()) e.preventDefault()
          break
        case '?':
          setHelpOpen((v) => !v)
          e.preventDefault()
          break
        default:
          break
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [triggerNewItem, focusSearch])

  return (
    <Sheet
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      side="bottom"
      title="키보드 단축키"
    >
      <dl className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        <ShortcutRow keys={['n']} label="새 항목 추가 (이 여행 / 새 여행)" />
        <ShortcutRow keys={['/']} label="검색 포커스" />
        <ShortcutRow keys={['Ctrl', 'K']} altKeys={['⌘', 'K']} label="검색 포커스" />
        <ShortcutRow keys={['Esc']} label="패널·시트 닫기" />
        <ShortcutRow keys={['?']} label="이 도움말 열기·닫기" />
      </dl>
      <p className="text-xs text-fg-subtle mt-3 px-1">
        입력 중에는 일부 단축키가 비활성화돼요. 검색은 입력 중에도 ⌘/Ctrl+K 로 이동할 수 있어요.
      </p>
    </Sheet>
  )
}

function ShortcutRow({
  keys,
  altKeys,
  label,
}: {
  keys: string[]
  altKeys?: string[]
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-bg-elevated">
      <dt className="text-sm text-fg">{label}</dt>
      <dd className="flex items-center gap-1.5 text-xs">
        <KeyCluster keys={keys} />
        {altKeys && (
          <>
            <span className="text-fg-subtle">또는</span>
            <KeyCluster keys={altKeys} />
          </>
        )}
      </dd>
    </div>
  )
}

function KeyCluster({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="px-1.5 py-0.5 rounded border border-border bg-bg text-fg-muted font-mono text-[11px] min-w-6 text-center"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}
