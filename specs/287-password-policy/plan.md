# Implementation Plan: Signup Password Policy Alignment

**Branch**: `tasks/issue-287-password-policy` | **Date**: 2026-06-29 | **Spec**: `specs/287-password-policy/spec.md`
**Input**: Feature specification from `specs/287-password-policy/spec.md`

## Summary

Centralize the password acceptance policy, use it in signup server validation and client submit validation, add password confirmation to signup, and keep the strength meter layout stable.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`
**Storage**: Supabase Auth
**Testing**: `npm run lint`, `npx tsc --noEmit`, `npm run build`
**Target Platform**: Browser signup page and Next.js auth API routes
**Project Type**: Next.js web application
**Performance Goals**: Password score loads only when password validation/meter needs it
**Constraints**: Avoid complexity-rule password requirements; keep length plus strength/common-password policy
**Scale/Scope**: Signup form, password meter, password policy helper, auth password-setting routes

## Constitution Check

The repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- Behavior change is security/user-flow scoped; no unrelated refactor.
- Copy must honestly match implemented signup behavior.
- UI must avoid layout shift and preserve accessible labels.

## Project Structure

### Documentation (this feature)

```text
specs/287-password-policy/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/signup/SignupForm.tsx
app/api/auth/signup/route.ts
app/api/auth/update-password/route.ts
components/UI/PasswordStrengthMeter.tsx
lib/passwordPolicy.ts
```

**Structure Decision**: Add a small policy helper in `lib/` so client and route handlers share the same acceptance threshold.

## Complexity Tracking

No added architectural complexity beyond a shared policy helper.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
