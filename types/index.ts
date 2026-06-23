export type Category =
  | '교통'
  | '숙박'
  | '명소'
  | '식당'
  | '카페'
  | '쇼핑'
  | '문화시설'
  | '공연·스포츠'
  | '액티비티'
  | '휴양'
  | '기타'
export type TripPriority = '검토 필요' | '시간 되면' | '가고 싶음' | '확정' | '제외'
export type ReservationStatus = '확인 필요' | '불필요' | '필요(미예약)' | '예약완료'
/** 여행 후 만족도(#264). 다음 추천 가중치 입력 — 좋았음/괜찮음/아쉬움. */
export type Satisfaction = '좋았어요' | '괜찮아요' | '아쉬웠어요'

export interface Link {
  label: string
  url: string
}

export interface TripItem {
  id: string
  name: string
  category: Category
  trip_priority: TripPriority
  reservation_status?: ReservationStatus | null
  address?: string
  lat?: number
  lng?: number
  links: Link[]
  budget?: number
  memo?: string
  /** 보류/탈락 사유 한 줄 — "이거 왜 뺐더라" (#259, 선택 입력). */
  decision_reason?: string | null
  /** 여행 후 만족도(#264, 선택 입력). 추천 루프 입력. */
  satisfaction?: Satisfaction | null
  date?: string
  end_date?: string
  time_start?: string
  time_end?: string
  /** 마지막 입장 시각 HH:MM (#261, 선택). 계획 시각이 이보다 늦으면 경고. */
  last_entry_time?: string | null
  /** 예약 마감일 YYYY-MM-DD (#261, 선택). 지났는데 미예약이면 경고. */
  reservation_deadline?: string | null
  google_place_id?: string | null
  created_at: string
  updated_at: string
}

export interface GooglePlace {
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  googlePlaceId: string | null
  googleCategory: string | null
}

export type ImportStatus = 'new' | 'similar' | 'duplicate'

export interface ImportCandidate {
  place: GooglePlace
  status: ImportStatus
  similarItem?: {
    id: string
    name: string
  }
  selected: boolean
  mappedCategory: Category
}
