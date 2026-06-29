# Implementation Plan: Schedule Category Cell Exception Recovery

**Branch**: `tasks/issue-355-category-icon-exception` | **Date**: 2026-06-29 | **Spec**: `specs/355-schedule-category-exception/spec.md`
**Input**: Feature specification from `specs/355-schedule-category-exception/spec.md`

## Summary

Make schedule category editing resilient by hardening the category cell against invalid category metadata and unstable portal positioning, then improve item update error reporting so failed saves remain recoverable.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `swr`, `lucide-react`, `@dnd-kit/core`
**Storage**: Supabase-backed item API through existing `/api/items` routes
**Testing**: `npm run lint`; manual schedule category click verification when local env permits
**Target Platform**: Browser web app, mobile and desktop
**Project Type**: Next.js web application
**Performance Goals**: No visible delay when opening category picker
**Constraints**: Keep behavior change narrow; preserve existing table navigation model
**Scale/Scope**: Schedule table category cell and shared item update hook

## Constitution Check

The repository constitution is still scaffold placeholders, so applicable gates come from `AGENTS.md`:

- Refactoring and behavior changes stay separated in intent; no broad structural cleanup.
- UI changes must pass basics-first gates for recovery, accessibility labels, and desktop/mobile behavior.
- Design token system remains unchanged; no new colors or spacing scale.

## Project Structure

### Documentation (this feature)

```text
specs/355-schedule-category-exception/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
components/Schedule/cells/CategoryCell.tsx
lib/hooks/useItems.ts
```

**Structure Decision**: Use existing schedule cell and item hook boundaries. Do not introduce a new editor abstraction for this narrow bug.

## Complexity Tracking

No constitution violations or added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent in this worktree. This plan uses the checked-in `.specify/templates` directly to keep #355 moving.
