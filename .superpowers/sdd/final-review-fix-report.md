# PR4 Final Review Fix Report

Date: 2026-07-22

## Scope

Addressed only the three final whole-branch review findings from
`.superpowers/sdd/final-review.md`. No production code or PR5/PR6 behavior was
changed.

## Changes

1. `BookingBasketReviewButton.test.tsx`
   - The two-selection assertion now targets and checks the accessible name
     `Review 2 selected slots`.
   - The existing one-selection assertion continues to cover `Review selection`.

2. `AvailabilityScreen.test.tsx`
   - Finalized selections are typed as `readonly BookingSlotSelection[]`.
   - Cross-cable fixture entries now supply the complete selection shape,
     including `cableId`, `startTime`, and `endTime`.

3. `use-availability-overview.test.ts`
   - The inactive-cable refresh test injects a directly typed `vi.fn` into
     `createApi`, preserving `.mockClear()` typing without casts.
   - The assertion still verifies exactly one request for `easy` on
     `2026-05-20` and confirms the active availability state remains `ready`.

## Reproduction Before Fix

Command:

```text
pnpm test src/features/availability/components/BookingBasketReviewButton.test.tsx
```

Output:

```text
Test Files  1 failed (1)
Tests       1 failed | 1 passed (2)
TestingLibraryElementError: Unable to find an accessible element with the role
"button" and name "Review selection"
Accessible button name: "Review 2 selected slots"
```

Command:

```text
pnpm test src/features/availability/components/AvailabilityScreen.test.tsx
```

Output:

```text
Test Files  1 passed (1)
Tests       3 passed (3)
```

Command:

```text
pnpm test src/features/availability/use-availability-overview.test.ts
```

Output:

```text
Test Files  1 passed (1)
Tests       21 passed (21)
```

Command:

```text
pnpm typecheck
```

Output:

```text
src/features/availability/components/AvailabilityScreen.test.tsx(169,11):
error TS2353: Object literal may only specify known properties, and 'cableId'
does not exist in type '{ date: string; }'.
src/features/availability/components/AvailabilityScreen.test.tsx(170,11):
error TS2353: Object literal may only specify known properties, and 'cableId'
does not exist in type '{ date: string; }'.
src/features/availability/components/AvailabilityScreen.test.tsx(171,11):
error TS2353: Object literal may only specify known properties, and 'cableId'
does not exist in type '{ date: string; }'.
src/features/availability/use-availability-overview.test.ts(257,32):
error TS2339: Property 'mockClear' does not exist on type
'(cableId: "pro" | "easy" | "hietsu", date: LocalDateString) =>
Promise<DailyAvailabilityWindow>'.
ELIFECYCLE Command failed with exit code 2.
```

## Final Verification

All commands below were run after the final source edit.

Command:

```text
pnpm test src/features/availability/components/BookingBasketReviewButton.test.tsx
```

Output:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
```

Command:

```text
pnpm test src/features/availability/components/AvailabilityScreen.test.tsx
```

Output:

```text
Test Files  1 passed (1)
Tests       3 passed (3)
```

Command:

```text
pnpm test src/features/availability/use-availability-overview.test.ts
```

Output:

```text
Test Files  1 passed (1)
Tests       21 passed (21)
```

Command:

```text
pnpm test
```

Output:

```text
Test Files  49 passed (49)
Tests       322 passed (322)
Duration    12.03s
```

Command:

```text
pnpm typecheck
```

Output:

```text
> tsc -b && tsc -p tsconfig.storybook.json
```

Exit status: 0.

Command:

```text
pnpm build
```

Output:

```text
> tsc -b && vite build
vite v8.0.10 building client environment for production...
2217 modules transformed.
built in 486ms
PWA v1.3.0
precache 19 entries (505.94 KiB)
```

Exit status: 0.

Command:

```text
pnpm lint
```

Output:

```text
[warn] Linter process terminated abnormally (possibly out of memory)
```

The lint command could not complete. This is the exact output from both lint
attempts in this work session.

Command:

```text
git diff --check
```

Output:

```text
(no output; exit status 0)
```

## Notes

- The accessible-name test was first observed failing before the assertion was
  updated, proving it covered the stale label.
- The typecheck failure identified all four reported errors before the fixture
  and mock corrections.
- An unrelated, pre-existing untracked path,
  `docs/superpowers/e1c8ab9`, was left untouched and excluded from the commit.
