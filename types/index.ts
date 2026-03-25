export type Category = '교통' | '숙소' | '식당' | '카페' | '관광' | '공연' | '스포츠' | '쇼핑' | '기타';
export type Status   = '검토중' | '보류' | '대기중' | '확정' | '탈락';
export type Priority = '반드시' | '들를만해' | '시간 남으면';

export interface Link {
  label: string;
  url:   string;
}

export interface TripItem {
  id:          string;
  name:        string;
  category:    Category;
  status:      Status;
  priority?:   Priority;
  address?:    string;
  lat?:        number;
  lng?:        number;
  links:       Link[];
  budget?:     number;
  memo?:       string;
  date?:       string;
  time_start?: string;
  time_end?:   string;
  created_at:  string;
  updated_at:  string;
}
