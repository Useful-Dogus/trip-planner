/**
 * 비밀번호 강도 추정 — zxcvbn-ts 를 **동적 import** 로 지연 로드해 초기 번들에서 제외한다.
 * 사용자가 비밀번호를 입력하기 시작할 때만 로드된다.
 *
 * zxcvbn-ts v4 는 ZxcvbnFactory().check() 형태이고, feedback 의 warning/suggestion 은
 * 번역 키(언어팩 미설정 시 raw key)라 신뢰할 수 없어 점수(0-4)만 사용한다.
 */

type Score = 0 | 1 | 2 | 3 | 4
interface Factory {
  check(password: string): { score: number }
}

let factoryPromise: Promise<Factory> | null = null

async function loadFactory(): Promise<Factory> {
  if (!factoryPromise) {
    factoryPromise = (async () => {
      const { ZxcvbnFactory } = await import('@zxcvbn-ts/core')
      const common = await import('@zxcvbn-ts/language-common')
      return new ZxcvbnFactory({
        dictionary: common.dictionary,
        graphs: common.adjacencyGraphs,
      }) as unknown as Factory
    })()
  }
  return factoryPromise
}

export interface StrengthResult {
  /** 0(매우 약함) - 4(매우 강함) */
  score: Score
}

export async function estimateStrength(password: string): Promise<StrengthResult> {
  const factory = await loadFactory()
  const { score } = factory.check(password)
  return { score: Math.max(0, Math.min(4, score)) as Score }
}

export const STRENGTH_LABEL: Record<Score, string> = {
  0: '매우 약함',
  1: '약함',
  2: '보통',
  3: '강함',
  4: '매우 강함',
}
