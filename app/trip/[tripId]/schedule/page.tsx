'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Layout/Navigation'
import ItemCardSkeleton from '@/components/UI/ItemCardSkeleton'
import ScheduleTable from '@/components/Schedule/ScheduleTable'
import { useItems } from '@/lib/hooks/useItems'
import { useToast } from '@/components/UI/Toast'
import TripPageHeader from '@/components/Layout/TripPageHeader'
import StickyAddBar from '@/components/UI/StickyAddBar'
import IconButton from '@/components/UI/IconButton'
import { Share } from 'lucide-react'
import ExportScheduleDialog from '@/components/Schedule/ExportScheduleDialog'
import TripPulse from '@/components/Trip/TripPulse'
import { buildTripPath, useTripId } from '@/lib/hooks/useTripContext'
import { getTripPulseSummary } from '@/lib/tripPulse'
import { TRIP_WORKSPACE_CLASS } from '@/lib/tripLayout'

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
  const tripId = useTripId()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() =>
    searchParams.get('item'),
  )
  const [exportOpen, setExportOpen] = useState(false)

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null
  const tripPulse = getTripPulseSummary('schedule', items, {
    list: buildTripPath(tripId, 'list'),
    map: buildTripPath(tripId, 'map'),
    schedule: buildTripPath(tripId, 'schedule'),
  })

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
      <div className={TRIP_WORKSPACE_CLASS}>
        <TripPageHeader
          section="일정"
          actions={
            <div className="flex items-center gap-1">
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
        {!isLoading && (
          <div className="px-4 md:px-8 mb-4">
            <TripPulse summary={tripPulse} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={`${TRIP_WORKSPACE_CLASS} px-4 space-y-2`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className={`${TRIP_WORKSPACE_CLASS} px-4 pb-32 md:pb-6`}>
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
    </div>
  )
}
