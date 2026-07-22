# Task 1 Report: Restore Explicit Basket Presentation Contracts

## Status

Implemented and verified the approved PR4 scope correction.

## Changed Files

- `src/features/availability/components/BookingBasketReviewButton.tsx`
- `src/features/availability/components/BookingBasketReviewButton.test.tsx`
- `src/features/availability/components/AvailabilityScreen.tsx`
- `src/features/booking/components/BookingConfirmPanel.tsx`
- `src/features/booking/components/BookingConfirmPanel.test.tsx`
- `src/features/booking/components/BookingConfirmPanel.stories.tsx`
- `src/features/booking/components/BookingSheetFlow.tsx`
- `src/features/booking/components/BookingSheetFlow.test.tsx`
- `src/features/booking/components/BookingSheetFlow.stories.tsx`
- `src/app/App.test.tsx`
- `src/features/booking/booking-flow.integration.test.tsx`

## Implementation

- Restored the static non-empty basket button label, `Review selection`.
- Restored the required `BookingSheetFlowActions` contract.
- Replaced inferred optional flow callbacks with explicit initial and basket actions.
- Restored `BookingConfirmPanel.secondaryAction` as the presentation-level secondary action contract.
- Kept the PR4 initial continuation explicit by passing `keepBookingForMore` as `onAddMore` from `AvailabilityScreen`.
- Updated direct component tests, stories, application tests, and booking-flow integration assertions to the restored static copy and required action contract.
- Did not change controller entry points or booking/reconciliation behavior.

## TDD Evidence

The restored contract tests were written before implementation and run while red. The focused run failed as expected because the button rendered `Review 2 selected slots`, `BookingConfirmPanel` ignored `secondaryAction`, and `BookingSheetFlow` did not consume `actions`. After the minimal implementation changes, the focused suite passed: 3 files, 18 tests.

## Verification

```text
pnpm test src/features/availability/components/BookingBasketReviewButton.test.tsx src/features/booking/components/BookingConfirmPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx src/app/App.test.tsx src/features/booking/booking-flow.integration.test.tsx
5 passed, 40 passed

pnpm typecheck
exit 0

pnpm build
exit 0
```

## Self-Review

- Confirmed `BookingSheetFlowActions` is exported, required, and structurally matches the approved discriminated union.
- Confirmed initial confirmations only show `Add more` for the explicit `add-more` continuation.
- Confirmed basket confirmations always show `Clear selection`, invoke the configured clear action, then dismiss the sheet.
- Confirmed the existing completed/submitting paths remain untouched apart from satisfying the required actions prop in tests and stories.
- Confirmed `git diff --check` reports no whitespace errors.

## Concerns

None. Storybook documentation was checked before story edits. Story preview URL resolution was unavailable for the isolated worktree paths, but Storybook typechecking passed.

## Review Correction

### Finding

The direct `AvailabilityScreen` unit test still captured and asserted the removed optional `keepBookingForMore` and `clearBookingSelection` props on `BookingSheetFlow`. This failed at runtime because `AvailabilityScreen` correctly supplies the required `actions` contract.

### Change

- Updated only `src/features/availability/components/AvailabilityScreen.test.tsx`.
- Typed the `BookingSheetFlow` mock's required `actions` property as `BookingSheetFlowActions`.
- Replaced removed callback assertions with checks for `actions.basket.onClearSelection` and the narrowed `actions.initial` `add-more` branch's `onAddMore` callback.
- Did not modify production code.

### Red Evidence

```text
pnpm test src/features/availability/components/AvailabilityScreen.test.tsx

FAIL src/features/availability/components/AvailabilityScreen.test.tsx > AvailabilityScreen > provides the required sheet continuation and basket clear actions
AssertionError: expected undefined to be defined
src/features/availability/components/AvailabilityScreen.test.tsx:160:61

Test Files  1 failed (1)
Tests       1 failed | 2 passed (3)
```

### Verification Output

```text
pnpm test src/features/availability/components/AvailabilityScreen.test.tsx

Test Files  1 passed (1)
Tests       3 passed (3)
Duration    1.34s
```

```text
pnpm test src/features/availability/components/BookingBasketReviewButton.test.tsx src/features/booking/components/BookingConfirmPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx src/app/App.test.tsx src/features/booking/booking-flow.integration.test.tsx

Test Files  5 passed (5)
Tests       40 passed (40)
Duration    4.18s
```

```text
pnpm typecheck

> tsc -b && tsc -p tsconfig.storybook.json

exit 0
```
