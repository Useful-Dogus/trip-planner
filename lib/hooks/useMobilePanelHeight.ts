'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'trip-planner.mobilePanelSnap'

/** 패널 높이 스냅 지점 (vh 단위). 순서대로 축소·기본·확장. */
export const PANEL_SNAP_POINTS_VH = [25, 40, 80] as const
const DEFAULT_SNAP_INDEX = 1
const DRAG_MIN_VH = 15
const DRAG_MAX_VH = 90

export type PanelSnapIndex = 0 | 1 | 2

interface DragState {
  pointerId: number
  startY: number
  startVh: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function nearestSnapIndex(vh: number): PanelSnapIndex {
  let best: PanelSnapIndex = 0
  let bestDist = Infinity
  PANEL_SNAP_POINTS_VH.forEach((point, i) => {
    const d = Math.abs(point - vh)
    if (d < bestDist) {
      bestDist = d
      best = i as PanelSnapIndex
    }
  })
  return best
}

/**
 * 모바일 하단 패널의 높이(vh)와 드래그 핸들러를 관리한다.
 *
 * - 3 개의 스냅 지점 사이를 핀치 없이 드래그/탭으로 이동할 수 있다.
 * - 드래그 종료 시 가장 가까운 스냅으로 정렬되고, 인덱스가 localStorage 에 저장된다.
 * - 핸들 단일 탭은 다음 스냅으로 순환 이동한다 (접근성·디스커버러빌리티).
 */
export function useMobilePanelHeight() {
  const [snapIndex, setSnapIndex] = useState<PanelSnapIndex>(DEFAULT_SNAP_INDEX)
  const [dragVh, setDragVh] = useState<number | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const movedRef = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved == null) return
    const idx = Number(saved)
    if (Number.isInteger(idx) && idx >= 0 && idx < PANEL_SNAP_POINTS_VH.length) {
      setSnapIndex(idx as PanelSnapIndex)
    }
  }, [])

  const persistSnap = useCallback((idx: PanelSnapIndex) => {
    setSnapIndex(idx)
    try {
      localStorage.setItem(STORAGE_KEY, String(idx))
    } catch {
      // ignore quota / private mode
    }
  }, [])

  const currentVh = dragVh ?? PANEL_SNAP_POINTS_VH[snapIndex]
  const heightStyle = `${currentVh}vh`

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // 마우스는 좌클릭만, 터치/펜은 모두 허용
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      const startVh = currentVh
      dragRef.current = { pointerId: e.pointerId, startY: e.clientY, startVh }
      movedRef.current = false
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [currentVh],
  )

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const deltaPx = drag.startY - e.clientY // 위로 끌면 +
    const deltaVh = (deltaPx / window.innerHeight) * 100
    const next = clamp(drag.startVh + deltaVh, DRAG_MIN_VH, DRAG_MAX_VH)
    if (Math.abs(next - drag.startVh) > 1) movedRef.current = true
    setDragVh(next)
  }, [])

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      const moved = movedRef.current
      const finalVh = dragVh ?? drag.startVh
      dragRef.current = null
      setDragVh(null)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      if (moved) {
        persistSnap(nearestSnapIndex(finalVh))
      } else {
        // 탭 (이동 없음): 다음 스냅으로 순환
        const next = ((snapIndex + 1) % PANEL_SNAP_POINTS_VH.length) as PanelSnapIndex
        persistSnap(next)
      }
    },
    [dragVh, persistSnap, snapIndex],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = Math.min(
          PANEL_SNAP_POINTS_VH.length - 1,
          snapIndex + 1,
        ) as PanelSnapIndex
        persistSnap(next)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = Math.max(0, snapIndex - 1) as PanelSnapIndex
        persistSnap(next)
      } else if (e.key === 'Home') {
        e.preventDefault()
        persistSnap(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        persistSnap((PANEL_SNAP_POINTS_VH.length - 1) as PanelSnapIndex)
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const next = ((snapIndex + 1) % PANEL_SNAP_POINTS_VH.length) as PanelSnapIndex
        persistSnap(next)
      }
    },
    [snapIndex, persistSnap],
  )

  return {
    /** 패널에 적용할 height 문자열 (예: "40vh"). 드래그 중에는 실시간 값. */
    heightStyle,
    /** 현재 스냅 인덱스 (0=축소, 1=기본, 2=확장). */
    snapIndex,
    /** 드래그 중 여부. transition 비활성화 등에 사용. */
    isDragging: dragVh !== null,
    /** 드래그 핸들에 바인딩할 포인터/키보드 핸들러. */
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onKeyDown,
    },
  }
}
