'use client'

import type { ReactNode } from 'react'
import EditableTripTitle from '@/components/Trip/EditableTripTitle'
import ThemeToggle from '@/components/Theme/ThemeToggle'

interface Props {
  section: string
  /** 우측 액션 슬롯 (공유 버튼·페이지 고유 액션 등). */
  actions?: ReactNode
  /** 데스크탑 헤더 본문 (검색·필터 등 페이지 고유 영역). 모바일에선 같은 영역 렌더. */
  body?: ReactNode
  className?: string
}

/**
 * 모든 /trip/[tripId]/** 페이지 공통 헤더.
 * - 좌: TripPageTitle (trip 제목 인라인 편집 · ⋯ 설정 · 섹션명)
 * - 우: 페이지 고유 액션 + 모바일 ThemeToggle
 * - 하단: 페이지 고유 body 슬롯 (검색·필터 등)
 *
 * G-1/G-2 의 인라인 편집·여행 설정 시트가 자동 포함.
 */
export default function TripPageHeader({ section, actions, body, className = '' }: Props) {
  return (
    <header className={`px-4 md:px-8 pt-4 ${className}`}>
      <div className="flex items-center justify-between mb-4 gap-3">
        <EditableTripTitle section={section} />
        <div className="flex items-center gap-2">
          {actions}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
      {body}
    </header>
  )
}
