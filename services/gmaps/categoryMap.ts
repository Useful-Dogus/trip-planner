import type { Category } from '@/types'

/**
 * 구글 place types → 앱 카테고리 매핑 룩업 테이블
 */
const CATEGORY_MAP: Record<string, Category> = {
  // 교통
  transit_station: '교통',
  bus_station: '교통',
  subway_station: '교통',
  train_station: '교통',
  light_rail_station: '교통',
  airport: '교통',
  taxi_stand: '교통',
  ferry_terminal: '교통',
  car_rental: '교통',
  parking: '교통',

  // 숙박
  hotel: '숙박',
  lodging: '숙박',
  motel: '숙박',
  hostel: '숙박',
  campground: '숙박',
  rv_park: '숙박',
  bed_and_breakfast: '숙박',
  guest_house: '숙박',
  vacation_rental: '숙박',

  // 식당
  restaurant: '식당',
  food: '식당',
  meal_takeaway: '식당',
  meal_delivery: '식당',
  bar: '식당',
  pub: '식당',
  fast_food_restaurant: '식당',
  japanese_restaurant: '식당',
  chinese_restaurant: '식당',
  korean_restaurant: '식당',
  italian_restaurant: '식당',
  american_restaurant: '식당',
  seafood_restaurant: '식당',
  steak_house: '식당',
  brunch_restaurant: '식당',
  barbecue_restaurant: '식당',
  pizza_restaurant: '식당',
  hamburger_restaurant: '식당',
  ramen_restaurant: '식당',
  sushi_restaurant: '식당',
  sandwich_shop: '식당',
  ice_cream_shop: '식당',
  dessert_shop: '식당',

  // 카페
  cafe: '카페',
  bakery: '카페',
  coffee_shop: '카페',
  tea_house: '카페',
  donut_shop: '카페',
  juice_bar: '카페',
  smoothie_bar: '카페',

  // 명소
  tourist_attraction: '명소',
  park: '명소',
  landmark: '명소',
  natural_feature: '명소',
  national_park: '명소',
  botanical_garden: '명소',
  palace: '명소',
  castle: '명소',
  historic_site: '명소',
  viewpoint: '명소',

  // 문화시설
  museum: '문화시설',
  art_gallery: '문화시설',
  library: '문화시설',
  temple: '문화시설',
  shrine: '문화시설',
  church: '문화시설',
  place_of_worship: '문화시설',

  // 공연·스포츠
  movie_theater: '공연·스포츠',
  theater: '공연·스포츠',
  concert_hall: '공연·스포츠',
  performing_arts_theater: '공연·스포츠',
  night_club: '공연·스포츠',
  comedy_club: '공연·스포츠',
  karaoke: '공연·스포츠',
  stadium: '공연·스포츠',
  gym: '공연·스포츠',
  sports_complex: '공연·스포츠',
  bowling_alley: '공연·스포츠',
  golf_course: '공연·스포츠',
  tennis_court: '공연·스포츠',
  swimming_pool: '공연·스포츠',
  fitness_center: '공연·스포츠',
  ski_resort: '공연·스포츠',

  // 액티비티
  amusement_park: '액티비티',
  zoo: '액티비티',
  aquarium: '액티비티',
  hiking_area: '액티비티',
  tour_agency: '액티비티',

  // 휴양
  resort: '휴양',
  spa: '휴양',

  // 쇼핑
  shopping_mall: '쇼핑',
  store: '쇼핑',
  department_store: '쇼핑',
  clothing_store: '쇼핑',
  supermarket: '쇼핑',
  convenience_store: '쇼핑',
  pharmacy: '쇼핑',
  book_store: '쇼핑',
  electronics_store: '쇼핑',
  furniture_store: '쇼핑',
  hardware_store: '쇼핑',
  jewelry_store: '쇼핑',
  shoe_store: '쇼핑',
  gift_shop: '쇼핑',
  market: '쇼핑',
  flea_market: '쇼핑',
  outlet_store: '쇼핑',
  toy_store: '쇼핑',
}

/**
 * 구글 place type 문자열을 앱 카테고리로 변환한다.
 * 매핑되지 않는 경우 "기타"를 반환한다.
 */
export function mapGoogleCategory(googleType: string | null | undefined): Category {
  if (!googleType) return '기타'

  // 직접 매핑 시도
  const direct = CATEGORY_MAP[googleType.toLowerCase()]
  if (direct) return direct

  // 부분 매핑 시도 (예: "korean_restaurant" → restaurant 키워드)
  const lower = googleType.toLowerCase()
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return cat
  }

  return '기타'
}
