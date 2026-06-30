# trip-planner 디자인 가이드라인

> Shopify Polaris, Apple Human Interface Guidelines, Microsoft Fluent 2 의 핵심 원칙을 trip-planner 의 맥락(지도 + 사이드 패널 + 일자별 타임라인 + 후보 카드, Next.js 14 + Tailwind, 모바일·데스크톱 동시 지원, 한국어 UI)에 맞춰 정리한 단일 가이드입니다.
>
> 신규 화면·컴포넌트를 디자인하거나 기존 UI 를 수정할 때 이 문서를 먼저 참고합니다. 명시된 토큰·수치는 Tailwind 클래스로 직접 매핑되도록 작성되어 있습니다.
>
> **출처별 신뢰도 메모**
> - Polaris: 16 페이지 본문 fetch 기반. 일부 수치 토큰은 별도 토큰 페이지에 있어 본문에서 추출되지 않음.
> - Fluent 2: 12 페이지 본문 fetch 기반. 토큰까지 대부분 확보.
> - Apple HIG: SPA 구조로 본문 fetch 불가. 일반에 잘 알려진 표준값(44pt 터치타겟, 4.5:1 대비, Dynamic Type, Reduced Motion 등)만 보수적으로 인용.

---

## 0. 핵심 디자인 원칙

세 시스템에서 공통적으로 강조되는 6가지 원칙을 trip-planner 의 합의 기준으로 채택합니다.

| 원칙 | 의미 | trip-planner 에서의 의미 |
|---|---|---|
| **Clarity (명료성)** | 모든 크기에서 텍스트가 읽히고 아이콘 의미가 분명 | 카드 제목·일자 라벨이 핵심, 데코는 최소 |
| **Hierarchy (위계)** | 크기/굵기/색/위치 조합으로 중요도를 즉시 인지 | 일자 헤더 > 카드 제목 > 메타. 색만으로 위계 만들지 않기 |
| **Deference (콘텐츠 우선)** | UI 크롬은 콘텐츠를 가리지 않음 | 지도가 1순위. 사이드 패널·바텀시트는 가벼운 보더와 절제된 그림자 |
| **Consistency (일관성)** | 같은 동작 → 같은 모양·같은 위치 | 후보 카드와 일자 카드는 동일 컴포넌트 공유 |
| **Built for focus (집중)** | 시각적 잡음 제거, 사용자가 다음 행동에 집중 | 모바일에서 보조 정보를 줄이고 핵심 액션만 노출 |
| **Considerate (배려)** | 접근성·포함성·복구 가능성 | 색맹·키보드·스크린리더·reduced-motion 안전성을 디폴트로 |

작은 결정에서 망설일 때 위 원칙으로 되돌아가서 결정합니다.

---

## 1. 정보 위계 (Information Architecture)

- **3축 네비게이션**(Polaris): Structural(페이지 골격) / Associative(컨텍스트 링크) / Utility(검색·계정).
- **Single Source, Multiple Doors**: 같은 데이터는 한 곳에 저장하고 여러 진입점에서 링크.
- **Progressive disclosure**: 한 화면에 모든 정보를 욱여넣지 않고, 필요할 때 펼침.
- **2/3 + 1/3 컬럼**(Polaris Resource Details): 좌측 본질 정보, 우측 메타·요약.

**trip-planner 에 적용**
- "후보 아이템"은 단일 소스. 지도 마커, 일자 타임라인, 검색 결과 모두 같은 데이터를 가리킨다.
- 모드 토글(후보/일자)은 utility, 일자 그리드는 structural, 핀↔카드 연결은 associative.
- 데스크톱 일자 상세는 좌측 2/3 타임라인(시간·이동거리·메모) + 우측 1/3 메타(총 거리·예산·숙소). 모바일은 stack.
- 카드 헤더에 CTA 두지 않음. 우측 tertiary icon button(편집/삭제) + tooltip 으로 분리.

---

## 2. 타이포그래피

### 2.1 폰트 스택

```
font-family: "Pretendard Variable", "Pretendard",
             system-ui, -apple-system,
             "Apple SD Gothic Neo", "Noto Sans KR",
             "Segoe UI", sans-serif;
```

- 한국어 본문 가독성을 위해 Pretendard 우선. 라틴은 system-ui 가 자연스러움.
- 표·시간·거리에는 `tabular-nums`(Tailwind: `tabular-nums`).

### 2.2 타입 스케일 (Fluent 2 ramp 기반, trip-planner 매핑)

| 역할 | 사이즈/라인 | Weight | Tailwind |
|---|---|---|---|
| Caption 2 | 10/14 | Regular | `text-[10px] leading-[14px]` |
| Caption 1 (메타) | 12/16 | Regular/Medium | `text-xs` |
| Body (기본) | 14/20 | Regular/Semibold | `text-sm` |
| Subtitle 2 (카드 제목·일자 라벨) | 16/22 | Semibold | `text-base font-semibold` |
| Subtitle 1 (섹션 헤더) | 20/26 | Semibold | `text-xl font-semibold` |
| Title 3 (페이지 헤더) | 24/32 | Semibold | `text-2xl font-semibold` |
| Title 2 | 28/36 | Semibold | `text-[28px] leading-9 font-semibold` |
| Title 1 (랜딩) | 32/40 | Semibold | `text-[32px] leading-10 font-semibold` |

### 2.3 한국어 적용 규칙

- 본문 **15-16px** 이하로 내리지 않는다. 한글은 같은 사이즈에서 라틴보다 시각적으로 가벼워 보임.
- 한글에는 **SemiBold(600)** 가독성이 좋음. **Light/Thin(300 이하) 금지**.
- 자간(`tracking-tight` 정도, -0.01em) 미세 보정. 영문 머리글자 약어에는 `tracking-wide`.
- `leading` 은 본문 1.5, 헤딩 1.25 비율 유지(Fluent ramp 자연 정합).

### 2.4 위계 만드는 법

- 색만으로 위계를 만들지 않는다. **size + weight + color + 위치** 조합.
- 같은 페이지에서 **굵기는 3종 이내**(Regular / Medium / Semibold) 유지. Bold(700+) 는 강조 한정.
- 같은 종류의 반복 요소는 동일 스타일(폰트 사이즈·색·간격) 고정.

---

## 3. 컬러

### 3.1 토큰 체계 (alias 우선, hex 직접 사용 금지)

CSS 변수로 시맨틱 토큰을 정의하고 Tailwind theme 에서 참조합니다. 토큰은 `R G B` 삼중값으로 두고 `rgb(var(--token))` / `rgb(var(--token) / .5)` 로 소비합니다.

> **브랜드 팔레트 (Waypost)**: 쿨 그레이 바탕 + 잉크 네이비 + 브라스 강조. 정본·도출 근거는 [brand.md](brand.md) §6 을 따릅니다(이슈 #231). 아래는 그 정본을 시맨틱 토큰으로 옮긴 것이며, 실제 `app/globals.css` 적용은 #228 에서 수행합니다. 종이/세피아 바탕·채도 높은 주황·네온은 금지.

```css
/* app/globals.css */
:root {
  /* surface — 페이지는 쿨 그레이, 카드는 흰색으로 떠 보이게.
     중립 회색은 무채색이 아니라 잉크네이비(hue ~217°) 틴트를 실은 쿨 스케일이다
     — 명도(g 채널)는 두고 b↑·r↓ 로만 색을 입혀 '쌩 회색'을 금지(#327). */
  --bg:            243 246 250;   /* #F3F6FA cool gray (navy tint) */
  --bg-subtle:     234 238 244;   /* #EAEEF4 */
  --bg-elevated:   255 255 255;   /* #FFFFFF 카드·패널 */
  --bg-overlay:    15 23 42;      /* rgb(var(--bg-overlay) / .30) */
  /* text — 검정 대신 잉크 네이비 */
  --fg:            22 36 63;      /* #16243F ink navy */
  --fg-muted:      74 88 110;     /* #4A586E */
  --fg-subtle:     137 149 166;   /* #8995A6 placeholder */
  --fg-on-accent:  255 255 255;   /* #FFFFFF */
  /* line — 표면과 같은 잉크네이비 틴트 스케일 */
  --border:        224 231 240;   /* #E0E7F0 */
  --border-strong: 207 217 231;   /* #CFD9E7 */
  /* status (기능색 — 브랜드 강조와 별개, 의미 전달 전용) */
  --success-bg:    236 253 245;  --success-fg:  4 120 87;
  --warning-bg:    254 243 199;  --warning-fg:  146 64 14;
  --critical-bg:   254 242 242;  --critical-fg: 185 28 28;
  --info-bg:       239 246 255;  --info-fg:     29 78 216;
  /* accent — 브라스 (CTA·활성·동선/핀 등 의미 있는 곳에만, 절제) */
  --accent:        151 118 47;    /* #97762F brass */
  --accent-hover:  126 99 38;     /* #7E6326 */
  --accent-subtle: 241 234 216;   /* #F1EAD8 */
}

/* 다크 모드: 명도 반전이 아니라 층 구조 (Apple HIG, Fluent 2) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:            18 24 33;     /* #121821 */
    --bg-subtle:     24 32 44;     /* #18202C */
    --bg-elevated:   27 36 48;     /* #1B2430 */
    --fg:            230 235 241;  /* #E6EBF1 */
    --fg-muted:      159 176 196;  /* #9FB0C4 */
    --fg-subtle:     107 122 140;  /* #6B7A8C */
    --fg-on-accent:  26 20 4;      /* #1A1404 */
    --border:        42 51 66;     /* #2A3342 */
    --border-strong: 58 68 86;     /* #3A4456 */
    --accent:        198 160 78;   /* #C6A04E brass, 다크에서 밝게 */
    --accent-hover:  216 184 106;  /* #D8B86A */
    --accent-subtle: 51 43 20;     /* #332B14 */
    /* status: 다크에서 채도 -10%, 명도 +15% (Fluent 권장) */
  }
}
```

### 3.2 색 사용 규칙

- **Status 색은 의미 전달에만**(Polaris/Fluent 공통). 장식 X.
  - Red = critical/error / Yellow = warning(critical 로 번질 수 있음) / Green = success / Blue = info.
- **흑백 베이스 + 강조색은 드물게**. 모든 곳에 컬러를 박지 않는다.
- **컬러 단독으로 의미 전달 금지**(세 시스템 공통). 색 + 아이콘 + 텍스트 라벨 3중 신호.
- **다크모드는 단순 반전이 아닌 층 구조**: Base → Elevated 갈수록 한 단계씩 밝아짐.
- **카테고리 색**(현재 hex 11종)은 Tailwind theme 의 `colors.category.{transit|stay|sight|food|cafe|shop|culture|show|activity|leisure|other}` 로 alias 등록 후 사용.

### 3.3 명도 대비 (WCAG 2.1 AA, Polaris 와 동일 목표)

| 대상 | 최소 대비 |
|---|---|
| 본문 텍스트 (< 18px or < 14px Bold) | **4.5:1** |
| 큰 텍스트 (≥ 18px or ≥ 14px Bold) | **3:1** |
| UI 컴포넌트·아이콘·그래픽 | **3:1** |
| 비활성(disabled) 텍스트 | 3:1 권장 |

지도 위 텍스트나 placeholder 도 위 기준에서 예외 두지 않는다.

---

## 4. 레이아웃 / Spacing / 반응형

### 4.1 4px 베이스 그리드

모든 spacing/size 는 **4 의 배수**만 사용(Fluent 2). Tailwind 기본 스케일과 자연 정합. 변칙 padding(예: `p-[7px]`) 금지.

| Polaris token | px | Tailwind | 용도 |
|---|---|---|---|
| space-100 | 4 | `gap-1`, `p-1` | 폼 라벨↔인풋, 강한 관계 |
| space-200 | 8 | `gap-2`, `p-2` | 섹션 내부 콘텐츠 분리 |
| space-300 | 12 | `gap-3`, `p-3` | 폼 항목 간 |
| **space-400** | 16 | `gap-4`, `p-4` | **카드 패딩, 섹션 간 분리(기본)** |
| space-500 | 20 | `gap-5`, `p-5` | 큰 섹션 |
| space-600 | 24 | `gap-6`, `p-6` | 페이지 마진 (모바일) |
| space-800 | 32 | `gap-8`, `p-8` | 페이지 마진 (데스크톱) |

중첩 컨테이너로 갈수록 패딩을 한 단계 줄인다(예: 페이지 24 → 카드 16 → 카드 내부 섹션 8).

### 4.2 터치 타겟

- **모바일 최소 44×44 px**(Apple HIG). `min-h-11 min-w-11` 또는 padding 으로 시각 크기보다 hit area 가 클 수 있게.
- 데스크톱 마우스는 28px 까지 허용 가능하나 **인접 버튼 간 최소 8px 간격**.
- 작은 칩·아이콘 버튼은 시각적으로 작더라도 padding/`::after` 로 hit area 확장.

### 4.3 브레이크포인트 (Fluent 2 + Tailwind 매핑)

| 이름 | 폭 | Tailwind | 패턴 |
|---|---|---|---|
| small | 320-479 | (default) | 1열 stack, 바텀시트, FAB |
| medium | 480-639 | `sm:` | 카드 2열 가능 |
| large | 640-1023 | `md:` | 사이드 패널 좌측 시도 |
| x-large | 1024-1365 | `lg:` | **사이드 패널 좌측 고정 + 지도 65%+** |
| xx-large | 1366-1919 | `xl:` | 컨텐츠 영역 최대 폭 제한 |

반응형 5가지 기법(Fluent): **reposition / resize / reflow / show-hide / re-architect**. 모바일 ↔ 데스크톱 전환은 단순 resize 가 아닌 **re-architect**(바텀시트 ↔ 좌측 고정 패널) 가 기본.

### 4.4 컨테이너 / Safe area

- iOS 노치/홈 인디케이터 영역은 `env(safe-area-inset-*)` 적용.
- **`user-scalable=no` 금지**(Apple HIG, 접근성). 사용자 확대를 막지 않는다.
- 데스크톱 본문 컨테이너 최대 폭 720-960px(가독 줄 길이 45-75자).

### 4.5 모바일 레이아웃 3원칙 (이슈 #300 — 좁은 화면 편안함)

좁은 화면에서 반복되던 결함(텍스트 잘림·주요 액션 below-the-fold·크롬 잠식)을 막는 강제 규칙이다.

**① 확인·컨텍스트 값은 `truncate` 금지.**
- `truncate` 는 **목록 미리보기**(카드·테이블 셀에서 한 줄 압축)에만 허용한다.
- "이걸로 확정합니다" 류 **확인 화면**, 트립 제목·기간 같은 **컨텍스트**, 상세 보기에서는 값을 끝까지 보여준다. 길면 `break-words` 로 줄바꿈하거나, 잘리면 안 되는 부분(예: 기간의 종료일)을 `shrink-0 whitespace-nowrap` 로 분리한다.
- 판별: *사용자가 이 값을 검증/신뢰해야 하는가?* → 그렇다면 truncate 금지. (예: 마법사 확인 단계 #294, 트립 헤더 기간 #291.)

**② 주요 액션은 sticky 푸터로 항상 도달 가능하게.**
- 긴 목록 뒤에 주요/탈출 액션을 그냥 두면 모바일에서 below-the-fold 가 된다.
- 공통 `components/UI/StickyActionBar` 를 사용한다(하단 고정 + 상단 보더 + backdrop). (예: gmaps 연동 "다른 URL 입력" #299.)

**③ 크롬에 상주 컨트롤을 최소화.**
- 한 번 정하면 거의 안 바꾸는 설정성 컨트롤(테마 토글 등)은 헤더·플로팅으로 상주시키지 않고 **유저메뉴/더보기 시트**에 넣는다(좁은 화면 잠식·중복 방지). (예: 테마 토글 크롬 추방 #291.)

---

## 5. Depth / Elevation

### 5.1 Shadow 단계 (Fluent 2)

Key + Ambient 2종 합성, 14% opacity 기본. trip-planner 매핑:

| 단계 | 사용처 | Tailwind |
|---|---|---|
| Shadow 2 | 카드, FAB(평상시) | `shadow-sm` |
| Shadow 4 | 그리드/리스트 hover | `shadow` |
| Shadow 8 | 커맨드바, 툴팁 | `shadow-md` |
| Shadow 16 | 콜아웃, 떠 있는 hover 카드 | `shadow-lg` |
| Shadow 28 | **모바일 바텀시트, 사이드 패널** | `shadow-xl` |
| Shadow 64 | 다이얼로그, 모달 | `shadow-2xl` |

### 5.2 사용 규칙

- **인터랙션 가능성 신호로만**(Polaris). 비-인터랙티브에 그림자 X.
- **부모를 벗어나는 protrusion 금지**(Polaris).
- depth 는 시각만으로 전달되지 않으므로 **다른 신호 병행**(예: 선택은 그림자 대신 ring + 좌측 accent bar).
- 데스크톱 좌측 사이드 패널은 Shadow 4-8 정도로 절제, 모바일 바텀시트는 Shadow 28.

---

## 6. Shape / Corner Radius (Fluent 2)

| 토큰 | px | 용도 | Tailwind |
|---|---|---|---|
| None | 0 | 풀블리드 영역, 표 | `rounded-none` |
| Small | 2 | 작은 칩, 인풋 보조 | `rounded-sm` |
| **Medium** | 4 | **인풋, 작은 버튼(기본)** | `rounded` |
| Large | 8 | **카드, 큰 버튼** | `rounded-lg` |
| X-Large | 12 | 패널, 바텀시트 | `rounded-xl` |
| 2X-Large | 16 | 모달 시트 상단 | `rounded-2xl` (`rounded-t-2xl`) |
| Circle | 50% | 아바타, 핀 라벨, FAB | `rounded-full` |

현재 코드의 혼재(`rounded-lg`/`rounded-xl`/`rounded-t-2xl`)를 위 표에 맞춰 정렬할 것.

---

## 7. 모션

### 7.1 Duration / Easing 토큰

세 시스템 공통 권장(Fluent 는 정확한 ms 미공개, 업계 관행 + Polaris 의 "snappy" 기준):

| 용도 | duration | easing |
|---|---|---|
| 마이크로(hover, ripple) | 100-150ms | `ease-out` |
| 패널·바텀시트 진입 | 200-250ms | `ease-out` |
| 패널 이탈 | 150-200ms | `ease-in` |
| 컨테이너 transform / 리사이즈 | 250-300ms | `ease-in-out` |
| 지도 fly-to | 400-500ms | `ease-in-out` |
| 큰 페이지 전환 | 300-400ms | `ease-in-out` |

### 7.2 사용 규칙

- **Purposeful**(Polaris): 장식 모션 금지. 상태 변화·관계·연속성을 전달할 때만.
- **Snappy**(Polaris): 사용자를 기다리게 하지 않을 만큼 짧게.
- 큰 요소일수록 약간 더 길게, 작은 요소는 짧게.
- 일자 그리드 등장처럼 여러 카드 동시 등장 시 **staggering(50ms 간격)** 으로 시선 유도.
- **`prefers-reduced-motion: reduce` 시 transform/슬라이드 → fade 또는 즉시 전환**(Apple HIG, Fluent 2).
- linear easing 은 회전/스피너에만.

---

## 8. 아이콘

### 8.1 라이브러리

- **lucide-react** 를 단일 패밀리로 채택. 인라인 SVG · 이모지 단독 사용 금지.
- 기본 `strokeWidth={2}` (lucide-react 기본값). 자체 그리기 금지.
- 카테고리 표시는 **반드시 `CATEGORY_META[category].Icon` 사용** (`lib/itemOptions.ts`).
  지도 마커는 `categoryIconSvg(category, ...)` (`lib/categoryIcon.ts`) 으로 SVG 문자열 생성 후 Leaflet `divIcon` 에 임베드.

### 8.2 사이즈 (Fluent 2)

| 크기 | 용도 |
|---|---|
| 12px | 정보 표시 전용(별점, 거리 인디케이터, 칩 leading). 인터랙션 X |
| 14px | 지도 마커 안 (`tp-chip-marker`) |
| 16px | 인라인 텍스트 옆, 메타 |
| 18px | 카드 헤더 카테고리 아이콘 (모바일 일정 카드) |
| **20px** | **버튼·툴바 표준** |
| 24px | 지도 마커, 강조 |
| 32-48px | 빈 상태(`EmptyState`) — `size-10` (page), `size-7` (inline) |

### 8.3 카테고리 매핑 (`CATEGORY_META`)

| Category | lucide | color (alias) | 용도 |
|---|---|---|---|
| 교통 | `Bus` | slate-400 | 이동 수단 |
| 숙박 | `Hotel` | sky-400 | 호텔·에어비앤비 |
| 명소 | `Landmark` | orange-400 | 관광 명소 |
| 식당 | `UtensilsCrossed` | red-400 | 식사 |
| 카페 | `Coffee` | amber-700 | 카페·디저트 |
| 쇼핑 | `ShoppingBag` | pink-400 | 쇼핑 |
| 문화시설 | `Palette` | violet-400 | 미술관·박물관·갤러리 |
| 공연·스포츠 | `Drama` | emerald-400 | 콘서트·경기 |
| 액티비티 | `Target` | amber-400 | 체험 |
| 휴양 | `Palmtree` | green-400 | 자연·휴식 |
| 기타 | `Bookmark` | slate-300 | 미분류 |

색은 dot/leading 보조용. **칩 배경 전체를 카테고리 색으로 덮지 않는다** (§ 12.5 참고).

### 8.3 스타일 (Fluent 2)

- **Regular**: 평상시·비선택. 네비게이션, 액션 기본.
- **Filled**: 선택 상태 / 작은 사이즈에서 가독성 보강 / 강조.
- 같은 위치의 토글은 Regular ↔ Filled 로 상태 표현(예: 즐겨찾기 별).

### 8.4 접근성

- 의미 있는 아이콘에는 **`aria-label` 필수**(아이콘 단독 버튼).
- 장식 아이콘은 `aria-hidden="true"`.
- 보편 메타포만 사용(Polaris). 문화 특수 메타포 X.

---

## 9. 상호작용 상태

5가지 상태를 모든 인터랙티브 요소에서 정의:

| 상태 | 신호 |
|---|---|
| **rest** | 기본 |
| **hover** | 배경 톤 +1 단계(예: `hover:bg-gray-50`), shadow 살짝 |
| **focus-visible** | **2px ring** (`focus-visible:ring-2 focus-visible:ring-offset-2`). 마우스 hover 와 시각 구분 |
| **pressed/active** | 살짝 어둡게 + 그림자 -1 |
| **selected** | **ring + 좌측 accent bar + 배경 틴트**(그림자 의존 X) |
| **disabled** | `opacity-50 cursor-not-allowed`, 대비 3:1 유지 |
| **loading** | spinner / skeleton (§ 13) |

### 9.1 포커스 이동 규칙 (Polaris)

- **이동 O**: 새 페이지 진입, 모달/바텀시트 오픈, 폼 제출 후 첫 에러 필드.
- **이동 X**: 백그라운드 자동 갱신, 사용자가 다른 곳 작업 중.
- 모달/바텀시트 닫힐 때 트리거 버튼으로 포커스 복귀.

### 9.2 비동기 액션

- 진행 중 → spinner / progress.
- 완료 → toast (자동 dismiss).
- 실패 → 인라인 검증 메시지(필드 옆) + 토스트 1회.

---

## 10. 접근성

### 10.1 기준

- **WCAG 2.1 A + AA**(Polaris).
- 키보드만으로 모든 핵심 워크플로(후보 추가, 일자 이동, 카드 편집) 완료 가능.
- 텍스트 200% 확대, 페이지 400% 확대에서 가로 스크롤 없이 작동(Fluent 2).
- VoiceOver/TalkBack/NVDA 에서 의미 있는 라벨 읽힘.

### 10.2 체크리스트 (모든 신규 화면)

- [ ] 색만으로 의미 전달하지 않는다(아이콘 + 텍스트 병행).
- [ ] 본문 4.5:1, 큰 텍스트/UI 3:1 대비 만족.
- [ ] 모든 인터랙티브 요소에 `:focus-visible` 스타일.
- [ ] 모바일 hit area ≥ 44px.
- [ ] 아이콘 단독 버튼에 `aria-label`.
- [ ] 시맨틱 HTML 우선(`<button>`, `<nav>`, `<main>`, `<dialog>`).
- [ ] `prefers-reduced-motion: reduce` 분기 추가.
- [ ] `<input>`/`<select>`에 연결된 `<label>` 또는 `aria-labelledby`.
- [ ] 모달/바텀시트는 포커스 트랩 + Escape 닫기 + 트리거로 포커스 복귀.
- [ ] 지도 마커는 `aria-label="Day 1, 1번, 경복궁"` 식 라벨 + 키보드 순회.
- [ ] 일자 토글 칩에 `role="tablist"` / `role="tab"` + 화살표 키 이동.

---

## 11. 콘텐츠 / 글쓰기 (한국어)

### 11.1 보이스

- **사람처럼**, **명료하고 짧게**, **사용자 행동 동사로 시작**, **능동태**(세 시스템 공통).
- 존댓말 일관성 유지(반말/존댓말 혼용 금지).
- "확인/취소" 같은 모호한 라벨 대신 **의미 있는 동사+대상**: "일정에 추가", "삭제", "다음 날로 이동".
- 느낌표·"sorry/please" 남발 X. 우리 잘못일 때만 사과.

### 11.2 한국어 마이크로카피 규칙

- **버튼 라벨**: 4-6자 동사형. "저장", "장소 추가", "일정에서 제거".
- **토스트**: 12자 이내. "추가했어요", "저장 실패. 다시 시도해 주세요".
- **다이얼로그 본문**: 2줄 이내. 원인 + 다음 행동.
- **빈 상태**: 다음 액션을 포함. 예) "아직 후보가 없어요. 지도에서 장소를 길게 눌러 추가해 보세요."
- **에러 메시지** (Polaris 구조: 원인 + 해결):
  - ✅ "이 장소는 이미 다른 일자에 있습니다. 옮기려면 기존 항목을 먼저 제거하세요."
  - ❌ "오류 발생" / "Invalid input" (jargon).
- 상태/심각도는 **색 + 아이콘 + 텍스트** 3중 신호.

#### 안티패턴 박제 (실제 사례 — 반복 금지, 이슈 #258 → #289)

"이익을 한 문장에" 를 글자대로 따르면 **이익 밀도는 최대, 사람다움은 최소**인 카피가 나온다. 아래는 실제로 머지됐다가 되돌린 사례다.

| ❌ Bad (지양) | 무엇이 문제인가 | ✅ Good (지향) |
|---|---|---|
| "모아둔 후보를 추려, 현장에서 안 깨지는 하루 일정으로 만들어요." | 부정추상("안 깨지는") = 내부 운영 관점. 한 절에 동사 4개(과압축). | "가 보고 싶은 곳을 모으면, 여기서 하루 단위 일정으로 정리할 수 있어요." |
| "지도 위에서 후보를 모아 **동선을 직접 깎는** 여행 설계 도구" | PM 관점 동사("동선을 깎다") — 사용자는 동선을 깎고 싶은 게 아니라 안 헤매고 싶다. | "가 보고 싶은 곳을 지도에 모아 하루 일정으로 정리하는 여행 계획 도구" |
| 동일 문구를 대시보드·항목목록에 토씨까지 같게 복붙 | verbatim 중복 = 템플릿 복붙의 흔적, "AI가 쓴 티". | 화면 맥락마다 고유 카피. |

**판별 기준:** ① 부정추상으로 가치를 말하지 않는다 ② PM 관점 동사 → 사용자 체감 결과로 번역한다 ③ 같은 카피를 두 화면에 복붙하지 않는다. (PR 템플릿 "카피 게이트" 로 강제.)

### 11.3 용어 통일

같은 개념을 두 단어로 번갈아 쓰지 않는다. trip-planner 표준 용어:

| 표준 | 금지(혼용) |
|---|---|
| **장소** | 지점, 후보지, 스팟 |
| **일정** | 스케줄, 플랜 |
| **일자 / Day** | 날짜, 데이 |
| **후보** | 위시리스트, 북마크 |
| **추가** | 등록, 담기 |
| **제거** | 삭제(데이터 삭제와 구분 필요할 때) |

### 11.4 포함적 언어 (Polaris)

- "비활성화하다"(disabled, 기능) → "끄기" / "잠금 해제 필요" / "사용 안 함" 등 구체 표현.
- "blacklist/whitelist" → **차단 목록 / 허용 목록**.
- "master" → **메인 / 주 / 원본**.
- 비유적 "blind/deaf/crazy/insane" 한국어 등가물도 회피.
- "쉽게/간단히/그냥(easy/just/only)" 가치 판단어 지양.

---

## 12. 패턴

### 12.1 카드 (Polaris)

- 구조: **Header**(제목 + 우측 tertiary icon button + tooltip — header 에 CTA 금지) → **Body**(섹션, 단일 섹션이면 제목 생략) → **Footer**(주요 CTA, primary 는 critical 한정, list-add 는 좌측).
- 카드가 길어지면 expand/collapse.
- 무관한 콘텐츠를 한 카드에 섞지 않는다.
- 액션은 그 액션이 영향을 주는 콘텐츠와 같은 컨테이너에.

### 12.2 Resource Index (= 후보 패널)

- 단일 컬럼.
- 페이지 타이틀 + **우상단 primary**("장소 추가") → **필터바**(검색, 카테고리 필터 chip, 정렬, 멀티셀렉트 토글) → **리소스 목록**.
- 적용된 필터는 **제거 가능한 chip + "Clear all"**.
- 검색 placeholder 는 명시적("전체에서 검색", "장소 이름·주소").
- 멀티셀렉트 시 선택 개수 + 일괄 액션("3개 일정에 추가").

### 12.3 Resource Details (= 일자 상세)

- 데스크톱: **좌 2/3 본질(타임라인)** + **우 1/3 메타(총 거리·예산·숙소)**.
- 모바일: stack.
- 풀 너비 카드 1개에 다 몰지 말기.
- 페이지 헤더 액션 = 일자 단위 액션(예: "이 날 복제", "삭제").

### 12.4 사이드 패널 / 바텀시트

- < 1024px: **바텀시트**(`rounded-t-2xl`, Shadow 28, 백드롭 `bg-black/30`).
  - 드래그 핸들 표시. 80vh 이상 점유 X.
  - 포커스 트랩 + Escape 닫기 + 백드롭 클릭 닫기.
- ≥ 1024px: **좌측 고정 패널** 360-400px 폭, Shadow 4-8.
- 두 형태가 **같은 컴포넌트**를 공유해야 함(re-architect).

### 12.5 칩 (`Chip` / `ChipButton`)

`components/UI/Chip.tsx` 의 컴포넌트만 사용한다. 인라인 `rounded-full px-2 py-0.5 ...` 마크업으로 새 칩을 만들지 않는다.

| variant | 배경 / 텍스트 | 용도 |
|---|---|---|
| `neutral` (기본) | `bg-bg-subtle text-fg-muted` | 일반 메타, 플레이스홀더 |
| `accent` | `bg-accent-subtle text-accent` | 선택 / 활성 표시 |
| `category` | neutral 톤 + props.category 의 lucide 아이콘 자동 leading | 카테고리 표시 |

**규칙**

- **카테고리 색은 leading dot / 아이콘에만**. 칩 배경 전체를 카테고리 색으로 깔지 않는다 (무지개 인상 방지).
- 같은 화면에 채도 높은 칩이 동시에 5개 이상 떠 있으면 디자인 재검토.
- 칩은 **"필터 가능한 분류"** 에만 사용. 시간 · 평점 · 거리 · 통화 같은 metadata 는 칩이 아니라 텍스트/작은 라벨로 표시.
- 사이즈: 기본 `md` (h-7). 빽빽한 곳은 `sm` (h-6).
- 인터랙티브 칩은 `ChipButton` (필터 토글, 칩 제거 X). `aria-pressed` 자동 적용.

**금지 패턴**

```tsx
// ❌ inline 마크업
<span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs">{category}</span>

// ✅ Chip 컴포넌트
<Chip variant="category" category={category}>{category}</Chip>
```

### 12.6 빈 상태 (`EmptyState`)

`components/UI/EmptyState.tsx` 만 사용한다. 인라인 `text-4xl` 이모지 + 텍스트로 빈 상태를 만들지 않는다.

**필수 구성**

- `icon`: **lucide 아이콘** (이모지 단독 사용 금지). `size-10` (size=page) / `size-7` (size=inline). `aria-hidden="true"`.
- `title`: 한 줄. "아직 …이 없어요" 처럼 사용자 시점 (§ 11.2).
- `description`: 선택. **다음 행동을 안내** (Polaris empty-state 원칙).
- `action`: 선택. 1차 액션은 `<Button>` 으로 — 추가 / 검색 초기화 등.
- 한국어 제목·설명은 `text-keep-korean`으로 조사·어미가 한 글자 단독 줄로 떨어지지 않게 한다.

**lucide 매핑 가이드**

| 컨텍스트 | 아이콘 |
|---|---|
| 목록(장소·항목 일반) | `MapPin` |
| 일정/캘린더 | `CalendarRange` |
| 검색 결과 0 | `SearchX` |
| 대시보드(여행 0) | `Compass` |
| 공유 링크 0 | `Link2Off` |

`size`: 페이지 메인 = `page` (기본). 컨테이너 내부 보조 = `inline`.

---

## 13. Wait UX (Fluent 2)

| 상황 | 패턴 |
|---|---|
| < 1초 | 인디케이터 없음 |
| 1-3초, 진행률 모름 | **Spinner** (작업 위치 근처) |
| > 3초, 측정 가능 | **Progress bar + 텍스트** |
| 콘텐츠 렌더링 지연 | **Skeleton**(레이아웃 보존, 점프 방지) |
| 백그라운드 장기 작업 | **Toast**, 사용자는 작업 계속 |

### 13.1 trip-planner 적용

- Supabase 후보/일정 fetch → **Skeleton 카드**(레이아웃 점프 방지).
- 저장/추가 같은 짧은 mutation → **Spinner**(버튼 내부).
- 지도 마커 일괄 가져오기(>3초) → **Toast** "지도에 핀 추가 중…" + 완료 시 success toast.
- 라벨은 진행형 + ellipsis: "저장 중…", "불러오는 중…".
- 한 화면에 인디케이터 1개. `role="status"` 부여.

---

## 14. 피드백 · 에러 패턴

### 14.1 컴포넌트 선택 매트릭스

| 상황 | 컴포넌트 | 위치 / 수명 |
|---|---|---|
| 폼 필드 검증 실패 | inline 텍스트 (`text-critical-fg text-xs`) | 필드 바로 아래, 입력 수정 시 사라짐 |
| 폼 제출/액션 실패 (회복 가능) | **`<ErrorBanner tone="critical">`** | 폼 상단 또는 액션 컨텍스트 내부, 사용자가 닫거나 재시도 |
| 페이지 차원 경고 (만료 등) | **`<ErrorBanner tone="warning">`** 또는 `info` | 페이지 최상단 |
| 일시적 성공/실패 알림 | **`<Toast>`** | 화면 하단, 3-5초 후 자동 dismiss |
| 비파괴 안내 (팁·전환 가능 정보) | **`<ErrorBanner tone="info">`** | 컨텍스트 근처 |
| 데이터 0건 / 필터 결과 없음 | **`<EmptyState>`** | 콘텐츠 영역 중앙 |
| 오프라인 | `<OfflineBanner>` | 최상단 고정 배너 (전역) |

### 14.2 톤(심각도) → 시맨틱 토큰

| 톤 | 토큰 prefix | 아이콘 (lucide) | 사용 |
|---|---|---|---|
| `critical` | `--critical-*` | `AlertCircle` | 사용자 액션 실패, 데이터 손실 위험 |
| `warning` | `--warning-*` | `AlertTriangle` | 주의 필요, 진행은 가능 |
| `info` | `--info-*` | `Info` | 중립 안내, 팁 |
| `success` | `--success-*` | `CheckCircle2` | 액션 성공 |

> hex 직접 사용 금지. 위 토큰만 사용하면 light/dark 모드 자동 대응.

### 14.3 메시지 카피 규칙

- **사실 진술 우선**. "왜 실패했고 다음에 무엇을 할 수 있는가" 를 명시. 사과·자책 회피.
- **길이 가이드**: 제목 ≤ 20자, 본문 ≤ 60자 (한 줄 권장). 길어지면 인라인 배너로.
- **재시도/해제 라벨**: "다시 시도", "취소", "확인". "OK" 같은 영어 잔재 금지.
- **금지**:
  - "알 수 없는 오류가 발생했습니다." → 원인을 좁히거나 사용자에게 다음 행동 제시.
  - "Oops!", "앗!" 같은 의태어 — 제품 보이스와 불일치.
  - 책임 회피("서버가 잠시 휴식 중입니다") — 사실 진술로 대체.
- **재시도 가능한 실패**는 항상 `action` 슬롯에 "다시 시도" 버튼 또는 toast `action` 제공.

### 14.4 접근성

- `<ErrorBanner tone="critical">` → `role="alert"` + `aria-live="assertive"` (자동 설정됨).
- 그 외 톤 → `role="status"` + `aria-live="polite"` (자동 설정됨).
- 토스트는 `aria-live="polite"`, 비차단. 모달로 만들지 않는다.
- 인라인 필드 에러는 `<input aria-invalid aria-describedby="...">` 로 연결.

### 14.5 적용 예시 코드

```tsx
import { ErrorBanner } from '@/components/UI'
import { useToast } from '@/components/UI/Toast'

// 1) 폼 제출 실패 — 인라인 배너
{error && (
  <ErrorBanner tone="critical" onDismiss={() => setError('')}>
    {error}
  </ErrorBanner>
)}

// 2) 일시적 성공 — 토스트
const { showToast } = useToast()
showToast({ type: 'success', message: '저장했어요' })

// 3) 재시도 액션이 있는 토스트
showToast({
  type: 'error',
  message: '저장에 실패했어요',
  action: { label: '다시 시도', onClick: handleSave },
})
```

### 14.6 후속 surface 적용 우선순위

1. `/login`, `/signup`, `/forgot` — 인증 실패 분기 (#128).
2. `/gmaps-import` — 가져오기 실패/부분 성공.
3. ItemForm 저장 실패 / 충돌.
4. geocode 실패 폴백.

---

## 15. 적용 우선순위 (현재 코드 기준)

현재 `tailwind.config.ts` 가 비어있고 hex 가 하드코딩되어 있어 토큰화가 가장 큰 갭. 다음 순서로 점진적으로 마이그레이션:

1. **CSS 변수 + Tailwind theme extension** 으로 컬러 시맨틱 토큰 정의 (`--color-fg`, `--color-bg-elevated`, status 토큰, category alias).
2. **Pretendard 폰트 로드**(`app/layout.tsx`) + 타입 스케일 시맨틱 클래스(`text-meta`, `text-card-title` 등).
3. **카테고리 색 hex 11종**을 Tailwind theme alias 로 옮기기(`lib/itemOptions.ts:55-86`).
4. **Radius 토큰화**(현재 혼재) → `rounded`(4) / `rounded-lg`(8) / `rounded-xl`(12) / `rounded-2xl`(16) 정렬.
5. **Shadow 단계 정렬** (Fluent 6단계 매핑).
6. **`focus-visible` 스타일 일괄 적용**.
7. **`prefers-reduced-motion` 분기** 모션 컴포넌트에 추가.
8. **다크모드 지원**(시맨틱 토큰 도입 후 자연 확장).
9. **lucide-react 도입** + 인라인 SVG 점진 교체.

각 단계는 별도 PR 로. 한 번에 다 바꾸지 않는다.

---

## 16. 참고 코드 위치

| 영역 | 파일 |
|---|---|
| Tailwind config (확장 필요) | [tailwind.config.ts](../tailwind.config.ts) |
| 글로벌 CSS (CSS 변수 추가 위치) | [app/globals.css](../app/globals.css) |
| 폰트 로드 위치 | [app/layout.tsx](../app/layout.tsx) |
| 카테고리/상태 색 토큰 | [lib/itemOptions.ts:55](../lib/itemOptions.ts) |
| 사이드 패널 패턴 | [components/Map/MapSidePanel.tsx](../components/Map/MapSidePanel.tsx) |
| 아이템 패널(바텀시트/드로어) | [components/Panel/ItemPanel.tsx](../components/Panel/ItemPanel.tsx) |
| 칩 / 메타 컴포넌트 | [components/UI/ItemMetadataChips.tsx](../components/UI/ItemMetadataChips.tsx) |
| Toast | [components/UI/Toast.tsx](../components/UI/Toast.tsx) |

---

## 17. 신규 화면 디자인 체크리스트

새 화면/컴포넌트를 만들기 전 이 체크리스트를 통과시킨다.

> **Taste 게이트 (먼저 통과).** 메커닉(아래 토큰 항목)에 앞서 [taste-for-waypost.md](taste-for-waypost.md) 의 판단 3문항을 먼저 본다. 토큰을 완벽히 지켜도 잘못된 문제를 풀면 추하다.
>
> - [ ] **올바른 문제를 푸는가?** (난로 다이얼 — 이 동작이 *그 다음 행동* 까지 한 흐름으로 이어지나, 사용자가 머릿속에서 별개 단계를 잇게 하나)
> - [ ] **장식이 substance 를 위장하지 않는가?** (이 색·칩·그림자가 정보를 더하나, 가리나)
> - [ ] **첫 안을 다시 그릴 각오가 있는가?** (못 버리는 이유가 옳아서인가, 아까워서인가)

- [ ] 페이지에 **위계가 한눈에 보이는가**? (가장 중요한 액션 1개를 즉시 인지)
- [ ] 콘텐츠가 1순위, **UI 크롬은 양보**하는가? (지도가 가려지지 않는가)
- [ ] **모바일·데스크톱 두 형태 모두** 디자인했는가? (resize 가 아닌 re-architect)
- [ ] 사용한 spacing 이 **4의 배수**인가?
- [ ] 사용한 radius/shadow 가 **§ 5, § 6 토큰**에 있는가?
- [ ] 사용한 색이 **시맨틱 토큰**(또는 status/카테고리 alias)인가? hex 직접 사용 X.
- [ ] 본문 4.5:1, UI 3:1 **대비** 만족하는가?
- [ ] **터치 타겟 44px**, 인접 버튼 8px 간격 만족하는가?
- [ ] 5가지 인터랙션 상태(rest/hover/focus-visible/active/disabled)를 정의했는가?
- [ ] 색만으로 의미 전달하지 않는가? (색 + 아이콘 + 텍스트)
- [ ] **`prefers-reduced-motion`** 분기가 있는가?
- [ ] 비동기 작업에 **§ 13 Wait UX 패턴**을 적용했는가?
- [ ] 한국어 카피가 **§ 11 용어/보이스**를 따르는가?
- [ ] 빈 상태 / 에러 상태가 **다음 행동을 제시**하는가?
- [ ] 새 칩이 인라인 마크업이 아닌 **`Chip` 컴포넌트** (§ 12.5) 인가?
- [ ] 카테고리 색이 칩 배경 전체를 덮지 않는가? (leading dot/아이콘만)
- [ ] 새 아이콘이 **lucide-react** 인가? 이모지 단독 사용 금지 (§ 8.1)
- [ ] 새 빈 상태가 **`EmptyState` 컴포넌트** (§ 12.6) + lucide icon 인가?
