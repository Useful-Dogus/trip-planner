# Implementation Plan: 모바일 패널 UX 개선

**Branch**: `004-mobile-panel-ux` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-mobile-panel-ux/spec.md`

## Summary

`ItemPanel`(바텀 시트)과 `PanelItemForm`(편집 폼) 두 컴포넌트를 수정하여 모바일 편집 UX를 개선한다. 핵심 변경은 4가지: ① 편집 중 미저장 변경사항 보호(인라인 확인 UI), ② sticky footer로 액션 버튼 항상 접근 가능, ③ 삭제 버튼 헤더 이동, ④ 링크 레이아웃 1단 변경. 백엔드/DB 변경 없음.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**: Next.js 14+ (App Router), React 18, Tailwind CSS 3.x
**Storage**: N/A (UI 전용 변경)
**Testing**: 없음 (프로젝트에 테스트 프레임워크 미설정)
**Target Platform**: 모바일 브라우저 — iOS Safari 15+, Android Chrome 108+ (viewport < 768px)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: 60fps 애니메이션 유지, 패널 열기/닫기 300ms transition 유지
**Constraints**: Visual Viewport API는 `useEffect` 내에서만 참조 (SSR 안전); iOS Safari 자동 포커스 제약 존중
**Scale/Scope**: 2개 파일 수정, 신규 파일 없음

## Constitution Check

Constitution 파일이 템플릿 상태(미작성)이므로 프로젝트별 게이트 없음.
일반 원칙으로 검토:
- ✅ 최소 변경 원칙: 기존 파일 2개만 수정, 신규 파일/컴포넌트 없음
- ✅ 단순성: 새로운 추상화 레이어 없음
- ✅ 기능 범위: 스펙에 명시된 4가지 문제만 해결

## Project Structure

### Documentation (this feature)

```text
specs/004-mobile-panel-ux/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (완료)
├── data-model.md        # Phase 1 output (완료)
├── quickstart.md        # Phase 1 output (완료)
└── tasks.md             # Phase 2 output (/speckit.tasks로 생성 예정)
```

### Source Code (수정 대상)

```text
components/
└── Panel/
    ├── ItemPanel.tsx        # 주요 변경
    └── PanelItemForm.tsx    # 주요 변경
```

**Structure Decision**: 단일 웹 앱 구조 유지. 신규 디렉토리/파일 없음. 기존 `components/Panel/` 디렉토리 내 두 파일만 수정.

---

## Phase 0: Research (완료)

→ [research.md](./research.md) 참조

**결정 사항 요약**:

| 문제 | 결정 |
|------|------|
| 가상 키보드 처리 | Visual Viewport API (`visualViewport.resize` 이벤트) |
| iOS에서 `dvh` 사용 여부 | 미사용 — iOS에서 키보드 미대응 |
| Dirty 감지 방식 | 필드별 비교 + 링크 배열 JSON.stringify (빈 URL 제외) |
| 확인 다이얼로그 UI | 인라인 — sticky footer를 확인 버튼으로 교체 |
| 삭제 버튼 위치 | ItemPanel 헤더 (편집 모드일 때만 표시) |
| 링크 레이아웃 | `grid-cols-1 md:grid-cols-2` |

---

## Phase 1: Design & Contracts (완료)

→ [data-model.md](./data-model.md), [quickstart.md](./quickstart.md) 참조

**새 계약(contracts/) 없음**: 이 기능은 내부 React 컴포넌트 변경으로, 외부 인터페이스 변경 없음.

### 컴포넌트 설계 상세

#### ItemPanel.tsx — 상태 및 동작 변경

```
신규 상태:
  isDirty: boolean                  ← PanelItemForm.onDirtyChange()로 수신
  confirmingClose: boolean          ← 닫기 시도 시 dirty면 true
  keyboardHeight: number            ← Visual Viewport API

close 시도 흐름:
  if (mode === 'edit' && isDirty)
    → setConfirmingClose(true)      // 인라인 확인 UI 표시
  else
    → onClose()                     // 즉시 닫기

스와이프 핸들러:
  if (mode === 'edit') return       // 편집 중 스와이프 무시

헤더 버튼 (편집 모드):
  [삭제 버튼] [X 버튼]             // 삭제 버튼 새로 추가

패널 bottom 스타일:
  style={{ bottom: `${keyboardHeight}px` }}

footer 렌더링:
  confirmingClose === true  → 인라인 확인 UI (나가기/계속 편집)
  confirmingClose === false → 정상 (PanelItemForm sticky footer)
```

#### PanelItemForm.tsx — 레이아웃 및 Props 변경

```
Props 변경:
  onDirtyChange: (dirty: boolean) => void  ← 추가
  onDelete 제거                             ← 헤더로 이동

레이아웃 구조:
  <form className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 ...">
      {/* 모든 폼 필드 */}
    </div>
    <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">
      {/* 저장 / 취소 버튼 (고정) */}
    </div>
  </form>

Dirty 계산:
  useEffect([form, item]) → isDirty 계산 → onDirtyChange(isDirty)

Auto-focus:
  이름 input에 autoFocus 속성 추가

링크 레이아웃:
  기존: className="grid grid-cols-2 gap-2"
  변경: className="grid grid-cols-1 md:grid-cols-2 gap-2"
```

#### 삭제 로직 이전

```
기존: PanelItemForm.handleDelete() → confirm() → DELETE API
변경: ItemPanel.handleDelete() → confirm() → DELETE API
     (삭제 confirm 방식은 현행 유지 — 스펙 범위 밖)
```

#### 인라인 확인 UI (ItemPanel footer 영역)

```
confirmingClose === true 시 렌더링:
  <div className="...">
    <p>변경사항이 있습니다. 저장하지 않고 나가시겠습니까?</p>
    <div>
      <button onClick={handleDiscardAndClose}>나가기</button>
      <button onClick={() => setConfirmingClose(false)}>계속 편집</button>
    </div>
  </div>

handleDiscardAndClose:
  setConfirmingClose(false)
  setMode('view')
  setIsDirty(false)
  onClose()
```

#### ESC 키 처리 변경

```
기존: ESC → onClose()
변경:
  if (confirmingClose) → setConfirmingClose(false)  // 확인 취소
  else if (mode === 'edit' && isDirty) → setConfirmingClose(true)
  else → onClose()
```

---

## Complexity Tracking

해당 없음 — Constitution 위반 없음, 복잡도 증가 없음.
