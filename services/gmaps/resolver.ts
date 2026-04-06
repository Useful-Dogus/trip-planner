/**
 * Google Maps short URL → list ID 추출
 */

export class GmapsResolverError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_URL' | 'PRIVATE_LIST' | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'GmapsResolverError'
  }
}

/**
 * maps.app.goo.gl short URL을 해석해 Google Maps full URL을 반환한다.
 * HTTP redirect를 따라가며 최종 URL을 얻는다.
 */
async function resolveShortUrl(shortUrl: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    })

    const finalUrl = response.url
    return finalUrl
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new GmapsResolverError('요청 시간이 초과되었습니다.', 'NETWORK_ERROR')
    }
    throw new GmapsResolverError('URL을 불러오는 중 오류가 발생했습니다.', 'NETWORK_ERROR')
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Google Maps URL에서 리스트 ID를 추출한다.
 * 지원 형식:
 *   - /maps/placelists/list/[listId]
 *   - /maps/placelists/list/[listId]/...
 */
export function extractListId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/maps\/placelists\/list\/([^/?#]+)/)
    if (match) return match[1]
    return null
  } catch {
    return null
  }
}

/**
 * URL 유효성 검사: maps.app.goo.gl 또는 google.com/maps 형식인지 확인
 */
export function isGmapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'maps.app.goo.gl' ||
      parsed.hostname === 'www.google.com' ||
      parsed.hostname === 'google.com'
    )
  } catch {
    return false
  }
}

/**
 * Short URL → list ID 추출
 * @throws GmapsResolverError
 */
export async function resolveListId(inputUrl: string): Promise<string> {
  if (!isGmapsUrl(inputUrl)) {
    throw new GmapsResolverError(
      '올바른 구글맵 리스트 URL을 입력해주세요.',
      'INVALID_URL'
    )
  }

  // 이미 full URL이면 바로 list ID 추출 시도
  const directId = extractListId(inputUrl)
  if (directId) return directId

  // Short URL이면 redirect 추적
  const fullUrl = await resolveShortUrl(inputUrl)
  const listId = extractListId(fullUrl)

  if (!listId) {
    throw new GmapsResolverError(
      '구글맵 리스트 URL이 아닙니다. 리스트 공유 URL을 입력해주세요.',
      'INVALID_URL'
    )
  }

  return listId
}
