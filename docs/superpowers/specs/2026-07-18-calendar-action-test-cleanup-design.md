# Calendar Action Test Cleanup Design

## Goal

Align booking-result tests with the always-available calendar callback and the presentation-layer action that decides whether the UI renders the calendar control.

## Design

`getBookingResultPresentation()` will return `{ kind: 'add-to-calendar' }` for successful bookings. Payment-required and failed booking results retain their existing payment, diagnostics, or no-action presentations.

`BookingResultPanel` continues to receive both `onAddToCalendar` and `onExportTrace` as required callbacks. Its action renderer selects the appropriate UI exclusively from the presentation action, not from callback presence.

## Test Coverage

- Update presentation tests to expect the calendar action for successful bookings.
- Retain panel tests that verify the calendar action calls its callback and reports a rejected calendar export inline.
- Retain panel tests for payment continuation and diagnostics copying, passing both required callbacks in every fixture.
- Delete panel tests for optional callback behavior and for calendar-button absence on non-success results; neither behavior is part of the simplified API.
- Simplify the `BookingSheetFlow` calendar wiring test to cover successful booking export only. Remove the payment-state visibility assertion because visibility is owned by `BookingResultPanel`'s presentation action.

## Constraints

- Do not change calendar export behavior, error copy, payment links, or diagnostics behavior.
- Do not add compatibility paths for omitted callbacks.
- Keep the change limited to booking-result presentation and its focused tests.
