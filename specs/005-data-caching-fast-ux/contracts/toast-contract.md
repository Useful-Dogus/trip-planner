# Contract: Toast Notification

**Type**: UI Component Interface
**Feature**: 005-data-caching-fast-ux

---

## Purpose

낙관적 업데이트 실패 및 기타 오류를 사용자에게 알리는 토스트 알림 시스템.

---

## Interface

```typescript
interface ToastOptions {
  message: string
  type: 'error' | 'success' | 'info'
  duration?: number          // ms, 기본값 4000
  action?: {
    label: string
    onClick: () => void
  }
}

function showToast(options: ToastOptions): void
```

---

## Visual Spec

- **위치**: 화면 하단 중앙 (모바일/데스크탑 공통)
- **z-index**: 지도 위에 표시되어야 함 (기존 z-index 이슈 참고)
- **소멸**: `duration`(기본 4000ms) 후 자동 소멸
- **스택**: 복수 토스트 동시 표시 가능 (최대 3개, 초과 시 오래된 것 제거)

---

## Usage Examples

```typescript
// 실패 알림 (재시도 버튼 포함)
showToast({
  message: '저장에 실패했습니다',
  type: 'error',
  action: {
    label: '재시도',
    onClick: () => updateItem(id, changes),
  }
})

// 성공 알림 (선택적 사용)
showToast({
  message: '삭제되었습니다',
  type: 'success',
})
```
