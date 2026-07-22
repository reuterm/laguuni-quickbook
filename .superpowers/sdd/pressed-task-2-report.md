# Task 2: Pressed Calendar State Report

## Changes

- Updated `AvailabilityCalendarGrid.test.tsx` to verify basket-selected slots expose `aria-pressed="true"` and unselected slots expose `aria-pressed="false"`.
- Updated the existing `BasketSelection` Storybook story because it did not begin with a selected fixture. The story now supplies `createSelection()` through the existing `basket` contract and verifies the selected slot with `pressed: true`.
- Kept the grid API, `BookingBasketProps` contract, chip implementation, and booking-controller/reconciliation behavior unchanged.

## Storybook Evidence

- Consulted `availability-calendargrid` documentation before modifying the story. It documents the existing `Basket Selection` variant and its `availability-calendargrid--basket-selection` story ID.
- Consulted Storybook story-writing instructions before modifying the story.
- Preview URL generated: http://localhost:6006/?path=/story/availability-calendargrid--basket-selection
- The local Storybook manager could not render for browser inspection because these addon bundle requests returned 404: `storybook-core-server-presets-0/common-manager-bundle.js`, `docs-1/manager-bundle.js`, and `a11y-2/manager-bundle.js`. The story play assertion covers the rendered selected button semantics in code.

## Verification

| Command | Result |
| --- | --- |
| `pnpm test src/features/availability/components/AvailabilityCalendarGrid.test.tsx` | Pass: 1 file, 7 tests |
| `pnpm test src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx` | Pass: 3 files, 10 tests |
| `pnpm test` | Pass: 51 files, 324 tests |
| `pnpm typecheck` | Pass: exit 0 |
| `pnpm build` | Pass: exit 0; Vite production build completed |
| `pnpm lint` | Pass: 222 files checked |

The focused grid test was initially run after Task 1 was already committed, so the new assertion passed immediately rather than reproducing the pre-Task-1 expected red state.

Biome required a formatting-only line wrap in the Task 1 chip file; no runtime behavior changed.

## Self-Review

- The grid-level test uses the required selected and unselected action labels and exact `aria-pressed` values.
- The story reuses `createSelection()` and passes it through `bookingBasket.selections` and `bookingBasket.isSelected`; it does not introduce a parallel selection model.
- The selected story fixture is static, so no controller or reconciliation semantics are duplicated in Storybook.
- No grid, basket-contract, chip, controller, or reconciliation production behavior was changed.

## Concerns

- Local Storybook manager addon 404s prevented browser-level inspection, although the generated story URL and story play assertion are present.
