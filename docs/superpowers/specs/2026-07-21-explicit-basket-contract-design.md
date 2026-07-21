# Explicit Basket Contract Design

## Goal

Make basket selection wiring an explicit, complete contract throughout the
availability presentation chain while preserving immediate booking behavior.
Also make the booking-sheet confirmation actions explicit for initial and
basket booking flows.

## Availability Contract

Introduce `BookingBasketProps` with these required fields:

- `kind`
- `selections`
- `isSelected`
- `onAddSelection`
- `onRemoveSelection`
- `onReview`

`AvailabilityOverviewContent`, `AvailabilityCalendarGrid`, and
`AvailabilityDayGroups` each receive this contract as a required `basket`
object. They do not supply defensive defaults or independently test whether
selection handlers were provided.

`kind` uses the existing booking-sheet vocabulary: `'basket'` for a real
basket and `'initial'` for the inert immediate-booking basket. It explicitly
determines whether availability slots add/remove a basket selection or use
the existing immediate booking action; an empty real basket is therefore
never confused with an initial booking.

The top-level availability integration creates the appropriate basket. The
real basket is passed when selection is enabled. Immediate booking receives a
stable inert basket with empty selections, a false predicate, and no-op
handlers. This keeps incomplete wiring out of presentation components.

`AvailabilityDayGroups` will use the same basket-driven add/remove behavior
as the calendar grid. Existing `AvailabilityBookingActionProps` continues to
control immediate booking and read-only presentation.

## Booking Sheet Contract

Replace `BookingSheetFlow`'s optional independent callbacks with a required
discriminated confirmation-action object. The initial branch supplies the
add-more action; the basket branch supplies clear-and-dismiss behavior.
The flow selects the appropriate action from its rendered booking state, so
the confirmation panel never relies on optional callback guards.

## Tests

Update component tests, stories, and helpers to supply complete objects.
Add TypeScript negative assertions with `@ts-expect-error` proving incomplete
basket and booking-sheet action objects are rejected. Preserve behavioral
coverage for immediate booking, basket add/remove and review actions, and
calendar/card responsive rendering.

## Scope

Only availability selection wiring and `BookingSheetFlow` callback contracts
change. Visual layout, basket tray behavior, and booking semantics remain
unchanged.
