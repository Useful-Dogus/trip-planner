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
  const maxRedirects = 5
  const timeoutMs = 5000

  try {
    let finalUrl = await followRedirect(shortUrl, maxRedirects, timeoutMs)

    if (finalUrl === shortUrl) {
      const curlResolvedUrl = await resolveShortUrlWithCurl(shortUrl, timeoutMs)
      if (curlResolvedUrl) {
        finalUrl = curlResolvedUrl
      }
    }

    return finalUrl
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new GmapsResolverError('요청 시간이 초과되었습니다.', 'NETWORK_ERROR')
    }
    throw new GmapsResolverError('URL을 불러오는 중 오류가 발생했습니다.', 'NETWORK_ERROR')
  }
}

async function resolveShortUrlWithCurl(shortUrl: string, timeoutMs: number): Promise<string | null> {
  try {
    const { execFile } = await import('node:child_process')

    const effectiveUrl = await new Promise<string>((resolve, reject) => {
      execFile(
        'curl',
        ['-Ls', '--max-time', String(Math.ceil(timeoutMs / 1000)), '-o', '/dev/null', '-w', '%{url_effective}', shortUrl],
        (error, stdout) => {
          if (error) {
            reject(error)
            return
          }
          resolve(stdout.trim())
        }
      )
    })

    return effectiveUrl || null
  } catch {
    return null
  }
}

function followRedirect(url: string, redirectsLeft: number, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    // Use Node's builtin HTTP client directly. In this route, fetch() receives a
    // durable deep-link HTML page instead of the 302 Location we need.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const http = require('node:http') as typeof import('node:http')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const https = require('node:https') as typeof import('node:https')
    const client = parsed.protocol === 'https:' ? https : http
    const request = client.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
      response => {
        response.resume()

        const location = response.headers.location
        const isRedirect =
          response.statusCode !== undefined &&
          response.statusCode >= 300 &&
          response.statusCode < 400

        if (isRedirect && location) {
          if (redirectsLeft <= 0) {
            reject(new Error('Too many redirects'))
            return
          }

          const nextUrl = new URL(location, parsed).toString()
          followRedirect(nextUrl, redirectsLeft - 1, timeoutMs).then(resolve).catch(reject)
          return
        }

        resolve(url)
      }
    )

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('AbortError'))
    })

    request.on('error', reject)
    request.end()
  })
}

/**
 * Google Maps URL에서 리스트 ID를 추출한다.
 * 지원 형식:
 *   - /maps/placelists/list/[listId]
 *   - /maps/placelists/list/[listId]/...
 *   - /maps/@/data=!...[!2s[listId]]...
 */
export function extractListId(url: string): string | null {
  try {
    const parsed = new URL(url)

    const placelistMatch = parsed.pathname.match(/\/maps\/placelists\/list\/([^/?#]+)/)
    if (placelistMatch) return placelistMatch[1]

    // Newer shared list redirects often encode the list id in the path data payload:
    // /maps/@/data=!3m1!...!2sLIST_ID!3e3
    const dataPayload = `${parsed.pathname}${parsed.search}${parsed.hash}`
    const dataMatch = dataPayload.match(/![12]s([^!/?#&]+)/)
    if (dataMatch) return dataMatch[1]

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
