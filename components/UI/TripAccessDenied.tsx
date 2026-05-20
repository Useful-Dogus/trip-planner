import Link from 'next/link'

export default function TripAccessDenied({ reason }: { reason: 'not-found' | 'forbidden' }) {
  const title = reason === 'forbidden' ? '이 여행에 접근할 권한이 없어요' : '여행을 찾을 수 없어요'
  const description =
    reason === 'forbidden'
      ? '초대받지 않은 여행이거나, 접근 권한이 해제되었을 수 있어요.'
      : '주소가 잘못되었거나 삭제된 여행일 수 있어요.'

  return (
    <main className="min-h-screen bg-bg text-fg flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-fg-muted">{description}</p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-accent text-accent-fg rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            내 여행으로 이동
          </Link>
        </div>
      </div>
    </main>
  )
}
