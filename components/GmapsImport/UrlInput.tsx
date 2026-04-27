'use client'

interface UrlInputProps {
  onSubmit: (url: string) => void
  loading: boolean
  error: string | null
}

export default function UrlInput({ onSubmit, loading, error }: UrlInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const url = (form.elements.namedItem('url') as HTMLInputElement).value.trim()
    if (url) onSubmit(url)
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold text-fg mb-1">구글맵 리스트 URL 입력</h2>
      <p className="text-sm text-fg-muted mb-4">
        구글맵에서 공개 리스트를 만들고 공유 URL을 붙여넣으세요.
        <br />
        지원 형식:{' '}
        <code className="text-xs bg-bg-subtle px-1 py-0.5 rounded">
          maps.app.goo.gl/...
        </code>
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="url"
          type="url"
          placeholder="https://maps.app.goo.gl/..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-bg-elevated text-fg focus:outline-none focus:ring-2 focus-visible:outline-accent focus:border-transparent disabled:bg-bg-subtle disabled:text-fg-subtle"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? '불러오는 중...' : '불러오기'}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-critical-fg">{error}</p>
      )}
    </div>
  )
}
