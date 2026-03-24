import { notFound } from 'next/navigation'
import { readItems } from '@/lib/data'
import Navigation from '@/components/Layout/Navigation'
import ItemForm from '@/components/Items/ItemForm'

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const items = await readItems()
  const item = items.find(i => i.id === params.id)

  if (!item) notFound()

  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">항목 수정</h1>
        <ItemForm mode="edit" initialData={item} itemId={item.id} />
      </div>
      <Navigation />
    </div>
  )
}
