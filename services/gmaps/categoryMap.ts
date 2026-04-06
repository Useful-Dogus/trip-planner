import type { Category } from '@/types'

/**
 * 구글 place types → 앱 9개 카테고리 매핑 룩업 테이블
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

  // 숙소
  hotel: '숙소',
  lodging: '숙소',
  motel: '숙소',
  hostel: '숙소',
  resort: '숙소',
  campground: '숙소',
  rv_park: '숙소',
  bed_and_breakfast: '숙소',
  guest_house: '숙소',
  vacation_rental: '숙소',

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

  // 관광
  tourist_attraction: '관광',
  museum: '관광',
  park: '관광',
  amusement_park: '관광',
  zoo: '관광',
  aquarium: '관광',
  art_gallery: '관광',
  landmark: '관광',
  natural_feature: '관광',
  national_park: '관광',
  botanical_garden: '관광',
  palace: '관광',
  castle: '관광',
  temple: '관광',
  shrine: '관광',
  church: '관광',
  place_of_worship: '관광',
  historic_site: '관광',
  viewpoint: '관광',
  hiking_area: '관광',

  // 공연
  movie_theater: '공연',
  theater: '공연',
  concert_hall: '공연',
  performing_arts_theater: '공연',
  night_club: '공연',
  comedy_club: '공연',
  karaoke: '공연',

  // 스포츠
  stadium: '스포츠',
  gym: '스포츠',
  sports_complex: '스포츠',
  bowling_alley: '스포츠',
  golf_course: '스포츠',
  tennis_court: '스포츠',
  swimming_pool: '스포츠',
  fitness_center: '스포츠',
  spa: '스포츠',
  ski_resort: '스포츠',

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
