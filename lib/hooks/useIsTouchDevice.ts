'use client'

import { useEffect, useState } from 'react'

/**
 * 터치(=마우스 hover 없음, 거친 포인터) 디바이스 여부.
 *
 * - SSR/초기 렌더에서는 false 를 반환해 데스크탑 동작을 기본값으로 둔다.
 * - autoFocus 등 모바일에서 키보드를 갑작스럽게 띄우는 동작을 끄는 데 사용한다.
 *   (사용자가 직접 탭해서 진입한 인라인 편집에는 사용하지 않는다 — 그건 의도된 포커스다.)
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    setIsTouch(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isTouch
}
