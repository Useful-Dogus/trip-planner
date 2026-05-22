# 041-pwa — Plan

## 기술 결정

Next.js 14 App Router 의 Metadata file convention 사용. `public/manifest.json` 정적 파일 대신 코드로 관리.

| 파일 | 역할 |
|---|---|
| `app/manifest.ts` | Web App Manifest (name, theme, icons, display, start_url) |
| `app/icon.tsx` | 192×192 PNG — 빌드 시 `next/og ImageResponse` 로 생성 |
| `app/icon-large.tsx` | 512×512 PNG (별 파일명으로 다중 사이즈) |
| `app/apple-icon.tsx` | 180×180 iOS 홈 아이콘 (Apple Touch Icon) |
| `app/layout.tsx` | `appleWebApp` 메타 추가 (statusBarStyle, capable) |

Next.js 가 위 컨벤션 파일을 자동 인식해 `<link>` 와 manifest 항목을 채워 넣음 — 우리는 별도 link tag 추가 불필요.

## 브랜드 토큰

- 배경/아이콘: `#0D9488` (brand teal, 기존 favicon 과 일치)
- theme_color (라이트): `#ffffff`
- theme_color (다크): `#0b1020` (기존 layout viewport themeColor 와 정렬)
- manifest theme_color 는 단일 값만 허용 → 다크 톤(`#0b1020`) 선택 (status bar 안정적)

## 아이콘 디자인

기존 `app/icon.svg` (지오/핀 모티프) 그대로 차용:
- 둥근 사각형 배경: `#0D9488`
- 핀 + 중심점: white

ImageResponse 의 div + SVG path 로 재현.

## 비범위

- Service Worker (오프라인 캐싱): next-pwa 도입 시 빌드·캐시 정책 결정 필요해 별도 PR
- 푸시 알림: 별도 인프라

## 검증 방법

- `npm run build` 성공
- 빌드 산출물에서 `manifest.webmanifest`, `icon`, `apple-icon` 경로 확인
- 로컬 dev 에서 Chrome DevTools → Application → Manifest 패널이 모든 필드를 인식
