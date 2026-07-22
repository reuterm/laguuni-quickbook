# Cross-Cable Replacement Design

## Goal

Require an explicit confirmation before replacing a retained booking-basket selection with a slot from another cable on the same date. Same-cable replacements remain immediate.

## Scope

This change preserves PR 4's persistent basket, booking-sheet controller, submission, reconciliation, and revision behavior. It does not add the persistent basket review action planned for PR 6.

## Architecture

`booking-replacement.ts` supplies pure helpers for finding a selection on a date and formatting the confirmation message. It defines a pending replacement as the current basket selection and the proposed selection.

`AvailabilityScreen` owns pending replacement state because it coordinates availability interactions and the basket. When a selected date collides:

- No existing selection: add the proposed slot.
- Same cable: replace immediately through the existing basket operation.
- Different cable: retain the basket and open the confirmation sheet.

The screen applies the proposed selection only when the user confirms. Closing, cancelling, or pressing Escape clears pending state without changing the basket. It also clears pending state if either relevant selection is removed, all selections are cleared, booking finalization completes, or an availability refresh no longer renders the proposed slot.

## UI

`BookingReplacementSheet` is a controlled bottom sheet. It names the existing and proposed cable, time, and date, and offers Keep current and Replace actions. Its controlled close behavior routes all dismissals to Keep current.

## Tests

- Unit tests cover no collision, same-cable collision, and cross-cable collision helper cases.
- Sheet tests cover displayed information plus confirm, cancel, close, and Escape behavior.
- Availability-screen tests cover immediate same-cable replacement and deferred cross-cable confirmation.
- App integration tests cover confirmation, cancellation, Escape, removal/clear cleanup, and completion cleanup.
- Stories demonstrate the replacement sheet and cross-cable replacement state, following project Storybook conventions.

## Error Handling

Pending replacement is transient. Invalidated, removed, cleared, or completed state cannot later apply a replacement. Existing booking failures and refresh behavior continue to preserve the editable basket under their PR 4 contracts.
