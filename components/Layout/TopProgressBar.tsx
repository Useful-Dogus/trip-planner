'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 라우트 전환 시 상단에 얇은 진행 막대를 표시한다 (#233).
 *
 * 문제: Next.js App Router 는 새 페이지를 그릴 준비가 될 때까지 이전 페이지를 그대로 유지한다.
 * 사용자는 클릭이 먹혔는지 확신할 수 없다.
 *
 * 해결:
 *  1. document 레벨에서 내부 링크 클릭을 캡처해 0ms 이내 진행 막대 노출
 *  2. usePathname / useSearchParams 변경을 감지해 막대 완료 → 페이드아웃
 *  3. 클릭 직후 200ms 안에 라우트가 바뀌어버리면(=빠른 전환) 막대를 보여주지 않는다.
 *     너무 빠른 깜빡임이 오히려 노이즈가 되기 때문.
 */
export default function TopProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState<number>(0)
  const [visible, setVisible] = useState<boolean>(false)
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPathRef = useRef<string>(pathname)
  const startedRef = useRef<boolean>(false)

  // 진행 시작 — start trickle to 90%, never reach 100 until finish().
  function start() {
    if (startedRef.current) return
    startedRef.current = true
    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    // 200ms 까지 빠른 전환이면 막대 자체를 띄우지 않는다.
    startTimerRef.current = setTimeout(() => {
      setVisible(true)
      setProgress(10)
      if (trickleTimerRef.current) clearInterval(trickleTimerRef.current)
      trickleTimerRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p
          // 90% 까지 점진적으로 — 가까울수록 느리게 (지연 인상을 줄임)
          const remaining = 90 - p
          return p + Math.max(1, remaining * 0.08)
        })
      }, 180)
    }, 200)
  }

  // 진행 완료 — 100% 채우고 페이드아웃.
  function finish() {
    if (!startedRef.current) return
    startedRef.current = false
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current)
      trickleTimerRef.current = null
    }
    setProgress(100)
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    finishTimerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 240)
  }

  // document 클릭 캡처 — 내부 링크면 진행 시작
  useEffect(() => {
    function shouldTrack(link: HTMLAnchorElement, event: MouseEvent): boolean {
      const href = link.getAttribute('href')
      if (!href) return false
      // 외부·해시·새 탭·모디파이어 키 — 스킵
      if (href.startsWith('#')) return false
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const url = new URL(href, window.location.origin)
          if (url.origin !== window.location.origin) return false
        } catch {
          return false
        }
      }
      if (link.target === '_blank' || link.hasAttribute('download')) return false
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
      if (event.button !== 0) return false
      // 동일 경로 — 진행 표시 불필요
      try {
        const url = new URL(href, window.location.origin)
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return false
        }
      } catch {
        // 무시
      }
      return true
    }

    function handleClick(e: MouseEvent) {
      const target = e.target
      if (!(target instanceof Element)) return
      const link = target.closest('a')
      if (!link) return
      if (shouldTrack(link as HTMLAnchorElement, e)) start()
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  // 경로 변경 = 새 라우트가 그려졌다는 신호 → finish
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname
      finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // 언마운트 cleanup
  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      if (trickleTimerRef.current) clearInterval(trickleTimerRef.current)
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    }
  }, [])

  if (!visible) return null
  return (
    <div
      role="progressbar"
      aria-label="페이지 전환 진행"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="fixed top-0 inset-x-0 z-[100] h-0.5 pointer-events-none"
    >
      <div
        className="h-full bg-accent shadow-[0_0_8px_var(--color-accent,#3b82f6)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  )
}
