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
