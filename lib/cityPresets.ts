// #221 도시 사전(preset) — 한국인 여행 빈도가 높은 도시의 중심 좌표·줌 내장.
// 지도 로드 경로는 외부 API 호출 없이 이 사전으로 즉시 포커싱한다(FR-007/FR-012).
// 공유 테이블이 아닌 코드 상수다(SC-004). 확장은 PR 로 추가한다.
//
// zoom 가이드: 거대 도시 11 / 일반 도시 12 / 소도시·리조트 12-13 (FR-006).

export interface CityPreset {
  /** 표시용 정식 이름 (한국어). 폼 인식 칩에 노출된다. */
  name: string
  lat: number
  lng: number
  zoom: number
  /** 한국어·영문·약어 별칭. 매칭 전 정규화된다. */
  aliases: string[]
}

export const CITY_PRESETS: CityPreset[] = [
  // ── 한국 ──────────────────────────────────────────────
  { name: '서울', lat: 37.5665, lng: 126.978, zoom: 11, aliases: ['서울', 'seoul', '서울특별시'] },
  { name: '부산', lat: 35.1796, lng: 129.0756, zoom: 12, aliases: ['부산', 'busan', '부산광역시', 'pusan'] },
  { name: '제주', lat: 33.4996, lng: 126.5312, zoom: 11, aliases: ['제주', 'jeju', '제주도', '제주시'] },
  { name: '인천', lat: 37.4563, lng: 126.7052, zoom: 12, aliases: ['인천', 'incheon', '인천광역시'] },
  { name: '대구', lat: 35.8714, lng: 128.6014, zoom: 12, aliases: ['대구', 'daegu', '대구광역시'] },
  { name: '경주', lat: 35.8562, lng: 129.2247, zoom: 12, aliases: ['경주', 'gyeongju'] },
  { name: '강릉', lat: 37.7519, lng: 128.8761, zoom: 12, aliases: ['강릉', 'gangneung'] },
  { name: '전주', lat: 35.8242, lng: 127.1479, zoom: 12, aliases: ['전주', 'jeonju'] },
  { name: '여수', lat: 34.7604, lng: 127.6622, zoom: 12, aliases: ['여수', 'yeosu'] },
  { name: '속초', lat: 38.207, lng: 128.5918, zoom: 13, aliases: ['속초', 'sokcho'] },

  // ── 일본 ──────────────────────────────────────────────
  { name: '도쿄', lat: 35.6762, lng: 139.6503, zoom: 11, aliases: ['도쿄', 'tokyo', '동경', '토쿄'] },
  { name: '오사카', lat: 34.6937, lng: 135.5023, zoom: 12, aliases: ['오사카', 'osaka', '오오사카'] },
  { name: '교토', lat: 35.0116, lng: 135.7681, zoom: 12, aliases: ['교토', 'kyoto'] },
  { name: '후쿠오카', lat: 33.5904, lng: 130.4017, zoom: 12, aliases: ['후쿠오카', 'fukuoka'] },
  { name: '삿포로', lat: 43.0618, lng: 141.3545, zoom: 12, aliases: ['삿포로', 'sapporo'] },
  { name: '나고야', lat: 35.1815, lng: 136.9066, zoom: 12, aliases: ['나고야', 'nagoya'] },
  { name: '오키나와', lat: 26.2124, lng: 127.6809, zoom: 11, aliases: ['오키나와', 'okinawa', '나하', 'naha'] },
  { name: '요코하마', lat: 35.4437, lng: 139.638, zoom: 12, aliases: ['요코하마', 'yokohama'] },
  { name: '고베', lat: 34.6901, lng: 135.1955, zoom: 12, aliases: ['고베', 'kobe'] },
  { name: '나라', lat: 34.6851, lng: 135.8048, zoom: 13, aliases: ['나라', 'nara'] },
  { name: '히로시마', lat: 34.3853, lng: 132.4553, zoom: 12, aliases: ['히로시마', 'hiroshima'] },
  { name: '벳푸', lat: 33.2846, lng: 131.4914, zoom: 13, aliases: ['벳푸', 'beppu'] },
  { name: '하코다테', lat: 41.7687, lng: 140.7288, zoom: 12, aliases: ['하코다테', 'hakodate'] },
  { name: '가나자와', lat: 36.5613, lng: 136.6562, zoom: 12, aliases: ['가나자와', 'kanazawa'] },
  { name: '센다이', lat: 38.2682, lng: 140.8694, zoom: 12, aliases: ['센다이', 'sendai'] },

  // ── 중화권 ────────────────────────────────────────────
  { name: '베이징', lat: 39.9042, lng: 116.4074, zoom: 11, aliases: ['베이징', 'beijing', '북경', 'peking'] },
  { name: '상하이', lat: 31.2304, lng: 121.4737, zoom: 11, aliases: ['상하이', 'shanghai', '상해'] },
  { name: '홍콩', lat: 22.3193, lng: 114.1694, zoom: 12, aliases: ['홍콩', 'hongkong', 'hong kong'] },
  { name: '타이베이', lat: 25.033, lng: 121.5654, zoom: 12, aliases: ['타이베이', 'taipei', '타이페이', '대북'] },
  { name: '마카오', lat: 22.1987, lng: 113.5439, zoom: 13, aliases: ['마카오', 'macau', 'macao'] },
  { name: '광저우', lat: 23.1291, lng: 113.2644, zoom: 12, aliases: ['광저우', 'guangzhou', '광주중국'] },
  { name: '선전', lat: 22.5431, lng: 114.0579, zoom: 12, aliases: ['선전', 'shenzhen', '심천'] },
  { name: '청두', lat: 30.5728, lng: 104.0668, zoom: 12, aliases: ['청두', 'chengdu', '성도'] },
  { name: '시안', lat: 34.3416, lng: 108.9398, zoom: 12, aliases: ['시안', 'xian', '서안'] },
  { name: '가오슝', lat: 22.6273, lng: 120.3014, zoom: 12, aliases: ['가오슝', 'kaohsiung', '고웅'] },

  // ── 동남아 ────────────────────────────────────────────
  { name: '방콕', lat: 13.7563, lng: 100.5018, zoom: 11, aliases: ['방콕', 'bangkok'] },
  { name: '싱가포르', lat: 1.3521, lng: 103.8198, zoom: 12, aliases: ['싱가포르', 'singapore', '싱가폴'] },
  { name: '발리', lat: -8.4095, lng: 115.1889, zoom: 11, aliases: ['발리', 'bali', '덴파사르', 'denpasar'] },
  { name: '다낭', lat: 16.0544, lng: 108.2022, zoom: 12, aliases: ['다낭', 'danang', 'da nang'] },
  { name: '하노이', lat: 21.0285, lng: 105.8542, zoom: 12, aliases: ['하노이', 'hanoi'] },
  { name: '호치민', lat: 10.8231, lng: 106.6297, zoom: 12, aliases: ['호치민', 'hochiminh', 'ho chi minh', '사이공', 'saigon'] },
  { name: '세부', lat: 10.3157, lng: 123.8854, zoom: 12, aliases: ['세부', 'cebu'] },
  { name: '쿠알라룸푸르', lat: 3.139, lng: 101.6869, zoom: 12, aliases: ['쿠알라룸푸르', 'kualalumpur', 'kuala lumpur', '쿠알라룸푸'] },
  { name: '푸켓', lat: 7.8804, lng: 98.3923, zoom: 12, aliases: ['푸켓', 'phuket'] },
  { name: '치앙마이', lat: 18.7883, lng: 98.9853, zoom: 12, aliases: ['치앙마이', 'chiangmai', 'chiang mai'] },
  { name: '보라카이', lat: 11.9674, lng: 121.9248, zoom: 13, aliases: ['보라카이', 'boracay'] },
  { name: '나트랑', lat: 12.2388, lng: 109.1967, zoom: 12, aliases: ['나트랑', 'nhatrang', 'nha trang'] },
  { name: '자카르타', lat: -6.2088, lng: 106.8456, zoom: 11, aliases: ['자카르타', 'jakarta'] },
  { name: '마닐라', lat: 14.5995, lng: 120.9842, zoom: 11, aliases: ['마닐라', 'manila'] },
  { name: '비엔티안', lat: 17.9757, lng: 102.6331, zoom: 12, aliases: ['비엔티안', 'vientiane'] },
  { name: '씨엠립', lat: 13.3671, lng: 103.8448, zoom: 12, aliases: ['씨엠립', 'siemreap', 'siem reap', '시엠립'] },
  { name: '코타키나발루', lat: 5.9804, lng: 116.0735, zoom: 12, aliases: ['코타키나발루', 'kotakinabalu', 'kota kinabalu', '코타키나바루'] },

  // ── 남아시아·중동 ─────────────────────────────────────
  { name: '두바이', lat: 25.2048, lng: 55.2708, zoom: 11, aliases: ['두바이', 'dubai'] },
  { name: '이스탄불', lat: 41.0082, lng: 28.9784, zoom: 11, aliases: ['이스탄불', 'istanbul'] },
  { name: '델리', lat: 28.6139, lng: 77.209, zoom: 11, aliases: ['델리', 'delhi', '뉴델리', 'newdelhi', 'new delhi'] },
  { name: '아부다비', lat: 24.4539, lng: 54.3773, zoom: 12, aliases: ['아부다비', 'abudhabi', 'abu dhabi'] },
  { name: '도하', lat: 25.2854, lng: 51.531, zoom: 12, aliases: ['도하', 'doha'] },

  // ── 유럽 ──────────────────────────────────────────────
  { name: '파리', lat: 48.8566, lng: 2.3522, zoom: 11, aliases: ['파리', 'paris'] },
  { name: '런던', lat: 51.5074, lng: -0.1278, zoom: 11, aliases: ['런던', 'london'] },
  { name: '로마', lat: 41.9028, lng: 12.4964, zoom: 12, aliases: ['로마', 'rome', 'roma'] },
  { name: '바르셀로나', lat: 41.3851, lng: 2.1734, zoom: 12, aliases: ['바르셀로나', 'barcelona'] },
  { name: '마드리드', lat: 40.4168, lng: -3.7038, zoom: 12, aliases: ['마드리드', 'madrid'] },
  { name: '암스테르담', lat: 52.3676, lng: 4.9041, zoom: 12, aliases: ['암스테르담', 'amsterdam'] },
  { name: '베를린', lat: 52.52, lng: 13.405, zoom: 11, aliases: ['베를린', 'berlin'] },
  { name: '뮌헨', lat: 48.1351, lng: 11.582, zoom: 12, aliases: ['뮌헨', 'munich', 'munchen', 'München'] },
  { name: '프라하', lat: 50.0755, lng: 14.4378, zoom: 12, aliases: ['프라하', 'prague', 'praha'] },
  { name: '비엔나', lat: 48.2082, lng: 16.3738, zoom: 12, aliases: ['비엔나', 'vienna', '빈', 'wien'] },
  { name: '취리히', lat: 47.3769, lng: 8.5417, zoom: 12, aliases: ['취리히', 'zurich'] },
  { name: '인터라켄', lat: 46.6863, lng: 7.8632, zoom: 13, aliases: ['인터라켄', 'interlaken'] },
  { name: '베네치아', lat: 45.4408, lng: 12.3155, zoom: 13, aliases: ['베네치아', 'venice', 'venezia', '베니스'] },
  { name: '피렌체', lat: 43.7696, lng: 11.2558, zoom: 12, aliases: ['피렌체', 'florence', 'firenze'] },
  { name: '밀라노', lat: 45.4642, lng: 9.19, zoom: 12, aliases: ['밀라노', 'milan', 'milano'] },
  { name: '나폴리', lat: 40.8518, lng: 14.2681, zoom: 12, aliases: ['나폴리', 'naples', 'napoli'] },
  { name: '리스본', lat: 38.7223, lng: -9.1393, zoom: 12, aliases: ['리스본', 'lisbon', 'lisboa'] },
  { name: '포르투', lat: 41.1579, lng: -8.6291, zoom: 12, aliases: ['포르투', 'porto', 'oporto'] },
  { name: '브뤼셀', lat: 50.8503, lng: 4.3517, zoom: 12, aliases: ['브뤼셀', 'brussels', 'bruxelles'] },
  { name: '코펜하겐', lat: 55.6761, lng: 12.5683, zoom: 12, aliases: ['코펜하겐', 'copenhagen'] },
  { name: '스톡홀름', lat: 59.3293, lng: 18.0686, zoom: 12, aliases: ['스톡홀름', 'stockholm'] },
  { name: '헬싱키', lat: 60.1699, lng: 24.9384, zoom: 12, aliases: ['헬싱키', 'helsinki'] },
  { name: '오슬로', lat: 59.9139, lng: 10.7522, zoom: 12, aliases: ['오슬로', 'oslo'] },
  { name: '레이캬비크', lat: 64.1466, lng: -21.9426, zoom: 12, aliases: ['레이캬비크', 'reykjavik', '레이캬빅'] },
  { name: '더블린', lat: 53.3498, lng: -6.2603, zoom: 12, aliases: ['더블린', 'dublin'] },
  { name: '에든버러', lat: 55.9533, lng: -3.1883, zoom: 12, aliases: ['에든버러', 'edinburgh', '에딘버러'] },
  { name: '아테네', lat: 37.9838, lng: 23.7275, zoom: 12, aliases: ['아테네', 'athens', 'athina'] },
  { name: '산토리니', lat: 36.3932, lng: 25.4615, zoom: 12, aliases: ['산토리니', 'santorini'] },
  { name: '부다페스트', lat: 47.4979, lng: 19.0402, zoom: 12, aliases: ['부다페스트', 'budapest'] },
  { name: '바르샤바', lat: 52.2297, lng: 21.0122, zoom: 12, aliases: ['바르샤바', 'warsaw', 'warszawa'] },
  { name: '크라쿠프', lat: 50.0647, lng: 19.945, zoom: 12, aliases: ['크라쿠프', 'krakow', 'cracow'] },
  { name: '니스', lat: 43.7102, lng: 7.262, zoom: 12, aliases: ['니스', 'nice'] },
  { name: '인스브루크', lat: 47.2692, lng: 11.4041, zoom: 12, aliases: ['인스브루크', 'innsbruck'] },
  { name: '두브로브니크', lat: 42.6507, lng: 18.0944, zoom: 13, aliases: ['두브로브니크', 'dubrovnik'] },
  { name: '자그레브', lat: 45.815, lng: 15.9819, zoom: 12, aliases: ['자그레브', 'zagreb'] },

  // ── 북미 ──────────────────────────────────────────────
  { name: '뉴욕', lat: 40.7128, lng: -74.006, zoom: 11, aliases: ['뉴욕', 'newyork', 'new york', 'nyc'] },
  { name: '로스앤젤레스', lat: 34.0522, lng: -118.2437, zoom: 11, aliases: ['로스앤젤레스', 'losangeles', 'los angeles', 'la', '엘에이', '로스엔젤레스'] },
  { name: '샌프란시스코', lat: 37.7749, lng: -122.4194, zoom: 12, aliases: ['샌프란시스코', 'sanfrancisco', 'san francisco', 'sf'] },
  { name: '라스베이거스', lat: 36.1699, lng: -115.1398, zoom: 12, aliases: ['라스베이거스', 'lasvegas', 'las vegas', '라스베가스'] },
  { name: '시애틀', lat: 47.6062, lng: -122.3321, zoom: 12, aliases: ['시애틀', 'seattle'] },
  { name: '시카고', lat: 41.8781, lng: -87.6298, zoom: 11, aliases: ['시카고', 'chicago'] },
  { name: '보스턴', lat: 42.3601, lng: -71.0589, zoom: 12, aliases: ['보스턴', 'boston'] },
  { name: '워싱턴', lat: 38.9072, lng: -77.0369, zoom: 12, aliases: ['워싱턴', 'washington', 'washington dc', 'dc'] },
  { name: '하와이', lat: 21.3069, lng: -157.8583, zoom: 11, aliases: ['하와이', 'hawaii', '호놀룰루', 'honolulu', '와이키키'] },
  { name: '밴쿠버', lat: 49.2827, lng: -123.1207, zoom: 12, aliases: ['밴쿠버', 'vancouver'] },
  { name: '토론토', lat: 43.6532, lng: -79.3832, zoom: 11, aliases: ['토론토', 'toronto'] },
  { name: '올랜도', lat: 28.5383, lng: -81.3792, zoom: 12, aliases: ['올랜도', 'orlando'] },
  { name: '마이애미', lat: 25.7617, lng: -80.1918, zoom: 12, aliases: ['마이애미', 'miami'] },
  { name: '멕시코시티', lat: 19.4326, lng: -99.1332, zoom: 11, aliases: ['멕시코시티', 'mexicocity', 'mexico city'] },
  { name: '칸쿤', lat: 21.1619, lng: -86.8515, zoom: 12, aliases: ['칸쿤', 'cancun'] },

  // ── 오세아니아 ────────────────────────────────────────
  { name: '시드니', lat: -33.8688, lng: 151.2093, zoom: 11, aliases: ['시드니', 'sydney'] },
  { name: '멜버른', lat: -37.8136, lng: 144.9631, zoom: 11, aliases: ['멜버른', 'melbourne', '멜번'] },
  { name: '브리즈번', lat: -27.4698, lng: 153.0251, zoom: 12, aliases: ['브리즈번', 'brisbane'] },
  { name: '오클랜드', lat: -36.8485, lng: 174.7633, zoom: 12, aliases: ['오클랜드', 'auckland'] },
  { name: '퀸스타운', lat: -45.0312, lng: 168.6626, zoom: 12, aliases: ['퀸스타운', 'queenstown'] },
  { name: '괌', lat: 13.4443, lng: 144.7937, zoom: 12, aliases: ['괌', 'guam'] },
  { name: '사이판', lat: 15.1779, lng: 145.7504, zoom: 12, aliases: ['사이판', 'saipan'] },

  // ── 남미·아프리카 ─────────────────────────────────────
  { name: '리우데자네이루', lat: -22.9068, lng: -43.1729, zoom: 11, aliases: ['리우데자네이루', 'riodejaneiro', 'rio de janeiro', '리우'] },
  { name: '부에노스아이레스', lat: -34.6037, lng: -58.3816, zoom: 11, aliases: ['부에노스아이레스', 'buenosaires', 'buenos aires'] },
  { name: '쿠스코', lat: -13.5319, lng: -71.9675, zoom: 12, aliases: ['쿠스코', 'cusco', 'cuzco'] },
  { name: '케이프타운', lat: -33.9249, lng: 18.4241, zoom: 11, aliases: ['케이프타운', 'capetown', 'cape town'] },
  { name: '카이로', lat: 30.0444, lng: 31.2357, zoom: 11, aliases: ['카이로', 'cairo'] },
  { name: '마라케시', lat: 31.6295, lng: -7.9811, zoom: 12, aliases: ['마라케시', 'marrakesh', 'marrakech'] },
]

const TRAVEL_WORDS = [
  '여행기',
  '여행',
  '트립',
  'trip',
  'travel',
  '투어',
  'tour',
  '출장',
  '워케이션',
  '신혼여행',
  '가족여행',
]

/**
 * 매칭 전 정규화: NFC, 소문자화, 공백·구두점·기호 제거.
 * 한글·CJK·라틴·숫자만 남긴다.
 */
export function normalizeRegion(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣぀-ヿ一-鿿]/g, '')
}

/** 입력 양끝에 붙은 여행 관련 단어를 제거해 도시명 본체를 추출한다. */
function stripTravelWords(s: string): string {
  let cur = s
  let changed = true
  while (changed) {
    changed = false
    for (const w of TRAVEL_WORDS) {
      const nw = normalizeRegion(w)
      if (cur.length > nw.length && cur.endsWith(nw)) {
        cur = cur.slice(0, cur.length - nw.length)
        changed = true
      }
      if (cur.length > nw.length && cur.startsWith(nw)) {
        cur = cur.slice(nw.length)
        changed = true
      }
    }
  }
  return cur
}

/**
 * region 텍스트를 도시 사전과 매칭한다.
 *
 * false positive 최소화(FR-005a): 위험한 `includes` substring 매칭을 쓰지 않는다.
 * - 1순위: 여행 단어 제거 후 정규화 입력이 별칭과 정확히 일치.
 * - 2순위: 정규화 입력이 별칭으로 시작/끝남(별칭 길이 ≥ 2).
 * 여러 후보가 매칭되면 (정확 일치 우선, 그다음 별칭 길이가 긴 것) 1개를 고른다.
 * 예) "후쿠오카여행" → "후쿠오카"(정확) 매칭, "오사카" 의 부분문자열 오탐 없음.
 */
export function matchCityPreset(region: string | null | undefined): CityPreset | null {
  if (!region || !region.trim()) return null
  const normalized = normalizeRegion(region)
  if (!normalized) return null
  const stripped = stripTravelWords(normalized) || normalized

  let best: { preset: CityPreset; exact: boolean; len: number } | null = null

  for (const preset of CITY_PRESETS) {
    for (const alias of preset.aliases) {
      const a = normalizeRegion(alias)
      if (!a || a.length < 2) continue

      const exact = stripped === a || normalized === a
      // 짧은 별칭(la, sf, dc, 빈 등)은 boundary 매칭에서 제외 — 정확 일치만 허용.
      const boundary =
        !exact &&
        a.length >= 3 &&
        (normalized.startsWith(a) ||
          normalized.endsWith(a) ||
          stripped.startsWith(a) ||
          stripped.endsWith(a))

      if (!exact && !boundary) continue

      const candidate = { preset, exact, len: a.length }
      if (
        !best ||
        (candidate.exact && !best.exact) ||
        (candidate.exact === best.exact && candidate.len > best.len)
      ) {
        best = candidate
      }
    }
  }

  return best?.preset ?? null
}
