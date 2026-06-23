'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import ThemeToggle from '@/components/Theme/ThemeToggle'
import { useItems } from '@/lib/hooks/useItems'
import { useToast } from '@/components/UI/Toast'
import TripPageHeader from '@/components/Layout/TripPageHeader'
import StickyAddBar from '@/components/UI/StickyAddBar'
import IconButton from '@/components/UI/IconButton'
import { Share, Sparkles } from 'lucide-react'
import ExportScheduleDialog from '@/components/Schedule/ExportScheduleDialog'
import DraftPlanSheet from '@/components/Schedule/DraftPlanSheet'
import { useTrip } from '@/lib/hooks/useTripContext'

const ItemPanel = dynamic(() => import('@/components/Panel/ItemPanel'), { ssr: false })

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageContent />
    </Suspense>
  )
}

function SchedulePageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { items, isLoading, updateItem, createItem, deleteItem } = useItems()
  const { showToast } = useToast()
  const trip = useTrip()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get('item'),
  )
  const [exportOpen, setExportOpen] = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null

  const buildUrl = (params: URLSearchParams): string =>
    params.toString() ? `${pathname}?${params.toString()}` : pathname

  useEffect(() => {
    if (isLoading || !selectedItemId) return
    if (!items.find((i) => i.id === selectedItemId)) {
      setSelectedItemId(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('item')
      router.replace(buildUrl(params), { scroll: false })
    }
  }, [items, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectItem(id: string) {
    const next = selectedItemId === id ? null : id
    setSelectedItemId(next)
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set('item', next)
    else params.delete('item')
    router.replace(buildUrl(params), { scroll: false })
  }

  function handleClosePanel() {
    setSelectedItemId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(buildUrl(params), { scroll: false })
  }

  return (
    <div className="md:pl-44 bg-bg text-fg min-h-screen">
      <div className="max-w-3xl mx-auto">
        <TripPageHeader
          section="일정"
          actions={
            <div className="flex items-center gap-1">
              <IconButton
                aria-label="자동 일정 초안 만들기"
                onClick={() => setDraftOpen(true)}
                title="자동 일정 초안 만들기"
              >
                <Sparkles className="size-5" />
              </IconButton>
              <IconButton
                aria-label="일정 내보내기"
                onClick={() => setExportOpen(true)}
                title="일정 내보내기"
              >
                <Share className="size-5" />
              </IconButton>
            </div>
          }
        />
      </div>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 pb-32 md:pb-6">
          <ScheduleTable
            items={items}
            onUpdateItem={updateItem}
            onCreateItem={createItem}
            onOpenPanel={handleSelectItem}
            onDeleteItem={deleteItem}
          />
        </div>
      )}

      <Navigation />

      <StickyAddBar />

      <ItemPanel
        item={selectedItem}
        isOpen={selectedItemId !== null}
        onClose={handleClosePanel}
        onSave={() => showToast({ type: 'success', message: '저장했어요' })}
        onDelete={() => {
          handleClosePanel()
          showToast({ type: 'success', message: '삭제했어요' })
        }}
      />

      <ExportScheduleDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        items={items}
      />

      <DraftPlanSheet
        open={draftOpen}
        onClose={() => setDraftOpen(false)}
        items={items}
        trip={{
          startDate: trip.startDate,
          endDate: trip.endDate,
          centerLat: trip.centerLat,
          centerLng: trip.centerLng,
        }}
        currency={trip.currency}
        onApply={async (stops) => {
          await Promise.all(
            stops.map((s) => updateItem(s.itemId, { date: s.date, time_start: s.time_start })),
          )
          showToast({ type: 'success', message: `${stops.length}개 일정에 넣었어요` })
        }}
      />
    </div>
  )
}
