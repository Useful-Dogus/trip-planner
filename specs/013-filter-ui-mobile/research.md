# Research: 목록 뷰 필터 UI 개선

## 1. 바텀시트 구현 패턴

**Decision**: 기존 `ItemPanel.tsx`의 바텀시트 패턴 그대로 재사용  
**Rationale**: 프로젝트 내에 이미 검증된 패턴이 존재한다. `translate-y-full` → `translate-y-0` CSS transition + backdrop div. 외부 라이브러리 불필요.  
**Alternatives considered**: react-spring, framer-motion — 의존성 추가 대비 이득 없음.

구체 패턴:
```
fixed bottom-0 left-0 right-0 rounded-t-2xl
transition-transform duration-300 ease-in-out
isOpen ? 'translate-y-0' : 'translate-y-full'
```
backdrop: `fixed inset-0 bg-black/30 z-[900]` (ItemPanel은 z-[1000], 필터 패널은 그 아래)

드래그 핸들: ItemPanel과 동일하게 `absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full md:hidden`

## 2. 데스크탑 드롭다운 구현 패턴

**Decision**: `useRef` + `useEffect` outside click 감지, `absolute` 포지셔닝  
**Rationale**: 외부 라이브러리 없이 표준 React 패턴으로 구현 가능. 프로젝트의 단순성 원칙에 부합.  
**Implementation**:
```tsx
const dropdownRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  function handleClick(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }
  if (open) document.addEventListener('mousedown', handleClick)
  return () => document.removeEventListener('mousedown', handleClick)
}, [open])
```
포지셔닝: `absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg`

## 3. 활성 필터 요약 칩 레이아웃

**Decision**: `flex overflow-x-auto gap-1.5` + `-mx-4 px-4` 로 edge-to-edge 가로 스크롤  
**Rationale**: 칩이 많아질 경우 줄 넘김 없이 스크롤 처리. 스크롤바는 `scrollbar-hide` 또는 `-webkit-overflow-scrolling: touch`.  
**칩 구조**: `[레이블 텍스트] [× 버튼]` 형태, `flex-shrink-0`으로 칩 축소 방지.

## 4. 필터 개수 배지

**Decision**: 버튼 텍스트에 `(N)` 형식으로 인라인 표시  
**Rationale**: 별도 absolute 배지보다 구현이 단순하고 접근성 면에서 스크린 리더가 자연스럽게 읽는다.  
예: "필터 (3)"

## 5. 필터 상태 관리 위치

**Decision**: 기존과 동일하게 `ItemList.tsx` 내 `useState` 유지, 신규 컴포넌트에 props로 전달  
**Rationale**: 필터 상태를 상위 컴포넌트(research/page.tsx)로 올리면 범위가 커진다. 현재 필터가 ItemList 내부에만 영향을 주므로 그대로 유지.

## 6. 반응형 분기 전략

**Decision**: CSS + Tailwind `md:` 접두사로 분기. JS에서 window.innerWidth 감지 없음.  
**Rationale**: SSR 안전성. 바텀시트는 `md:hidden`, 드롭다운은 `hidden md:block`으로 처리.  
**구체적 접근**:
- 모바일 바텀시트: `fixed ... md:hidden`
- 데스크탑 드롭다운: `hidden md:block absolute ...`
- backdrop은 모바일 바텀시트에만 표시: `md:hidden`
