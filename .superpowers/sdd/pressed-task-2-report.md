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

## Review Repair (2026-07-22)

- Changed the unselected grid assertion to the required `Add 16:00-17:00` fixture and retained its exact `aria-pressed="false"` assertion.
- Added the `16:00-17:00` fixture to the grid test data and updated the directly affected Thursday slot-count assertion from two to three slots.
- Reverted only Task 2's formatting-only change in `availability-badge.tsx`; the Task 1 pressed-state production behavior is unchanged.

### Repair Verification

| Command | Result |
| --- | --- |
| `pnpm test src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx` | Pass: 3 files, 10 tests |
| `pnpm test` | Pass: 51 files, 324 tests |
| `pnpm typecheck` | Pass: exit 0 |
| `pnpm build` | Pass: exit 0 |
| `pnpm lint` | Could not complete: runner reported abnormal termination, possibly out of memory, on six attempts. Direct `biome check .` completed and reported the intentionally restored pre-Task-2 formatting line as its sole formatting error. |
[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)

> laguuni-quickbook@0.1.0 test /Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis
> vitest run


[1m[30m[46m RUN [49m[39m[22m [36mv4.1.5 [39m[90m/Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis[39m

 [32m✓[39m src/components/ui/sheet.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[33m 312[2mms[22m[39m
 [32m✓[39m src/features/booking/components/BookingResultPanel.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[33m 328[2mms[22m[39m
 [32m✓[39m src/features/booking/use-booking-sheet-controller.test.ts [2m([22m[2m22 tests[22m[2m)[22m[33m 310[2mms[22m[39m
 [32m✓[39m src/features/booking/components/BookingSheet.test.tsx [2m([22m[2m6 tests[22m[2m)[22m[32m 258[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityScreen.integration.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 188[2mms[22m[39m
 [32m✓[39m src/features/booking/components/BookingSheetFlow.test.tsx [2m([22m[2m13 tests[22m[2m)[22m[33m 461[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityOverviewContent.test.tsx [2m([22m[2m32 tests[22m[2m)[22m[33m 479[2mms[22m[39m
 [32m✓[39m src/features/availability/use-availability-overview.test.ts [2m([22m[2m21 tests[22m[2m)[22m[33m 1444[2mms[22m[39m
 [32m✓[39m src/features/booking/components/BookingConfirmPanel.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[32m 184[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityDayGroups.test.tsx [2m([22m[2m4 tests[22m[2m)[22m[33m 332[2mms[22m[39m
 [32m✓[39m .storybook/storybook-app-providers.test.tsx [2m([22m[2m8 tests[22m[2m)[22m[33m 306[2mms[22m[39m
 [32m✓[39m src/app/App.test.tsx [2m([22m[2m8 tests[22m[2m)[22m[33m 2018[2mms[22m[39m
     [33m[2m✓[22m[39m shows read-only availability and an optional settings path before booking is configured [33m 461[2mms[22m[39m
     [33m[2m✓[22m[39m books an available slot and surfaces success [33m 364[2mms[22m[39m
     [33m[2m✓[22m[39m retains two selected slots after dismissing their review [33m 621[2mms[22m[39m
 [32m✓[39m .storybook/fixtures.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 109[2mms[22m[39m
 [32m✓[39m .storybook/laguuni-handlers.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 86[2mms[22m[39m
 [32m✓[39m src/features/diagnostics/runtime-capture.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[32m 207[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityCalendarGrid.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[33m 410[2mms[22m[39m
 [32m✓[39m src/features/availability/components/BookingBasketReviewButton.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 235[2mms[22m[39m
 [32m✓[39m src/test/render-app.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 184[2mms[22m[39m
 [32m✓[39m src/features/settings/components/SettingsScreen.test.tsx [2m([22m[2m10 tests[22m[2m)[22m[33m 2997[2mms[22m[39m
     [33m[2m✓[22m[39m persists settings locally and restores the saved default cable [33m 837[2mms[22m[39m
     [33m[2m✓[22m[39m does not override the current cable after changing the saved default in-session [33m 364[2mms[22m[39m
     [33m[2m✓[22m[39m discards unsaved edits when the sheet closes [33m 455[2mms[22m[39m
     [33m[2m✓[22m[39m persists developer mode until it is disabled [33m 423[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityScreen.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[32m 156[2mms[22m[39m
 [32m✓[39m src/app/providers.test.tsx [2m([22m[2m3 tests[22m[2m)[22m[32m 187[2mms[22m[39m
 [32m✓[39m src/lib/api/client.test.ts [2m([22m[2m4 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/features/booking/booking-result-presentation.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/features/calendar/calendar-share.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityCalendarWeek.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 123[2mms[22m[39m
 [32m✓[39m src/app/config.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/features/availability/use-booking-basket.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 38[2mms[22m[39m
 [32m✓[39m src/features/availability/components/availability-badge.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 130[2mms[22m[39m
 [32m✓[39m src/features/calendar/ical.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/features/booking/booking-service.test.ts [2m([22m[2m23 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m .storybook/StorybookAppFrame.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/features/availability/availability-service.test.ts [2m([22m[2m9 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/features/booking/booking-flow.integration.test.tsx [2m([22m[2m14 tests[22m[2m)[22m[33m 5683[2mms[22m[39m
     [33m[2m✓[22m[39m shows a failure state when checkout returns an error [33m 625[2mms[22m[39m
     [33m[2m✓[22m[39m releases a failed basket reservation without checkout and retains its review [33m 842[2mms[22m[39m
     [33m[2m✓[22m[39m keeps a mixed-cable basket until every availability refresh settles [33m 495[2mms[22m[39m
     [33m[2m✓[22m[39m preserves a replacement basket when an earlier refresh completion clears [33m 717[2mms[22m[39m
     [33m[2m✓[22m[39m shows payment required when checkout returns a plain token string [33m 443[2mms[22m[39m
     [33m[2m✓[22m[39m allows dismissing a failed booking status [33m 384[2mms[22m[39m
     [33m[2m✓[22m[39m shows a successful booking status [33m 435[2mms[22m[39m
     [33m[2m✓[22m[39m keeps the success sheet open until the user dismisses it [33m 457[2mms[22m[39m
 [32m✓[39m .storybook/storybook-persisted-state.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/features/diagnostics/logs.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m tests/fixtures/laguuni/fixture-contract.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/features/calendar/use-booking-calendar-action.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m src/lib/storage/local-storage.test.ts [2m([22m[2m5 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/lib/api/normalize.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/lib/api/booking-api.test.ts [2m([22m[2m14 tests[22m[2m)[22m[32m 13[2mms[22m[39m
 [32m✓[39m src/test/persisted-state.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/api/laguuni-api.test.ts [2m([22m[2m8 tests[22m[2m)[22m[32m 8[2mms[22m[39m
 [32m✓[39m src/features/availability/availability-calendar.test.ts [2m([22m[2m7 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/features/booking/booking-selections.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 7[2mms[22m[39m
 [32m✓[39m src/features/diagnostics/export.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/test/create-memory-storage.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
 [32m✓[39m src/features/availability/availability-overview-store.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/features/calendar/calendar-event.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 6[2mms[22m[39m
 [32m✓[39m src/features/availability/components/availability-overview-content-model.test.ts [2m([22m[2m6 tests[22m[2m)[22m[32m 5[2mms[22m[39m
 [32m✓[39m src/features/booking/booking-selection-label.test.ts [2m([22m[2m3 tests[22m[2m)[22m[32m 4[2mms[22m[39m
 [32m✓[39m src/lib/date.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 4[2mms[22m[39m

[2m Test Files [22m [1m[32m51 passed[39m[22m[90m (51)[39m
[2m      Tests [22m [1m[32m324 passed[39m[22m[90m (324)[39m
[2m   Start at [22m 20:09:46
[2m   Duration [22m 11.24s[2m (transform 3.85s, setup 16.07s, import 42.82s, tests 17.44s, environment 32.30s)[22m


> laguuni-quickbook@0.1.0 typecheck /Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis
> tsc -b && tsc -p tsconfig.storybook.json


> laguuni-quickbook@0.1.0 build /Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis
> tsc -b && vite build

vite v8.0.10 building client environment for production...
[2Ktransforming...✓ 2217 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                          0.49 kB
dist/index.html                                    1.01 kB │ gzip:   0.48 kB
dist/assets/index-BHFyfZgR.css                    44.60 kB │ gzip:   8.39 kB
dist/assets/workbox-window.prod.es5-Cch4wiA5.js    5.65 kB │ gzip:   2.20 kB
dist/assets/index-BQ2B1PtB.js                    371.17 kB │ gzip: 116.27 kB

✓ built in 227ms

PWA v1.3.0
mode      generateSW
precache  19 entries (506.84 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js

> laguuni-quickbook@0.1.0 test /Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis
> vitest run src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx


[1m[30m[46m RUN [49m[39m[22m [36mv4.1.5 [39m[90m/Users/maxreuter/Dev/laguuni-quickbook/.worktrees/pr4-alignment-analysis[39m

 [32m✓[39m src/features/availability/components/availability-badge.test.tsx [2m([22m[2m2 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityCalendarWeek.test.tsx [2m([22m[2m1 test[22m[2m)[22m[32m 82[2mms[22m[39m
 [32m✓[39m src/features/availability/components/AvailabilityCalendarGrid.test.tsx [2m([22m[2m7 tests[22m[2m)[22m[32m 204[2mms[22m[39m

[2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m
[2m      Tests [22m [1m[32m10 passed[39m[22m[90m (10)[39m
[2m   Start at [22m 20:10:15
[2m   Duration [22m 1.53s[2m (transform 229ms, setup 596ms, import 2.06s, tests 354ms, environment 1.03s)[22m

[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)
[warn] Linter process terminated abnormally (possibly out of memory)
src/features/availability/components/availability-badge.tsx format ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × Formatter would have printed the following content:
  
     39  39 │       getAvailabilityChipClassName(slot),
     40  40 │       isInteractive && availabilityChipInteractiveClassName,
     41     │ - ····isInteractive·&&·props.pressed·&&·'border-primary·bg-primary/25·text-primary·ring-2·ring-primary/50',
         41 │ + ····isInteractive·&&
         42 │ + ······props.pressed·&&
         43 │ + ······'border-primary·bg-primary/25·text-primary·ring-2·ring-primary/50',
     42  44 │       className,
     43  45 │     )
  

Checked 222 files in 59ms. No fixes applied.
Found 1 error.
check ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  × Some errors were emitted while running checks.

## Lint Formatting Repair (2026-07-22)

- Applied Biome's required three-line wrap at `src/features/availability/components/availability-badge.tsx:41`. This is formatting-only; behavior is unchanged.

### Verification Output

| Command | Result |
| --- | --- |
| `pnpm lint` | Could not complete: `[warn] Linter process terminated abnormally (possibly out of memory)` |
| `pnpm test -- src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx` | Pass: 51 files, 324 tests (Vitest runs the full suite with these arguments) |
| `pnpm test` | Pass: 51 files, 324 tests |
| `pnpm typecheck` | Pass: exit 0 |
| `pnpm build` | Pass: exit 0; Vite production build completed |

### Concern

- The required `pnpm lint` command still terminates abnormally in this environment, including when targeting only the formatted component. The review's sole Biome formatting finding is addressed, but lint does not provide a successful exit status.
  
