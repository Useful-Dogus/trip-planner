'use client'

import { useState } from 'react'
import type { TripPriority } from '@/types'
import PriorityCell from '@/components/Schedule/cells/PriorityCell'

interface PriorityQuickPickerProps {
  value: TripPriority
  onChange: (priority: TripPriority) => void
}

/**
 * 자체 open 상태를 갖는 우선순위 1-2클릭 전환 컨트롤.
 * schedule 테이블·map 패널이 쓰는 PriorityCell 을 감싸, 카드처럼 편집 상태를
 * 위에서 관리하지 않는 곳(list 카드)에도 그대로 떨어뜨릴 수 있게 한다.
 * 카드 클릭(선택)과 충돌하지 않도록 클릭 이벤트 전파를 막는다.
 */
export default function PriorityQuickPicker({ value, onChange }: PriorityQuickPickerProps) {
  const [editing, setEditing] = useState(false)
  return (
    <span
      className="inline-flex"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <PriorityCell
        value={value}
        isEditing={editing}
        onClick={() => setEditing((v) => !v)}
        onSelect={(priority) => {
          onChange(priority)
          setEditing(false)
        }}
        onClose={() => setEditing(false)}
      />
    </span>
  )
}
