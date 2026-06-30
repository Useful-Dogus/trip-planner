# Implementation Plan: Basecamp Role Clarification

**Branch**: `tasks/issue-350-basecamp-role` | **Date**: 2026-06-30 | **Spec**: `specs/350-basecamp-role/spec.md`
**Input**: Feature specification from `specs/350-basecamp-role/spec.md`

## Summary

Remove basecamp from the new-trip wizard so creation only asks for immediate trip setup inputs. Preserve the existing trip-level `basecamp_address` storage as a single optional map reference point in settings, and update user-facing copy so multiple lodgings are modeled as lodging/stay items.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `tailwindcss`, `lucide-react`
**Storage**: Existing Supabase `trips.basecamp_address`; no schema change
**Testing**: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`
**Target Platform**: New trip wizard, trip settings sheet, shared trip/map labels
**Project Type**: Next.js web application
**Performance Goals**: No extra rendering work or data fetching
**Constraints**: Do not remove existing stored `basecamp_address` data; do not add a new lodging model
**Scale/Scope**: Copy and state cleanup across the create/edit surfaces

## Constitution Check

Repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- Copy honesty: creation flow must not imply a lodging model that the product does not support.
- CRUD symmetry: no new object or field is introduced; existing trip settings still update the retained single reference point.
- Basics-first: reduce creation friction and keep the setting discoverable after trip creation.
- Design mechanics: use existing form controls and token classes only.

## Project Structure

### Documentation (this feature)

```text
specs/350-basecamp-role/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/dashboard/new/NewTripWizard.tsx
app/share/[token]/page.tsx
components/Map/TripPlannerMap.tsx
components/Trip/TripSettingsSheet.tsx
```

**Structure Decision**: Keep this as a narrow UI/copy clarification. The API and database schema remain unchanged because existing trips may already have `basecamp_address`.

## Complexity Tracking

No added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
