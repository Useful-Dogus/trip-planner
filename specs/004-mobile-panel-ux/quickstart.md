# Quickstart: 모바일 패널 UX 개선

**Phase 1 Output** | Branch: `004-mobile-panel-ux`

---

## 개요

`ItemPanel` (바텀 시트)와 `PanelItemForm` (편집 폼) 두 컴포넌트를 수정한다. 신규 파일 생성 없음.

## 수정 대상 파일

```
components/
├── Panel/
│   ├── ItemPanel.tsx        # 주요 변경 (dirty/confirm 상태, 헤더 삭제 버튼, 키보드 핸들링)
│   └── PanelItemForm.tsx    # 주요 변경 (sticky footer, 링크 레이아웃, auto-focus, onDirtyChange)
```

## 로컬 개발

```bash
npm run dev   # http://localhost:3000
```

모바일 테스트:
- Chrome DevTools → Device Toolbar → iPhone 12 Pro (390×844)
- 실기기 테스트: `next.config.mjs`에서 `hostname` 허용 후 로컬 IP 접속

## 핵심 변경 요약

### 1. ItemPanel.tsx

**추가 상태**:
- `isDirty: boolean` — PanelItemForm의 onDirtyChange 콜백으로 수신
- `confirmingClose: boolean` — 닫기 시도 시 인라인 확인 UI 표시 여부
- `keyboardHeight: number` — Visual Viewport API 감지값 (패널 bottom 오프셋)

**동작 변경**:
- close 핸들러: `isDirty && mode === 'edit'`이면 `setConfirmingClose(true)`, 아니면 즉시 닫기
- 스와이프(`handleTouchEnd`): `mode === 'edit'`이면 아무 동작 안 함
- 헤더: `mode === 'edit'`일 때 삭제 버튼 추가 (X 버튼 왼쪽)
- 패널 `bottom` 스타일: `keyboardHeight`px로 동적 오프셋
- `confirmingClose` 상태: footer를 인라인 확인 UI로 교체

**Visual Viewport 연결**:
```tsx
useEffect(() => {
  const vv = window.visualViewport
  if (!vv || !isOpen) return
  const handler = () => {
    setKeyboardHeight(window.innerHeight - vv.height - vv.offsetTop)
  }
  vv.addEventListener('resize', handler)
  vv.addEventListener('scroll', handler)
  return () => {
    vv.removeEventListener('resize', handler)
    vv.removeEventListener('scroll', handler)
    setKeyboardHeight(0)
  }
}, [isOpen])
```

### 2. PanelItemForm.tsx

**레이아웃 재구성**:
- `<form>` 태그에 `flex flex-col h-full` 추가
- 필드 영역: `<div className="flex-1 overflow-y-auto px-5 py-4 ...">` (스크롤 가능)
- 버튼 영역: `<div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">` (고정)

**Props 변경**:
- `onDelete` 제거 (헤더로 이동)
- `onDirtyChange: (dirty: boolean) => void` 추가

**Dirty 계산**:
- `useEffect`로 `form` 변경마다 isDirty 계산 후 `onDirtyChange` 호출

**기타**:
- 이름 input: `autoFocus` 속성 추가
- 링크 그리드: `grid-cols-1 md:grid-cols-2`로 변경

## 주의사항

- `PanelItemForm`에서 `onDelete` prop 제거 시, `ItemPanel`의 삭제 핸들러가 직접 API를 호출해야 한다. 삭제 로직(`handleDelete`)을 `ItemPanel`로 이전한다.
- Visual Viewport API는 SSR 환경에서 `window` 참조 오류가 발생할 수 있으므로 `useEffect` 내부에서만 참조한다.
- `confirmingClose`가 true인 동안 ESC 키는 확인을 취소(계속 편집)해야 한다.
