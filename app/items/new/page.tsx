import Navigation from '@/components/Layout/Navigation'
import ItemForm from '@/components/Items/ItemForm'

export default function NewItemPage() {
  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">항목 추가</h1>
        <ItemForm mode="create" />
      </div>
      <Navigation />
    </div>
  )
}
