import Link from 'next/link'

export type TripAccessDeniedReason = 'not-found' | 'forbidden' | 'server-error'

const COPY: Record<TripAccessDeniedReason, { title: string; description: string }> = {
  'not-found': {
    title: '여행을 찾을 수 없어요',
    description: '주소가 잘못되었거나 삭제된 여행일 수 있어요.',
  },
  forbidden: {
    title: '이 여행에 접근할 권한이 없어요',
    description: '초대받지 않은 여행이거나, 접근 권한이 해제되었을 수 있어요.',
  },
  // 서버측 오류(스키마 드리프트, DB 연결 실패 등)는 '권한 없음' 과 분리해서 표시한다.
  // 사용자에게 잘못된 원인(권한)을 안내하지 않기 위함.
  'server-error': {
    title: '여행을 불러오지 못했어요',
    description: '일시적인 서버 오류일 수 있어요. 잠시 후 다시 시도해 주세요.',
  },
}

export default function TripAccessDenied({ reason }: { reason: TripAccessDeniedReason }) {
  const { title, description } = COPY[reason]

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
