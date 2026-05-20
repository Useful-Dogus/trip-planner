import Navigation from '@/components/Layout/Navigation'
import ItemForm from '@/components/Items/ItemForm'
import TripPageTitle from '@/components/UI/TripPageTitle'

export default function NewItemPage() {
  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <TripPageTitle section="항목 추가" />
        </div>
        <ItemForm mode="create" />
      </div>
      <Navigation />
    </div>
  )
}
