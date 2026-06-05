'use client'

import { useMemo, useState } from 'react'
import { Copy, Printer } from 'lucide-react'
import Sheet from '@/components/UI/Sheet'
import Button from '@/components/UI/Button'
import { useToast } from '@/components/UI/Toast'
import { useTrip } from '@/lib/hooks/useTripContext'
import { buildScheduleText } from '@/lib/exportSchedule'
import type { TripItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  items: TripItem[]
}

export default function ExportScheduleDialog({ open, onClose, items }: Props) {
  const trip = useTrip()
  const { showToast } = useToast()
  const [copying, setCopying] = useState(false)

  const text = useMemo(
    () =>
      buildScheduleText(items, {
        tripTitle: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        currency: trip.currency,
      }),
    [items, trip.title, trip.startDate, trip.endDate, trip.currency],
  )

  async function handleCopy() {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(text)
      showToast({ type: 'success', message: '클립보드에 복사했어요' })
    } catch {
      showToast({ type: 'error', message: '복사에 실패했어요' })
    } finally {
      setCopying(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="auto"
      title="일정 내보내기"
      description="확정된 일정만 날짜순으로 정렬해 텍스트로 만들어요."
      footer={
        <>
          <Button variant="secondary" onClick={handlePrint} leftIcon={<Printer size={16} />}>
            인쇄
          </Button>
          <Button
            variant="primary"
            onClick={handleCopy}
            loading={copying}
            leftIcon={<Copy size={16} />}
          >
            복사
          </Button>
        </>
      }
    >
      <div className="px-5 py-4">
        <textarea
          readOnly
          value={text}
          className="w-full min-h-[40vh] md:min-h-[50vh] resize-none bg-bg-subtle text-fg text-sm font-mono p-3 rounded border border-border focus:outline-none"
        />
      </div>
    </Sheet>
  )
}
