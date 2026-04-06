/**
 * Google Maps 리스트 페이지 HTML fetch
 */

export class GmapsFetcherError extends Error {
  constructor(
    message: string,
    public code: 'PRIVATE_LIST' | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'GmapsFetcherError'
  }
}

/**
 * Google Maps 리스트 페이지를 fetch하여 HTML 문자열을 반환한다.
 * @param listId Google Maps list ID
 */
export async function fetchListPage(listId: string): Promise<string> {
  const url = `https://www.google.com/maps/placelists/list/${listId}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      },
      signal: controller.signal,
    })

    if (response.status === 403 || response.status === 401) {
      throw new GmapsFetcherError(
        '비공개 리스트는 지원하지 않습니다. 리스트를 공개로 설정한 후 다시 시도해주세요.',
        'PRIVATE_LIST'
      )
    }

    if (!response.ok) {
      throw new GmapsFetcherError(
        '구글맵 페이지를 불러오는 중 오류가 발생했습니다.',
        'NETWORK_ERROR'
      )
    }

    const html = await response.text()

    // HTML 크기 제한 (10MB)
    if (html.length > 10 * 1024 * 1024) {
      throw new GmapsFetcherError(
        '응답 데이터가 너무 큽니다.',
        'NETWORK_ERROR'
      )
    }

    // 로그인 페이지로 리다이렉트된 경우 감지
    if (html.includes('accounts.google.com') && html.includes('signin')) {
      throw new GmapsFetcherError(
        '비공개 리스트는 지원하지 않습니다. 리스트를 공개로 설정한 후 다시 시도해주세요.',
        'PRIVATE_LIST'
      )
    }

    return html
  } catch (err) {
    if (err instanceof GmapsFetcherError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new GmapsFetcherError('요청 시간이 초과되었습니다.', 'NETWORK_ERROR')
    }
    throw new GmapsFetcherError(
      '구글맵 페이지를 불러오는 중 오류가 발생했습니다.',
      'NETWORK_ERROR'
    )
  } finally {
    clearTimeout(timeout)
  }
}
