import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readItems } from '@/lib/data'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import Navigation from '@/components/Layout/Navigation'
import ItemForm from '@/components/Items/ItemForm'
import { buildTripPath } from '@/lib/hooks/useTripContext'

export default async function EditItemPage({
  params,
}: {
  params: { tripId: string; id: string }
}) {
  const items = await readItems(createRouteHandlerSupabase(), params.tripId)
  const item = items.find(i => i.id === params.id)

  if (!item) notFound()

  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={buildTripPath(params.tripId, `items/${item.id}`)}
            className="text-sm text-fg-subtle hover:text-fg-muted transition-colors"
          >
            ← 상세보기
          </Link>
          <h1 className="text-xl font-bold text-fg">항목 수정</h1>
        </div>
        <ItemForm mode="edit" initialData={item} itemId={item.id} />
      </div>
      <Navigation />
    </div>
  )
}
