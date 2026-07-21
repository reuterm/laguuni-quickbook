# Remaining Multi-Slot Booking PR Plan

## Purpose

This plan replaces the original PR 4 scope after PR 3 materially changed the architecture.

PRs 1 and 2 generalized booking submission and the booking sheet for multiple selections. PR 3 established the new availability architecture: a persistent, editable booking basket that can contain mixed-cable selections while enforcing one selection per day. Do not restore the original local, calendar-only `useMultipleSlotSelection` design or cable locking.

The remaining work lands the reference branch's user-facing behavior in three reviewable PRs. The approximate line counts are guidance, not limits; preserve coherent behavioral boundaries over an artificial size target.

## Baseline And Branches

- Base branch: current `main`, after PR 3 merge (`c97b6dd` when this plan was written).
- Behavioral reference: `feature/multi-slot-booking`.
- All implementation work must occur in a separate worktree, never in the reference branch checkout.
- Before starting a PR, compare its intended scope against both `main` and the reference branch; do not copy unrelated reference-only changes.

## Architecture Contract

The availability layer owns the transient `useBookingBasket` state, selection interactions, and availability reconciliation. The booking sheet controller owns initial confirmation, basket review, dismissal, continuation, submission, and result states.

The basket contract is:

- It is persistent for the current availability session but is not externally persisted.
- It can contain selections from multiple cables.
- It contains at most one selection for any date.
- Adding a slot for an already-selected date replaces that date's selection according to the current PR's replacement rule.
- The basket is retained when a review sheet is dismissed or a recoverable booking error occurs.
- It is cleared only after successful booking and required availability reconciliation, with revision protection against clearing selections added while submission was in flight.

## Delivery Sequence

| PR | Title | Depends on | Approx. added LOC | Production behavior after merge |
| --- | --- | --- | --- | --- |
| 4 | Finalize basket booking and availability reconciliation | PRs 1-3 | 600-750 | Multi-slot booking is usable; selecting another slot on an already-selected day immediately replaces it. |
| 5 | Confirm cross-cable same-day replacements | PR 4 | 450-650 | Cross-cable same-day replacement requires explicit confirmation; same-cable replacement remains immediate. |
| 6 | Persist basket review action across availability states | PR 4 | 250-450 | A fixed review action remains accessible whenever the basket has selections, including degraded availability states. |

PR 6 may land after PR 5 or in parallel with it once PR 4 has merged, because it does not depend on replacement confirmation. Prefer PR 5 first if release sequencing needs the safest interaction behavior as early as possible.

---

## PR 4: Finalize Basket Booking And Availability Reconciliation

### Goal

Ship production-ready, reachable multi-slot booking through the persistent basket model. This PR intentionally uses immediate replacement for every same-day collision, including across cables; PR 5 improves only that cross-cable interaction.

### In Scope

- [ ] Add `useBookingBasket` and its focused unit tests.
- [ ] Connect availability slot actions to the basket.
- [ ] Start normal one-slot booking with `requestInitialBooking` when the basket is empty.
- [ ] After initial booking confirmation, support adding more selections with the booking controller's continuation API.
- [ ] Open a read-only review of retained selections through `requestBasketReview`.
- [ ] Keep basket selections when the user dismisses review.
- [ ] Keep basket selections after recoverable booking failures.
- [ ] Enforce one selection per day by immediately replacing the existing selection when another slot on that day is selected, regardless of cable.
- [ ] Allow removing individual selected slots and clearing all selections.
- [ ] Clear the basket only after successful booking and completion of availability reconciliation.
- [ ] Capture the basket revision at submission and clear only if it is unchanged after completion.
- [ ] Refresh each unique submitted `{ cableId, date }` pair.
- [ ] Refresh days for the selected cable in visible availability state.
- [ ] Refresh days for another cable without changing the user's selected cable or displayed scope.
- [ ] Wait for all refresh attempts to settle before clearing a successful basket; failed refreshes must not leave a stale booked selection in the basket.
- [ ] Update relevant diagnostics and booking-flow integration coverage for basket continuation and reconciliation behavior.

### Explicitly Out Of Scope

- [ ] Do not add cross-cable replacement confirmation UI; immediate replacement is the deliberate interim behavior.
- [ ] Do not add a fixed basket review pill or special scroll clearance.
- [ ] Do not reinstate a cable selector lock.
- [ ] Do not restrict editing to the calendar; PR 3 established basket interactions across availability views.

### Primary Files

- `src/features/availability/use-booking-basket.ts`
- `src/features/availability/use-booking-basket.test.ts`
- `src/features/availability/components/AvailabilityScreen.tsx`
- `src/features/availability/use-availability-overview.ts`
- `src/features/availability/use-availability-overview.test.ts`
- `src/app/App.test.tsx`
- `src/features/booking/booking-flow.integration.test.tsx`
- Availability component tests and stories needed to demonstrate basket selection and review.

### Acceptance Criteria

- [ ] A user can begin with one slot, add slots across cables, and submit all retained selections as one booking.
- [ ] A user can dismiss review and later continue editing the same basket.
- [ ] Selecting a second slot for the same day replaces the first, including when cables differ.
- [ ] Removing or clearing selections updates the reviewable basket accurately.
- [ ] A booking failure does not discard editable selections.
- [ ] A successful booking clears only the submitted, unchanged basket after every affected availability day has been reconciled.
- [ ] A selection added during submission is not erased when the earlier submission finishes.
- [ ] Refreshes for other cables do not change the active cable or the visible date scope.

### Required Tests

- [ ] `use-booking-basket` behavior: add, remove, clear, same-day replacement, revision changes.
- [ ] Availability screen behavior: initial booking, continuation, retained review, removal, clearing, and same-day replacement.
- [ ] App integration: mixed-cable selections, review dismissal retention, successful clear, and active-cable preservation.
- [ ] Booking-flow integration: successful multi-slot reconciliation, failed submission retention, and refresh-before-clear behavior.
- [ ] Availability overview hook: refresh paths for active and inactive cables.
- [ ] Stories: basket selection and review on the availability screen/grid, following current Storybook project guidance.

### Reference Commits

Use as behavioral evidence, not as blind cherry-pick targets:

- `a03d7f2` local booking basket
- `5f4072b` initial booking continuation
- `bfa9fdc` basket controls across availability views
- `ab253e4` basket-oriented booking integration
- `4fa8a04` refresh before clearing
- `2716fcc` review-level clearing
- `c31f9bf` reconciliation failure handling

### Verification

- [ ] Run focused availability, basket, app, and booking-flow tests while implementing.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run relevant Storybook story tests when the server is available.

---

## PR 5: Confirm Cross-Cable Same-Day Replacements

### Goal

Replace PR 4's deliberate immediate cross-cable replacement with explicit confirmation, while preserving immediate same-cable replacement and every unrelated basket behavior.

### In Scope

- [ ] Add a pure replacement-decision helper that distinguishes no collision, same-cable collision, and cross-cable collision.
- [ ] Add `BookingReplacementSheet` with current and proposed slot information.
- [ ] Add pending-replacement state to the availability screen.
- [ ] Keep same-cable same-day replacements immediate.
- [ ] For a cross-cable same-day selection, leave the basket unchanged and open the confirmation sheet.
- [ ] On confirmation, replace only the selection on that date.
- [ ] On close, cancel, or Escape, retain the existing selection unchanged.
- [ ] Clear pending replacement state when the existing selection is removed, all selections are cleared, booking completes, or refresh invalidates the proposal/current selection.
- [ ] Keep normal basket review, submission, refresh, and revision behavior unchanged.

### Explicitly Out Of Scope

- [ ] Do not change the booking transaction contract.
- [ ] Do not add or reposition a persistent review control.
- [ ] Do not alter same-cable replacement behavior.

### Primary Files

- `src/features/availability/booking-replacement.ts`
- `src/features/availability/booking-replacement.test.ts`
- `src/features/availability/components/BookingReplacementSheet.tsx`
- `src/features/availability/components/BookingReplacementSheet.test.tsx`
- `src/features/availability/components/BookingReplacementSheet.stories.tsx`
- `src/features/availability/components/AvailabilityScreen.tsx`
- `src/app/App.test.tsx`
- Availability screen stories and focused availability component tests.

### Acceptance Criteria

- [ ] Selecting another slot from the same cable on an already-selected date replaces it immediately.
- [ ] Selecting another cable's slot on an already-selected date opens a replacement confirmation and does not mutate the basket first.
- [ ] Confirming performs exactly that replacement.
- [ ] Cancelling, closing, and pressing Escape leave the basket exactly as it was.
- [ ] Pending replacement UI cannot later apply an invalid or removed selection.
- [ ] Existing PR 4 multi-slot booking behavior remains unchanged outside the collision flow.

### Required Tests

- [ ] Pure decision helper cases for no collision, same-cable, and cross-cable collision.
- [ ] Replacement sheet rendering and confirmation/cancel/Escape interaction tests.
- [ ] Availability screen tests for immediate same-cable replacement and deferred cross-cable replacement.
- [ ] App integration tests for confirm, cancel, Escape, removal/clear cleanup, and completion cleanup.
- [ ] Stories demonstrating cross-cable replacement and its cancelled state.

### Reference Commits

- `b25af07` replacement helpers
- `a48d88d` inline replacement prototype
- `dc3908c` cross-cable confirmation
- `4f06907` pending-state cleanup
- `38efd00` replacement hardening
- `7d8a458` replacement sheet
- `bcc0046` removal of the inline prototype
- `724ebbd` cross-cable-only confirmation

### Verification

- [ ] Run focused replacement, availability screen, and app tests.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run the replacement story tests when the Storybook server is available.

---

## PR 6: Persist Basket Review Action Across Availability States

### Goal

Ensure a basket with selections is always reviewable and the fixed action does not obscure availability content.

### In Scope

- [ ] Add `BookingBasketTray`, a fixed review action that appears only when selections exist.
- [ ] Render the tray before all availability early returns so it remains available during loading, offline, error, empty, and regular content states.
- [ ] Wire the tray to open the retained basket review with the current selections.
- [ ] Add bottom content clearance only when the tray is present.
- [ ] Keep the count and review action synchronized when selections change, are cleared, or booking completes.
- [ ] Remove superseded inline review triggers only where the fixed tray takes over their role.

### Explicitly Out Of Scope

- [ ] Do not alter booking submission, refresh, or replacement decisions.
- [ ] Do not make the fixed tray visible for an empty basket.
- [ ] Do not introduce another basket state store.

### Primary Files

- `src/features/availability/components/BookingBasketTray.tsx`
- `src/features/availability/components/BookingBasketTray.test.tsx`
- `src/features/availability/components/AvailabilityOverviewContent.tsx`
- `src/features/availability/components/AvailabilityOverviewContent.test.tsx`
- `src/features/availability/components/AvailabilityScreen.stories.tsx`
- `src/features/availability/components/AvailabilityCalendarGrid.stories.tsx`

### Acceptance Criteria

- [ ] With at least one selection, the user can open review from every availability UI state.
- [ ] With no selections, no fixed review action or reserved clearance is rendered.
- [ ] Availability content remains reachable and unobscured when the fixed action exists.
- [ ] The action opens review using the latest basket selections.
- [ ] Clearing or completing the basket removes the action and the added clearance.

### Required Tests

- [ ] Tray component rendering, count, and review callback behavior.
- [ ] Overview rendering through loading, offline, error, empty, and populated states with and without selections.
- [ ] Clearance behavior only while a basket exists.
- [ ] Story coverage for basket selection and persistent review access.

### Reference Commits

- `5507a0a` review-only trigger
- `53a2a91` fixed basket review pill
- `1df5af1` scroll clearance
- `b1ddeac` clearance scope
- `5636573` action persistence across availability states
- `df2be6b` corresponding story assertion update

### Verification

- [ ] Run focused tray and overview tests.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Run relevant Storybook story tests when the server is available.

---

## Shared Implementation Rules

- [ ] Use the existing booking selection identity and ordering helpers from PR 1; do not create parallel keying rules.
- [ ] Preserve the booking sheet/controller contracts landed by PR 2.
- [ ] Preserve the persistent basket architecture landed by PR 3.
- [ ] Make no changes in the reference branch checkout.
- [ ] Use isolated worktrees for every implementation PR.
- [ ] Do not expand a PR with later-reference behavior merely because affected files overlap.
- [ ] Update or create Storybook stories only after consulting project Storybook documentation and instructions.
- [ ] Do not claim a PR is ready until its stated verification commands have been run successfully.

## Progress Log

Use this section for concise, append-only implementation notes. Include date, PR, branch/worktree, completed checklist groups, and any deliberate deviations from this plan.

- [ ] No implementation has started.
