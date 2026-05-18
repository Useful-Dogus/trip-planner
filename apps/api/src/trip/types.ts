// Supabase row → 내부 도메인 매핑용 타입.
// apps/web 의 TripItem 과 의도적으로 분리한다 (모노레포 내 API 워크스페이스의 독립성 확보).

export interface ItemRow {
  id: string;
  name: string;
  category: string;
  status: string | null;
  reservation_status: string | null;
  priority: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  links: unknown;
  budget: number | null;
  memo: string | null;
  date: string | null;
  end_date: string | null;
  time_start: string | null;
  time_end: string | null;
  is_franchise: boolean | null;
  branches: unknown;
  google_place_id: string | null;
  created_at: string;
  updated_at: string;
}

export const LODGING_CATEGORY = '숙박';
