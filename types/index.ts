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
export type Status = '아이디어' | '검토' | '확정' | '제외'
export type ReservationStatus = '확인 필요' | '불필요' | '필요(미예약)' | '예약완료'
export type Priority = '반드시' | '들를만해' | '시간 남으면'

export interface Link {
  label: string
  url: string
}

export interface Branch {
  id: string
  name: string
  address?: string
  lat?: number
  lng?: number
}

export interface TripItem {
  id: string
  name: string
  category: Category
  status: Status
  reservation_status?: ReservationStatus | null
  priority?: Priority
  address?: string
  lat?: number
  lng?: number
  links: Link[]
  budget?: number
  memo?: string
  date?: string
  end_date?: string
  time_start?: string
  time_end?: string
  is_franchise?: boolean
  branches?: Branch[]
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
