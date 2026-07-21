# Explicit Basket Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require complete basket and booking-sheet action contracts, while keeping immediate booking, tray behavior, and responsive availability rendering unchanged.

**Architecture:** A shared `BookingBasketProps` type carries the five basket values through all availability presentation components as a required `basket` object. `AvailabilityScreen` is the sole integration boundary: it creates the real hook-backed basket when selection is active, or passes a stable inert basket for immediate booking. `BookingSheetFlow` receives explicit actions for both confirmation kinds rather than optional independent callbacks.

**Tech Stack:** React 19, TypeScript 6, Vitest, Testing Library, Storybook 10, pnpm.

## Global Constraints

- Work only in `/Users/maxreuter/Dev/laguuni-quickbook/.worktrees/multi-slot-booking-pr3`.
- Do not commit changes.
- Do not alter basket tray behavior, booking semantics, or calendar/card responsive layout.
- Presentation components must not provide basket no-ops or infer incomplete basket wiring.
- Run targeted tests, `pnpm typecheck`, and `pnpm test` when practical.

---

## File Structure

- Create: `src/features/availability/components/booking-basket-props.ts` - the complete required `BookingBasketProps` interface and inert basket factory/value.
- Modify: `src/features/availability/components/AvailabilityOverviewContent.tsx` - accepts and forwards one required basket object to both responsive content branches.
- Modify: `src/features/availability/components/AvailabilityCalendarGrid.tsx` - consumes the required basket, removing callback defaults and partial-mode detection.
- Modify: `src/features/availability/components/AvailabilityCalendarWeek.tsx` - receives the explicit basket mode rather than an inferred selection mode.
- Modify: `src/features/availability/components/AvailabilityDayGroups.tsx` - consumes the required basket alongside immediate booking actions, removing the `AvailabilitySlotAction` union.
- Modify: `src/features/availability/components/AvailabilityScreen.tsx` - owns real basket integration and supplies the stable immediate-booking basket.
- Modify: availability component tests and stories - use only complete basket objects and prove direct behavior remains correct.
- Modify: `src/features/booking/components/BookingSheetFlow.tsx` - replaces optional confirmation callbacks with a required per-kind action object.
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx` and `.stories.tsx` - supply complete actions and cover both confirmation branches.

### Task 1: Define and Thread the Required Basket Contract

**Files:**
- Create: `src/features/availability/components/booking-basket-props.ts`
- Modify: `src/features/availability/components/AvailabilityOverviewContent.tsx:14-67,141-153`
- Modify: `src/features/availability/components/AvailabilityCalendarGrid.tsx:8-39,67-84`
- Modify: `src/features/availability/components/AvailabilityCalendarWeek.tsx:23-41,99-109`
- Modify: `src/features/availability/components/AvailabilityDayGroups.tsx:9-87,90-133`
- Modify: `src/features/availability/components/AvailabilityCalendarGrid.test.tsx`
- Modify: `src/features/availability/components/AvailabilityDayGroups.test.tsx`
- Modify: `src/features/availability/components/AvailabilityOverviewContent.test.tsx`

**Interfaces:**
- Produces: `BookingBasketProps`:

```ts
type BookingBasketProps = {
  kind: 'basket' | 'initial'
  selections: readonly BookingSlotSelection[]
  isSelected: (selection: BookingSlotSelection) => boolean
  onAddSelection: (selection: BookingSlotSelection) => void
  onRemoveSelection: (selection: BookingSlotSelection) => void
  onReview: () => void
}
```

- Consumes: existing `AvailabilityBookingActionProps` unchanged for immediate booking availability.

- [ ] **Step 1: Write failing type and behavior tests**

Add reusable `createBasket(overrides?: Partial<BookingBasketProps>)` test fixtures that always return all five fields. Add a type-only test in an existing availability test file:

```ts
// @ts-expect-error A basket must have every selection and review member.
const incompleteBasket: BookingBasketProps = {
  selections: [],
  isSelected: () => false,
  onAddSelection: () => {},
  onRemoveSelection: () => {},
}
void incompleteBasket
```

Update direct calendar and card tests to pass `basket={createBasket(...)}`. Keep assertions that selected slots invoke `onRemoveSelection`, unselected slots invoke `onAddSelection`, enabled immediate booking invokes `onBookSelection`, and hidden/disabled actions retain their existing output.

- [ ] **Step 2: Run targeted tests to verify the old props fail to typecheck**

Run: `pnpm typecheck`

Expected: PASS before adding the negative assertion; after updating components to require `basket`, existing direct callers using parallel props produce TypeScript errors until migrated.

- [ ] **Step 3: Create the contract and simplify presentation components**

Create `booking-basket-props.ts` with the exported type above and a stable inert value:

```ts
const emptyBookingBasket: BookingBasketProps = {
  selections: [],
  isSelected: () => false,
  onAddSelection: () => {},
  onRemoveSelection: () => {},
  onReview: () => {},
}
```

In `AvailabilityOverviewContent`, replace independent selection props with `basket: BookingBasketProps`; always forward `basket` to `AvailabilityCalendarGrid` and `AvailabilityDayGroups`.

In `AvailabilityCalendarGrid`, replace `isSelected`, `onAddSelection`, and `onRemoveSelection` props with `basket`. Remove fallback callback creation and partial-mode detection; pass the required selection members plus `basket.mode` directly to `AvailabilityCalendarWeek`.

In `AvailabilityCalendarWeek`, rename `selectionMode` to `basketKind: BookingBasketProps['kind']` and use `basketKind === 'basket'` to choose add/remove behavior. The `'initial'` branch retains the current enabled, disabled, and hidden booking-action behavior.

In `AvailabilityDayGroups`, replace `slotAction` with `basket` plus `AvailabilityBookingActionProps`. For every slot, render Add/Remove from `basket.isSelected`, `basket.onAddSelection`, and `basket.onRemoveSelection` when `basket.kind === 'basket'`; retain immediate booking/hidden behavior when `basket.kind === 'initial'`. Remove `AvailabilitySlotAction` and its exports.

- [ ] **Step 4: Update direct tests and run them**

Run: `pnpm vitest run src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/AvailabilityDayGroups.test.tsx src/features/availability/components/AvailabilityOverviewContent.test.tsx`

Expected: PASS with basket add/remove behavior and existing card/calendar layout assertions preserved.

### Task 2: Make AvailabilityScreen the Basket Integration Boundary

**Files:**
- Modify: `src/features/availability/components/AvailabilityScreen.tsx:1-167`
- Modify: `src/features/availability/components/AvailabilityScreen.test.tsx`
- Modify: `src/features/availability/components/AvailabilityCalendarGrid.stories.tsx`
- Modify: `src/features/availability/components/AvailabilityOverviewContent.stories.tsx`
- Modify: `src/features/availability/components/AvailabilityDayGroups.stories.tsx`
- Modify: `src/features/availability/components/AvailabilityScreen.stories.tsx`

**Interfaces:**
- Consumes: `BookingBasketProps` and `emptyBookingBasket` from Task 1.
- Produces: all availability callers supply `basket`, never parallel selection props.

- [ ] **Step 1: Write failing integration tests**

In `AvailabilityScreen.test.tsx`, add a test that loads a bookable immediate-booking screen, activates a slot, and asserts `BookingSheetFlow` reaches the confirmation state for exactly that selection. Add a basket-enabled test only if the screen already exposes the basket-selection entry path; it must assert review receives all current selections and the tray remains visible according to its existing behavior.

- [ ] **Step 2: Wire real and inert baskets at the screen boundary**

Call `useBookingBasket()` in `AvailabilityScreen`. Build the real contract using its `selections`, `isSelected`, `addSelection`, and `removeSelection`, with `onReview` requesting a basket booking for the current selections. Select this contract only for the basket-selection capability. Otherwise pass the module-level `emptyBookingBasket`; do not recreate no-op functions inside availability presentation components.

Pass the selected `basket` to `AvailabilityOverviewContent`. Keep `getAvailabilityBookingActionProps` and immediate booking's `requestBooking('initial', [selection])` behavior unchanged.

- [ ] **Step 3: Migrate Storybook callers**

Before editing stories, call `storybook_get-storybook-story-instructions`. Update every availability story to pass a complete `basket`, using `emptyBookingBasket` for immediate/read-only states and the hook-backed object in basket selection stories. Preserve existing play assertions for basket review, card/calendar rendering, and booking enabled stories.

- [ ] **Step 4: Run targeted integration tests**

Run: `pnpm vitest run src/features/availability/components/AvailabilityScreen.test.tsx src/features/availability/components/BookingBasketReviewButton.test.tsx`

Expected: PASS; immediate booking still opens its flow and tray/review behavior is unchanged.

### Task 3: Replace Optional BookingSheetFlow Callbacks with Explicit Actions

**Files:**
- Modify: `src/features/booking/components/BookingSheetFlow.tsx:15-103`
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx`
- Modify: `src/features/booking/components/BookingSheetFlow.stories.tsx`
- Modify: `src/features/availability/components/AvailabilityScreen.tsx:60-97`

**Interfaces:**
- Produces:

```ts
type BookingSheetFlowActions = {
  basket: { onClearSelection: () => void }
  initial: { onAddMore: () => void }
}
```

- `BookingSheetFlowProps` requires `actions: BookingSheetFlowActions`.

- [ ] **Step 1: Write failing flow-contract tests**

Add a type-only negative assertion:

```ts
// @ts-expect-error Each confirmation kind requires its explicit action.
const incompleteActions: BookingSheetFlowActions = {
  initial: { onAddMore: () => {} },
}
void incompleteActions
```

Convert all flow renders to a `createFlowActions()` fixture. Keep and adapt the tests that initial confirmation calls `actions.initial.onAddMore`, basket confirmation calls `actions.basket.onClearSelection` then dismisses, and non-confirmation states accept the complete action object without rendering either control.

- [ ] **Step 2: Implement the required action object**

Replace `clearBookingSelection` and `keepBookingForMore` props with `actions`. In the `confirm` branch, use `actions.initial.onAddMore` for `kind === 'initial'`; use an `onClearSelection` wrapper for `kind === 'basket'` that calls `actions.basket.onClearSelection()` then `dismissBookingSheet()`. Remove all truthiness guards and conditional callback spreads.

- [ ] **Step 3: Update the screen and stories**

At `AvailabilityScreen`, pass both required action branches. The initial action invokes `keepBookingForMore`; the basket action clears the hook basket. In flow stories, pass `fn()`/`noop` actions for both branches and preserve existing play tests.

- [ ] **Step 4: Run focused flow tests**

Run: `pnpm vitest run src/features/booking/components/BookingSheetFlow.test.tsx src/features/booking/use-booking-sheet-controller.test.ts`

Expected: PASS; initial Add more and basket Clear selection remain behaviorally identical.

### Task 4: Verify the Complete Change

**Files:**
- Modify only files from Tasks 1-3 as formatting or test failures require.

**Interfaces:**
- Verifies the required contracts and behavior introduced by Tasks 1-3.

- [ ] **Step 1: Format and lint modified sources**

Run: `pnpm lint`

Expected: PASS with no Biome diagnostics.

- [ ] **Step 2: Typecheck all app and Storybook callers**

Run: `pnpm typecheck`

Expected: PASS; `@ts-expect-error` assertions are consumed, proving partial contracts are rejected.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`

Expected: PASS with existing responsive, tray, booking, and availability tests green.

- [ ] **Step 4: Inspect the worktree without committing**

Run: `git status --short` and `git diff --check`

Expected: intended source, test, story, spec, and plan changes only; no whitespace errors; no commit created.
