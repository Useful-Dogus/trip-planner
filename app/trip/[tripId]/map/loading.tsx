import Navigation from '@/components/Layout/Navigation'
import { Skeleton } from '@/components/UI/Skeleton'

function PanelLoading() {
  return (
    <aside className="flex h-full flex-col bg-bg-elevated" aria-hidden="true">
      <div className="flex flex-shrink-0 gap-1 border-b border-border bg-bg-subtle p-1.5">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
      <div className="flex-shrink-0 border-b border-border px-3 py-2">
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <div className="flex-shrink-0 border-b border-border px-3 py-2">
        <Skeleton className="h-9 rounded-md" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden p-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-border bg-bg-elevated p-3"
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function MapLoading() {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-bg-subtle"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgb(var(--border))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--border))_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute left-3 top-3 z-[600] rounded-md bg-bg-elevated/90 px-2.5 py-1.5 shadow-sm backdrop-blur">
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <div className="absolute right-3 top-3 z-[600] rounded-lg bg-bg-elevated/90 px-3 py-2 shadow-sm backdrop-blur">
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="absolute bottom-5 right-5 z-[600] space-y-2">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-elevated shadow-e4" />
    </div>
  )
}

export default function MapRouteLoading() {
  return (
    <div className="bg-bg text-fg md:pl-44" aria-busy="true" aria-label="지도 불러오는 중">
      <div className="hidden h-screen md:flex">
        <div className="w-[360px] flex-shrink-0 border-r border-border bg-bg-elevated">
          <PanelLoading />
        </div>
        <div className="relative min-w-0 flex-1">
          <MapLoading />
        </div>
      </div>

      <div className="relative flex h-[calc(100vh-56px)] flex-col md:hidden">
        <div className="relative min-h-0 flex-1">
          <MapLoading />
          <Skeleton className="absolute bottom-4 right-4 z-[600] size-12 rounded-full shadow-e4" />
        </div>
        <div className="flex h-[40vh] flex-shrink-0 flex-col border-t border-border bg-bg-elevated">
          <div className="flex w-full flex-shrink-0 items-center justify-center py-2">
            <span
              aria-hidden="true"
              className="block h-1 w-10 rounded-full bg-fg-subtle/40"
            />
          </div>
          <div className="min-h-0 flex-1">
            <PanelLoading />
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
