# Tasks: Signup Password Policy Alignment

**Input**: `specs/287-password-policy/spec.md`, `specs/287-password-policy/plan.md`
**Prerequisites**: Issue #287 reopened acceptance criteria

## Phase 1: Shared Policy

- [x] T001 Add shared password policy validation in `lib/passwordPolicy.ts`.
- [x] T002 Use shared policy in `app/api/auth/signup/route.ts`.
- [x] T003 Use shared policy in `app/api/auth/update-password/route.ts`.

## Phase 2: Signup UX

- [x] T004 Add password confirmation to `app/signup/SignupForm.tsx`.
- [x] T005 Block weak/mismatched passwords before signup API call in `app/signup/SignupForm.tsx`.
- [x] T006 Reserve stable height for `components/UI/PasswordStrengthMeter.tsx`.

## Phase 3: Verification

- [x] T007 Run `npm run lint`.
- [x] T008 Run `npx tsc --noEmit`.
- [x] T009 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.
- [ ] T010 Manually verify signup form if local auth credentials are available.

## Dependencies & Execution Order

- T001 before T002, T003, and T005.
- T004 before T005.
- T006 can run independently.
- Verification runs after implementation.
